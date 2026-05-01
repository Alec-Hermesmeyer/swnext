/**
 * Revenue Report parser — pulls structured rows out of a daily Jobs .docx.
 *
 * Daily files are prose paragraphs (not tables). Format varies enough between
 * days that a regex-only approach would be brittle, so we extract the plain
 * text deterministically (pizzip + a small XML scan) and hand it to Groq for
 * structured row extraction. Same Groq pattern as parse-schedule-photo.
 */
import PizZip from "pizzip";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
export const GROQ_PARSE_MODEL = "llama-3.3-70b-versatile";

/**
 * Extract paragraph-aware plain text from a docx Buffer.
 * Avoids a full DOM parse — the WordprocessingML structure is regular enough
 * that paragraph-split + <w:t> capture matches what we need.
 */
export function extractDocxText(buffer) {
  const zip = new PizZip(buffer);
  const docXml = zip.file("word/document.xml")?.asText();
  if (!docXml) throw new Error("Not a valid .docx (missing word/document.xml)");

  const decode = (s) =>
    s
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, "&");

  // Split on paragraph close tags so each chunk holds the text for one paragraph.
  const paragraphChunks = docXml.split(/<\/w:p>/);
  const lines = [];
  for (const chunk of paragraphChunks) {
    const matches = chunk.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [];
    const joined = matches
      .map((m) => decode(m.replace(/<w:t[^>]*>/, "").replace(/<\/w:t>/, "")))
      .join("");
    if (joined.trim()) lines.push(joined);
  }
  return lines.join("\n");
}

/**
 * Normalize a job_number for matching. Strips year-prefix separators so
 * "26/0356", "26-0356", and "260356" all collapse to "260356". Lets the
 * canonical crew_jobs lookup tolerate format drift between the daily reports
 * and the database.
 */
const normalizeJobNumber = (raw) => String(raw || "").replace(/[^0-9]/g, "");

/**
 * Build a Map<digits, crew_jobs row> from a list of crew_jobs. Used by the
 * canonical-overlay step.
 */
export function buildCrewJobIndex(crewJobs = []) {
  const index = new Map();
  for (const j of crewJobs) {
    const digits = normalizeJobNumber(j.job_number);
    if (digits.length >= 3) index.set(digits, j);
  }
  return index;
}

/**
 * Overlay canonical crew_jobs data onto parsed rows where job_number matches
 * an existing record. The model often gets job/customer names slightly
 * wrong (truncations, abbreviations); the database has the source of truth.
 *
 * Mutates rows in place. Returns the count of rows that got linked.
 */
export function applyCrewJobOverlay(parsedRows, crewJobIndex) {
  let linked = 0;
  for (const row of parsedRows) {
    const digits = normalizeJobNumber(row.job_number);
    if (digits.length < 3) continue;
    const canonical = crewJobIndex.get(digits);
    if (!canonical) continue;

    row.crew_job_id = canonical.id;
    // Always prefer canonical names — they're the source of truth and let
    // reports stay consistent with the rest of the admin UI.
    if (canonical.job_name) row.job_name = canonical.job_name;
    if (canonical.customer_name) {
      row.customer_name = canonical.customer_name;
    } else if (canonical.hiring_contractor) {
      row.customer_name = canonical.hiring_contractor;
    }
    // Overlay location only if the canonical record has anything more
    // specific than what the model captured — daily reports sometimes have
    // richer site notes than the address field in crew_jobs.
    const canonicalLoc = [canonical.address, canonical.city]
      .filter(Boolean)
      .join(", ");
    if (canonicalLoc && (!row.location || row.location.length < canonicalLoc.length / 2)) {
      row.location = canonicalLoc;
    }
    // Normalize the job_number stored on the report to match the DB format.
    if (canonical.job_number) row.job_number = canonical.job_number;
    linked += 1;
  }
  return linked;
}

/**
 * Build the set of crew_jobs column updates that should be written when a
 * parsed daily-report row is linked to an existing crew_job. The rule is
 * strict: ONLY fill columns that are currently null/empty/zero in the
 * canonical record. Never overwrite. This makes the daily docs a safe
 * backfill source — the worst case is no-op, never data loss.
 *
 * Returns { updates, filledFields } where filledFields lists the column
 * names we touched (used by the UI to show "added address + contract").
 * Returns null when nothing needs filling.
 */
