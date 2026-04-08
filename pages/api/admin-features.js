import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export default async function handler(req, res) {
  // GET — list features
  if (req.method === "GET") {
    try {
      const { data, error } = await supabase
        .from("admin_features")
        .select("id, slug, title, description, priority, href, icon, status, sort_order, status_note")
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

  // POST — create a new feature
  if (req.method === "POST") {
    try {
      const { title, description, priority, href, status, status_note, sort_order } = req.body;
      if (!title) return res.status(400).json({ error: "Title is required" });

      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

      const { data, error } = await supabase
        .from("admin_features")
        .insert({
          slug,
          title,
          description: description || "",
          priority: priority || "support",
          href: href || "#",
          status: status || "active",
          status_note: status_note || "",
          sort_order: sort_order ?? 99,
        })
        .select()
        .single();

      if (error) {
        console.error("admin_features insert error:", error);
        return res.status(500).json({ error: "Failed to create feature" });
      }

      return res.status(201).json({ feature: data });
    } catch (err) {
      console.error("admin-features POST error:", err);
      return res.status(500).json({ error: "Failed to create feature" });
    }
  }

  // PUT — update an existing feature
  if (req.method === "PUT") {
    try {
      const { id, ...updates } = req.body;
      if (!id) return res.status(400).json({ error: "Feature id is required" });

      const { data, error } = await supabase
        .from("admin_features")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("admin_features update error:", error);
        return res.status(500).json({ error: "Failed to update feature" });
      }

      return res.status(200).json({ feature: data });
    } catch (err) {
      console.error("admin-features PUT error:", err);
      return res.status(500).json({ error: "Failed to update feature" });
    }
  }

  // DELETE — remove a feature
  if (req.method === "DELETE") {
    try {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: "Feature id is required" });

      const { error } = await supabase
        .from("admin_features")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("admin_features delete error:", error);
        return res.status(500).json({ error: "Failed to delete feature" });
      }

      return res.status(200).json({ deleted: true });
    } catch (err) {
      console.error("admin-features DELETE error:", err);
      return res.status(500).json({ error: "Failed to delete feature" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
