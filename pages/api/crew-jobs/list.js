/**
 * GET /api/crew-jobs/list
 *
 * Returns crew_jobs for typeaheads — admin (service-role) client so RLS
 * doesn't drop rows for the browser anon role. Default returns active jobs;
 * pass ?include_inactive=1 to include inactive too (useful when editing
 * older revenue rows that point at jobs since marked done).
 */
import { createAdminSupabase } from "@/lib/supabase";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const includeInactive =
    req.query.include_inactive === "1" || req.query.include_inactive === "true";

  const supabase = createAdminSupabase();
  try {
    let q = supabase
      .from("crew_jobs")
      .select(
        "id, job_number, job_name, customer_name, hiring_contractor, address, city, zip, pm_name, is_active, job_status"
      )
      .order("job_name", { ascending: true })
      .range(0, 9999);
    if (!includeInactive) q = q.neq("is_active", false);
    const { data, error } = await q;
    if (error) throw error;
    return res.status(200).json({ jobs: data || [] });
  } catch (error) {
    console.error("crew-jobs/list error:", error);
    return res.status(500).json({ error: error.message || "List failed" });
  }
}