export function buildCrewJobBackfillUpdates(parsedJob, crewJob) {
  if (!parsedJob || !crewJob) return null;
  const extra = parsedJob.extra || {};
  const updates = {};
  const filled = [];

  const isBlankString = (v) => v === null || v === undefined || String(v).trim() === "";
  const isMissingNumber = (v) => v === null || v === undefined || Number(v) === 0 || !Number.isFinite(Number(v));

  // Customer / contractor — fill from the parsed row's customer_name.
  if (isBlankString(crewJob.customer_name) && parsedJob.customer_name) {
    updates.customer_name = parsedJob.customer_name;
    filled.push("customer_name");
  }

  // Address fields — extra.address/city/zip take priority; fall back to
  // splitting the parsed "location" if extras aren't there.
  let addr = extra.address;
  let city = extra.city;
  let zip = extra.zip;
  if ((!addr || !city) && parsedJob.location) {
    // Naive split on commas: "1506 John Stockbauer Dr, Victoria, TX 77904"
    const parts = String(parsedJob.location).split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0 && !addr) addr = parts[0];
    if (parts.length > 1 && !city) city = parts[1].replace(/\b\d{5}(-\d{4})?\b/, "").trim();
    if (parts.length > 2 && !zip) {
      const zipMatch = parts.slice(2).join(" ").match(/\b(\d{5})(-\d{4})?\b/);
      if (zipMatch) zip = zipMatch[1];
    }
  }
  if (isBlankString(crewJob.address) && addr) { updates.address = addr; filled.push("address"); }
  if (isBlankString(crewJob.city) && city) { updates.city = city; filled.push("city"); }
  if (isBlankString(crewJob.zip) && zip) { updates.zip = zip; filled.push("zip"); }

  if (isBlankString(crewJob.pm_name) && extra.pm_name) {
    updates.pm_name = extra.pm_name;
    filled.push("pm_name");
  }

  if (isMissingNumber(crewJob.contract_amount) && Number.isFinite(Number(extra.contract_price)) && Number(extra.contract_price) > 0) {
    updates.contract_amount = Number(extra.contract_price);
    filled.push("contract_amount");
  }

  if (isMissingNumber(crewJob.pier_count) && Number.isFinite(Number(extra.total_pier_count)) && Number(extra.total_pier_count) > 0) {
    updates.pier_count = Math.round(Number(extra.total_pier_count));
    filled.push("pier_count");
  }

  // estimated_days = days_on_site + days_remaining if either is reported.
  if (isMissingNumber(crewJob.estimated_days)) {
    const onSite = Number(extra.days_on_site);
    const remaining = Number(extra.days_remaining);
    const haveAny = Number.isFinite(onSite) || Number.isFinite(remaining);
    if (haveAny) {
      const total = (Number.isFinite(onSite) ? onSite : 0) + (Number.isFinite(remaining) ? remaining : 0);
      if (total > 0) {
        updates.estimated_days = Math.round(total);
        filled.push("estimated_days");
      }
    }
  }

  if (filled.length === 0) return null;
  return { updates, filledFields: filled };
}

/**
 * Run buildCrewJobBackfillUpdates against every linked parsed job and write
 * the updates back to crew_jobs. Returns a summary the caller can surface in
 * the UI. Same semantics as applyCrewJobOverlay — only fills holes, never
 * overwrites.
 */
export async function backfillCrewJobsFromParsed(supabase, parsedJobs, crewJobIndexById) {
  const summary = []; // [{ job_id, job_number, job_name, filledFields }]
  for (const p of parsedJobs) {
    if (!p.crew_job_id) continue;
    const crewJob = crewJobIndexById.get(p.crew_job_id);
    if (!crewJob) continue;
    const result = buildCrewJobBackfillUpdates(p, crewJob);
    if (!result) continue;
    const { error } = await supabase
      .from("crew_jobs")
      .update(result.updates)
      .eq("id", crewJob.id);
    if (error) {
      console.warn(`[revenue-backfill] failed to enrich crew_job ${crewJob.id}:`, error.message);
      continue;
    }
    summary.push({
      job_id: crewJob.id,
      job_number: crewJob.job_number,
      job_name: crewJob.job_name,
      filledFields: result.filledFields,
    });
  }
  return summary;
}

/**
 * Pull a date from the filename if we can. Falls back to null and lets the
 * model infer from the doc body. Daily files in the wild are named like
 * "4-20-2026 Jobs.docx" or "04-20-2026 Jobs.docx".
 */
export function dateFromFilename(name) {
  const match = String(name || "").match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (!match) return null;
  const [, mm, dd, yyyy] = match;
  const m = String(mm).padStart(2, "0");
  const d = String(dd).padStart(2, "0");
  return `${yyyy}-${m}-${d}`;
}

