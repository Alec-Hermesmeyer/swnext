import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Service-role client needed to list auth.users
const supabase = SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

export default async function handler(req, res) {
  if (!supabase) {
    return res.status(500).json({ error: "Service role key not configured" });
  }

  // GET — list all users with profiles
  if (req.method === "GET") {
    try {
      const [{ data: authUsers, error: authErr }, { data: profiles, error: profErr }] =
        await Promise.all([
          supabase.auth.admin.listUsers({ perPage: 200 }),
          supabase.from("profiles").select("id, full_name, username, role, department"),
        ]);

      if (authErr) {
        console.error("Auth list error:", authErr);
        return res.status(500).json({ error: "Could not list auth users" });
      }

      const profileMap = {};
      (profiles || []).forEach((p) => {
        profileMap[p.id] = p;
      });

      const users = (authUsers?.users || []).map((u) => {
        const profile = profileMap[u.id] || {};
        return {
          id: u.id,
          email: u.email || "",
          full_name: profile.full_name || u.user_metadata?.full_name || "",
          username: profile.username || "",
          role: profile.role || "",
          department: profile.department || "",
          last_sign_in: u.last_sign_in_at || null,
          created_at: u.created_at || null,
        };
      });

      return res.status(200).json({ users });
    } catch (err) {
      console.error("Admin users GET error:", err);
      return res.status(500).json({ error: "Failed to fetch users" });
    }
  }

  // PATCH — update a user's profile
  if (req.method === "PATCH") {
    const { id, full_name, username, role, department } = req.body || {};
    if (!id) {
      return res.status(400).json({ error: "User id is required" });
    }

    const updates = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (username !== undefined) updates.username = username;
    if (role !== undefined) updates.role = role;
    if (department !== undefined) updates.department = department;

    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: "No fields to update" });
    }

    // Upsert so it works even if profile row doesn't exist yet
    const { error } = await supabase
      .from("profiles")
      .upsert({ id, ...updates }, { onConflict: "id" });

    if (error) {
      console.error("Profile update error:", error);
      return res.status(500).json({ error: "Failed to update profile" });
    }

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
