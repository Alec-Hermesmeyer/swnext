/**
 * Shared OpenAI embedding utility used by RAG search, backfill, and upload endpoints.
 *
 * Improvements over the original:
 *  - Input normalization: collapse whitespace, strip control chars so noisy
 *    PDF/DOCX extractions don't waste token budget on garbage bytes.
 *  - Automatic retry with back-off for transient 429 / 5xx errors.
 *  - Configurable model via env var so upgrading to text-embedding-3-large
 *    or a future model only requires a deploy-time change.
 */

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "text-embedding-3-small";
const MAX_INPUT_CHARS = 8000;
const MAX_RETRIES = 2;

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
        input: cleaned,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.data[0].embedding;
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

// Re-export for use in chunking/upload if callers need normalization directly
export { normalizeForEmbedding, EMBEDDING_MODEL };
