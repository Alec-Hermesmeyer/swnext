/**
 * /api/portal-jobs — Fetch active jobs associated with a client portal.
 *
 * Jobs are matched via case-insensitive ILIKE on the portal's `match_name`
 * against `customer_name` or `hiring_contractor` in `crew_jobs`.
 *
 * GET  ?portal_id=<id>                        → active jobs for a portal
 * GET  ?portal_id=<id>&include_inactive=true  → all jobs (including completed)
 * GET  ?match_name=<name>                     → jobs by customer name directly
 *
 * Returns a lightweight summary suitable for admin views, plus aggregate stats.
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

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { portal_id, match_name, include_inactive } = req.query;

  try {
    let matchValue = "";

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
    } else if (match_name) {
      matchValue = String(match_name).trim();
    } else {
      return res
        .status(400)
        .json({ error: "portal_id or match_name required" });
    }

    if (!matchValue) {
      return res.status(200).json({ jobs: [], summary: emptySummary() });
    }

    // Fetch jobs matching on customer_name or hiring_contractor
    const [byCustomer, byGc] = await Promise.all([
      supabase.from("crew_jobs").select(JOB_SELECT).ilike("customer_name", matchValue),
      supabase.from("crew_jobs").select(JOB_SELECT).ilike("hiring_contractor", matchValue),
    ]);
    if (byCustomer.error) throw byCustomer.error;
    if (byGc.error) throw byGc.error;

    // Deduplicate
    const seen = new Set();
    let jobList = [];
    [...(byCustomer.data || []), ...(byGc.data || [])].forEach((j) => {
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
    jobList.sort((a, b) => {
      const statusOrder = { in_progress: 0, active: 0, scheduled: 1, awarded: 2, bid: 3, on_hold: 4, completed: 5 };
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
      statuses: {},
    };
    jobList.forEach((j) => {
      const s = j.job_status || "unknown";
      summary.statuses[s] = (summary.statuses[s] || 0) + 1;
    });

    // Shape response
    const jobs = jobList.map((j) => ({
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
    }));

    return res.status(200).json({ jobs, summary });
  } catch (err) {
    console.error("portal-jobs error:", err);
    return res.status(500).json({ error: err?.message || "Server error" });
  }
}

function emptySummary() {
  return {
    total_jobs: 0,
    active_jobs: 0,
    total_contract_value: 0,
    total_piers: 0,
    statuses: {},
  };
}
