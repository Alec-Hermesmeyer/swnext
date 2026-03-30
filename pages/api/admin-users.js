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
          supabase.from("profiles").select("id, full_name, username, role, department, access_level"),
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
          access_level: profile.access_level || 3,
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

  // POST — create a new user (auth + profile)
  if (req.method === "POST") {
    const { email, password, full_name, role, department } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    try {
      const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: full_name || "" },
      });

      if (authErr) {
        console.error("Create user auth error:", authErr);
        // Supabase returns a message like "A user with this email address has already been registered"
        return res.status(400).json({ error: authErr.message || "Could not create user" });
      }

      const userId = authData.user?.id;
      if (!userId) {
        return res.status(500).json({ error: "User created but no ID returned" });
      }

      // Create profile row
      const profileRow = { id: userId };
      if (full_name) profileRow.full_name = full_name;
      if (role) profileRow.role = role;
      if (department) profileRow.department = department;

      const { error: profErr } = await supabase
        .from("profiles")
        .upsert(profileRow, { onConflict: "id" });

      if (profErr) {
        console.error("Profile create error (user auth was created):", profErr);
        // User auth exists but profile failed — return success with warning
        return res.status(200).json({
          success: true,
          warning: "User account created but profile save failed. Edit the user to fix.",
          user: {
            id: userId,
            email,
            full_name: full_name || "",
            role: role || "",
            department: department || "",
            last_sign_in: null,
            created_at: authData.user.created_at,
          },
        });
      }

      return res.status(200).json({
        success: true,
        user: {
          id: userId,
          email,
          full_name: full_name || "",
          username: "",
          role: role || "",
          department: department || "",
          last_sign_in: null,
          created_at: authData.user.created_at,
        },
      });
    } catch (err) {
      console.error("Create user error:", err);
      return res.status(500).json({ error: "Failed to create user" });
    }
  }

  // PATCH — update a user's profile
  if (req.method === "PATCH") {
    const { id, full_name, username, role, department, access_level } = req.body || {};
    if (!id) {
      return res.status(400).json({ error: "User id is required" });
    }

    const updates = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (username !== undefined) updates.username = username;
    if (role !== undefined) updates.role = role;
    if (department !== undefined) updates.department = department;
    if (access_level !== undefined) updates.access_level = Number(access_level) || 3;

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
