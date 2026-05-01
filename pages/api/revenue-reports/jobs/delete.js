/**
 * POST /api/revenue-reports/jobs/delete
 * Body: { id: string }
 */
import { createAdminSupabase } from "@/lib/supabase";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.body || {};
  if (!id) return res.status(400).json({ error: "Missing id" });

  const supabase = createAdminSupabase();
  try {
    const { error } = await supabase
      .from("revenue_report_jobs")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("revenue-reports/jobs/delete error:", error);
    return res.status(500).json({ error: error.message || "Delete failed" });
  }
}
