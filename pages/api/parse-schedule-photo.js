/**
 * API Route: /api/parse-schedule-photo
 *
 * Accepts multipart image upload (1–4 schedule photos), sends to a vision LLM
 * for structured extraction, then fuzzy-matches against known Supabase entities.
 *
 * Provider priority:
 *   1. Groq (Llama 4 Scout) — default, fast, ~$0.11/M tokens, key already set
 *   2. Anthropic (Claude Sonnet) — optional fallback, higher accuracy, ~$3/M tokens
 *
 * The provider can be forced via ?provider=groq|anthropic query param.
 * If neither key is configured the route returns a 500.
 */
import { IncomingForm } from "formidable";
import fs from "fs";
import path from "path";
import { createAdminSupabase } from "@/lib/supabase";
import {
  buildMatchers,
  matchAllRows,
  computeSummary,
} from "@/lib/schedule-parser";

// Disable Next.js body parser so formidable can handle multipart
export const config = {
  api: { bodyParser: false },
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const MAX_FILES = 4;
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB per file
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/heic",
  "image/heif",
]);

// Groq base64 limit is 4 MB — resize more aggressively than Anthropic
const GROQ_MAX_DIMENSION = 1600;
const ANTHROPIC_MAX_DIMENSION = 2400;

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse multipart form data and return file array */
function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({
      maxFileSize: MAX_FILE_SIZE,
      maxFiles: MAX_FILES,
      allowEmptyFiles: false,
      keepExtensions: true,
    });
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      const fileList = Array.isArray(files.photos)
        ? files.photos
        : files.photos
        ? [files.photos]
        : [];
      resolve({ fields, files: fileList });
    });
  });
}

/**
 * Convert HEIC buffer to JPEG buffer.
 *
 * Strategy (ordered by speed):
 *   1. macOS `sips` — 200ms, available on dev machines and macOS CI
 *   2. `heic-convert` — 1-2s, pure JS, works on Linux / Vercel / any platform
 *
 * Returns a JPEG Buffer, or throws if both fail.
 */
async function convertHeicToJpeg(heicBuffer, srcPath, maxDimension) {
  // --- Fast path: macOS sips ---
  try {
    const { execSync } = await import("child_process");
    const tmpOut = srcPath + ".converted.jpg";
    execSync(
      `sips -s format jpeg -Z ${maxDimension} "${srcPath}" --out "${tmpOut}"`,
      { stdio: "pipe", timeout: 10000 }
    );
    const jpegBuf = fs.readFileSync(tmpOut);
    try { fs.unlinkSync(tmpOut); } catch (_) {}
    if (jpegBuf.length > 0) {
      console.log("HEIC→JPEG via sips:", (jpegBuf.length / 1024).toFixed(0), "KB");
      return jpegBuf;
    }
  } catch (_) {
    // sips not available (Linux, Vercel) — fall through
  }

  // --- Cross-platform: heic-convert (pure JS) ---
  try {
    const heicConvert = (await import("heic-convert")).default;
    const rawJpeg = await heicConvert({
      buffer: heicBuffer,
      format: "JPEG",
      quality: 0.85,
    });
    // heic-convert returns a full-res JPEG — we'll let sharp resize it later
    console.log("HEIC→JPEG via heic-convert:", (rawJpeg.length / 1024).toFixed(0), "KB");
    return Buffer.from(rawJpeg);
  } catch (e) {
    throw new Error(`Cannot decode HEIC image: ${e.message}`);
  }
}

/** Preprocess image: decode HEIC if needed, auto-rotate, resize, normalize → JPEG base64 */
async function fileToBase64(filePath, mimeType, maxDimension) {
  const ext = path.extname(filePath).toLowerCase();
  const isHeic =
    ext === ".heic" ||
    ext === ".heif" ||
    mimeType?.includes("heic") ||
    mimeType?.includes("heif");

  let buffer = fs.readFileSync(filePath);

  // Step 1: If HEIC, decode to JPEG first (sharp can't decode HEIC without libheif)
  if (isHeic) {
    buffer = await convertHeicToJpeg(buffer, filePath, maxDimension);
  }

  // Step 2: Standard sharp pipeline — rotate, resize, normalize, sharpen, output JPEG
  try {
    const sharp = (await import("sharp")).default;
    buffer = await sharp(buffer)
      .rotate() // auto-orient from EXIF
      .resize(maxDimension, null, { withoutEnlargement: true })
      .normalize() // auto-levels for contrast
      .sharpen({ sigma: 0.8 })
      .jpeg({ quality: 85 })
      .toBuffer();
  } catch (e) {
    // If sharp fails on the (now JPEG/PNG) buffer, log but continue with what we have
    console.error("Sharp post-processing failed (using decoded buffer):", e.message);
  }

  const b64 = buffer.toString("base64");
  const sizeMB = (b64.length / 1024 / 1024).toFixed(2);
  console.log(`Image ready: ${sizeMB} MB base64, source=${isHeic ? "HEIC" : ext}`);

  // Safety check: Groq rejects base64 over 4MB
  if (b64.length > 4 * 1024 * 1024) {
    console.warn(`Base64 size ${sizeMB}MB exceeds 4MB — re-compressing at lower quality`);
    try {
      const sharp = (await import("sharp")).default;
      buffer = await sharp(buffer)
        .resize(1200, null, { withoutEnlargement: true })
        .jpeg({ quality: 70 })
        .toBuffer();
    } catch (_) {}
  }

  return {
    base64: buffer.toString("base64"),
    mediaType: "image/jpeg",
  };
}

