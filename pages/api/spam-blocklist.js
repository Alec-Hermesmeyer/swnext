import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { canWrite as roleCanWrite } from "@/lib/roles";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_KEY = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
const COOKIE_NAME = "sw-admin-auth";

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

const serializeCookie = (name, value, options = {}) => {
  const enc = encodeURIComponent;
  const parts = [`${enc(name)}=${enc(value ?? "")}`];
  parts.push(`Path=${options.path || "/"}`);
  if (options.maxAge !== undefined) parts.push(`Max-Age=${Math.floor(options.maxAge)}`);
  if (options.domain) parts.push(`Domain=${options.domain}`);
  if (options.expires) parts.push(`Expires=${new Date(options.expires).toUTCString()}`);
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  if (options.sameSite) {
    const sameSite = String(options.sameSite).toLowerCase();
    if (sameSite === "lax") parts.push("SameSite=Lax");
    else if (sameSite === "strict") parts.push("SameSite=Strict");
    else if (sameSite === "none") parts.push("SameSite=None");
  }
  return parts.join("; ");
};

const appendResponseCookie = (res, name, value, options) => {
  const serialized = serializeCookie(name, value, options);
  const existing = res.getHeader("Set-Cookie");
  if (!existing) {
    res.setHeader("Set-Cookie", serialized);
    return;
  }
  const list = Array.isArray(existing) ? existing : [String(existing)];
  res.setHeader("Set-Cookie", [...list, serialized]);
};

const getAuthClient = (req, res) =>
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
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          appendResponseCookie(res, name, value, options);
        });
      },
    },
  });

async function getAuthenticatedUserContext(req, res) {
  const authClient = getAuthClient(req, res);
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, access_level")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    role: profile?.role || "",
    accessLevel: profile?.access_level || 3,
  };
}

function normalizeRule(ruleType, ruleValue) {
  const type = String(ruleType || "").trim().toLowerCase();
  let value = String(ruleValue || "").trim().toLowerCase();
  if (type === "domain" && value.startsWith("@")) value = value.slice(1);
  return { type, value };
}

export default async function handler(req, res) {
  try {
    if (!SUPABASE_URL || !SUPABASE_KEY || !SUPABASE_ANON_KEY) {
      return res.status(500).json({ error: "Supabase is not configured" });
    }

    const userContext = await getAuthenticatedUserContext(req, res);
    if (!userContext) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!roleCanWrite(String(userContext.role || "").trim().toLowerCase(), userContext.accessLevel)) {
      return res.status(403).json({ error: "Write access is disabled for this role" });
    }

    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("spam_blocklist")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        return res.status(200).json({ rows: [] });
      }
      return res.status(200).json({ rows: data || [] });
    }

    if (req.method === "POST") {
      const { ruleType = "", ruleValue = "", reason = "" } = req.body || {};
      const { type, value } = normalizeRule(ruleType, ruleValue);
      if (!["email", "domain"].includes(type) || !value) {
        return res.status(400).json({ error: "ruleType must be email/domain and ruleValue is required" });
      }

      const { data, error } = await supabase
        .from("spam_blocklist")
        .insert({
          rule_type: type,
          rule_value: value,
          reason: String(reason || "").trim() || null,
          is_active: true,
          created_by: userContext.id,
        })
        .select("*")
        .single();
      if (error) {
        return res.status(500).json({ error: error.message || "Could not save block rule" });
      }
      return res.status(200).json({ row: data });
    }

    if (req.method === "PATCH") {
      const { id, is_active } = req.body || {};
      if (!id || typeof is_active !== "boolean") {
        return res.status(400).json({ error: "id and is_active are required" });
      }
      const { data, error } = await supabase
        .from("spam_blocklist")
        .update({ is_active })
        .eq("id", id)
        .select("*")
        .single();
      if (error) return res.status(500).json({ error: error.message || "Could not update rule" });
      return res.status(200).json({ row: data });
    }

    if (req.method === "DELETE") {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: "id is required" });
      const { error } = await supabase.from("spam_blocklist").delete().eq("id", id);
      if (error) return res.status(500).json({ error: error.message || "Could not delete rule" });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Spam blocklist API error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
}
