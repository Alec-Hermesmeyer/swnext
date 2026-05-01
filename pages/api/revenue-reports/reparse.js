/**
 * POST /api/revenue-reports/reparse
 *
 * Re-runs the Groq extraction on an upload's saved raw_text. Useful when:
 *   - The prompt was tweaked and you want to retry old uploads.
 *   - The first parse landed in the "error" state.
 *   - A user manually edited rows but wants a fresh parser pass.
 *
 * IMPORTANT: this REPLACES the imported rows for the upload. Manual edits
 * (rows with source="manual" pointing at this upload, if any, or rows where
 * source="imported" but edited_at is set) get blown away. Confirm in the UI
 * before calling.
 *
 * Body: { upload_id: string }
 */
import { createAdminSupabase } from "@/lib/supabase";
import {
  callGroqExtract,
  buildCrewJobIndex,
  applyCrewJobOverlay,
  backfillCrewJobsFromParsed,
  GROQ_PARSE_MODEL,
} from "@/lib/revenue-report-parser";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { upload_id } = req.body || {};
  if (!upload_id) return res.status(400).json({ error: "Missing upload_id" });

  const supabase = createAdminSupabase();
  try {
    const { data: upload, error: fetchErr } = await supabase
      .from("revenue_report_uploads")
      .select("id, raw_text, report_date, file_name")
      .eq("id", upload_id)
      .single();
    if (fetchErr) throw fetchErr;
    if (!upload?.raw_text) {
      return res.status(400).json({
        error: "This upload has no raw_text saved. Re-upload the file instead.",
      });
    }

    const extracted = await callGroqExtract(upload.raw_text, upload.report_date || null);
    const reportDate = extracted.report_date || upload.report_date;
    if (!reportDate) {
      throw new Error("Could not determine report_date from saved text");
    }

    // Wipe existing imported rows for this upload, then insert fresh ones.
    // ON CASCADE means deleting the upload would also nuke them, but here
    // we only want a refresh, so explicit delete-then-insert.
    const { error: delErr } = await supabase
      .from("revenue_report_jobs")
      .delete()
      .eq("upload_id", upload_id);
    if (delErr) throw delErr;

    // Canonical overlay against crew_jobs (same as upload.js). Pull the
    // full row so the backfill step can see which fields are still empty.
    const { data: crewJobs } = await supabase
      .from("crew_jobs")
      .select(
        "id, job_number, job_name, customer_name, hiring_contractor, address, city, zip, pm_name, contract_amount, bid_amount, pier_count, estimated_days"
      );
    const crewJobIndex = buildCrewJobIndex(crewJobs || []);
    const crewJobIndexById = new Map((crewJobs || []).map((j) => [j.id, j]));
    const overlayCount = applyCrewJobOverlay(extracted.jobs || [], crewJobIndex);
    if (overlayCount > 0) {
      console.log(`[revenue-reparse] linked ${overlayCount}/${(extracted.jobs || []).length} rows to canonical crew_jobs`);
    }

    // Backfill empty crew_jobs columns from the parsed extras.
    const backfillSummary = await backfillCrewJobsFromParsed(
      supabase,
      extracted.jobs || [],
      crewJobIndexById
    );
    if (backfillSummary.length > 0) {
      console.log(
        `[revenue-reparse] backfilled ${backfillSummary.length} crew_jobs:`,
        backfillSummary.map((s) => `${s.job_number} (${s.filledFields.join(",")})`).join("; ")
      );
    }

    const jobRows = (extracted.jobs || []).map((j) => ({
      upload_id,
      report_date: reportDate,
      job_number: j.job_number,
      job_name: j.job_name,
      customer_name: j.customer_name,
      location: j.location,
      revenue: j.revenue,
      rig_name: j.rig_name,
      crew_names: j.crew_names,
      notes: j.notes,
      extra: j.extra,
      crew_job_id: j.crew_job_id || null,
    }));

    if (jobRows.length > 0) {
      const { error: insErr } = await supabase
        .from("revenue_report_jobs")
        .insert(jobRows);
      if (insErr) throw insErr;
    }

    const parsedRevenueSum = jobRows.reduce(
      (acc, j) => acc + (Number.isFinite(Number(j.revenue)) ? Number(j.revenue) : 0),
      0
    );

    await supabase
      .from("revenue_report_uploads")
      .update({
        status: "parsed",
        report_date: reportDate,
        parser_model: GROQ_PARSE_MODEL,
        parsed_at: new Date().toISOString(),
        parse_error: null,
        day_total: extracted.day_total,
        parsed_revenue_sum: parsedRevenueSum,
        notes: extracted.reconciliation_note || null,
      })
      .eq("id", upload_id);

    return res.status(200).json({
      upload_id,
      report_date: reportDate,
      job_count: jobRows.length,
      linked_count: overlayCount,
      enriched_count: backfillSummary.length,
      enriched: backfillSummary,
      day_total: extracted.day_total,
      parsed_revenue_sum: parsedRevenueSum,
      reconciliation_note: extracted.reconciliation_note,
    });
  } catch (error) {
    console.error("revenue-reports/reparse error:", error);
    await supabase
      .from("revenue_report_uploads")
      .update({
        status: "error",
        parse_error: String(error.message || error).slice(0, 1000),
      })
      .eq("id", upload_id)
      .then(() => {}, () => {});
    return res.status(500).json({ error: error.message || "Reparse failed" });
  }
}
