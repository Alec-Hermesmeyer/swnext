/**
 * GET /api/revenue-reports/list
 *
 * Returns uploaded daily reports with parsed-row counts and revenue totals,
 * suitable for the management list on /admin/revenue-reports.
 *
 * Optional query params:
 *   from=YYYY-MM-DD   restrict to uploads whose report_date >= from
 *   to=YYYY-MM-DD     restrict to uploads whose report_date <= to
 *   limit=N           cap rows returned (default 200)
 */
import { createAdminSupabase } from "@/lib/supabase";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabase = createAdminSupabase();
  const { from, to } = req.query;
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 200, 1), 1000);

  try {
    // Pull uploads + the rolled-up child counts/sums in two cheap queries
    // and join client-side. Doing this as a single SQL would mean a view or
    // RPC; not worth it for the volume here.
    let q = supabase
      .from("revenue_report_uploads")
      .select(
        "id, file_name, storage_path, report_date, status, parse_error, uploaded_at, uploaded_by, parser_model, day_total, parsed_revenue_sum, notes"
      )
      .order("report_date", { ascending: false, nullsFirst: false })
      .order("uploaded_at", { ascending: false })
      .limit(limit);
    if (from) q = q.gte("report_date", from);
    if (to) q = q.lte("report_date", to);

    const { data: uploads, error: upErr } = await q;
    if (upErr) throw upErr;

    const ids = (uploads || []).map((u) => u.id);
    let countsByUpload = new Map();
    let totalsByUpload = new Map();
    if (ids.length > 0) {
      const { data: jobs, error: jobsErr } = await supabase
        .from("revenue_report_jobs")
        .select("upload_id, revenue")
        .in("upload_id", ids);
      if (jobsErr) throw jobsErr;
      for (const row of jobs || []) {
        countsByUpload.set(row.upload_id, (countsByUpload.get(row.upload_id) || 0) + 1);
        if (row.revenue != null) {
          totalsByUpload.set(
            row.upload_id,
            (totalsByUpload.get(row.upload_id) || 0) + Number(row.revenue)
          );
        }
      }
    }

    const enriched = (uploads || []).map((u) => ({
      ...u,
      job_count: countsByUpload.get(u.id) || 0,
      revenue_total: totalsByUpload.get(u.id) || 0,
    }));

    return res.status(200).json({ uploads: enriched });
  } catch (error) {
    console.error("revenue-reports/list error:", error);
    return res.status(500).json({ error: error.message || "List failed" });
  }
}
