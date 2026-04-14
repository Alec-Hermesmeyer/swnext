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

function normalizeAiJson(payload = {}) {
  const title = String(payload.title || "").trim();
  const excerpt = String(payload.excerpt || "").trim();
  const imageId = String(payload.imageId || "").trim();
  const content = String(payload.content || "").trim();
  return {
    title,
    excerpt,
    imageId,
    content,
  };
}

function buildFallbackDraft({ titleHint, keywordHint, notesHint, cityHint }) {
  const topic = titleHint || keywordHint || "Commercial foundation planning";
  const title = titleHint || `What To Know About ${topic} in ${cityHint}`;
  const excerpt = `Practical field guidance from S&W Foundation on ${topic.toLowerCase()} in ${cityHint}.`;
  const content = `## Why this matters

Reliable foundation planning is one of the biggest risk reducers on commercial jobs in ${cityHint}. Early coordination, realistic sequencing, and clear communication across crews keep work moving safely and on schedule.

## What we focus on in the field

- Pre-task planning and crew readiness
- Site access and equipment constraints
- Soil behavior and drilling strategy
- Daily production tracking and adjustment

## Common mistakes to avoid

Teams often lose time when assumptions are not validated in the field. We recommend confirming access, utility constraints, and scope details before committing to daily targets.

## Practical workflow for project teams

1. Align superintendent, rig plan, and truck assignment.
2. Confirm job-specific constraints before mobilization.
3. Track progress daily and communicate adjustments early.
4. Keep documentation clear for handoffs and closeout.

## FAQ

### How early should planning begin?
As early as possible once scope is defined, with a final pass before mobilization.

### What improves consistency most?
Standardized planning checklists and daily crew communication.

### Can this reduce rework?
Yes. Clear sequencing and early constraint checks usually reduce downstream surprises.

## Next steps

If you need help planning a commercial foundation project in ${cityHint}, contact S&W Foundation and we can help scope the work and build a practical execution plan.

${notesHint ? `\n\n_Additional context to refine:_ ${notesHint}` : ""}
`;
  return {
    title,
    excerpt,
    imageId: "",
    content,
  };
}

async function fetchOpenAiDraft(prompt, apiKey, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.5,
        max_tokens: 1000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You output only valid JSON objects." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`AI generation failed (${response.status}): ${text.slice(0, 180)}`);
    }

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content || "{}";
    let parsed = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }
    return normalizeAiJson(parsed);
  } finally {
    clearTimeout(timer);
  }
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
    return res.status(403).json({ error: "You do not have permission to generate drafts" });
  }

  try {
    const body = req.body || {};
    const titleHint = String(body.title || "").trim();
    const keywordHint = String(body.keyword || "").trim();
    const notesHint = String(body.notes || "").trim();
    const cityHint = String(body.city || "Dallas-Fort Worth").trim();
    const toneHint = String(body.tone || "Practical, trustworthy, expert").trim();

    if (!titleHint && !keywordHint) {
      return res.status(400).json({ error: "Provide at least a title or keyword." });
    }

    const prompt = `
You are writing a blog draft for S&W Foundation Contractors (commercial foundation and pier drilling company).
Return ONLY a valid JSON object with keys:
- title (string)
- excerpt (string, 1-2 sentences, under 220 chars)
- imageId (string, may be empty if unknown)
- content (string, markdown with H2/H3 headings, 450-750 words)

Requirements:
- Focus location: ${cityHint}
- Writing tone: ${toneHint}
- Include practical project context and operational realism.
- Avoid fluff and avoid fake statistics.
- Include a short FAQ section near the end.
- End with a call-to-action to contact S&W Foundation.

Inputs:
- title hint: ${titleHint || "(none)"}
- keyword hint: ${keywordHint || "(none)"}
- additional notes: ${notesHint || "(none)"}
`.trim();

    let normalized = null;
    try {
      normalized = await fetchOpenAiDraft(prompt, OPENAI_API_KEY, 8000);
    } catch (aiError) {
      console.warn("AI draft timed out/faulted; returning fallback draft:", aiError?.message || aiError);
      normalized = buildFallbackDraft({
        titleHint,
        keywordHint,
        notesHint,
        cityHint,
      });
      return res.status(200).json({
        draft: normalized,
        fallback: true,
      });
    }

    if (!normalized.content || !normalized.excerpt) {
      normalized = buildFallbackDraft({
        titleHint,
        keywordHint,
        notesHint,
        cityHint,
      });
      return res.status(200).json({
        draft: normalized,
        fallback: true,
      });
    }

    return res.status(200).json({ draft: normalized });
  } catch (error) {
    console.error("admin-blog-generate handler:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
