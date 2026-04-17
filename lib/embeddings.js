/**
 * Shared OpenAI embedding utility used by RAG search, backfill, and upload endpoints.
 *
 * Features:
 *  - Input normalization: collapse whitespace, strip control chars so noisy
 *    PDF/DOCX extractions don't waste token budget on garbage bytes.
 *  - Automatic retry with back-off for transient 429 / 5xx errors.
 *  - Configurable model via env var so upgrading to text-embedding-3-large
 *    or a future model only requires a deploy-time change.
 *  - Batch embedding: embed multiple texts in a single API call for
 *    faster throughput during backfill and bulk upload operations.
 */

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "text-embedding-3-small";
const MAX_INPUT_CHARS = 8000;
const MAX_RETRIES = 2;
/** Maximum texts per batch — OpenAI allows up to 2048 but smaller batches
 *  keep individual request latency reasonable and limit blast radius. */
const MAX_BATCH_SIZE = 50;

/**
 * Normalize raw text so the embedding model sees clean, meaningful input.
 * Particularly important for PDF/DOCX extractions that carry binary artefacts.
 */
function normalizeForEmbedding(raw) {
  return raw
    // Strip non-printable control characters (keep newline, tab, space)
    .replace(/[^\x20-\x7E\n\t\u00A0-\uFFFF]/g, " ")
    // Collapse runs of whitespace (including mixed spaces/tabs/newlines)
    .replace(/[ \t]{2,}/g, " ")
    // Collapse 3+ consecutive blank lines into two
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Low-level fetch wrapper with retry logic.
 * @param {string|string[]} input — single string or array of strings (already cleaned)
 * @param {string} key — OpenAI API key
 * @returns {Promise<object>} raw API response JSON
 */
async function callEmbeddingAPI(input, key) {
  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input,
      }),
    });

    if (response.ok) {
      return response.json();
    }

    const errText = await response.text();
    lastError = new Error(
      `Embedding API error (${response.status}): ${errText.substring(0, 200)}`
    );

    // Only retry on rate-limit (429) or server errors (5xx)
    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt === MAX_RETRIES) throw lastError;

    // Exponential back-off: 500ms, 1500ms
    await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
  }

  throw lastError;
}

/**
 * Generate an embedding vector for the given text using OpenAI.
 * @param {string} text — the text to embed (normalized + truncated to 8 000 chars)
 * @param {string} [apiKey] — OpenAI API key; falls back to process.env.OPENAI_API_KEY
 * @returns {Promise<number[]>} embedding vector
 */
export async function getEmbedding(text, apiKey) {
  const key = apiKey || process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not configured");

  const cleaned = normalizeForEmbedding(text).substring(0, MAX_INPUT_CHARS);
  if (!cleaned) throw new Error("Embedding input is empty after normalization");

  const data = await callEmbeddingAPI(cleaned, key);
  return data.data[0].embedding;
}

/**
 * Embed multiple texts in a single API call.  Much faster than calling
 * getEmbedding() in a loop when ingesting many chunks (backfill, bulk upload).
 *
 * Returns an array of { embedding, index } objects ordered by the original
 * input index.  Texts that normalize to empty are returned as null.
 *
 * @param {string[]} texts — array of texts to embed
 * @param {string} [apiKey]
 * @returns {Promise<(number[]|null)[]>} array of embeddings (same order as input)
 */
export async function getEmbeddingBatch(texts, apiKey) {
  const key = apiKey || process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not configured");

  // Normalize and filter — keep track of original indices
  const cleaned = [];
  const indexMap = []; // cleaned[i] came from texts[indexMap[i]]
  const results = new Array(texts.length).fill(null);

  for (let i = 0; i < texts.length; i++) {
    const c = normalizeForEmbedding(texts[i]).substring(0, MAX_INPUT_CHARS);
    if (c) {
      cleaned.push(c);
      indexMap.push(i);
    }
  }

  if (!cleaned.length) return results;

  // Process in sub-batches to stay within reasonable request sizes
  for (let start = 0; start < cleaned.length; start += MAX_BATCH_SIZE) {
    const batch = cleaned.slice(start, start + MAX_BATCH_SIZE);
    const data = await callEmbeddingAPI(batch, key);

    // OpenAI returns data[].index relative to the input array of this call
    for (const item of data.data) {
      const originalIdx = indexMap[start + item.index];
      results[originalIdx] = item.embedding;
    }
  }

  return results;
}

// Re-export for use in chunking/upload if callers need normalization directly
export { normalizeForEmbedding, EMBEDDING_MODEL };
