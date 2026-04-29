/**
 * Bid Assistant — shared utility functions.
 * Extracted from pages/admin/sales.jsx for reuse across the
 * chat interface, document editor, and panel components.
 */

// ── Currency / number helpers ───────────────────────────────────────

export function parseCurrencyAmount(value) {
  const numeric = String(value || "").replace(/[^0-9.-]/g, "");
  const parsed = Number(numeric);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatCurrencyAmount(value) {
  const amount = Number(value || 0);
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function toNumberOrZero(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

// ── Category helpers ────────────────────────────────────────────────

export function inferPriceCategory(text) {
  const lower = String(text || "").toLowerCase();
  if (lower.includes("de mobil") || lower.includes("demobil")) return "demobilization";
  if (lower.includes("mobil")) return "mobilization";
  if (lower.includes("downtime") || lower.includes("delay") || lower.includes("per hour")) return "delay_or_downtime";
  if (lower.includes("inspection")) return "inspection";
  if (lower.includes("mat")) return "mat_support";
  if (lower.includes("auger change") || lower.includes("per change")) return "auger_change";
  if (lower.includes("allowance") || lower.includes("contingency")) return "contingency_or_allowance";
  if (lower.includes("pile") || lower.includes("hole") || lower.includes("depth")) return "pile_or_hole_pricing";
  return "other";
}

export function formatCategoryLabel(category) {
  const safe = String(category || "other").replace(/_/g, " ");
  return safe.charAt(0).toUpperCase() + safe.slice(1);
}

// ── Price extraction from raw text ──────────────────────────────────

export function extractPricedItemsFromRawText(rawText) {
  if (!rawText) return [];
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const items = [];
  const seen = new Set();
  for (let idx = 0; idx < lines.length; idx += 1) {
    const line = lines[idx];
    const amounts = line.match(/\$[\d,]+(?:\.\d{1,2})?/g) || [];
    if (!amounts.length) continue;
    const previous = idx > 0 ? lines[idx - 1] : "";
    const next = idx + 1 < lines.length ? lines[idx + 1] : "";
    const context = [previous, line, next].filter(Boolean).join(" | ").replace(/\s+/g, " ").trim();
    const holeCount = context.match(/(\d+)\s*(?:holes?|piers?)\b/i)?.[1] || null;
    const depthFt = context.match(/(\d+(?:\.\d+)?)\s*(?:ft|feet|foot)\b/i)?.[1] || null;
    const diameterIn = context.match(/(\d+(?:\.\d+)?)\s*(?:in|inch|inches|\"|")\b/i)?.[1] || null;
    const unit = context.match(/\b(per\s+(?:hour|day|shift|mat|change|inspection|instance|pile|hole|lf|foot))\b/i)?.[1] || "";
    for (const amount of amounts) {
      const key = `${amount}|${context}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({
        amount,
        category: inferPriceCategory(context),
        context: context.slice(0, 400),
        hole_count_hint: holeCount ? Number(holeCount) : null,
        depth_hint_ft: depthFt ? Number(depthFt) : null,
        diameter_hint_in: diameterIn ? Number(diameterIn) : null,
        unit_hint: unit,
      });
    }
  }
  return items.slice(0, 80);
}

// ── Headline / scenario totals ──────────────────────────────────────

export function classifyHeadlineLabel(label) {
  const lower = String(label || "").toLowerCase();
  if (lower.includes("base")) return "base";
  if (lower.includes("alt") || lower.includes("alternate")) return "alt";
  return "other";
}

export function buildScenarioTotals(headlineTotals) {
  const safe = Array.isArray(headlineTotals) ? headlineTotals : [];
  const buckets = { base: [], alt: [], other: [] };

  for (const row of safe) {
    const amount = parseCurrencyAmount(row?.amount);
    if (!amount) continue;
    const category = classifyHeadlineLabel(row?.label);
    buckets[category].push({ amount, label: row?.label || "" });
  }

  const bestOf = (rows) => rows.reduce((max, row) => (row.amount > max ? row.amount : max), 0);
  const baseBest = bestOf(buckets.base);
  const altBest = bestOf(buckets.alt);
  const otherBest = bestOf(buckets.other);

  return {
    auto: baseBest || altBest || otherBest || 0,
    base: baseBest || 0,
    alt: altBest || 0,
    basePlusAlt: (baseBest || 0) + (altBest || 0),
  };
}

// ── Draft normalization / serialization ─────────────────────────────

export function normalizeDraftPayload(draft) {
  return {
    title: String(draft?.title || ""),
    project_name: String(draft?.project_name || ""),
    client_name: String(draft?.client_name || ""),
    due_date: String(draft?.due_date || ""),
    intro: String(draft?.intro || ""),
    scope_items: Array.isArray(draft?.scope_items) ? draft.scope_items.map((x) => String(x).trim()).filter(Boolean) : [],
    assumptions: Array.isArray(draft?.assumptions) ? draft.assumptions.map((x) => String(x).trim()).filter(Boolean) : [],
    exclusions: Array.isArray(draft?.exclusions) ? draft.exclusions.map((x) => String(x).trim()).filter(Boolean) : [],
    pricing_items: Array.isArray(draft?.pricing_items)
      ? draft.pricing_items
          .map((item) => ({
            label: String(item?.label || "").trim(),
            amount: String(item?.amount || "").trim(),
          }))
          .filter((item) => item.label || item.amount)
      : [],
    terms: String(draft?.terms || ""),
    notes: String(draft?.notes || ""),
  };
}

// Compares one field of two normalized drafts. Returns true when the current
// draft differs from the saved baseline. Uses JSON-stringify for arrays/objects
// so we capture changes to list ordering, pricing rows, etc.
//
// Why JSON.stringify and not a deep-equal library: drafts always pass through
// normalizeDraftPayload which produces a deterministic key order with only
// strings and plain arrays/objects of strings — no Dates, undefined, functions,
// or Maps. Under that contract stringify equality is correct, dependency-free,
// and faster than walking arbitrary structures.
export function isFieldDirty(currentDraft, savedDraft, field) {
  const a = currentDraft?.[field];
  const b = savedDraft?.[field];
  if (a === b) return false;
  const aIsObj = a !== null && typeof a === "object";
  const bIsObj = b !== null && typeof b === "object";
  if (aIsObj || bIsObj) {
    try {
      return JSON.stringify(a) !== JSON.stringify(b);
    } catch {
      return true;
    }
  }
  return String(a ?? "") !== String(b ?? "");
}

export function listToTextarea(values) {
  return (Array.isArray(values) ? values : []).join("\n");
}

export function textareaToList(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function pricingItemsToTextarea(items) {
  return (Array.isArray(items) ? items : [])
    .map((item) => `${item?.label || "Line item"} | ${item?.amount || ""}`.trim())
    .join("\n");
}

export function textareaToPricingItems(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [labelPart, ...rest] = line.split("|");
      return {
        label: String(labelPart || "").trim(),
        amount: String(rest.join("|") || "").trim(),
      };
    })
    .filter((item) => item.label || item.amount);
}

// ── Bid-fit metrics defaults ────────────────────────────────────────

export const METRICS_SOURCE_LABEL = "swnext-admin";
export const METRICS_PROFILE_KEY = "default";

export function getDefaultBidFitMetrics() {
  return {
    source_label: METRICS_SOURCE_LABEL,
    profile_key: METRICS_PROFILE_KEY,
    // Financial thresholds
    target_margin_percent: 18,
    minimum_profit_usd: 75000,
    minimum_contract_value_usd: 300000,
    risk_buffer_percent: 8,
    default_estimated_cost_usd: 550000,
    // Capacity & scheduling
    max_concurrent_jobs: 20,
    min_crew_available: 3,
    // Signal weights (should total 100)
    weight_profitability: 35,
    weight_contract_size: 15,
    weight_resources: 20,
    weight_scheduling: 15,
    weight_pipeline: 15,
    // Meta
    notes: "",
  };
}

// ── Build context summary for the AI chat system prompt ────────────

export function buildMetricsContextForAI(metrics, opsContext) {
  const parts = [];
  if (metrics) {
    parts.push("## User's Bid Metrics Preferences");
    parts.push(`Target margin: ${metrics.target_margin_percent || 18}%`);
    parts.push(`Minimum profit: $${Number(metrics.minimum_profit_usd || 75000).toLocaleString()}`);
    parts.push(`Minimum contract value: $${Number(metrics.minimum_contract_value_usd || 300000).toLocaleString()}`);
    parts.push(`Risk buffer: ${metrics.risk_buffer_percent || 8}%`);
    parts.push(`Max concurrent jobs: ${metrics.max_concurrent_jobs || 20}`);
    if (metrics.notes) parts.push(`Notes: ${metrics.notes}`);
  }
  if (opsContext) {
    parts.push("\n## Current Operational Context");
    parts.push(`Active crew members: ${opsContext.workforce?.active_workers || 0}`);
    parts.push(`Active jobs: ${opsContext.scheduling?.active_jobs || 0}`);
    parts.push(`Capacity utilization: ${Math.round((opsContext.workforce?.capacity_utilization || 0) * 100)}%`);
    parts.push(`Bids due in next 2 weeks: ${opsContext.pipeline?.upcoming_bids_2wk || 0}`);
    parts.push(`Total pipeline value: $${Number(opsContext.pipeline?.total_pipeline_value || 0).toLocaleString()}`);
    parts.push(`Backlog value: $${Number(opsContext.backlog?.total_value || 0).toLocaleString()}`);
  }
  return parts.join("\n");
}

// ── Quick-action chip definitions ───────────────────────────────────

export const CHAT_QUICK_ACTIONS = [
  { id: "summarize_risks", label: "Summarize risks", prompt: "Summarize the key risk flags in this bid document and what we should watch out for." },
  { id: "generate_intro", label: "Generate intro", prompt: "Draft a professional introduction paragraph for our bid proposal based on the project details in this document." },
  { id: "draft_exclusions", label: "Draft exclusions", prompt: "Suggest a list of exclusions we should include in our bid proposal based on the scope described in this document." },
  { id: "calculate_margin", label: "Calculate margin", prompt: "Walk me through the margin calculation for this bid based on the detected pricing, my target margin preferences, and our cost estimates. Factor in the risk buffer." },
  { id: "scope_review", label: "Review scope", prompt: "Review the extracted scope items from this bid document and flag anything that seems incomplete or risky." },
  { id: "compare_pricing", label: "Compare pricing", prompt: "Analyze the pricing structure in this bid and identify areas where our numbers might need adjustment." },
  { id: "bid_recommendation", label: "Bid / No-Bid?", prompt: "Based on my metric preferences, current operational capacity, scheduling load, and this bid's projected profitability, should we bid on this project? Give a clear recommendation with specific reasons." },
  { id: "resource_check", label: "Resource check", prompt: "Given our current crew size, active job count, and scheduling capacity, do we have the resources to take on this project? What scheduling constraints should we consider?" },
];

// ── Wizard step definitions ─────────────────────────────────────────

export const WIZARD_STEPS = [
  { id: "review", label: "Document Review", description: "AI summary of what was detected" },
  { id: "scope", label: "Scope Confirmation", description: "Review and adjust extracted scope items" },
  { id: "risk", label: "Risk Assessment", description: "Walk through flagged risks" },
  { id: "pricing", label: "Pricing Strategy", description: "Review pricing and confirm margins" },
  { id: "draft", label: "Draft Generation", description: "AI generates the bid proposal draft" },
  { id: "final", label: "Final Review", description: "Preview and export" },
];
