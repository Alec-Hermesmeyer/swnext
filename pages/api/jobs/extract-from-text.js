/**
 * POST /api/jobs/extract-from-text
 * Body: { text: string }  — pasted email, message, RFP excerpt, etc.
 * Response: { fields: { ...crew_jobs draft }, confidence: string, notes: string }
 *
 * Calls OpenAI with a strict JSON schema so the JobFormModal can pre-fill
 * every field it knows how to. Fields the model can't confidently infer
 * are returned as empty strings so the user can fill them in.
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const SYSTEM_PROMPT = `You extract pier-drilling / foundation-construction job details from unstructured text (emails, RFPs, texts, scope notes) into structured JSON for S&W Foundation Contractors.

Return ONE JSON object with exactly these keys. If a value is not clearly stated, return an empty string. Do not invent values.

{
  "job_name": string,                // Project name or site name, e.g., "Goodloe Stadium (Red Oak)"
  "job_number": string,              // Internal/external job number if present (strip label, value only)
  "dig_tess_number": string,         // "DigTess" or "DIG-TESS" number if mentioned
  "customer_name": string,           // Property owner or direct customer (often the developer/owner)
  "hiring_contractor": string,       // General contractor that hired S&W (may be same as customer_name)
  "hiring_contact_name": string,     // Primary contact at the GC
  "hiring_contact_phone": string,    // Digits + standard format, e.g., "(214) 555-0100"
  "hiring_contact_email": string,    // Valid email address only
  "address": string,                 // Street address of the site
  "city": string,
  "zip": string,
  "pm_name": string,                 // S&W project manager if named in the text
  "pm_phone": string,
  "default_rig": string,             // Rig preference if stated (e.g., "Rig 5", "track rig")
  "crane_required": boolean,         // true only if explicitly required/requested
  "pier_count": number | "",         // Integer; "" if unknown
  "scope_description": string,       // Brief scope summary — pier size, depth, notes
  "estimated_days": number | "",     // Integer working days; "" if unknown
  "bid_amount": number | "",         // Dollars, number only, no commas or $. "" if unknown
  "contract_amount": number | "",    // Dollars. Often same as bid_amount at award time.
  "start_date": string,              // YYYY-MM-DD if a specific date is stated; else ""
  "end_date": string,                // YYYY-MM-DD if stated
  "notes": string                    // Anything important that didn't fit above (internal note for the PM)
}

Rules:
- Never fabricate. Empty string is better than a guess.
- Phone: return just the visible formatted string; don't invent area codes.
- Dates: only return if a clear date is given. Accept "Monday Dec 5" style but convert to YYYY-MM-DD using the current year if no year given.
- For pier_count / estimated_days / amounts: return the number, not a string. If unclear, return "".
- job_name is the most important field. Always try to find it from the subject line, greeting context, or address.`;

function buildUserPrompt(text) {
  return `Extract the job details from this message:\n\n---\n${text}\n---`;
}

async function fetchOpenAiExtract(userPrompt, apiKey, timeoutMs = 15000) {
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
        temperature: 0,
        max_tokens: 1200,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const bodyText = await response.text();
      throw new Error(`OpenAI error (${response.status}): ${bodyText.slice(0, 200)}`);
    }

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content || "{}";
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  } finally {
    clearTimeout(timer);
  }
}

function normalizeNumberOrBlank(value) {
  if (value === "" || value === null || value === undefined) return "";
  const n = typeof value === "number" ? value : parseFloat(String(value).replace(/[$,\s]/g, ""));
  return Number.isFinite(n) ? n : "";
}

function coerceBoolean(value) {
  if (typeof value === "boolean") return value;
  const s = String(value || "").trim().toLowerCase();
  return ["true", "yes", "y", "1", "required"].includes(s);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: "OPENAI_API_KEY is not configured on the server." });
  }

  const { text } = req.body || {};
  const trimmed = String(text || "").trim();
  if (!trimmed) {
    return res.status(400).json({ error: "Paste the email or message text to extract." });
  }
  if (trimmed.length > 30000) {
    return res.status(400).json({ error: "Text is too long (max 30,000 chars). Trim to the relevant section." });
  }

  try {
    const parsed = await fetchOpenAiExtract(buildUserPrompt(trimmed), OPENAI_API_KEY);

    // Normalize output to the shape JobFormModal expects
    const fields = {
      job_name: String(parsed.job_name || "").trim(),
      job_number: String(parsed.job_number || "").trim(),
      dig_tess_number: String(parsed.dig_tess_number || "").trim(),
      customer_name: String(parsed.customer_name || "").trim(),
      hiring_contractor: String(parsed.hiring_contractor || "").trim(),
      hiring_contact_name: String(parsed.hiring_contact_name || "").trim(),
      hiring_contact_phone: String(parsed.hiring_contact_phone || "").trim(),
      hiring_contact_email: String(parsed.hiring_contact_email || "").trim(),
      address: String(parsed.address || "").trim(),
      city: String(parsed.city || "").trim(),
      zip: String(parsed.zip || "").trim(),
      pm_name: String(parsed.pm_name || "").trim(),
      pm_phone: String(parsed.pm_phone || "").trim(),
      default_rig: String(parsed.default_rig || "").trim(),
      crane_required: coerceBoolean(parsed.crane_required),
      pier_count: normalizeNumberOrBlank(parsed.pier_count),
      scope_description: String(parsed.scope_description || "").trim(),
      estimated_days: normalizeNumberOrBlank(parsed.estimated_days),
      bid_amount: normalizeNumberOrBlank(parsed.bid_amount),
      contract_amount: normalizeNumberOrBlank(parsed.contract_amount),
      start_date: String(parsed.start_date || "").trim(),
      end_date: String(parsed.end_date || "").trim(),
    };

    // Which fields the AI actually populated — lets the UI highlight them
    const populatedKeys = Object.entries(fields)
      .filter(([, v]) => (typeof v === "boolean" ? v : (v !== "" && v !== null && v !== undefined)))
      .map(([k]) => k);

    return res.status(200).json({
      fields,
      populatedKeys,
      notes: String(parsed.notes || "").trim(),
    });
  } catch (err) {
    console.error("jobs/extract-from-text error:", err);
    return res.status(500).json({ error: err?.message || "Extraction failed." });
  }
}
