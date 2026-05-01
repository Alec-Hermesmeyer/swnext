/**
 * GET /api/revenue-reports/jobs/list
 *
 * Reads revenue_report_jobs with the admin (service-role) supabase client so
 * RLS settings on the new tables don't silently swallow rows for the
 * browser's anon client. Used by the Preview expand and the Manual Entries
 * panel on /admin/revenue-reports.
 *
 * Modes:
 *   ?upload_id=<uuid>          rows belonging to a specific upload
 *   ?manual=1&from=&to=        rows with NULL upload_id in [from, to]
 */
import { createAdminSupabase } from "@/lib/supabase";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { upload_id, manual, from, to } = req.query;
  const supabase = createAdminSupabase();

  try {
    let q = supabase
      .from("revenue_report_jobs")
      .select(
        "id, upload_id, crew_job_id, report_date, job_number, job_name, customer_name, location, revenue, rig_name, crew_names, notes, source, edited_at, extra"
      );

    if (upload_id) {
      q = q.eq("upload_id", upload_id).order("job_number", { ascending: true });
    } else if (manual === "1" || manual === "true") {
      if (!from || !to) {
        return res.status(400).json({ error: "manual mode requires from and to (YYYY-MM-DD)" });
      }
      q = q
        .is("upload_id", null)
        .gte("report_date", from)
        .lte("report_date", to)
        .order("report_date", { ascending: true });
    } else {
      return res.status(400).json({ error: "Specify upload_id, or manual=1&from=&to=" });
    }

    const { data, error } = await q;
    if (error) throw error;
    return res.status(200).json({ rows: data || [] });
  } catch (error) {
    console.error("revenue-reports/jobs/list error:", error);
    return res.status(500).json({ error: error.message || "List failed" });
  }
}
