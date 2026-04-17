/**
 * /api/bid-chat — Local AI chat endpoint for bid document Q&A.
 *
 * The external bidding backend (sw-bidding-api) does NOT have a /chat
 * endpoint.  This route fills that gap by:
 *   1. Fetching the document's extracted data from the bidding backend
 *   2. Building a context prompt from the extracted fields
 *   3. Sending the user's question + context to the Groq LLM
 *   4. Returning the answer with source citations
 *
 * POST /api/bid-chat
 * Body: { document_id, message, top_k? }
 */

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const BIDDING_BACKEND =
  process.env.BIDDING_BACKEND ||
  process.env.BIDDING_API_URL ||
  process.env.NEXT_PUBLIC_BIDDING_BACKEND ||
  process.env.NEXT_PUBLIC_BIDDING_API_URL ||
  "http://localhost:8000";

// ── Fetch document detail from bidding backend ──────────────────────

async function fetchDocumentDetail(documentId) {
  const url = `${BIDDING_BACKEND.replace(/\/$/, "")}/api/ai-bidding/documents/${documentId}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.detail || body?.error || `Backend returned ${res.status}`);
  }
  const data = await res.json();
  return data?.document || null;
}

// ── Build context from extracted document data ──────────────────────

function buildDocumentContext(doc) {
  if (!doc) return "No document data available.";

  const parts = [];
  const extracted = doc.extracted_json || {};
  const summary = extracted.summary || {};

  parts.push(`## Document: ${doc.filename || "Unknown"}`);
  parts.push(`File type: ${doc.file_type || "unknown"}`);

  if (summary.project_name || extracted.project_name) {
    parts.push(`Project: ${summary.project_name || extracted.project_name}`);
  }
  if (summary.client_name || summary.customer_name || extracted.client_name) {
    parts.push(`Client: ${summary.client_name || summary.customer_name || extracted.client_name}`);
  }
  if (summary.due_date || extracted.due_date) {
    parts.push(`Due date: ${summary.due_date || extracted.due_date}`);
  }

  // Scope items
  const scopeItems = Array.isArray(extracted.scope_items) ? extracted.scope_items : [];
  if (scopeItems.length) {
    parts.push(`\n## Scope Items (${scopeItems.length})`);
    scopeItems.forEach((item, i) => parts.push(`${i + 1}. ${item}`));
  }

  // Assumptions
  const assumptions = Array.isArray(extracted.assumptions) ? extracted.assumptions : [];
  if (assumptions.length) {
    parts.push(`\n## Assumptions (${assumptions.length})`);
    assumptions.forEach((item, i) => parts.push(`${i + 1}. ${item}`));
  }

  // Exclusions
  const exclusions = Array.isArray(extracted.exclusions) ? extracted.exclusions : [];
  if (exclusions.length) {
    parts.push(`\n## Exclusions (${exclusions.length})`);
    exclusions.forEach((item, i) => parts.push(`${i + 1}. ${item}`));
  }

  // Risk flags
  const riskFlags = Array.isArray(extracted.risk_flags) ? extracted.risk_flags : [];
  if (riskFlags.length) {
    parts.push(`\n## Risk Flags (${riskFlags.length})`);
    riskFlags.forEach((flag, i) => parts.push(`${i + 1}. ${flag}`));
  }

  // Currency values / pricing
  const currencyValues = Array.isArray(summary.currency_values_detected)
    ? summary.currency_values_detected
    : [];
  if (currencyValues.length) {
    parts.push(`\n## Detected Currency Values`);
    parts.push(currencyValues.join(", "));
  }

  const headlineTotals = Array.isArray(summary.headline_totals)
    ? summary.headline_totals
    : [];
  if (headlineTotals.length) {
    parts.push(`\n## Headline Bid Totals`);
    headlineTotals.forEach((t) => {
      parts.push(`- ${t.label || "Unlabeled"}: ${t.amount || "N/A"}`);
    });
  }

  // Percentages
  const percentages = Array.isArray(summary.percentages_detected)
    ? summary.percentages_detected
    : [];
  if (percentages.length) {
    parts.push(`\n## Detected Percentages`);
    parts.push(percentages.join(", "));
  }

  // Priced items
  const pricedItems = Array.isArray(extracted.priced_items)
    ? extracted.priced_items
    : [];
  if (pricedItems.length) {
    parts.push(`\n## Priced Line Items (${pricedItems.length})`);
    pricedItems.slice(0, 30).forEach((item, i) => {
      const ctx = item.context ? ` — ${item.context.slice(0, 120)}` : "";
      parts.push(`${i + 1}. ${item.amount} [${item.category || "other"}]${ctx}`);
    });
    if (pricedItems.length > 30) {
      parts.push(`... and ${pricedItems.length - 30} more items`);
    }
  }

  // Raw text excerpt (first ~2000 chars for additional context)
  if (doc.raw_text) {
    const excerpt = doc.raw_text.slice(0, 2000);
    parts.push(`\n## Raw Document Text (excerpt)`);
    parts.push(excerpt);
    if (doc.raw_text.length > 2000) {
      parts.push(`... [truncated, ${doc.raw_text.length} total characters]`);
    }
  }

  // Suggestions
  const suggestions = Array.isArray(doc.suggestions_json) ? doc.suggestions_json : [];
  if (suggestions.length) {
    parts.push(`\n## AI Suggestions`);
    suggestions.forEach((s, i) => parts.push(`${i + 1}. ${s.text || s}`));
  }

  return parts.join("\n");
}

