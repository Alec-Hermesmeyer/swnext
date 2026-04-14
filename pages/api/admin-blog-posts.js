import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { canWrite } from "@/lib/roles";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const BLOG_DIR = path.join(process.cwd(), "content", "blog");
const BLOG_STATUSES = new Set(["draft", "published"]);

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

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const cleanYamlValue = (value) =>
  String(value || "")
    .replace(/\r\n/g, " ")
    .replace(/\r/g, " ")
    .replace(/\n/g, " ")
    .replace(/"/g, '\\"')
    .trim();

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

function getPostSummaryFromFile(filename) {
  const slug = filename.replace(/\.md$/i, "");
  const filePath = path.join(BLOG_DIR, filename);
  const markdown = fs.readFileSync(filePath, "utf-8");
  const { data: frontmatter } = matter(markdown);
  const status = BLOG_STATUSES.has(String(frontmatter?.status || "").toLowerCase())
    ? String(frontmatter.status).toLowerCase()
    : "published";
  return {
    slug,
    title: frontmatter?.title || slug,
    excerpt: frontmatter?.excerpt || "",
    date: frontmatter?.date || null,
    imageId: frontmatter?.imageId || "",
    status,
  };
}

function buildMarkdownContent({ title, date, excerpt, imageId, body, status = "draft" }) {
  return `---
title: "${cleanYamlValue(title)}"
date: "${cleanYamlValue(date)}"
excerpt: "${cleanYamlValue(excerpt)}"
imageId: "${cleanYamlValue(imageId)}"
status: "${BLOG_STATUSES.has(String(status || "").toLowerCase()) ? String(status).toLowerCase() : "draft"}"
contact:
  phone: "(214) 703-0484"
  address: "2806 Singleton St. Rowlett, TX 75088"
  contactUrl: "/contact"
  servicesUrl: "/services"
---

${String(body || "").trim()}
`;
}

export default async function handler(req, res) {
  if (!SUPABASE_URL || (!SUPABASE_SERVICE_ROLE_KEY && !SUPABASE_ANON_KEY)) {
    return res.status(500).json({ error: "Supabase is not configured" });
  }

  const userContext = await getAuthenticatedUserContext(req, res);
  if (!userContext) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (!canWrite(userContext.role, userContext.accessLevel)) {
    return res.status(403).json({ error: "You do not have permission to manage blog posts" });
  }

  try {
    if (!fs.existsSync(BLOG_DIR)) {
      fs.mkdirSync(BLOG_DIR, { recursive: true });
    }

    if (req.method === "GET") {
      const files = fs
        .readdirSync(BLOG_DIR)
        .filter((filename) => filename.toLowerCase().endsWith(".md"));
      const posts = files
        .map(getPostSummaryFromFile)
        .sort((a, b) => new Date(b?.date || 0).getTime() - new Date(a?.date || 0).getTime());
      return res.status(200).json({ posts });
    }

    if (req.method === "POST") {
      const body = req.body || {};
      const title = String(body.title || "").trim();
      const excerpt = String(body.excerpt || "").trim();
      const content = String(body.content || "").trim();
      const imageId = String(body.imageId || "").trim();
      const date = String(body.date || "").trim() || new Date().toISOString().slice(0, 10);
      const status = BLOG_STATUSES.has(String(body.status || "").toLowerCase())
        ? String(body.status).toLowerCase()
        : "draft";
      const requestedSlug = String(body.slug || "").trim();

      if (!title) return res.status(400).json({ error: "title is required" });
      if (!excerpt) return res.status(400).json({ error: "excerpt is required" });
      if (!content) return res.status(400).json({ error: "content is required" });

      const safeSlug = slugify(requestedSlug || title);
      if (!safeSlug) {
        return res.status(400).json({ error: "Could not generate a valid slug" });
      }

      const filePath = path.join(BLOG_DIR, `${safeSlug}.md`);
      if (fs.existsSync(filePath)) {
        return res.status(409).json({ error: "A blog post with this slug already exists" });
      }

      const markdown = buildMarkdownContent({
        title,
        date,
        excerpt,
        imageId,
        status,
        body: content,
      });

      fs.writeFileSync(filePath, markdown, "utf-8");
      return res.status(201).json({
        ok: true,
        slug: safeSlug,
        message: "Blog post created.",
      });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("admin-blog-posts handler:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
