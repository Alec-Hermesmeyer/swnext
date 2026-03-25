import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_KEY = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
const COOKIE_NAME = "sw-admin-auth";
const READ_ONLY_ROLES = new Set(["viewer", "readonly", "read_only"]);
const ALLOWED_UPDATE_FIELDS = new Set(["jobTitle", "jobDesc", "is_Open"]);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const getRequestCookies = (req) => {
  if (req?.cookies && typeof req.cookies.getAll === "function") {
    return req.cookies.getAll();
  }

  if (req?.cookies && typeof req.cookies === "object") {
    return Object.entries(req.cookies).map(([name, value]) => ({ name, value }));
  }

  const rawCookie = req?.headers?.cookie || "";
  return rawCookie
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const separatorIndex = part.indexOf("=");
      if (separatorIndex === -1) {
        return { name: part, value: "" };
      }

      return {
        name: decodeURIComponent(part.slice(0, separatorIndex)),
        value: decodeURIComponent(part.slice(separatorIndex + 1)),
      };
    });
};

const getAuthClient = (req) =>
  createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    cookieOptions: { name: COOKIE_NAME },
    cookies: {
      getAll() {
        return getRequestCookies(req);
      },
    },
  });

async function getAuthenticatedUserContext(req) {
  const authClient = getAuthClient(req);
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, department, full_name, username")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email || "",
    fullName: profile?.full_name || user.user_metadata?.full_name || "",
    username: profile?.username || "",
    role: profile?.role || "",
    department: profile?.department || "",
  };
}

function sanitizeUpdates(updates = {}) {
  return Object.fromEntries(
    Object.entries(updates).filter(([key]) => ALLOWED_UPDATE_FIELDS.has(key))
  );
}

export default async function handler(req, res) {
  try {
    if (!SUPABASE_URL || !SUPABASE_KEY || !SUPABASE_ANON_KEY) {
      return res.status(500).json({ error: "Supabase is not configured" });
    }

    const userContext = await getAuthenticatedUserContext(req);
    if (!userContext) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const isReadOnly = READ_ONLY_ROLES.has(String(userContext.role || "").trim().toLowerCase());
    if (req.method !== "GET" && isReadOnly) {
      return res.status(403).json({ error: "Write access is disabled for this role" });
    }

    if (req.method === "GET") {
      const { data, error } = await supabase.from("jobs").select("*").order("id", { ascending: false });

      if (error) {
        return res.status(500).json({ error: error.message || "Error fetching job postings" });
      }

      return res.status(200).json({ jobs: data || [] });
    }

    if (req.method === "POST") {
      const { jobTitle = "", jobDesc = "", is_Open = true } = req.body || {};

      if (!jobTitle.trim() || !jobDesc.trim()) {
        return res.status(400).json({ error: "jobTitle and jobDesc are required" });
      }

      const { data, error } = await supabase
        .from("jobs")
        .insert([
          {
            jobTitle: jobTitle.trim(),
            jobDesc: jobDesc.trim(),
            is_Open: is_Open !== false,
          },
        ])
        .select("*");

      if (error) {
        return res.status(500).json({ error: error.message || "Error adding job" });
      }

      return res.status(200).json({ jobs: data || [] });
    }

    if (req.method === "PUT") {
      const { id, ids, updates = {} } = req.body || {};
      const sanitizedUpdates = sanitizeUpdates(updates);

      if (!Object.keys(sanitizedUpdates).length) {
        return res.status(400).json({ error: "No valid fields were provided to update" });
      }

      let query = supabase.from("jobs").update(sanitizedUpdates);

      if (Array.isArray(ids) && ids.length > 0) {
        query = query.in("id", ids);
      } else if (id) {
        query = query.eq("id", id);
      } else {
        return res.status(400).json({ error: "id or ids is required" });
      }

      const { data, error } = await query.select("*");
      if (error) {
        return res.status(500).json({ error: error.message || "Error updating job postings" });
      }

      return res.status(200).json({ jobs: data || [] });
    }

    if (req.method === "DELETE") {
      const { id, ids } = req.body || {};
      let query = supabase.from("jobs").delete();

      if (Array.isArray(ids) && ids.length > 0) {
        query = query.in("id", ids);
      } else if (id) {
        query = query.eq("id", id);
      } else {
        return res.status(400).json({ error: "id or ids is required" });
      }

      const { error } = await query;
      if (error) {
        return res.status(500).json({ error: error.message || "Error deleting job postings" });
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Job postings API error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
}