const SYSTEM_PROMPT = `You extract structured revenue data from a single-day construction "Daily Jobs" report.

The report is plain text (paragraphs). It typically has:
- A "Total: $XXX,XXX.XX" line near the top — that's the day total.
- One block per job. Each block contains some subset of:
    * A header with customer + project name + parenthesized revenue (and maybe "+ $X standing")
    * Job # like "26/0356"
    * Address (street/city)
    * Bid line items (e.g., "28-24\\"-1064'")
    * Contract Price, Price per hole, Days on site, Estimated days remaining, date
    * Production lines describing what was completed that day
    * Rig name(s) (e.g., "Sany 4")
    * Crew member names (one per line, first names + last initial)
    * Occasional trailing notes ("ALL ELSE NO GO FOR WEATHER")

Return ONLY valid JSON in the exact shape:
{
  "report_date": "YYYY-MM-DD" | null,
  "day_total": number | null,
  "reconciliation_note": string | null,     // explain any sum mismatch you couldn't resolve
  "jobs": [
    {
      "job_number": string | null,
      "job_name": string | null,
      "customer_name": string | null,
      "location": string | null,
      "revenue": number | null,             // daily revenue for this job in dollars (no commas, no $)
      "rig_name": string | null,
      "crew_names": string | null,
      "notes": string | null,
      "extra": {
        "contract_price": number | null,
        "price_per_hole": number | null,
        "days_on_site": number | null,
        "days_remaining": number | null,
        "bid_line_items": string | null,
        "standing_amount": number | null,   // record any "+ $X standing" amount you saw, even if you didn't include it in revenue
        // Job-detail enrichment fields. These power a backfill that fills in
        // crew_jobs records when a column is empty. Extract only what the
        // doc actually says — DO NOT invent.
        "address": string | null,           // street address only (no city)
        "city": string | null,
        "zip": string | null,               // 5-digit ZIP if present
        "pm_name": string | null,           // project manager name if mentioned
        "total_pier_count": number | null   // SUM of leading numbers in bid line items: "28-24\\"-1064'" = 28 piers; "28-24\\"-1064', 12-30\\"-500'" = 40
      }
    }
  ]
}

CRITICAL — the sum of per-job "revenue" values MUST equal "day_total". To get this right:

1. First pass — extract each job's PARENTHESIZED dollar amount as its base revenue.
   Example: "Acme Roofing Project ($12,500)" → revenue 12500.
   If you see "+ $4,000 standing" appended, do NOT include it in revenue yet. Put 4000 in extra.standing_amount.

2. Sum the base revenues. Compare to day_total.
   - If they match: leave revenue as-is.
   - If sum is short by exactly the standing amounts: ADD each job's standing_amount to its revenue.
   - If sum is short by some standing amounts but not all: figure out which jobs' standing are included by trying combinations until the math works.
   - If you still can't make it match: leave the most-likely revenues, and write a brief note in "reconciliation_note" describing the discrepancy.

3. Other rules:
   - Numbers must be numbers (no $, no commas, no quotes).
   - If a field isn't present, use null. Don't invent data.
   - One object per job. Don't merge or split jobs.
   - Don't include the day-total line itself as a "job".
   - JSON STRING ESCAPING (critical): when a string value contains a literal double-quote — common in bid measurements like \`28-24"-1064'\` — escape it as \\". Never emit a raw " inside a string value. Same for backslashes (\\\\) and newlines (\\n).`;

/**
 * Try to recover a JSON object from a string the model emitted without strict
 * JSON-mode constraints. The model often wraps JSON in prose ("Here you
 * go: {...} Hope that helps.") or markdown code fences. This pulls out the
 * first balanced { ... } block it can find.
 */
function extractFirstJsonObject(text) {
  if (!text) return null;
  // Strip markdown fences if present.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : text;

  // Find the first {, then walk forward counting braces (respecting strings)
  // until we find the matching close. Naive but enough for our shape.
  const start = body.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inStr = false;
  let escape = false;
  for (let i = start; i < body.length; i += 1) {
    const ch = body[i];
    if (escape) { escape = false; continue; }
    if (inStr) {
      if (ch === "\\") escape = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        const slice = body.slice(start, i + 1);
        try { return JSON.parse(slice); } catch { return null; }
      }
    }
  }
  return null;
}

async function callGroq(messages, opts = {}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not configured");
  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_PARSE_MODEL,
      messages,
      temperature: 0.1,
      max_tokens: 8000,
      ...opts,
    }),
  });
  return res;
}

