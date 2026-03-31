import { createClient } from "@supabase/supabase-js";
import { IncomingForm } from "formidable";
import fs from "fs";
import path from "path";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const config = {
  api: { bodyParser: false },
};

async function getEmbedding(text) {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text.substring(0, 8000),
    }),
  });
  if (!response.ok) throw new Error("Embedding failed");
  const data = await response.json();
  return data.data[0].embedding;
}

function chunkText(text, maxChunkSize = 1500, overlap = 200) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = start + maxChunkSize;
    // Try to break at a sentence or paragraph boundary
    if (end < text.length) {
      const slice = text.substring(start, end + 200);
      const breakPoints = [
        slice.lastIndexOf("\n\n"),
        slice.lastIndexOf(".\n"),
        slice.lastIndexOf(". "),
        slice.lastIndexOf("\n"),
      ];
      for (const bp of breakPoints) {
        if (bp > maxChunkSize * 0.5) {
          end = start + bp + 1;
          break;
        }
      }
    }
    chunks.push(text.substring(start, Math.min(end, text.length)).trim());
    start = end - overlap;
    if (start < 0) start = 0;
    if (end >= text.length) break;
  }
  return chunks.filter((c) => c.length > 50); // skip tiny fragments
}

function extractTextFromFile(filePath, mimeType) {
  const raw = fs.readFileSync(filePath);

  // Plain text / CSV / markdown
  if (
    mimeType?.includes("text") ||
    mimeType?.includes("csv") ||
    mimeType?.includes("markdown")
  ) {
    return raw.toString("utf-8");
  }

  // JSON
  if (mimeType?.includes("json")) {
    try {
      const parsed = JSON.parse(raw.toString("utf-8"));
      return JSON.stringify(parsed, null, 2);
    } catch {
      return raw.toString("utf-8");
    }
  }

  // For PDFs and other binary formats, extract what we can as UTF-8
  // A proper PDF parser would be better but this handles basic cases
  const textContent = raw
    .toString("utf-8", 0, Math.min(raw.length, 500000))
    .replace(/[^\x20-\x7E\n\r\t]/g, " ")
    .replace(/\s{3,}/g, "\n")
    .trim();

  if (textContent.length > 100) return textContent;

  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: "OPENAI_API_KEY not configured" });
  }

  try {
    const form = new IncomingForm({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      keepExtensions: true,
    });

    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const file = files.file?.[0] || files.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const category = String(fields.category?.[0] || fields.category || "general");
    const originalName = file.originalFilename || file.newFilename || "unknown";
    const mimeType = file.mimetype || "";

    // 1. Upload to Supabase Storage
    const storagePath = `uploads/${Date.now()}-${originalName}`;
    const fileBuffer = fs.readFileSync(file.filepath);

    const { error: uploadError } = await supabase.storage
      .from("knowledge-base")
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return res.status(500).json({ error: `Upload failed: ${uploadError.message}` });
    }

    // 2. Extract text
    const text = extractTextFromFile(file.filepath, mimeType);
    if (!text || text.length < 50) {
      return res.status(200).json({
        stored: 0,
        file_path: storagePath,
        message: "File uploaded to storage but could not extract enough text to embed. For PDFs, try copy-pasting the text content directly using '+ Add Document'.",
      });
    }

    // 3. Chunk the text
    const chunks = chunkText(text);

    // 4. Embed and store each chunk
    let stored = 0;
    let failed = 0;

    for (let i = 0; i < chunks.length; i += 5) {
      const batch = chunks.slice(i, i + 5);
      const rows = [];

      for (const chunk of batch) {
        try {
          const embedding = await getEmbedding(chunk);
          rows.push({
            content: chunk,
            category,
            source: "upload",
            file_path: storagePath,
            metadata: {
              filename: originalName,
              chunk_index: stored + failed,
              total_chunks: chunks.length,
            },
            embedding,
          });
        } catch {
          failed++;
        }
      }

      if (rows.length) {
        const { error: insertError } = await supabase.from("documents").insert(rows);
        if (insertError) {
          failed += rows.length;
        } else {
          stored += rows.length;
        }
      }
    }

    // Clean up temp file
    try { fs.unlinkSync(file.filepath); } catch {}

    return res.status(200).json({
      stored,
      failed,
      total_chunks: chunks.length,
      file_path: storagePath,
      filename: originalName,
      text_length: text.length,
    });
  } catch (err) {
    console.error("RAG upload error:", err);
    return res.status(500).json({ error: err.message });
  }
}
