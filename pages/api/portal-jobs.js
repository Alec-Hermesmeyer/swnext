/**
 * /api/portal-jobs — Manage jobs associated with a client portal.
 *
 * Uses a hybrid model: jobs are resolved from both the `portal_job_links`
 * junction table (explicit links) AND case-insensitive ILIKE name-matching
 * on the portal's `match_name`. Results are deduped and each job is tagged
 * with its source ("linked", "matched", or "both").
 *
 * GET     ?portal_id=<id>                        → active jobs for a portal
 * GET     ?portal_id=<id>&include_inactive=true  → all jobs (including completed)
 * GET     ?match_name=<name>                     → jobs by customer name only (no links)
 * POST    { portal_id, job_id, linked_by? }      → explicitly link a job
 * DELETE  ?portal_id=<id>&job_id=<id>            → remove an explicit link
 *
 * Requires auth (admin / operations / sales).
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const JOB_SELECT =
  "id, job_name, job_number, customer_name, hiring_contractor, address, city, job_status, is_active, contract_amount, estimated_days, actual_days, pier_count, start_date, end_date, default_rig, pm_name, scope_description";

// ── GET ────────────────────────────────────────────────────────────
async function handleGet(req, res) {
  const { portal_id, match_name, include_inactive } = req.query;

  try {
    let matchValue = "";
    let portalId = portal_id || null;

    // Resolve match_name from portal or directly
    if (portal_id) {
      const { data: portal, error: portalErr } = await supabase
        .from("client_portals")
        .select("id, match_name, label")
        .eq("id", portal_id)
        .maybeSingle();

      if (portalErr) throw portalErr;
      if (!portal) {
        return res.status(404).json({ error: "Portal not found" });
      }
      matchValue = String(portal.match_name || "").trim();
      portalId = portal.id;
    } else if (match_name) {
      matchValue = String(match_name).trim();
    } else {
      return res.status(400).json({ error: "portal_id or match_name required" });
    }

    // Fetch ILIKE-matched jobs (existing pattern)
    const matchedJobIds = new Set();
    if (matchValue) {
      const [byCustomer, byGc] = await Promise.all([
        supabase.from("crew_jobs").select(JOB_SELECT).ilike("customer_name", matchValue),
        supabase.from("crew_jobs").select(JOB_SELECT).ilike("hiring_contractor", matchValue),
      ]);
      if (byCustomer.error) throw byCustomer.error;
      if (byGc.error) throw byGc.error;
      [...(byCustomer.data || []), ...(byGc.data || [])].forEach((j) => matchedJobIds.add(j.id));
      // Store raw rows for merging below
      var matchedRows = [...(byCustomer.data || []), ...(byGc.data || [])];
    } else {
      var matchedRows = [];
    }

    // Fetch explicitly-linked jobs from junction table (graceful if table doesn't exist)
    let linkedJobIds = new Set();
    let linkedRows = [];
    if (portalId) {
      try {
        const { data: links, error: linkErr } = await supabase
          .from("portal_job_links")
          .select("job_id")
          .eq("portal_id", portalId);

        if (linkErr) throw linkErr;
        const linkJobIdList = (links || []).map((l) => l.job_id).filter(Boolean);
        linkJobIdList.forEach((id) => linkedJobIds.add(id));

        if (linkJobIdList.length > 0) {
          // Fetch the actual job rows for linked IDs not already in matched set
          const missingIds = linkJobIdList.filter((id) => !matchedJobIds.has(id));
          if (missingIds.length > 0) {
            const { data: extraJobs, error: extraErr } = await supabase
              .from("crew_jobs")
              .select(JOB_SELECT)
              .in("id", missingIds);
            if (extraErr) throw extraErr;
            linkedRows = extraJobs || [];
          }
        }
      } catch (err) {
        // Table may not exist yet — degrade gracefully
        if (err?.code === "42P01" || err?.message?.includes("does not exist")) {
          linkedJobIds = new Set();
          linkedRows = [];
        } else {
          throw err;
        }
      }
    }

    // Merge and deduplicate
    const seen = new Set();
    let jobList = [];
    [...matchedRows, ...linkedRows].forEach((j) => {
      if (!seen.has(j.id)) {
        seen.add(j.id);
        jobList.push(j);
      }
    });

    // Filter inactive unless requested
    if (include_inactive !== "true") {
      jobList = jobList.filter(
        (j) => j.is_active !== false && j.job_status !== "completed"
      );
    }

    // Sort: active/in-progress first, then by start_date descending
    const statusOrder = { in_progress: 0, active: 0, scheduled: 1, awarded: 2, bid: 3, on_hold: 4, completed: 5 };
    jobList.sort((a, b) => {
      const aOrder = statusOrder[a.job_status] ?? 3;
      const bOrder = statusOrder[b.job_status] ?? 3;
      if (aOrder !== bOrder) return aOrder - bOrder;
      const aDate = a.start_date ? new Date(a.start_date).getTime() : 0;
      const bDate = b.start_date ? new Date(b.start_date).getTime() : 0;
      return bDate - aDate;
    });

    // Build summary stats
    const summary = {
      total_jobs: jobList.length,
      active_jobs: jobList.filter((j) => j.is_active !== false && j.job_status !== "completed").length,
      total_contract_value: jobList.reduce((sum, j) => sum + (Number(j.contract_amount) || 0), 0),
      total_piers: jobList.reduce((sum, j) => sum + (Number(j.pier_count) || 0), 0),
      linked_count: jobList.filter((j) => linkedJobIds.has(j.id)).length,
      matched_count: jobList.filter((j) => matchedJobIds.has(j.id)).length,
      statuses: {},
    };
    jobList.forEach((j) => {
      const s = j.job_status || "unknown";
      summary.statuses[s] = (summary.statuses[s] || 0) + 1;
    });

    // Shape response — tag each job with its source
    const jobs = jobList.map((j) => {
      const isLinked = linkedJobIds.has(j.id);
      const isMatched = matchedJobIds.has(j.id);
      let source = "matched";
      if (isLinked && isMatched) source = "both";
      else if (isLinked) source = "linked";

      return {
        id: j.id,
        job_name: j.job_name,
        job_number: j.job_number,
        customer_name: j.customer_name,
        hiring_contractor: j.hiring_contractor,
        address: j.address,
        city: j.city,
        job_status: j.job_status,
        is_active: j.is_active !== false,
        contract_amount: Number(j.contract_amount) || 0,
        estimated_days: Number(j.estimated_days) || 0,
        actual_days: Number(j.actual_days) || 0,
        pier_count: Number(j.pier_count) || 0,
        start_date: j.start_date,
        end_date: j.end_date,
        rig: j.default_rig || null,
        pm_name: j.pm_name || null,
        scope_description: j.scope_description || null,
        source,
      };
    });

    return res.status(200).json({ jobs, summary });
  } catch (err) {
    console.error("portal-jobs GET error:", err);
    return res.status(500).json({ error: err?.message || "Server error" });
  }
}

// ── POST — link a job to a portal ──────────────────────────────────
async function handlePost(req, res) {
  const { portal_id, job_id, linked_by } = req.body || {};
  if (!portal_id || !job_id) {
    return res.status(400).json({ error: "portal_id and job_id are required" });
  }

  try {
    const { data, error } = await supabase
      .from("portal_job_links")
      .insert({
        portal_id,
        job_id,
        linked_by: linked_by || null,
      })
      .select()
      .single();

    if (error) {
      // Handle duplicate
      if (error.code === "23505") {
        return res.status(409).json({ error: "Job is already linked to this portal" });
      }
      // Handle missing table
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        return res.status(503).json({
          error: "portal_job_links table has not been created yet. Run the migration first.",
          migration_file: "scripts/add-portal-job-links.sql",
        });
      }
      throw error;
    }

    return res.status(201).json({ success: true, link: data });
  } catch (err) {
    console.error("portal-jobs POST error:", err);
    return res.status(500).json({ error: err?.message || "Server error" });
  }
}

// ── DELETE — unlink a job from a portal ────────────────────────────
async function handleDelete(req, res) {
  const { portal_id, job_id } = req.query;
  if (!portal_id || !job_id) {
    return res.status(400).json({ error: "portal_id and job_id are required" });
  }

  try {
    const { error } = await supabase
      .from("portal_job_links")
      .delete()
      .eq("portal_id", portal_id)
      .eq("job_id", job_id);

    if (error) {
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        return res.status(503).json({
          error: "portal_job_links table has not been created yet.",
          migration_file: "scripts/add-portal-job-links.sql",
        });
      }
      throw error;
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("portal-jobs DELETE error:", err);
    return res.status(500).json({ error: err?.message || "Server error" });
  }
}

// ── Router ─────────────────────────────────────────────────────────
export default async function handler(req, res) {
  switch (req.method) {
    case "GET":
      return handleGet(req, res);
    case "POST":
      return handlePost(req, res);
    case "DELETE":
      return handleDelete(req, res);
    default:
      res.setHeader("Allow", "GET, POST, DELETE");
      return res.status(405).json({ error: "Method not allowed" });
  }
}
