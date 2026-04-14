import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { canWrite } from "@/lib/roles";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY, {
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
      if (separatorIndex === -1) return { name: part, value: "" };
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
  const accessToken =
    req.cookies?.["sb-access-token"] || req.headers?.authorization?.replace("Bearer ", "");

  let user = null;
  if (accessToken) {
    const result = await supabase.auth.getUser(accessToken);
    user = result.data?.user || null;
  }
  if (!user) {
    const authClient = getAuthClient(req, res);
    const result = await authClient.auth.getUser();
    user = result.data?.user || null;
  }
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, access_level")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    role: profile?.role || "",
    accessLevel: profile?.access_level ?? 3,
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!SUPABASE_URL || (!SUPABASE_SERVICE_ROLE_KEY && !SUPABASE_ANON_KEY)) {
    return res.status(500).json({ error: "Supabase is not configured" });
  }
  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: "OPENAI_API_KEY is not configured" });
  }

  const userContext = await getAuthenticatedUserContext(req, res);
  if (!userContext) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (!canWrite(userContext.role, userContext.accessLevel)) {
    return res.status(403).json({ error: "You do not have permission to generate alt text" });
  }

  try {
    const body = req.body || {};
    const imageUrl = String(body.imageUrl || "").trim();
    if (!imageUrl) {
      return res.status(400).json({ error: "imageUrl is required" });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        max_tokens: 90,
        messages: [
          {
            role: "system",
            content:
              "Write concise accessibility alt text for construction blog images. Return only plain text, no quotes, no markdown.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Generate alt text under 20 words, specific and descriptive for this image." },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(500).json({ error: `Alt text generation failed (${response.status}): ${text.slice(0, 160)}` });
    }
    const data = await response.json();
    const altText = String(data?.choices?.[0]?.message?.content || "").trim();
    if (!altText) {
      return res.status(500).json({ error: "AI returned empty alt text." });
    }
    return res.status(200).json({ altText });
  } catch (error) {
    console.error("admin-blog-image-alt handler:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
