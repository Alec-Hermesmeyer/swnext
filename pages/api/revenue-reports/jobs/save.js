/**
 * POST /api/revenue-reports/jobs/save
 *
 * Single-row create-or-update for revenue_report_jobs. Used by the inline
 * edit modal on /admin/revenue-reports.
 *
 * Body: {
 *   id?:           string,    // present → update; absent → insert
 *   upload_id?:    string,    // null/undefined for manually-added rows
 *   report_date:   "YYYY-MM-DD",
 *   job_number?:   string,
 *   job_name?:     string,
 *   customer_name?:string,
 *   location?:     string,
 *   revenue?:      number,
 *   rig_name?:     string,
 *   crew_names?:   string,
 *   notes?:        string,
 * }
 */
import { createAdminSupabase } from "@/lib/supabase";

const FIELDS = [
  "report_date",
  "job_number",
  "job_name",
  "customer_name",
  "location",
  "revenue",
  "rig_name",
  "crew_names",
  "notes",
];

const cleanText = (v) => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s ? s : null;
};

const cleanNumber = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(/[$,\s]/g, ""));
  return Number.isFinite(n) ? n : null;
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body || {};
  if (!body.report_date || !/^\d{4}-\d{2}-\d{2}$/.test(body.report_date)) {
    return res.status(400).json({ error: "report_date is required (YYYY-MM-DD)" });
  }

  // Build a normalized payload — coerce strings/numbers, drop fields that
  // weren't in the body so we don't clobber existing values to null on update.
  const payload = {};
  for (const f of FIELDS) {
    if (!(f in body)) continue;
    payload[f] = f === "revenue" ? cleanNumber(body[f]) : cleanText(body[f]);
  }
  if ("upload_id" in body) payload.upload_id = body.upload_id || null;
  if ("crew_job_id" in body) payload.crew_job_id = body.crew_job_id || null;
  payload.edited_at = new Date().toISOString();

  const supabase = createAdminSupabase();
  try {
    if (body.id) {
      const { data, error } = await supabase
        .from("revenue_report_jobs")
        .update(payload)
        .eq("id", body.id)
        .select("*")
        .single();
      if (error) throw error;
      return res.status(200).json({ row: data, mode: "updated" });
    }

    // Insert path: a manual row needs source="manual" so the UI can flag it.
    // Imported rows always come through the upload API, never this endpoint.
    payload.source = "manual";
    const { data, error } = await supabase
      .from("revenue_report_jobs")
      .insert(payload)
      .select("*")
      .single();
    if (error) throw error;
    return res.status(200).json({ row: data, mode: "inserted" });
  } catch (error) {
    console.error("revenue-reports/jobs/save error:", error);
    return res.status(500).json({ error: error.message || "Save failed" });
  }
}