export async function callGroqExtract(rawText, hintDate) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not configured");

  const userMessage = [
    hintDate ? `Filename suggests report_date = ${hintDate}.` : "",
    "Extract structured rows from this Daily Jobs report:",
    "",
    "----- BEGIN REPORT -----",
    rawText,
    "----- END REPORT -----",
  ]
    .filter(Boolean)
    .join("\n");

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userMessage },
  ];

  // Pass 1: strict JSON mode. Fast, normally works.
  let res = await callGroq(messages, { response_format: { type: "json_object" } });
  let content = null;

  if (res.ok) {
    const data = await res.json();
    content = data?.choices?.[0]?.message?.content;
  } else {
    // Groq sometimes returns 400 json_validate_failed when grammar-constrained
    // decoding wedges on a tricky input (or the model would have produced
    // output that briefly violated JSON grammar before recovering). The error
    // body usually contains a `failed_generation` we could try, but the
    // cleaner recovery is a second pass WITHOUT strict JSON mode and a
    // tolerant extractor on the result.
    const errText = await res.text();
    const looksLikeJsonValidation = /json_validate_failed|json/i.test(errText) && res.status === 400;
    if (!looksLikeJsonValidation) {
      throw new Error(`Groq extract failed (${res.status}): ${errText.slice(0, 300)}`);
    }
    console.warn("Groq json_validate_failed; retrying without strict JSON mode");
    const retryMessages = [
      { role: "system", content: SYSTEM_PROMPT + "\n\nReply with ONLY a single JSON object. No prose, no markdown fences." },
      { role: "user", content: userMessage },
    ];
    res = await callGroq(retryMessages);
    if (!res.ok) {
      const t2 = await res.text();
      throw new Error(`Groq extract failed (${res.status}): ${t2.slice(0, 300)}`);
    }
    const data = await res.json();
    content = data?.choices?.[0]?.message?.content;
  }

  if (!content) throw new Error("Groq returned no content");

  // Try strict JSON.parse first; fall back to the tolerant extractor;
  // finally, ask Groq to repair its own broken JSON (common cause: literal
  // " inside bid measurements not properly escaped).
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (_) {
    parsed = extractFirstJsonObject(content);
  }

  if (!parsed) {
    console.warn("Groq output unparseable; attempting JSON repair pass");
    const repairRes = await callGroq(
      [
        {
          role: "system",
          content:
            "You are a JSON repair tool. The user will give you broken JSON (most often: unescaped \" inside string values from measurements like 28-24\"-1064'). Output the corrected JSON object only — no prose, no markdown fences. Do not change any data values; only fix escaping/syntax so it parses.",
        },
        { role: "user", content: content },
      ],
      { response_format: { type: "json_object" } }
    );
    if (!repairRes.ok) {
      const errBody = await repairRes.text();
      throw new Error(
        `Groq returned non-JSON content (length ${content.length}); repair pass also failed (${repairRes.status}). ` +
          `First 300 chars of original: ${content.slice(0, 300)}. Repair error: ${errBody.slice(0, 200)}`
      );
    }
    const repairData = await repairRes.json();
    const repaired = repairData?.choices?.[0]?.message?.content;
    try {
      parsed = JSON.parse(repaired);
    } catch (err) {
      parsed = extractFirstJsonObject(repaired);
    }
    if (!parsed) {
      throw new Error(
        `Groq returned non-JSON content (length ${content.length}); repair pass produced unparseable output too. ` +
          `Original first 300 chars: ${content.slice(0, 300)}`
      );
    }
  }

  // Defensive normalization: coerce shapes so the API can trust the result.
  if (!Array.isArray(parsed.jobs)) parsed.jobs = [];
  parsed.jobs = parsed.jobs.map((j) => ({
    job_number: j.job_number ? String(j.job_number).trim() : null,
    job_name: j.job_name ? String(j.job_name).trim() : null,
    customer_name: j.customer_name ? String(j.customer_name).trim() : null,
    location: j.location ? String(j.location).trim() : null,
    revenue: Number.isFinite(Number(j.revenue)) ? Number(j.revenue) : null,
    rig_name: j.rig_name ? String(j.rig_name).trim() : null,
    crew_names: j.crew_names ? String(j.crew_names).trim() : null,
    notes: j.notes ? String(j.notes).trim() : null,
    extra: j.extra && typeof j.extra === "object" ? j.extra : null,
  }));
  parsed.day_total = Number.isFinite(Number(parsed.day_total)) ? Number(parsed.day_total) : null;
  parsed.report_date = parsed.report_date || hintDate || null;
  parsed.reconciliation_note = parsed.reconciliation_note ? String(parsed.reconciliation_note).trim() : null;
  return parsed;
}
