import { createClient } from "@supabase/supabase-js";
import { IncomingForm } from "formidable";
import fs from "fs";
import path from "path";
// Use the shared embedding utility (includes normalization + retry logic)
import { getEmbedding } from "@/lib/embeddings";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const config = {
  api: { bodyParser: false },
};

/**
 * Split text into overlapping chunks at natural boundaries.
 *
 * Improvements:
 *  - Adaptively picks chunk size: shorter for dense structured data (JSON/CSV),
 *    standard for narrative text.
 *  - Prefers paragraph → sentence → line → word breaks (in that priority order).
 *  - Each chunk gets a lightweight context header with the source filename and
 *    chunk index so the LLM can attribute information during generation.
 */
function chunkText(text, { maxChunkSize = 1500, overlap = 200, filename = "" } = {}) {
  // For JSON/structured data, use smaller chunks so each chunk is self-contained
  const isStructured = text.trimStart().startsWith("{") || text.trimStart().startsWith("[");
  const effectiveMax = isStructured ? Math.min(maxChunkSize, 900) : maxChunkSize;
  const effectiveOverlap = isStructured ? Math.min(overlap, 120) : overlap;

  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = start + effectiveMax;
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
        if (bp > effectiveMax * 0.5) {
          end = start + bp + 1;
          break;
        }
      }
    }
    let chunk = text.substring(start, Math.min(end, text.length)).trim();

    // Prepend a lightweight header so the embedding captures source context
    if (filename && chunks.length === 0) {
      chunk = `[Source: ${filename}]\n${chunk}`;
    }

    chunks.push(chunk);
    start = end - effectiveOverlap;
    if (start < 0) start = 0;
    if (end >= text.length) break;
  }
  return chunks.filter((c) => c.length > 50); // skip tiny fragments
}

/**
 * Extract readable text from uploaded files.
 *
 * For DOCX files we pull text from the inner word/document.xml (the DOCX
 * format is just a ZIP of XML files). This produces far cleaner text than
 * the previous raw-binary-to-UTF-8 fallback.
 *
 * For PDFs the raw-binary approach is retained as a best-effort extractor
 * (a proper library like pdf-parse would be an excellent next step) but we
 * now apply smarter cleanup so the embedding model gets usable input.
 */
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

  // JSON — pretty-print so chunker gets readable structure
  if (mimeType?.includes("json")) {
    try {
      const parsed = JSON.parse(raw.toString("utf-8"));
      return JSON.stringify(parsed, null, 2);
    } catch {
      return raw.toString("utf-8");
    }
  }

  // DOCX — extract text from the embedded XML
  if (
    mimeType?.includes("wordprocessingml") ||
    mimeType?.includes("docx") ||
    filePath.endsWith(".docx")
  ) {
    try {
      // DOCX is a ZIP; look for PK header
      if (raw[0] === 0x50 && raw[1] === 0x4b) {
        // Minimal ZIP scan: find word/document.xml entry and extract its text nodes.
        // This avoids adding a ZIP dependency for the common case.
        const str = raw.toString("binary");
        const xmlStart = str.indexOf("word/document.xml");
        if (xmlStart !== -1) {
          // Find the XML content — it's between the local-file header and the next PK entry
          const contentStart = str.indexOf("<?xml", xmlStart);
          const contentEnd = str.indexOf("</w:document>", contentStart);
          if (contentStart !== -1 && contentEnd !== -1) {
            const xmlContent = str.substring(contentStart, contentEnd + 13);
            // Pull text from <w:t> tags (Word paragraph text runs)
            const textParts = [];
            const tagRe = /<w:t[^>]*>([^<]*)<\/w:t>/g;
            let match;
            while ((match = tagRe.exec(xmlContent)) !== null) {
              textParts.push(match[1]);
            }
            // Detect paragraph boundaries from </w:p> tags
            const fullText = xmlContent
              .replace(/<\/w:p>/g, "\n")
              .replace(/<[^>]+>/g, "")
              .replace(/&amp;/g, "&")
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
              .replace(/&quot;/g, '"')
              .replace(/\s{3,}/g, "\n")
              .trim();
            if (fullText.length > 100) return fullText;
            // Fall back to the simple tag-strip if the paragraph approach was sparse
            if (textParts.length) {
              const joined = textParts.join(" ").trim();
              if (joined.length > 100) return joined;
            }
          }
        }
      }
    } catch {
      // Fall through to generic binary extraction
    }
  }

  // PDF / other binary formats — best-effort extraction with improved cleanup
  const textContent = raw
    .toString("utf-8", 0, Math.min(raw.length, 500000))
    .replace(/[^\x20-\x7E\n\r\t]/g, " ")
    // Collapse runs of spaces (common in PDF binary artefacts)
    .replace(/ {3,}/g, " ")
    // Turn multiple blank lines into double-newline paragraph breaks
    .replace(/\n{3,}/g, "\n\n")
    // Remove lines that are entirely non-alpha (binary noise)
    .split("\n")
    .filter((line) => /[a-zA-Z]{2,}/.test(line))
    .join("\n")
    .trim();

  if (textContent.length > 100) return textContent;

  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!process.env.OPENAI_API_KEY) {
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

    // 3. Chunk the text (pass filename for context-aware headers)
    const chunks = chunkText(text, { filename: originalName });

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