// ---------------------------------------------------------------------------
// Fetch known entities from Supabase for fuzzy matching context
// ---------------------------------------------------------------------------
async function fetchEntities() {
  const supabase = createAdminSupabase();

  const [workers, jobs, categories, trucks, superintendents] =
    await Promise.all([
      supabase
        .from("crew_workers")
        .select("id, name, phone, role")
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("crew_jobs")
        .select(
          "id, job_name, job_number, customer_name, address, city, default_rig, is_active"
        )
        .order("job_name"),
      supabase
        .from("crew_categories")
        .select("id, name, color, sort_order")
        .order("sort_order"),
      supabase
        .from("crew_trucks")
        .select("id, truck_number, description")
        .eq("is_active", true)
        .order("truck_number"),
      supabase
        .from("crew_superintendents")
        .select("id, name, phone")
        .eq("is_active", true)
        .order("name"),
    ]);

  return {
    workers: workers.data || [],
    jobs: jobs.data || [],
    categories: categories.data || [],
    trucks: trucks.data || [],
    superintendents: superintendents.data || [],
  };
}

// ---------------------------------------------------------------------------
// Build the extraction prompt (shared by both providers)
// ---------------------------------------------------------------------------
function buildPrompt(entities) {
  const workerNames = entities.workers.map((w) => w.name).join(", ");
  const jobList = entities.jobs
    .filter((j) => j.is_active !== false)
    .map((j) => `${j.job_name}${j.job_number ? ` (#${j.job_number})` : ""}`)
    .join("; ");
  const categoryNames = entities.categories.map((c) => c.name).join(", ");
  const truckNumbers = entities.trucks.map((t) => t.truck_number).join(", ");
  const superNames = entities.superintendents
    .map((s) => s.name)
    .join(", ");

  return `You are extracting structured data from handwritten S&W Foundation daily crew schedule photos.

FORM LAYOUT (columns left to right — paper is landscape, photographed sideways):
  Job Name | Job Number | Rig | Crane | Superintendent | Truck # | Start Time | Crew Members

COLOR CODING:
- Orange/pink highlighted rows = one rig group
- Yellow/green highlighted rows = another rig group
- Bottom section typically covers Equipment and Crane entries
- Rows with no highlighting are also valid entries

KNOWN ENTITIES (use these to correct OCR spelling):
Workers: ${workerNames || "(none loaded)"}
Jobs: ${jobList || "(none loaded)"}
Categories/Rigs: ${categoryNames || "(none loaded)"}
Trucks: ${truckNumbers || "(none loaded)"}
Superintendents: ${superNames || "(none loaded)"}

STATUS KEYWORDS:
- "Mob rig" or "Mob" = mobilizing
- "Down Day" = not working
- "Down for repairs" or "Repairs" = maintenance
- "Yard" or "Shop" = at yard/shop
- Regular working rows just show the job name

CRITICAL INSTRUCTIONS:
1. Extract EVERY visible row, even partial ones.
2. The date is at the top-left of the first page (format: M-DD-YY).
3. Superintendent column may show a single letter like "R" or "F" — output exactly as written.
4. Crew names may be first-name-only or abbreviated — output exactly as written.
5. Same job on multiple rigs = separate entries.
6. Non-working rows: set status keyword, still extract other visible fields.
7. Multiple photos with overlap: include each row once (deduplicate by rig name + job).

Return ONLY valid JSON (no markdown fences, no commentary):
{
  "schedule_date": "YYYY-MM-DD",
  "superintendent_header": "names listed at top of page if visible",
  "rows": [
    {
      "row_number": 1,
      "highlight_color": "orange|yellow|none",
      "rig_name": "full rig designation as written",
      "job_name": "job name as written",
      "job_number": "4-digit number if visible",
      "superintendent": "name or initial as written",
      "truck_number": "T-## format as written",
      "start_time": "time if visible (e.g. 5:30, 4:30, 6AM)",
      "crane_info": "crane details if present",
      "status": "working|mob|down_day|repairs|yard",
      "status_text": "exact status text if non-working",
      "crew_members": ["name1", "name2"],
      "notes": "any additional text"
    }
  ]
}`;
}

// ---------------------------------------------------------------------------
// Provider: Groq (Llama 4 Scout — OpenAI-compatible API)
// ---------------------------------------------------------------------------
async function callGroqVision(images, prompt) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not configured");

  // Build OpenAI-compatible content array
  const content = [
    { type: "text", text: prompt },
    ...images.map((img) => ({
      type: "image_url",
      image_url: {
        url: `data:${img.mediaType};base64,${img.base64}`,
      },
    })),
    {
      type: "text",
      text: "Extract all schedule rows from the photo(s) above. Return ONLY valid JSON.",
    },
  ];

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_VISION_MODEL,
      messages: [{ role: "user", content }],
      max_tokens: 8000,
      temperature: 0.1, // low temp for structured extraction
      top_p: 0.9,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Groq Vision API error:", errText);
    throw new Error(`Groq API error (${response.status}): ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "";

  return parseVisionJSON(text, "Groq");
}

// ---------------------------------------------------------------------------
// Provider: Anthropic Claude (optional fallback)
// ---------------------------------------------------------------------------
async function callAnthropicVision(images, prompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  // Dynamic import — only loaded when Anthropic is actually used
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey });

  const content = [
    { type: "text", text: prompt },
    ...images.map((img) => ({
      type: "image",
      source: {
        type: "base64",
        media_type: img.mediaType,
        data: img.base64,
      },
    })),
    {
      type: "text",
      text: "Extract all schedule rows from the photo(s) above. Return ONLY valid JSON.",
    },
  ];

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8000,
    messages: [{ role: "user", content }],
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  return parseVisionJSON(text, "Anthropic");
}

// ---------------------------------------------------------------------------
// Shared JSON parser — handles markdown fences, partial JSON, etc.
// ---------------------------------------------------------------------------
function parseVisionJSON(raw, providerName) {
  // Strip markdown code fences if present
  let text = raw.trim();
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();

  // Some models prepend commentary — try to find the JSON object
  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  if (jsonStart >= 0 && jsonEnd > jsonStart) {
    text = text.slice(jsonStart, jsonEnd + 1);
  }

  try {
    const parsed = JSON.parse(text);
    // Validate basic structure
    if (!parsed.rows || !Array.isArray(parsed.rows)) {
      throw new Error("Response missing 'rows' array");
    }
    return parsed;
  } catch (e) {
    console.error(`Failed to parse ${providerName} response as JSON:`, e.message);
    console.error("Raw response (first 600 chars):", raw.slice(0, 600));
    throw new Error(
      `${providerName} returned invalid JSON. The model may have struggled with the image. Try re-uploading clearer photos.`
    );
  }
}

// ---------------------------------------------------------------------------
// Resolve which provider to use
// ---------------------------------------------------------------------------
function resolveProvider(queryProvider) {
  const forced = (queryProvider || "").toLowerCase();
  if (forced === "anthropic" && process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (forced === "groq" && process.env.GROQ_API_KEY) return "groq";

  // Auto: prefer Groq (cheaper, faster, key already configured)
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";

  return null;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const provider = resolveProvider(req.query?.provider);
  if (!provider) {
    return res.status(500).json({
      error:
        "No vision API key configured. Set GROQ_API_KEY (recommended) or ANTHROPIC_API_KEY in .env.local",
    });
  }

  const maxDim =
    provider === "groq" ? GROQ_MAX_DIMENSION : ANTHROPIC_MAX_DIMENSION;

  try {
    // 1. Parse uploaded files
    const { files } = await parseForm(req);
    if (files.length === 0) {
      return res.status(400).json({ error: "No photos uploaded" });
    }

    // Validate file types
    for (const file of files) {
      const mime = file.mimetype || file.type || "";
      const ext = path
        .extname(file.originalFilename || file.newFilename || "")
        .toLowerCase();
      const isAllowed =
        ALLOWED_TYPES.has(mime) ||
        [".png", ".jpg", ".jpeg", ".heic", ".heif", ".webp"].includes(ext);
      if (!isAllowed) {
        return res
          .status(400)
          .json({ error: `Unsupported file type: ${mime || ext}` });
      }
    }

    // 2. Convert all files to base64 (with preprocessing)
    const images = await Promise.all(
      files.map((file) =>
        fileToBase64(
          file.filepath || file.path,
          file.mimetype || file.type,
          maxDim
        )
      )
    );

    // 3. Fetch known entities from Supabase
    const entities = await fetchEntities();

    // 4. Build prompt and call vision API
    const prompt = buildPrompt(entities);
    const startMs = Date.now();
    const visionOutput =
      provider === "groq"
        ? await callGroqVision(images, prompt)
        : await callAnthropicVision(images, prompt);
    const durationMs = Date.now() - startMs;

    // 5. Fuzzy-match extracted data against known entities
    const matchers = buildMatchers(entities);
    const matchedResult = matchAllRows(visionOutput, matchers);
    computeSummary(matchedResult);

    // 6. Cleanup temp files
    for (const file of files) {
      try {
        fs.unlinkSync(file.filepath || file.path);
      } catch (_) {
        // Ignore cleanup errors
      }
    }

    // 7. Return results
    return res.status(200).json({
      success: true,
      provider,
      duration_ms: durationMs,
      ...matchedResult,
      entities: {
        workers: entities.workers,
        jobs: entities.jobs.filter((j) => j.is_active !== false),
        categories: entities.categories,
        trucks: entities.trucks,
        superintendents: entities.superintendents,
      },
    });
  } catch (error) {
    console.error("parse-schedule-photo error:", error);
    return res.status(500).json({
      error: error.message || "Failed to parse schedule photo",
      provider,
    });
  }
}
