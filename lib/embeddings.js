/**
 * Shared OpenAI embedding utility used by RAG search, backfill, and upload endpoints.
 */

const EMBEDDING_MODEL = "text-embedding-3-small";
const MAX_INPUT_CHARS = 8000;

/**
 * Generate an embedding vector for the given text using OpenAI.
 * @param {string} text — the text to embed (truncated to 8 000 chars)
 * @param {string} [apiKey] — OpenAI API key; falls back to process.env.OPENAI_API_KEY
 * @returns {Promise<number[]>} embedding vector
 */
export async function getEmbedding(text, apiKey) {
  const key = apiKey || process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not configured");

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text.substring(0, MAX_INPUT_CHARS),
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Embedding API error (${response.status}): ${errText.substring(0, 200)}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}
