import fs from "fs";
import path from "path";
import { IncomingForm } from "formidable";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { canWrite } from "@/lib/roles";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const BLOG_IMAGE_BUCKET = "blog-images";

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

const sanitizeFilename = (name) =>
  String(name || "image")
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const readJsonBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (!SUPABASE_URL || (!SUPABASE_SERVICE_ROLE_KEY && !SUPABASE_ANON_KEY)) {
    return res.status(500).json({ error: "Supabase is not configured" });
  }

  const userContext = await getAuthenticatedUserContext(req, res);
  if (!userContext) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (!canWrite(userContext.role, userContext.accessLevel)) {
    return res.status(403).json({ error: "You do not have permission to manage blog images" });
  }

  try {
    if (req.method === "GET") {
      const { data, error } = await supabase.storage
        .from(BLOG_IMAGE_BUCKET)
        .list("", { limit: 200, sortBy: { column: "created_at", order: "desc" } });
      if (error) {
        return res.status(500).json({ error: error.message || "Could not load blog images" });
      }

      const images = (data || [])
        .filter((item) => item?.name && !item.name.endsWith("/"))
        .map((item) => {
          const pathName = item.name;
          const { data: urlData } = supabase.storage.from(BLOG_IMAGE_BUCKET).getPublicUrl(pathName);
          return {
            path: pathName,
            name: item.name,
            created_at: item.created_at || null,
            updated_at: item.updated_at || null,
            publicUrl: urlData?.publicUrl || "",
          };
        });

      return res.status(200).json({ images });
    }

    if (req.method === "POST") {
      const form = new IncomingForm({
        keepExtensions: true,
        maxFileSize: 15 * 1024 * 1024,
      });
      const [, files] = await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, parsedFiles) => {
          if (err) reject(err);
          else resolve([fields, parsedFiles]);
        });
      });

      const file = files?.file?.[0] || files?.file;
      if (!file?.filepath) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const original = file.originalFilename || path.basename(file.filepath);
      const safeName = sanitizeFilename(original);
      const objectName = `${Date.now()}-${safeName}`;
      const fileBuffer = fs.readFileSync(file.filepath);
      const contentType = file.mimetype || "application/octet-stream";

      const { error: uploadError } = await supabase.storage
        .from(BLOG_IMAGE_BUCKET)
        .upload(objectName, fileBuffer, {
          contentType,
          upsert: false,
        });

      fs.unlink(file.filepath, () => {});

      if (uploadError) {
        return res.status(500).json({ error: uploadError.message || "Could not upload blog image" });
      }

      const { data: urlData } = supabase.storage.from(BLOG_IMAGE_BUCKET).getPublicUrl(objectName);
      return res.status(201).json({
        ok: true,
        image: {
          path: objectName,
          name: safeName,
          publicUrl: urlData?.publicUrl || "",
        },
      });
    }

    if (req.method === "PATCH") {
      const body = await readJsonBody(req);
      const sourcePath = String(body.sourcePath || "").trim();
      const nextNameInput = String(body.nextName || "").trim();
      if (!sourcePath || !nextNameInput) {
        return res.status(400).json({ error: "sourcePath and nextName are required" });
      }

      const ext = path.extname(sourcePath || "").toLowerCase();
      const requestedExt = path.extname(nextNameInput || "").toLowerCase();
      const cleanBase = sanitizeFilename(path.basename(nextNameInput, requestedExt || ext));
      const finalName = `${cleanBase}${requestedExt || ext}`;
      const targetPath = finalName;

      if (!cleanBase) {
        return res.status(400).json({ error: "Invalid target filename" });
      }
      if (sourcePath === targetPath) {
        const { data: urlData } = supabase.storage.from(BLOG_IMAGE_BUCKET).getPublicUrl(targetPath);
        return res.status(200).json({ ok: true, image: { path: targetPath, publicUrl: urlData?.publicUrl || "" } });
      }

      const { error: moveError } = await supabase.storage
        .from(BLOG_IMAGE_BUCKET)
        .move(sourcePath, targetPath);

      if (moveError) {
        return res.status(500).json({ error: moveError.message || "Could not rename image" });
      }

      const { data: urlData } = supabase.storage.from(BLOG_IMAGE_BUCKET).getPublicUrl(targetPath);
      return res.status(200).json({
        ok: true,
        image: {
          path: targetPath,
          name: path.basename(targetPath),
          publicUrl: urlData?.publicUrl || "",
        },
      });
    }

    if (req.method === "DELETE") {
      const body = await readJsonBody(req);
      const imagePath = String(body.path || "").trim();
      if (!imagePath) return res.status(400).json({ error: "path is required" });

      const { error: removeError } = await supabase.storage
        .from(BLOG_IMAGE_BUCKET)
        .remove([imagePath]);
      if (removeError) {
        return res.status(500).json({ error: removeError.message || "Could not delete image" });
      }
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, POST, PATCH, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("admin-blog-images handler:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
