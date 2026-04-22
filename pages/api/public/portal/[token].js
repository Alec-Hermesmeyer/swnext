/**
 * Public client-portal endpoint. Validates the token and returns a sanitized
 * snapshot: active jobs for that customer, progress, approved/pending change
 * orders, and a public-safe view of recent field reports. No crew names, no
 * bid amounts, no internal notes — only what the GC should see.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const HOURS_PER_CREW_DAY = 10;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { token } = req.query;
  if (!token || typeof token !== "string") {
    return res.status(400).json({ error: "Missing token" });
  }

  try {
    // 1. Resolve the portal by token
    const { data: portal, error: portalErr } = await supabase
      .from("client_portals")
      .select("*")
      .eq("access_token", token)
      .maybeSingle();

    if (portalErr) throw portalErr;
    if (!portal || portal.is_active === false) {
      return res.status(404).json({ error: "Portal not found or inactive" });
    }

    // 2. Fetch jobs matching this portal's customer (case-insensitive on either field)
    const matchName = String(portal.match_name || "").trim();
    if (!matchName) {
      return res.status(500).json({ error: "Portal misconfigured" });
    }

    const baseSelect = "id, job_name, job_number, customer_name, hiring_contractor, address, city, zip, contract_amount, estimated_days, mob_days, actual_days, actual_mob_days, start_date, end_date, pier_count, scope_description, job_status, is_active, default_rig, pm_name";
    const [byCustomer, byGc] = await Promise.all([
      supabase.from("crew_jobs").select(baseSelect).ilike("customer_name", matchName),
      supabase.from("crew_jobs").select(baseSelect).ilike("hiring_contractor", matchName),
    ]);
    if (byCustomer.error) throw byCustomer.error;
    if (byGc.error) throw byGc.error;

    const seen = new Set();
    const jobList = [];
    [...(byCustomer.data || []), ...(byGc.data || [])].forEach((j) => {
      if (!seen.has(j.id)) {
        seen.add(j.id);
        jobList.push(j);
      }
    });
    jobList.sort((a, b) => {
      const aDate = a.start_date ? new Date(a.start_date).getTime() : 0;
      const bDate = b.start_date ? new Date(b.start_date).getTime() : 0;
      return bDate - aDate;
    });
    const jobIds = jobList.map((j) => j.id);

    if (jobIds.length === 0) {
      // Log the access then return empty portal
      await supabase
        .from("client_portals")
        .update({
          last_accessed_at: new Date().toISOString(),
          access_count: (portal.access_count || 0) + 1,
        })
        .eq("id", portal.id);

      return res.status(200).json({
        portal: {
          label: portal.label,
          contact_name: portal.contact_name,
          match_name: portal.match_name,
        },
        jobs: [],
      });
    }

    // 3. Fetch related data in parallel
    const [assignmentResult, scheduleResult, coResult, reportResult, portalDocsResult] = await Promise.all([
      supabase.from("crew_assignments").select("id, job_id, schedule_id, worker_id").in("job_id", jobIds),
      supabase.from("crew_schedules").select("id, schedule_date"),
      supabase
        .from("change_orders")
        .select("id, job_id, co_number, description, amount, status, requested_at, approved_at")
        .in("job_id", jobIds)
        .in("status", ["approved", "submitted", "invoiced", "pending"]),
      supabase
        .from("crew_daily_reports")
        .select("id, job_id, report_date, crew_hours, crew_size, piers_drilled, weather_stop, weather_notes, delays, submitted_at, photo_urls")
        .in("job_id", jobIds)
        .order("report_date", { ascending: false })
        .limit(100),
      // Portal documents — graceful if table doesn't exist
      supabase
        .from("portal_documents")
        .select("id, job_id, title, description, file_url, file_type, document_source, created_at")
        .eq("portal_id", portal.id)
        .order("created_at", { ascending: false })
        .then((r) => r)
        .catch(() => ({ data: [], error: null })),
    ]);

    const assignments = assignmentResult.error ? [] : (assignmentResult.data || []);
    const schedules = scheduleResult.error ? [] : (scheduleResult.data || []);
    const cos = coResult.error ? [] : (coResult.data || []);
    const reports = reportResult.error ? [] : (reportResult.data || []);
    const portalDocs = portalDocsResult?.error ? [] : (portalDocsResult?.data || []);

    const scheduleDateById = {};
    schedules.forEach((s) => { scheduleDateById[s.id] = s.schedule_date; });

    // 4. Aggregate per job
    const assignmentsByJob = new Map();
    assignments.forEach((a) => {
      if (!a.job_id) return;
      if (!assignmentsByJob.has(a.job_id)) {
        assignmentsByJob.set(a.job_id, { dates: new Set(), workersByDate: {} });
      }
      const bucket = assignmentsByJob.get(a.job_id);
      const dateStr = scheduleDateById[a.schedule_id];
      if (dateStr) {
        bucket.dates.add(dateStr);
        if (!bucket.workersByDate[dateStr]) bucket.workersByDate[dateStr] = new Set();
        if (a.worker_id) bucket.workersByDate[dateStr].add(a.worker_id);
      }
    });

    // Portal docs by job
    const docsByJob = new Map();
    const globalDocs = [];
    portalDocs.forEach((doc) => {
      if (doc.job_id) {
        if (!docsByJob.has(doc.job_id)) docsByJob.set(doc.job_id, []);
        docsByJob.get(doc.job_id).push(doc);
      } else {
        globalDocs.push(doc);
      }
    });

    const cosByJob = new Map();
    cos.forEach((co) => {
      if (!co.job_id) return;
      if (!cosByJob.has(co.job_id)) cosByJob.set(co.job_id, []);
      cosByJob.get(co.job_id).push(co);
    });

    const reportsByJob = new Map();
    reports.forEach((r) => {
      if (!r.job_id) return;
      if (!reportsByJob.has(r.job_id)) reportsByJob.set(r.job_id, []);
      reportsByJob.get(r.job_id).push(r);
    });

    const sanitizedJobs = jobList.map((job) => {
      const agg = assignmentsByJob.get(job.id) || { dates: new Set() };
      const jobCos = cosByJob.get(job.id) || [];
      const jobReports = reportsByJob.get(job.id) || [];

      const scheduledDays = agg.dates.size;
      const estimatedDays = Number(job.estimated_days) || 0;
      const contractAmount = Number(job.contract_amount) || 0;

      const approvedCoTotal = jobCos
        .filter((c) => c.status === "approved" || c.status === "invoiced")
        .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
      const pendingCoTotal = jobCos
        .filter((c) => c.status === "pending" || c.status === "submitted")
        .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

      const progress = estimatedDays > 0 ? Math.min((scheduledDays / estimatedDays) * 100, 100) : null;

      return {
        id: job.id,
        job_name: job.job_name,
        job_number: job.job_number,
        address: job.address,
        city: job.city,
        zip: job.zip,
        pier_count: job.pier_count,
        scope_description: job.scope_description,
        job_status: job.job_status,
        is_active: job.is_active !== false,
        start_date: job.start_date,
        end_date: job.end_date,
        contract_amount: contractAmount,
        approved_co_total: approvedCoTotal,
        pending_co_total: pendingCoTotal,
        adjusted_contract: contractAmount + approvedCoTotal,
        estimated_days: estimatedDays,
        scheduled_days: scheduledDays,
        progress_pct: progress,
        change_orders: jobCos.map((co) => ({
          co_number: co.co_number,
          description: co.description,
          amount: Number(co.amount) || 0,
          status: co.status,
          requested_at: co.requested_at,
          approved_at: co.approved_at,
        })),
        recent_reports: jobReports.slice(0, 10).map((r) => ({
          report_date: r.report_date,
          crew_hours: r.crew_hours,
          crew_size: r.crew_size,
          piers_drilled: r.piers_drilled,
          weather_stop: r.weather_stop,
          weather_notes: r.weather_notes,
          photo_urls: Array.isArray(r.photo_urls) ? r.photo_urls : [],
        })),
      };
    });

    // 5. Log access (fire-and-forget)
    supabase
      .from("client_portals")
      .update({
        last_accessed_at: new Date().toISOString(),
        access_count: (portal.access_count || 0) + 1,
      })
      .eq("id", portal.id)
      .then(() => {});

    return res.status(200).json({
      portal: {
        label: portal.label,
        contact_name: portal.contact_name,
        match_name: portal.match_name,
      },
      jobs: sanitizedJobs,
    });
  } catch (err) {
    console.error("Portal error:", err);
    return res.status(500).json({ error: err?.message || "Portal error" });
  }
}
