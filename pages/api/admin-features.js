import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { data, error } = await supabase
      .from("admin_features")
      .select("slug, title, description, priority, href, icon, status, sort_order")
      .neq("status", "hidden")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("admin_features query error:", error);
      return res.status(500).json({ error: "Failed to load features" });
    }

    return res.status(200).json({ features: data || [] });
  } catch (err) {
    console.error("admin-features handler error:", err);
    return res.status(500).json({ error: "Failed to load features" });
  }
}
