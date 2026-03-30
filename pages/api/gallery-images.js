import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Hardcoded seed data — the current gallery images. Used to auto-populate the
// table the first time the API is called so nothing changes visually.
const SEED_DATA = [
  { filename: "gal1.webp", category: "Pier Drilling", sort_order: 1 },
  { filename: "gal9.webp", category: "Pier Drilling", sort_order: 2 },
  { filename: "gal15.webp", category: "Pier Drilling", sort_order: 3 },
  { filename: "gal22.webp", category: "Pier Drilling", sort_order: 4 },
  { filename: "gal28.webp", category: "Pier Drilling", sort_order: 5 },
  { filename: "gal35.webp", category: "Pier Drilling", sort_order: 6 },
  { filename: "gal5.webp", category: "Equipment & Operations", sort_order: 1 },
  { filename: "gal12.webp", category: "Equipment & Operations", sort_order: 2 },
  { filename: "gal18.webp", category: "Equipment & Operations", sort_order: 3 },
  { filename: "gal25.webp", category: "Equipment & Operations", sort_order: 4 },
  { filename: "gal32.webp", category: "Equipment & Operations", sort_order: 5 },
  { filename: "gal38.webp", category: "Equipment & Operations", sort_order: 6 },
  { filename: "gal3.webp", category: "Infrastructure Projects", sort_order: 1 },
  { filename: "gal10.webp", category: "Infrastructure Projects", sort_order: 2 },
  { filename: "gal17.webp", category: "Infrastructure Projects", sort_order: 3 },
  { filename: "gal24.webp", category: "Infrastructure Projects", sort_order: 4 },
  { filename: "gal31.webp", category: "Infrastructure Projects", sort_order: 5 },
  { filename: "gal39.webp", category: "Infrastructure Projects", sort_order: 6 },
  { filename: "gal2.webp", category: "Commercial Buildings", sort_order: 1 },
  { filename: "gal8.webp", category: "Commercial Buildings", sort_order: 2 },
  { filename: "gal14.webp", category: "Commercial Buildings", sort_order: 3 },
  { filename: "gal21.webp", category: "Commercial Buildings", sort_order: 4 },
  { filename: "gal29.webp", category: "Commercial Buildings", sort_order: 5 },
  { filename: "gal36.webp", category: "Commercial Buildings", sort_order: 6 },
  { filename: "gal4.webp", category: "Industrial Projects", sort_order: 1 },
  { filename: "gal11.webp", category: "Industrial Projects", sort_order: 2 },
  { filename: "gal19.webp", category: "Industrial Projects", sort_order: 3 },
  { filename: "gal26.webp", category: "Industrial Projects", sort_order: 4 },
  { filename: "gal33.webp", category: "Industrial Projects", sort_order: 5 },
  { filename: "gal40.webp", category: "Industrial Projects", sort_order: 6 },
];

async function ensureTable() {
  // Check if table exists by trying a select
  const { data, error } = await supabase.from("gallery_images").select("id").limit(1);

  if (error) {
    // Table doesn't exist (42P01) or permissions issue
    // Log it so the user knows to create the table
    console.error(
      "gallery_images table not accessible:",
      error.message,
      "— Run the SQL from docs/gallery-table.sql in the Supabase SQL editor to create it."
    );
    return false;
  }

  // Table exists — check if empty and seed with current hardcoded data
  if (!data || data.length === 0) {
    const { count } = await supabase
      .from("gallery_images")
      .select("id", { count: "exact", head: true });
    if (count === 0) {
      await supabase.from("gallery_images").insert(
        SEED_DATA.map((row) => ({ ...row, is_visible: true }))
      );
    }
  }
  return true;
}

export default async function handler(req, res) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  await ensureTable();

  // GET — list gallery images (public endpoint for gallery page + admin)
  if (req.method === "GET") {
    const showAll = req.query.all === "true"; // admin wants hidden ones too
    let query = supabase
      .from("gallery_images")
      .select("*")
      .order("category")
      .order("sort_order");

    if (!showAll) {
      query = query.eq("is_visible", true);
    }

    const { data, error } = await query;
    if (error) {
      return res.status(500).json({ error: "Failed to fetch gallery images" });
    }
    return res.status(200).json({ images: data || [] });
  }

  // POST — add a new gallery image
  if (req.method === "POST") {
    const { filename, category, title, description } = req.body || {};
    if (!filename) {
      return res.status(400).json({ error: "filename is required" });
    }

    // Get next sort order for this category
    const { data: last } = await supabase
      .from("gallery_images")
      .select("sort_order")
      .eq("category", category || "Uncategorized")
      .order("sort_order", { ascending: false })
      .limit(1);
    const nextSort = ((last?.[0]?.sort_order) || 0) + 1;

    const { data, error } = await supabase
      .from("gallery_images")
      .insert({
        filename,
        category: category || "Uncategorized",
        title: title || null,
        description: description || null,
        is_visible: true,
        sort_order: nextSort,
      })
      .select()
      .single();

    if (error) {
      console.error("Gallery insert error:", error);
      return res.status(500).json({ error: "Failed to add image" });
    }
    return res.status(200).json({ image: data });
  }

  // PATCH — update a gallery image (toggle visibility, edit fields)
  if (req.method === "PATCH") {
    const { id, ...updates } = req.body || {};
    if (!id) {
      return res.status(400).json({ error: "id is required" });
    }

    const allowed = {};
    if (updates.is_visible !== undefined) allowed.is_visible = updates.is_visible;
    if (updates.category !== undefined) allowed.category = updates.category;
    if (updates.title !== undefined) allowed.title = updates.title;
    if (updates.description !== undefined) allowed.description = updates.description;
    if (updates.sort_order !== undefined) allowed.sort_order = updates.sort_order;
    if (updates.filename !== undefined) allowed.filename = updates.filename;

    const { error } = await supabase
      .from("gallery_images")
      .update(allowed)
      .eq("id", id);

    if (error) {
      console.error("Gallery update error:", error);
      return res.status(500).json({ error: "Failed to update image" });
    }
    return res.status(200).json({ success: true });
  }

  // DELETE — permanently remove
  if (req.method === "DELETE") {
    const { id } = req.body || {};
    if (!id) {
      return res.status(400).json({ error: "id is required" });
    }

    const { error } = await supabase.from("gallery_images").delete().eq("id", id);
    if (error) {
      return res.status(500).json({ error: "Failed to delete image" });
    }
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
