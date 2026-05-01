/**
 * POST /api/revenue-reports/upload
 *
 * Accepts a single .docx daily Jobs report. Pipeline:
 *   1. Read the multipart upload (formidable).
 *   2. Push the raw file to the `revenueReports` Supabase bucket.
 *   3. Extract plain text from the docx.
 *   4. Hand the text to Groq for structured row extraction.
 *   5. Persist one revenue_report_uploads row + N revenue_report_jobs rows.
 *
 * On parse failure we still keep the upload + raw_text + error message so
 * the user can re-parse from the UI without re-uploading.
 */
import { IncomingForm } from "formidable";
import fs from "fs";
import path from "path";
import { createAdminSupabase } from "@/lib/supabase";
import {
  extractDocxText,
  callGroqExtract,
  dateFromFilename,
  buildCrewJobIndex,
  applyCrewJobOverlay,
  backfillCrewJobsFromParsed,
  GROQ_PARSE_MODEL,
} from "@/lib/revenue-report-parser";

export const config = {
  api: {
    bodyParser: false,
    responseLimit: "8mb",
  },
};

const BUCKET = "revenueReports";
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB; daily docs are tiny but be generous.

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({
      maxFileSize: MAX_FILE_SIZE,
      maxFiles: 1,
      keepExtensions: true,
    });
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      const fileEntry = Array.isArray(files.file) ? files.file[0] : files.file;
      resolve({ fields, file: fileEntry });
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabase = createAdminSupabase();
  let uploadId = null;
  let tempFilePath = null;

  try {
    const { file, fields } = await parseForm(req);
    if (!file) return res.status(400).json({ error: "No file uploaded (expected field name: file)" });

    const originalName = file.originalFilename || file.newFilename || "report.docx";
    if (!/\.docx$/i.test(originalName)) {
      return res.status(400).json({ error: "Only .docx files are accepted" });
    }

    tempFilePath = file.filepath || file.path;
    const buffer = fs.readFileSync(tempFilePath);

    // 1. Storage path: bucket-bound, namespaced by report-date when we can
    //    figure it out, otherwise a timestamp folder so things stay tidy.
    const hintDate = dateFromFilename(originalName) || (fields?.report_date ? String(fields.report_date) : null);
    const folder = hintDate || new Date().toISOString().slice(0, 10);
    const sanitized = originalName.replace(/[^\w.\- ]/g, "_");
    const storagePath = `daily/${folder}/${Date.now()}_${sanitized}`;

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        upsert: false,
      });
    if (uploadErr) {
      // Bucket missing is a configuration error, surface it loud.
      return res.status(500).json({
        error: `Storage upload failed: ${uploadErr.message}. Confirm the "${BUCKET}" bucket exists.`,
      });
    }

    // 2. Insert the parent upload row in 'pending' state so we have something
    //    to attach jobs to (and a record even if parsing crashes later).
    const uploadedBy = fields?.uploaded_by ? String(fields.uploaded_by) : null;
    const insertUploadRes = await supabase
      .from("revenue_report_uploads")
      .insert({
        file_name: originalName,
        storage_path: storagePath,
        report_date: hintDate,
        uploaded_by: uploadedBy,
        status: "pending",
      })
      .select("id")
      .single();
    if (insertUploadRes.error) throw insertUploadRes.error;
    uploadId = insertUploadRes.data.id;

    // 3. Extract plain text + run Groq.
    const rawText = extractDocxText(buffer);
    if (!rawText.trim()) throw new Error("Document had no extractable text");

    const extracted = await callGroqExtract(rawText, hintDate);
    const reportDate = extracted.report_date || hintDate;
    if (!reportDate) {
      throw new Error("Could not determine report_date from filename or document body");
    }

    // 4. Canonical overlay: look up parsed jobs against crew_jobs by
    //    job_number digits. Where we find a match, replace the model's
    //    transcribed names with the database source-of-truth and link via
    //    crew_job_id. This is what makes "26/0356 → Concrete Strategies
    //    Haskell" stay consistent with the rest of the admin UI.
    //
    //    We pull the FULL crew_jobs row here (not just the lookup keys) so
    //    the backfill step that runs after has everything it needs to see
    //    which canonical fields are still empty.
    const { data: crewJobs } = await supabase
      .from("crew_jobs")
      .select(
        "id, job_number, job_name, customer_name, hiring_contractor, address, city, zip, pm_name, contract_amount, bid_amount, pier_count, estimated_days"
      );
    const crewJobIndex = buildCrewJobIndex(crewJobs || []);
    const crewJobIndexById = new Map((crewJobs || []).map((j) => [j.id, j]));
    const overlayCount = applyCrewJobOverlay(extracted.jobs || [], crewJobIndex);
    if (overlayCount > 0) {
      console.log(`[revenue-upload] linked ${overlayCount}/${(extracted.jobs || []).length} parsed rows to canonical crew_jobs`);
    }

    // 4b. Backfill: for each linked parsed job, fill any null/empty columns
    // on the canonical crew_jobs record from the parsed extras. Daily docs
    // contain rich job-level data (address, contract amount, pier count,
    // PM name, etc.) that the crew_jobs table is mostly missing — this is
    // the moment to populate it. ONLY fills holes; never overwrites.
    const backfillSummary = await backfillCrewJobsFromParsed(
      supabase,
      extracted.jobs || [],
      crewJobIndexById
    );
    if (backfillSummary.length > 0) {
      console.log(
        `[revenue-upload] backfilled ${backfillSummary.length} crew_jobs:`,
        backfillSummary.map((s) => `${s.job_number} (${s.filledFields.join(",")})`).join("; ")
      );
    }

    // 5. Persist the parsed rows. The unique (upload_id, job_number)
    //    constraint prevents accidental duplicates if the model emits the
    //    same job twice in one response.
    const jobRows = (extracted.jobs || []).map((j) => ({
      upload_id: uploadId,
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
      const { error: jobsErr } = await supabase
        .from("revenue_report_jobs")
        .upsert(jobRows, { onConflict: "upload_id,job_number" });
      if (jobsErr) throw jobsErr;
    }

    // Reconciliation: capture the doc's stated total and the actual sum of
    // parsed rows. The UI uses these to flag mismatches the user should fix.
    const parsedRevenueSum = jobRows.reduce(
      (acc, j) => acc + (Number.isFinite(Number(j.revenue)) ? Number(j.revenue) : 0),
      0
    );

    await supabase
      .from("revenue_report_uploads")
      .update({
        status: "parsed",
        report_date: reportDate,
        raw_text: rawText,
        parser_model: GROQ_PARSE_MODEL,
        parsed_at: new Date().toISOString(),
        parse_error: null,
        day_total: extracted.day_total,
        parsed_revenue_sum: parsedRevenueSum,
        notes: extracted.reconciliation_note || null,
      })
      .eq("id", uploadId);

    return res.status(200).json({
      upload_id: uploadId,
      report_date: reportDate,
      job_count: jobRows.length,
      linked_count: overlayCount,
      enriched_count: backfillSummary.length,
      enriched: backfillSummary,
      day_total: extracted.day_total,
      parsed_revenue_sum: parsedRevenueSum,
      reconciliation_note: extracted.reconciliation_note,
      storage_path: storagePath,
    });
  } catch (error) {
    console.error("revenue-reports/upload error:", error);
    // Best-effort: mark the upload as errored so the UI shows it instead of
    // the file vanishing into the bucket without a trace.
    if (uploadId) {
      await supabase
        .from("revenue_report_uploads")
        .update({
          status: "error",
          parse_error: String(error.message || error).slice(0, 1000),
        })
        .eq("id", uploadId)
        .then(() => {}, () => {});
    }
    return res.status(500).json({
      error: error.message || "Upload failed",
      upload_id: uploadId,
    });
  } finally {
    if (tempFilePath) {
      try { fs.unlinkSync(tempFilePath); } catch (_) {}
    }
  }
}
