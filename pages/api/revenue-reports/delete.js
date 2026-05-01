/**
 * POST /api/revenue-reports/delete
 *
 * Removes one upload: deletes the storage object and the DB row. The CASCADE
 * on revenue_report_jobs.upload_id pulls the parsed rows along with it.
 */
import { createAdminSupabase } from "@/lib/supabase";

const BUCKET = "revenueReports";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { upload_id } = req.body || {};
  if (!upload_id) return res.status(400).json({ error: "Missing upload_id" });

  const supabase = createAdminSupabase();
  try {
    const { data: row, error: fetchErr } = await supabase
      .from("revenue_report_uploads")
      .select("storage_path")
      .eq("id", upload_id)
      .single();
    if (fetchErr) throw fetchErr;

    if (row?.storage_path) {
      const { error: storageErr } = await supabase.storage
        .from(BUCKET)
        .remove([row.storage_path]);
      // Tolerate a missing storage object — the DB delete is what really
      // matters for the user.
      if (storageErr) console.warn("Storage delete warning:", storageErr.message);
    }

    const { error: dbErr } = await supabase
      .from("revenue_report_uploads")
      .delete()
      .eq("id", upload_id);
    if (dbErr) throw dbErr;

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("revenue-reports/delete error:", error);
    return res.status(500).json({ error: error.message || "Delete failed" });
  }
}