// ── Build citations from document sections ──────────────────────────

function buildCitations(answer, doc) {
  const citations = [];
  const extracted = doc?.extracted_json || {};
  const sections = [
    { name: "Scope Items", data: extracted.scope_items },
    { name: "Assumptions", data: extracted.assumptions },
    { name: "Exclusions", data: extracted.exclusions },
    { name: "Risk Flags", data: extracted.risk_flags },
  ];

  const lowerAnswer = answer.toLowerCase();
  let idx = 1;

  for (const section of sections) {
    if (!Array.isArray(section.data)) continue;
    for (const item of section.data) {
      const itemLower = String(item).toLowerCase();
      // Check if any significant words from the item appear in the answer
      const words = itemLower.split(/\s+/).filter((w) => w.length > 4);
      const matches = words.filter((w) => lowerAnswer.includes(w));
      if (matches.length >= 2 || (words.length <= 2 && matches.length >= 1)) {
        citations.push({
          index: idx++,
          section: section.name,
          snippet: String(item).slice(0, 200),
        });
        if (citations.length >= 6) break;
      }
    }
    if (citations.length >= 6) break;
  }

  return citations;
}

// ── Call Groq LLM ───────────────────────────────────────────────────

async function callGroq(messages) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages,
      max_tokens: 2048,
      temperature: 0.3,
      top_p: 0.85,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Groq API error:", errText);
    throw new Error("AI service error");
  }

  return response.json();
}

// ── Main handler ────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: "AI service not configured (GROQ_API_KEY missing)" });
  }

  const { document_id, message } = req.body || {};

  if (!document_id) {
    return res.status(400).json({ error: "document_id is required" });
  }
  if (!message || !String(message).trim()) {
    return res.status(400).json({ error: "message is required" });
  }

  try {
    // 1. Fetch the full document from the bidding backend
    const doc = await fetchDocumentDetail(document_id);
    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    // 2. Build context from the extracted data
    const context = buildDocumentContext(doc);

    // 3. Build the LLM messages
    const systemPrompt = [
      "You are a Bid Document Assistant for S&W Foundation Contractors, a deep foundation and drilling company.",
      "You help the sales team analyze bid documents, identify risks, draft proposals, and answer questions about bid content.",
      "",
      "When answering questions:",
      "- Reference specific details from the document data provided below",
      "- If asked to generate content (intro, exclusions, scope items, etc.), format lists with bullet points (- item)",
      "- Be specific and actionable — avoid vague or generic advice",
      "- When discussing pricing, always reference the actual amounts from the document",
      "- Flag any potential risks or missing information you notice",
      "",
      "Here is the bid document data:",
      "",
      context,
    ].join("\n");

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: String(message).trim() },
    ];

    // 4. Call the LLM
    const completion = await callGroq(messages);
    const answer = completion?.choices?.[0]?.message?.content || "I couldn't generate a response.";

    // 5. Build citations from document sections
    const citations = buildCitations(answer, doc);

    return res.status(200).json({ answer, citations });
  } catch (error) {
    console.error("bid-chat error:", error);
    return res.status(500).json({
      error: "Chat failed",
      detail: error.message || "Unknown error",
    });
  }
}
