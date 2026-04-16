"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import withAuthTw from "@/components/withAuthTw";
import TWAdminLayout from "@/components/TWAdminLayout";
import { Lato } from "next/font/google";
import { getSalesData } from "@/actions/jobInfo";
import SalesPipeline from "@/components/admin/SalesPipeline";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });
const METRICS_SOURCE_LABEL = "swnext-admin";
const METRICS_PROFILE_KEY = "default";

function getDefaultBidFitMetrics() {
  return {
    source_label: METRICS_SOURCE_LABEL,
    profile_key: METRICS_PROFILE_KEY,
    target_margin_percent: 18,
    minimum_profit_usd: 75000,
    minimum_contract_value_usd: 300000,
    risk_buffer_percent: 8,
    default_estimated_cost_usd: 550000,
    notes: "",
  };
}

function ExpandableInsightList({ title, items, emptyLabel = "None extracted.", initialVisible = 3 }) {
  const [expanded, setExpanded] = useState(false);
  const safeItems = Array.isArray(items) ? items : [];
  const visibleItems = expanded ? safeItems : safeItems.slice(0, initialVisible);
  const hasMore = safeItems.length > initialVisible;

  return (
    <div className="rounded-lg border border-neutral-200 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{title}</p>
      <ul className="mt-2 space-y-1 text-sm text-neutral-700">
        {safeItems.length ? visibleItems.map((item, idx) => <li key={idx}>- {item}</li>) : <li>- {emptyLabel}</li>}
      </ul>
      {hasMore ? (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-2 text-xs font-semibold text-brand hover:underline"
        >
          {expanded ? "Show less" : `Show all ${safeItems.length}`}
        </button>
      ) : null}
    </div>
  );
}

function inferPriceCategory(text) {
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

function extractPricedItemsFromRawText(rawText) {
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

function parseCurrencyAmount(value) {
  const numeric = String(value || "").replace(/[^0-9.-]/g, "");
  const parsed = Number(numeric);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrencyAmount(value) {
  const amount = Number(value || 0);
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function formatCategoryLabel(category) {
  const safe = String(category || "other").replace(/_/g, " ");
  return safe.charAt(0).toUpperCase() + safe.slice(1);
}

function classifyHeadlineLabel(label) {
  const lower = String(label || "").toLowerCase();
  if (lower.includes("base")) return "base";
  if (lower.includes("alt") || lower.includes("alternate")) return "alt";
  return "other";
}

function buildScenarioTotals(headlineTotals) {
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

function toNumberOrZero(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizeDraftPayload(draft) {
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

function listToTextarea(values) {
  return (Array.isArray(values) ? values : []).join("\n");
}

function textareaToList(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function pricingItemsToTextarea(items) {
  return (Array.isArray(items) ? items : [])
    .map((item) => `${item?.label || "Line item"} | ${item?.amount || ""}`.trim())
    .join("\n");
}

function textareaToPricingItems(value) {
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

function DraftPricingTableEditor({ items, onChange }) {
  const safeItems = Array.isArray(items) ? items : [];

  const updateRow = (index, field, value) => {
    const next = safeItems.map((row, idx) =>
      idx === index ? { ...row, [field]: value } : row
    );
    onChange(next);
  };

  const addRow = () => {
    onChange([...safeItems, { label: "", amount: "" }]);
  };

  const removeRow = (index) => {
    onChange(safeItems.filter((_, idx) => idx !== index));
  };

  return (
    <div className="rounded-lg border border-neutral-200 bg-white">
      <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Pricing Table</p>
        <button
          type="button"
          onClick={addRow}
          className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
        >
          + Add row
        </button>
      </div>
      {!safeItems.length ? (
        <div className="px-3 py-4 text-sm text-neutral-500">No pricing lines yet. Add a row to build the table.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-3 py-2 font-semibold">Line item</th>
                <th className="px-3 py-2 font-semibold">Amount</th>
                <th className="px-3 py-2 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {safeItems.map((row, index) => (
                <tr key={`draft-pricing-${index}`} className="border-t border-neutral-200">
                  <td className="px-3 py-2 align-top">
                    <input
                      type="text"
                      value={row?.label || ""}
                      onChange={(e) => updateRow(index, "label", e.target.value)}
                      placeholder="Line description"
                      className="h-9 w-full rounded-md border border-neutral-300 px-2 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <input
                      type="text"
                      value={row?.amount || ""}
                      onChange={(e) => updateRow(index, "amount", e.target.value)}
                      placeholder="$0.00"
                      className="h-9 w-full rounded-md border border-neutral-300 px-2 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2 text-right align-top">
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DraftDocumentPreview({ draft }) {
  const pricingRows = Array.isArray(draft?.pricing_items) ? draft.pricing_items : [];

  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Live Export Preview</p>
        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-neutral-500">DOCX-style layout</span>
      </div>

      <div className="rounded-md border border-neutral-200 bg-white p-4 text-sm text-neutral-800">
        <h3 className="text-base font-bold text-neutral-900">{draft?.title || "Bid Proposal"}</h3>
        <div className="mt-2 grid gap-2 text-xs text-neutral-600 sm:grid-cols-3">
          <p><span className="font-semibold text-neutral-700">Project:</span> {draft?.project_name || "—"}</p>
          <p><span className="font-semibold text-neutral-700">Client:</span> {draft?.client_name || "—"}</p>
          <p><span className="font-semibold text-neutral-700">Due:</span> {draft?.due_date || "—"}</p>
        </div>

        {draft?.intro ? <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-800">{draft.intro}</p> : null}

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Pricing Table</p>
          {!pricingRows.length ? (
            <p className="mt-1 text-sm text-neutral-500">No pricing rows yet.</p>
          ) : (
            <div className="mt-2 overflow-x-auto rounded-md border border-neutral-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Description</th>
                    <th className="px-3 py-2 font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {pricingRows.map((row, idx) => (
                    <tr key={`preview-pricing-${idx}`} className="border-t border-neutral-200">
                      <td className="px-3 py-2">{row?.label || "—"}</td>
                      <td className="px-3 py-2">{row?.amount || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Scope</p>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-neutral-700">
              {(draft?.scope_items || []).length ? draft.scope_items.map((row, idx) => <li key={`scope-${idx}`}>{row}</li>) : <li>—</li>}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Assumptions</p>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-neutral-700">
              {(draft?.assumptions || []).length ? draft.assumptions.map((row, idx) => <li key={`assumption-${idx}`}>{row}</li>) : <li>—</li>}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Exclusions</p>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-neutral-700">
              {(draft?.exclusions || []).length ? draft.exclusions.map((row, idx) => <li key={`exclusion-${idx}`}>{row}</li>) : <li>—</li>}
            </ul>
          </div>
        </div>

        {draft?.terms ? (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Terms</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700">{draft.terms}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PriceRollupPanel({ pricedItems }) {
  const [expandedGroups, setExpandedGroups] = useState({});
  const safeItems = Array.isArray(pricedItems) ? pricedItems : [];
  const groupedMap = safeItems.reduce((acc, item) => {
    const category = item?.category || "other";
    if (!acc[category]) {
      acc[category] = { category, totalAmount: 0, count: 0, items: [] };
    }
    acc[category].count += 1;
    acc[category].totalAmount += parseCurrencyAmount(item?.amount);
    acc[category].items.push(item);
    return acc;
  }, {});
  const grouped = Object.values(groupedMap).sort((a, b) => b.totalAmount - a.totalAmount);
  const grandTotal = grouped.reduce((sum, group) => sum + group.totalAmount, 0);
  const categoriesCount = grouped.length;

  const toggleGroup = (category) => {
    setExpandedGroups((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  return (
    <div className="rounded-lg border border-neutral-200 p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Pricing Rollup</p>
        <p className="text-xs text-neutral-500">{safeItems.length} mapped line items</p>
      </div>

      {!safeItems.length ? (
        <p className="text-sm text-neutral-500">No pricing rows available to roll up yet.</p>
      ) : (
        <>
          <div className="mb-3 grid gap-2 sm:grid-cols-3">
            <div className="rounded-md bg-neutral-50 p-2">
              <p className="text-[11px] uppercase tracking-wide text-neutral-500">Total mapped amount</p>
              <p className="mt-1 text-sm font-semibold text-neutral-900">{formatCurrencyAmount(grandTotal)}</p>
            </div>
            <div className="rounded-md bg-neutral-50 p-2">
              <p className="text-[11px] uppercase tracking-wide text-neutral-500">Pricing categories</p>
              <p className="mt-1 text-sm font-semibold text-neutral-900">{categoriesCount}</p>
            </div>
            <div className="rounded-md bg-neutral-50 p-2">
              <p className="text-[11px] uppercase tracking-wide text-neutral-500">Average line value</p>
              <p className="mt-1 text-sm font-semibold text-neutral-900">
                {formatCurrencyAmount(safeItems.length ? grandTotal / safeItems.length : 0)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {grouped.map((group) => {
              const isExpanded = !!expandedGroups[group.category];
              return (
                <div key={group.category} className="rounded-md border border-neutral-200 bg-neutral-50 p-2.5">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.category)}
                    className="flex w-full flex-wrap items-center justify-between gap-2 text-left"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-semibold text-neutral-700">
                        {formatCategoryLabel(group.category)}
                      </span>
                      <span className="text-xs text-neutral-600">{group.count} lines</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-neutral-900">{formatCurrencyAmount(group.totalAmount)}</span>
                      <span className="text-xs font-semibold text-brand">{isExpanded ? "Hide details" : "Show details"}</span>
                    </div>
                  </button>

                  {isExpanded ? (
                    <div className="mt-2 space-y-1.5 border-t border-neutral-200 pt-2">
                      {group.items.map((item, idx) => (
                        <div key={`${group.category}-${idx}`} className="rounded-md border border-neutral-200 bg-white p-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                              {item.amount}
                            </span>
                            {item.unit_hint ? (
                              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-800">{item.unit_hint}</span>
                            ) : null}
                            {item.hole_count_hint ? (
                              <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-800">
                                {item.hole_count_hint} holes
                              </span>
                            ) : null}
                            {item.depth_hint_ft ? (
                              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
                                {item.depth_hint_ft} ft
                              </span>
                            ) : null}
                            {item.diameter_hint_in ? (
                              <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-xs font-semibold text-cyan-800">
                                {item.diameter_hint_in} in
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-xs text-neutral-700">{item.context || "No context found."}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function CollapsibleSection({ title, subtitle, badge, badgeTone, icon, isOpen, onToggle, children }) {
  return (
    <div className={`rounded-2xl border overflow-hidden transition-shadow ${isOpen ? "border-neutral-200 shadow-card" : "border-neutral-200/80"}`}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 bg-gradient-to-r from-neutral-50/80 to-white px-5 py-3.5 text-left transition-colors hover:from-neutral-50"
      >
        <div className="flex items-center gap-3">
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${isOpen ? "bg-brand-50 text-brand" : "bg-neutral-100 text-neutral-400"}`}>
            {icon || (
              <svg
                className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-90" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-800">{title}</h3>
            {subtitle ? <p className="mt-0.5 text-[11px] text-neutral-400">{subtitle}</p> : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {badge ? (
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                badgeTone === "emerald"
                  ? "bg-emerald-100 text-emerald-800"
                  : badgeTone === "red"
                    ? "bg-red-100 text-red-800"
                    : badgeTone === "sky"
                      ? "bg-sky-100 text-sky-800"
                      : "bg-neutral-100 text-neutral-600"
              }`}
            >
              {badge}
            </span>
          ) : null}
          <svg
            className={`h-4 w-4 text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {isOpen ? <div className="border-t border-neutral-100 px-5 py-4">{children}</div> : null}
    </div>
  );
}

function BidAssistantPanel() {
  const [uploading, setUploading] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState("");
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [status, setStatus] = useState("");
  const [feedbackState, setFeedbackState] = useState({});
  const [showExtractedJson, setShowExtractedJson] = useState(false);
  const [showRawText, setShowRawText] = useState(false);
  const [scenarioMode, setScenarioMode] = useState("auto");
  const [metrics, setMetrics] = useState(getDefaultBidFitMetrics());
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [savingMetrics, setSavingMetrics] = useState(false);
  const [draft, setDraft] = useState(normalizeDraftPayload({}));
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [exportingDraft, setExportingDraft] = useState(false);
  const [vectorizingDocId, setVectorizingDocId] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    financials: true,
    draft: false,
    insights: false,
    chat: false,
    debug: false,
  });
  const toggleSection = (key) =>
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const fetchDocumentById = useCallback(async (documentId) => {
    if (!documentId) return null;
    const response = await fetch(`/api/bidding/ai-bidding/documents/${documentId}`);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.detail || data?.error || "Could not load document details");
    return data?.document || null;
  }, []);

  const loadDocuments = useCallback(async () => {
    setLoadingDocs(true);
    try {
      const response = await fetch("/api/bidding/ai-bidding/documents");
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.detail || data?.error || "Could not load documents");
      const rows = Array.isArray(data?.documents) ? data.documents : [];
      setDocuments(rows);
      if (selectedDoc?.id) {
        const fresh = rows.find((doc) => doc.id === selectedDoc.id) || null;
        if (!fresh) {
          setSelectedDoc(null);
        } else {
          try {
            const detailed = await fetchDocumentById(fresh.id);
            setSelectedDoc(detailed || fresh);
          } catch {
            setSelectedDoc(fresh);
          }
        }
      }
    } catch (error) {
      setStatus(error.message || "Could not load documents");
    } finally {
      setLoadingDocs(false);
    }
  }, [fetchDocumentById, selectedDoc?.id]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const loadMetrics = useCallback(async () => {
    setLoadingMetrics(true);
    try {
      const params = new URLSearchParams({
        source_label: METRICS_SOURCE_LABEL,
        profile_key: METRICS_PROFILE_KEY,
      });
      const response = await fetch(`/api/bidding/ai-bidding/metrics?${params.toString()}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.detail || data?.error || "Could not load fit metrics");
      setMetrics({ ...getDefaultBidFitMetrics(), ...(data?.metrics || {}) });
    } catch (error) {
      setStatus(error.message || "Could not load fit metrics");
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const loadDraft = useCallback(async (documentId) => {
    if (!documentId) {
      setDraft(normalizeDraftPayload({}));
      return;
    }
    setLoadingDraft(true);
    try {
      const response = await fetch(`/api/bidding/ai-bidding/documents/${documentId}/draft`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.detail || data?.error || "Could not load draft");
      setDraft(normalizeDraftPayload(data?.draft || {}));
    } catch (error) {
      setStatus(error.message || "Could not load draft");
    } finally {
      setLoadingDraft(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedDoc?.id) {
      setDraft(normalizeDraftPayload({}));
      return;
    }
    loadDraft(selectedDoc.id);
  }, [loadDraft, selectedDoc?.id]);

  useEffect(() => {
    setChatHistory([]);
    setChatInput("");
  }, [selectedDoc?.id]);

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || uploading) return;
    setUploading(true);
    setStatus("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("source_label", "swnext-admin");
      const response = await fetch("/api/bidding/ai-bidding/documents/upload-assist", {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.detail || data?.error || "Upload failed");
      setStatus("Bid document analyzed. Review suggestions below.");
      await loadDocuments();
      if (data?.document?.id) {
        setSelectedDoc(data.document);
      }
    } catch (error) {
      setStatus(error.message || "Could not analyze uploaded file");
    } finally {
      setUploading(false);
      if (event.target) event.target.value = "";
    }
  };

  const handleSelectDocument = async (doc) => {
    if (!doc?.id) return;
    setSelectedDoc(doc);
    setStatus("");
    try {
      const detailed = await fetchDocumentById(doc.id);
      if (detailed) setSelectedDoc(detailed);
    } catch (error) {
      setStatus(error.message || "Could not load document details");
    }
  };

  const handleDeleteDocument = async (doc) => {
    if (!doc?.id || deletingDocId) return;
    const confirmed = window.confirm(`Delete "${doc.filename}"? This cannot be undone.`);
    if (!confirmed) return;

    setDeletingDocId(doc.id);
    setStatus("");
    try {
      const response = await fetch(`/api/bidding/ai-bidding/documents/${doc.id}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.detail || data?.error || "Could not delete document");
      setStatus("Document deleted. Upload again to re-analyze with latest logic.");
      if (selectedDoc?.id === doc.id) {
        setSelectedDoc(null);
      }
      await loadDocuments();
    } catch (error) {
      setStatus(error.message || "Could not delete document");
    } finally {
      setDeletingDocId("");
    }
  };

  const updateDraftField = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const saveDraft = async () => {
    if (!selectedDoc?.id) return;
    setSavingDraft(true);
    setStatus("");
    const payload = normalizeDraftPayload(draft);
    try {
      const response = await fetch(`/api/bidding/ai-bidding/documents/${selectedDoc.id}/draft`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.detail || data?.error || "Could not save draft");
      setDraft(normalizeDraftPayload(data?.draft || payload));
      setStatus("Bid draft saved.");
    } catch (error) {
      setStatus(error.message || "Could not save draft");
    } finally {
      setSavingDraft(false);
    }
  };

  const exportDraft = async (format = "docx") => {
    if (!selectedDoc?.id) return;
    setExportingDraft(true);
    setStatus("");
    const payload = {
      format,
      draft: normalizeDraftPayload(draft),
    };
    try {
      const response = await fetch(`/api/bidding/ai-bidding/documents/${selectedDoc.id}/draft/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.detail || err?.error || `Could not export ${format.toUpperCase()}`);
      }
      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") || "";
      const fromHeader = disposition.match(/filename="?([^"]+)"?/i)?.[1] || "";
      const fallbackName = `${(selectedDoc.filename || "bid_draft").replace(/\.[^/.]+$/, "")}_draft.${format}`;
      const fileName = fromHeader || fallbackName;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setStatus(`Exported ${fileName}`);
    } catch (error) {
      setStatus(error.message || "Could not export draft");
    } finally {
      setExportingDraft(false);
    }
  };

  const vectorizeSelectedDocument = async () => {
    if (!selectedDoc?.id || vectorizingDocId) return;
    setVectorizingDocId(selectedDoc.id);
    setStatus("");
    try {
      const response = await fetch(`/api/bidding/ai-bidding/documents/${selectedDoc.id}/vectorize`, {
        method: "POST",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.detail || data?.error || "Could not vectorize document");
      const report = data?.vectorization || {};
      if (report.vectorized) {
        setStatus(`Vectorized ${report.stored_chunks || 0} chunks for chat.`);
      } else {
        setStatus(report.reason || "Vectorization did not complete.");
      }
    } catch (error) {
      setStatus(error.message || "Could not vectorize document");
    } finally {
      setVectorizingDocId("");
    }
  };

  const askBidDocument = async () => {
    const question = String(chatInput || "").trim();
    if (!selectedDoc?.id || !question || chatLoading) return;
    setChatLoading(true);
    const pendingEntry = { role: "user", text: question };
    setChatHistory((prev) => [...prev, pendingEntry]);
    setChatInput("");
    try {
      const response = await fetch(`/api/bidding/ai-bidding/documents/${selectedDoc.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question, top_k: 6 }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.detail || data?.error || "Could not get chat response");
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data?.answer || "No answer generated.",
          citations: Array.isArray(data?.citations) ? data.citations : [],
        },
      ]);
    } catch (error) {
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          text: error.message || "Could not get chat response",
          citations: [],
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const updateMetricField = (field, value) => {
    setMetrics((prev) => ({ ...prev, [field]: value }));
  };

  const saveMetrics = async () => {
    setSavingMetrics(true);
    setStatus("");
    const payload = {
      source_label: METRICS_SOURCE_LABEL,
      profile_key: METRICS_PROFILE_KEY,
      target_margin_percent: toNumberOrZero(metrics.target_margin_percent),
      minimum_profit_usd: toNumberOrZero(metrics.minimum_profit_usd),
      minimum_contract_value_usd: toNumberOrZero(metrics.minimum_contract_value_usd),
      risk_buffer_percent: toNumberOrZero(metrics.risk_buffer_percent),
      default_estimated_cost_usd: toNumberOrZero(metrics.default_estimated_cost_usd),
      notes: String(metrics.notes || ""),
    };

    try {
      const response = await fetch("/api/bidding/ai-bidding/metrics", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.detail || data?.error || "Could not save fit metrics");
      setMetrics({ ...getDefaultBidFitMetrics(), ...(data?.metrics || payload) });
      setStatus("Bid Fit Metrics saved.");
    } catch (error) {
      setStatus(error.message || "Could not save fit metrics");
    } finally {
      setSavingMetrics(false);
    }
  };

  const submitFeedback = async (suggestion, statusValue) => {
    if (!selectedDoc?.id) return;
    const key = `${selectedDoc.id}:${suggestion.id || suggestion.text}`;
    setFeedbackState((prev) => ({ ...prev, [key]: "saving" }));
    try {
      const response = await fetch(`/api/bidding/ai-bidding/documents/${selectedDoc.id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          suggestion_id: suggestion.id || null,
          status: statusValue,
          original_text: suggestion.text || "",
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.detail || data?.error || "Feedback failed");
      setFeedbackState((prev) => ({ ...prev, [key]: "saved" }));
      setTimeout(() => {
        setFeedbackState((prev) => ({ ...prev, [key]: "" }));
      }, 1200);
    } catch {
      setFeedbackState((prev) => ({ ...prev, [key]: "error" }));
    }
  };

  const extracted = selectedDoc?.extracted_json || {};
  const suggestions = Array.isArray(selectedDoc?.suggestions_json) ? selectedDoc.suggestions_json : [];
  const riskFlags = Array.isArray(extracted?.risk_flags) ? extracted.risk_flags : [];
  const summary = extracted?.summary || {};
  const clientMatchFromRaw =
    selectedDoc?.raw_text
      ?.match(/(?:customer|client|owner|company|hiring contractor)\s*[:\-]\s*([^\n\r]+)/i)?.[1]
      ?.trim() || "";
  const clientName =
    summary?.client_name ||
    summary?.customer_name ||
    extracted?.client_name ||
    extracted?.customer_name ||
    clientMatchFromRaw ||
    "";
  const projectName = summary?.project_name || extracted?.project_name || "Not detected";
  const dueDate = summary?.due_date || extracted?.due_date || "";
  const currencyValues = Array.isArray(summary?.currency_values_detected) ? summary.currency_values_detected : [];
  const percentages = Array.isArray(summary?.percentages_detected) ? summary.percentages_detected : [];
  const headlineTotals = Array.isArray(summary?.headline_totals) ? summary.headline_totals : [];
  const assumptions = Array.isArray(extracted?.assumptions) ? extracted.assumptions : [];
  const scopeItems = Array.isArray(extracted?.scope_items) ? extracted.scope_items : [];
  const exclusions = Array.isArray(extracted?.exclusions) ? extracted.exclusions : [];
  const pricedItemsFromJson = Array.isArray(extracted?.priced_items) ? extracted.priced_items : [];
  const pricedItems = pricedItemsFromJson.length ? pricedItemsFromJson : extractPricedItemsFromRawText(selectedDoc?.raw_text || "");
  const scenarioTotals = useMemo(() => buildScenarioTotals(headlineTotals), [headlineTotals]);
  const selectedScenarioTotal =
    scenarioMode === "base"
      ? scenarioTotals.base
      : scenarioMode === "alt"
      ? scenarioTotals.alt
      : scenarioMode === "basePlusAlt"
      ? scenarioTotals.basePlusAlt
      : scenarioTotals.auto;
  const mappedRollupTotal = pricedItems.reduce((sum, item) => sum + parseCurrencyAmount(item?.amount), 0);
  const estimatedCost = toNumberOrZero(metrics.default_estimated_cost_usd);
  const minProfit = toNumberOrZero(metrics.minimum_profit_usd);
  const minContract = toNumberOrZero(metrics.minimum_contract_value_usd);
  const targetMargin = Math.min(95, Math.max(0, toNumberOrZero(metrics.target_margin_percent)));
  const riskBuffer = Math.max(0, toNumberOrZero(metrics.risk_buffer_percent));
  const requiredByProfit = estimatedCost + minProfit;
  const requiredByMargin = targetMargin >= 95 ? requiredByProfit : estimatedCost / (1 - targetMargin / 100 || 1);
  const baseFloor = Math.max(requiredByProfit, requiredByMargin, minContract);
  const recommendedMinimumBid = baseFloor * (1 + riskBuffer / 100);
  const expectedProfit = selectedScenarioTotal - estimatedCost;
  const expectedMargin = selectedScenarioTotal > 0 ? (expectedProfit / selectedScenarioTotal) * 100 : 0;
  const worthIt = selectedScenarioTotal > 0 && selectedScenarioTotal >= recommendedMinimumBid;

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-6 py-4">
        <div>
          <h2 className={`${lato.className} text-lg font-bold text-brand`}>Bid Document Assistant</h2>
          <p className="mt-0.5 text-sm text-neutral-500">
            Upload bid files for instant risk + clarification suggestions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-light">
            {uploading ? "Analyzing..." : "Upload Bid File"}
            <input
              type="file"
              accept=".pdf,.docx,.xlsx,.csv,.txt"
              className="hidden"
              disabled={uploading}
              onChange={handleUpload}
            />
          </label>
          <button
            type="button"
            onClick={loadDocuments}
            disabled={loadingDocs}
            className="rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 disabled:opacity-60"
          >
            {loadingDocs ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[300px_1fr]">
        {/* Left: Document list */}
        <div className="border-b border-neutral-100 lg:border-b-0 lg:border-r lg:max-h-[calc(100vh-16rem)] lg:overflow-y-auto">
          <div className="p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-400">Documents</p>
            {/* status message */}
            {status ? (
              <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">{status}</div>
            ) : null}
            <div className="space-y-2 max-h-[460px] overflow-y-auto lg:max-h-none">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className={`rounded-xl border p-3 transition-all ${
                    selectedDoc?.id === doc.id
                      ? "border-brand bg-brand-50 shadow-card-active"
                      : "border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-card"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button type="button" onClick={() => handleSelectDocument(doc)} className="min-w-0 flex-1 text-left">
                      <p className="font-semibold text-neutral-800 truncate text-sm">{doc.filename}</p>
                      <p className="mt-1 text-xs text-neutral-400">
                        {doc.file_type?.toUpperCase() || "FILE"} &middot; {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDocument(doc)}
                      disabled={deletingDocId === doc.id}
                      className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                      title="Delete report"
                    >
                      {deletingDocId === doc.id ? "..." : "Del"}
                    </button>
                  </div>
                </div>
              ))}
              {!documents.length ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-neutral-400">No uploads yet.</p>
                  <p className="mt-1 text-xs text-neutral-400">Upload a bid file to get started.</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Right: Document detail with collapsible sections */}
        <div className="p-6 lg:max-h-[calc(100vh-16rem)] lg:overflow-y-auto">
          {!selectedDoc ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-2xl bg-neutral-50 p-6">
                <svg className="mx-auto h-10 w-10 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="mt-4 text-sm font-medium text-neutral-500">Select a document to review</p>
              <p className="mt-1 text-xs text-neutral-400">Upload a bid file or choose from the list.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Overview */}
              <CollapsibleSection
                title="Overview"
                subtitle={selectedDoc.filename}
                isOpen={expandedSections.overview}
                onToggle={() => toggleSection("overview")}
                icon={<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
              >
                <div className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className={`${lato.className} text-lg font-bold text-neutral-900`}>{selectedDoc.filename}</h3>
                      <p className="mt-1 text-xs text-neutral-400">
                        {selectedDoc.file_type?.toUpperCase() || "FILE"} &middot; Uploaded {new Date(selectedDoc.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span className="rounded-full bg-brand-50 px-3 py-1 text-[11px] font-bold text-brand">
                      {selectedDoc?.source_label || "Upload"}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="group rounded-xl border border-neutral-200 bg-gradient-to-br from-white to-neutral-50/50 p-3.5 transition-shadow hover:shadow-card">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Project</p>
                      <p className="mt-1.5 text-sm font-semibold text-neutral-900 leading-snug">{projectName}</p>
                    </div>
                    <div className="group rounded-xl border border-neutral-200 bg-gradient-to-br from-white to-neutral-50/50 p-3.5 transition-shadow hover:shadow-card">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Client</p>
                      <p className="mt-1.5 text-sm font-semibold text-neutral-900 leading-snug">{clientName || "Not detected"}</p>
                    </div>
                    <div className="group rounded-xl border border-neutral-200 bg-gradient-to-br from-white to-neutral-50/50 p-3.5 transition-shadow hover:shadow-card">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Due Date</p>
                      <p className={`mt-1.5 text-sm font-semibold leading-snug ${dueDate ? "text-neutral-900" : "text-neutral-400"}`}>{dueDate || "Not detected"}</p>
                    </div>
                    <div className="group rounded-xl border border-neutral-200 bg-gradient-to-br from-white to-neutral-50/50 p-3.5 transition-shadow hover:shadow-card">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Source</p>
                      <p className="mt-1.5 text-sm font-semibold text-neutral-900 leading-snug">{selectedDoc?.source_label || "Unknown"}</p>
                    </div>
                  </div>
                </div>
              </CollapsibleSection>

              {/* Financial Analysis */}
              <CollapsibleSection
                title="Financial Analysis"
                subtitle="Metrics, scenarios, and worth-it evaluation"
                badge={worthIt ? "Worth pursuing" : "Below threshold"}
                badgeTone={worthIt ? "emerald" : "red"}
                isOpen={expandedSections.financials}
                onToggle={() => toggleSection("financials")}
                icon={<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              >
                <div className="space-y-4">
                  {/* Bid Fit Metrics */}
                  <div className="rounded-xl border border-neutral-200 bg-gradient-to-br from-white to-neutral-50/30 p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Bid Fit Metrics</p>
                        <p className="mt-0.5 text-[11px] text-neutral-400">Saved per profile — used for worth-it scoring</p>
                      </div>
                      <button
                        type="button"
                        onClick={saveMetrics}
                        disabled={savingMetrics || loadingMetrics}
                        className="rounded-lg bg-brand px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-light disabled:opacity-60"
                      >
                        {savingMetrics ? "Saving..." : "Save Metrics"}
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <label className="block">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Target margin %</span>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="95"
                          value={metrics.target_margin_percent}
                          onChange={(e) => updateMetricField("target_margin_percent", e.target.value)}
                          className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
                        />
                      </label>
                      <label className="block">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Minimum profit ($)</span>
                        <input
                          type="number"
                          step="1000"
                          min="0"
                          value={metrics.minimum_profit_usd}
                          onChange={(e) => updateMetricField("minimum_profit_usd", e.target.value)}
                          className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
                        />
                      </label>
                      <label className="block">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Min contract value ($)</span>
                        <input
                          type="number"
                          step="10000"
                          min="0"
                          value={metrics.minimum_contract_value_usd}
                          onChange={(e) => updateMetricField("minimum_contract_value_usd", e.target.value)}
                          className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
                        />
                      </label>
                      <label className="block">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Risk buffer %</span>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={metrics.risk_buffer_percent}
                          onChange={(e) => updateMetricField("risk_buffer_percent", e.target.value)}
                          className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
                        />
                      </label>
                      <label className="block">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Estimated job cost ($)</span>
                        <input
                          type="number"
                          step="1000"
                          min="0"
                          value={metrics.default_estimated_cost_usd}
                          onChange={(e) => updateMetricField("default_estimated_cost_usd", e.target.value)}
                          className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
                        />
                      </label>
                    </div>
                    <label className="mt-3 block">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Notes</span>
                      <textarea
                        rows={2}
                        value={metrics.notes || ""}
                        onChange={(e) => updateMetricField("notes", e.target.value)}
                        className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
                        placeholder="Example: Prefer margins over volume this quarter."
                      />
                    </label>
                  </div>

                  {/* Currency Values and Percentages */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-neutral-200 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Detected Currency Values</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {currencyValues.length ? (
                          currencyValues.map((value, idx) => (
                            <span key={`${value}-${idx}`} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">
                              {value}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-neutral-500">None detected</span>
                        )}
                      </div>
                    </div>
                    <div className="rounded-lg border border-neutral-200 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Detected Percentages</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {percentages.length ? (
                          percentages.map((value, idx) => (
                            <span key={`${value}-${idx}`} className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-800">
                              {value}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-neutral-500">None detected</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Price Mapping */}
                  <div className="rounded-lg border border-neutral-200 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Price Mapping</p>
                      <p className="text-xs text-neutral-500">{pricedItems.length} mapped values</p>
                    </div>
                    {pricedItems.length ? (
                      <div className="space-y-2">
                        {pricedItems.slice(0, 20).map((item, idx) => (
                          <div key={`${item.amount}-${idx}`} className="rounded-md border border-neutral-200 bg-neutral-50 p-2.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                                {item.amount}
                              </span>
                              <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-semibold text-neutral-700">
                                {item.category || "other"}
                              </span>
                              {item.unit_hint ? (
                                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-800">{item.unit_hint}</span>
                              ) : null}
                              {item.hole_count_hint ? (
                                <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-800">
                                  {item.hole_count_hint} holes
                                </span>
                              ) : null}
                              {item.depth_hint_ft ? (
                                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
                                  {item.depth_hint_ft} ft
                                </span>
                              ) : null}
                              {item.diameter_hint_in ? (
                                <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-xs font-semibold text-cyan-800">
                                  {item.diameter_hint_in} in
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-1 text-xs text-neutral-700">{item.context || "No context found."}</p>
                          </div>
                        ))}
                        {pricedItems.length > 20 ? (
                          <p className="text-xs text-neutral-500">Showing first 20 mapped values. Open raw text/JSON for the full set.</p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-500">No mapped price context detected yet.</p>
                    )}
                  </div>

                  {/* Detected Bid Totals */}
                  <div className="rounded-lg border border-neutral-200 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Detected Bid Totals</p>
                      <p className="text-xs text-neutral-500">{headlineTotals.length} candidates</p>
                    </div>
                    {headlineTotals.length ? (
                      <div className="space-y-2">
                        {headlineTotals.map((item, idx) => (
                          <div key={`${item.amount}-${idx}`} className="rounded-md border border-neutral-200 bg-neutral-50 p-2.5">
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                              {item.amount}
                            </span>
                            <p className="mt-1 text-xs text-neutral-700">{item.label || "No label context found."}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-500">
                        No headline bid totals detected yet. Re-analyze this file after table extraction update.
                      </p>
                    )}
                  </div>

                  {/* Total Scenario */}
                  <div className="rounded-lg border border-neutral-200 p-3">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Total Scenario</p>
                      <span className="text-xs text-neutral-500">Use this as target contract value</span>
                    </div>
                    <div className="mb-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setScenarioMode("auto")}
                        className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                          scenarioMode === "auto" ? "bg-brand text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                        }`}
                      >
                        Auto
                      </button>
                      <button
                        type="button"
                        onClick={() => setScenarioMode("base")}
                        className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                          scenarioMode === "base" ? "bg-brand text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                        }`}
                      >
                        Base
                      </button>
                      <button
                        type="button"
                        onClick={() => setScenarioMode("alt")}
                        className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                          scenarioMode === "alt" ? "bg-brand text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                        }`}
                      >
                        Alt
                      </button>
                      <button
                        type="button"
                        onClick={() => setScenarioMode("basePlusAlt")}
                        className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                          scenarioMode === "basePlusAlt"
                            ? "bg-brand text-white"
                            : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                        }`}
                      >
                        Base + Alt
                      </button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="rounded-md bg-neutral-50 p-2">
                        <p className="text-[11px] uppercase tracking-wide text-neutral-500">Selected scenario total</p>
                        <p className="mt-1 text-sm font-semibold text-neutral-900">{formatCurrencyAmount(selectedScenarioTotal)}</p>
                      </div>
                      <div className="rounded-md bg-neutral-50 p-2">
                        <p className="text-[11px] uppercase tracking-wide text-neutral-500">Current mapped rollup total</p>
                        <p className="mt-1 text-sm font-semibold text-neutral-900">{formatCurrencyAmount(mappedRollupTotal)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Worth-It Evaluation */}
                  <div
                    className={`rounded-2xl border-2 p-4 ${
                      worthIt
                        ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/30"
                        : "border-red-200 bg-gradient-to-br from-red-50 to-red-100/30"
                    }`}
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${worthIt ? "bg-emerald-100" : "bg-red-100"}`}>
                          {worthIt ? (
                            <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                          ) : (
                            <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                          )}
                        </div>
                        <p className="text-sm font-bold text-neutral-800">Worth-It Evaluation</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${worthIt ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                        {worthIt ? "Worth pursuing" : "Below threshold"}
                      </span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-xl bg-white/80 p-3 shadow-sm">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Min bid floor</p>
                        <p className="mt-1 text-lg font-black tracking-tight text-neutral-900">{formatCurrencyAmount(recommendedMinimumBid)}</p>
                      </div>
                      <div className="rounded-xl bg-white/80 p-3 shadow-sm">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Scenario total</p>
                        <p className="mt-1 text-lg font-black tracking-tight text-neutral-900">{formatCurrencyAmount(selectedScenarioTotal)}</p>
                      </div>
                      <div className="rounded-xl bg-white/80 p-3 shadow-sm">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Gross profit</p>
                        <p className={`mt-1 text-lg font-black tracking-tight ${expectedProfit >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                          {formatCurrencyAmount(expectedProfit)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white/80 p-3 shadow-sm">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Margin</p>
                        <p className="mt-1 text-lg font-black tracking-tight text-neutral-900">{expectedMargin.toFixed(1)}%</p>
                      </div>
                    </div>
                    <p className="mt-3 text-[11px] text-neutral-500">
                      Floor = max(min contract, cost + min profit, margin target) &times; (1 + risk buffer).
                    </p>
                  </div>

                  {/* Price Rollup */}
                  <PriceRollupPanel pricedItems={pricedItems} />
                </div>
              </CollapsibleSection>

              {/* Bid Builder Draft */}
              <CollapsibleSection
                title="Bid Builder Draft"
                subtitle="Compose and export your bid proposal"
                isOpen={expandedSections.draft}
                onToggle={() => toggleSection("draft")}
                icon={<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
              >
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50/50 px-4 py-2.5">
                    <p className="text-xs text-neutral-500">Export uses your in-memory edits — Save is optional before Download.</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={saveDraft}
                        disabled={savingDraft || loadingDraft || !selectedDoc?.id}
                        className="rounded-lg bg-brand px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-light disabled:opacity-60"
                      >
                        {savingDraft ? "Saving..." : "Save Draft"}
                      </button>
                      <button
                        type="button"
                        onClick={() => exportDraft("docx")}
                        disabled={exportingDraft || loadingDraft || !selectedDoc?.id}
                        className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 disabled:opacity-60"
                      >
                        {exportingDraft ? "Exporting..." : "DOCX"}
                      </button>
                      <button
                        type="button"
                        onClick={() => exportDraft("txt")}
                        disabled={exportingDraft || loadingDraft || !selectedDoc?.id}
                        className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 disabled:opacity-60"
                      >
                        TXT
                      </button>
                    </div>
                  </div>
                  {loadingDraft ? (
                    <p className="text-sm text-neutral-500">Loading draft...</p>
                  ) : (
                    <>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Draft title</span>
                          <input
                            type="text"
                            value={draft.title}
                            onChange={(e) => updateDraftField("title", e.target.value)}
                            className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
                          />
                        </label>
                        <label className="block">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Due date</span>
                          <input
                            type="text"
                            value={draft.due_date}
                            onChange={(e) => updateDraftField("due_date", e.target.value)}
                            className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
                          />
                        </label>
                        <label className="block">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Project name</span>
                          <input
                            type="text"
                            value={draft.project_name}
                            onChange={(e) => updateDraftField("project_name", e.target.value)}
                            className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
                          />
                        </label>
                        <label className="block">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Client name</span>
                          <input
                            type="text"
                            value={draft.client_name}
                            onChange={(e) => updateDraftField("client_name", e.target.value)}
                            className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
                          />
                        </label>
                      </div>

                      <label className="mt-3 block">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Intro / cover letter</span>
                        <textarea
                          rows={3}
                          value={draft.intro}
                          onChange={(e) => updateDraftField("intro", e.target.value)}
                          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
                        />
                      </label>

                      <div className="mt-2 grid gap-2 lg:grid-cols-2">
                        <div className="text-xs text-neutral-600">
                          <p className="mb-1">Pricing lines (editable table)</p>
                          <DraftPricingTableEditor
                            items={draft.pricing_items}
                            onChange={(items) => updateDraftField("pricing_items", normalizeDraftPayload({ pricing_items: items }).pricing_items)}
                          />
                          <details className="mt-2 rounded-md border border-neutral-200 bg-white p-2">
                            <summary className="cursor-pointer text-xs font-semibold text-neutral-700">
                              Paste/edit as text (label | amount)
                            </summary>
                            <textarea
                              rows={4}
                              value={pricingItemsToTextarea(draft.pricing_items)}
                              onChange={(e) => updateDraftField("pricing_items", textareaToPricingItems(e.target.value))}
                              className="mt-2 w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                            />
                          </details>
                        </div>
                        <label className="text-xs text-neutral-600">
                          Scope items (one per line)
                          <textarea
                            rows={5}
                            value={listToTextarea(draft.scope_items)}
                            onChange={(e) => updateDraftField("scope_items", textareaToList(e.target.value))}
                            className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                          />
                        </label>
                        <label className="text-xs text-neutral-600">
                          Assumptions (one per line)
                          <textarea
                            rows={5}
                            value={listToTextarea(draft.assumptions)}
                            onChange={(e) => updateDraftField("assumptions", textareaToList(e.target.value))}
                            className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                          />
                        </label>
                        <label className="text-xs text-neutral-600">
                          Exclusions (one per line)
                          <textarea
                            rows={5}
                            value={listToTextarea(draft.exclusions)}
                            onChange={(e) => updateDraftField("exclusions", textareaToList(e.target.value))}
                            className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                          />
                        </label>
                      </div>

                      <label className="mt-2 block text-xs text-neutral-600">
                        Terms
                        <textarea
                          rows={3}
                          value={draft.terms}
                          onChange={(e) => updateDraftField("terms", e.target.value)}
                          className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                        />
                      </label>
                      <label className="mt-2 block text-xs text-neutral-600">
                        Internal notes
                        <textarea
                          rows={2}
                          value={draft.notes}
                          onChange={(e) => updateDraftField("notes", e.target.value)}
                          className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                        />
                      </label>

                      <p className="text-xs text-neutral-500">
                        This preview uses your current edits immediately; export uses the same in-memory draft payload, so Save is optional before Download.
                      </p>
                      <DraftDocumentPreview draft={draft} />
                    </>
                  )}
                </div>
              </CollapsibleSection>

              {/* Insights & Risk */}
              <CollapsibleSection
                title="Insights & Risk"
                badge={riskFlags.length ? `${riskFlags.length} flags` : null}
                badgeTone={riskFlags.length ? "red" : undefined}
                isOpen={expandedSections.insights}
                onToggle={() => toggleSection("insights")}
              >
                <div className="space-y-4">
                  {/* Risk Flags */}
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Risk Flags</p>
                    <ul className="mt-2 space-y-1 text-sm text-amber-900">
                      {riskFlags.length ? riskFlags.map((flag, idx) => <li key={idx}>- {flag}</li>) : <li>- No major risks flagged.</li>}
                    </ul>
                  </div>

                  {/* Assumptions / Scope / Exclusions */}
                  <div className="grid gap-3 lg:grid-cols-3">
                    <ExpandableInsightList title="Assumptions" items={assumptions} />
                    <ExpandableInsightList title="Scope Items" items={scopeItems} />
                    <ExpandableInsightList title="Exclusions" items={exclusions} />
                  </div>

                  {/* Suggestions */}
                  <div className="rounded-lg border border-neutral-200 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Suggestions</p>
                    <div className="mt-2 space-y-2">
                      {suggestions.length ? suggestions.map((suggestion, idx) => {
                        const key = `${selectedDoc.id}:${suggestion.id || suggestion.text}`;
                        return (
                          <div key={suggestion.id || idx} className="rounded-md border border-neutral-200 bg-neutral-50 p-2">
                            <p className="text-sm text-neutral-800">{suggestion.text || "Untitled suggestion"}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => submitFeedback(suggestion, "accepted")}
                                className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                              >
                                Accept
                              </button>
                              <button
                                type="button"
                                onClick={() => submitFeedback(suggestion, "edited")}
                                className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                              >
                                Edited
                              </button>
                              <button
                                type="button"
                                onClick={() => submitFeedback(suggestion, "rejected")}
                                className="rounded-md bg-neutral-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-neutral-800"
                              >
                                Reject
                              </button>
                              {feedbackState[key] === "saving" ? <span className="text-xs text-neutral-500">Saving...</span> : null}
                              {feedbackState[key] === "saved" ? <span className="text-xs text-emerald-700">Saved</span> : null}
                              {feedbackState[key] === "error" ? <span className="text-xs text-red-700">Failed</span> : null}
                            </div>
                          </div>
                        );
                      }) : (
                        <p className="text-sm text-neutral-500">No suggestions generated for this file.</p>
                      )}
                    </div>
                  </div>
                </div>
              </CollapsibleSection>

              {/* Ask This Bid */}
              <CollapsibleSection
                title="Ask This Bid"
                isOpen={expandedSections.chat}
                onToggle={() => toggleSection("chat")}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={vectorizeSelectedDocument}
                      disabled={!selectedDoc?.id || vectorizingDocId === selectedDoc?.id}
                      className="rounded-md border border-neutral-300 bg-white px-3 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 disabled:opacity-60"
                    >
                      {vectorizingDocId === selectedDoc?.id ? "Vectorizing..." : "Vectorize now"}
                    </button>
                  </div>
                  <div className="max-h-72 space-y-2 overflow-y-auto rounded-md border border-neutral-200 bg-neutral-50 p-2.5">
                    {chatHistory.length ? (
                      chatHistory.map((entry, idx) => (
                        <div
                          key={`${entry.role}-${idx}`}
                          className={`rounded-md border px-2.5 py-2 text-sm ${
                            entry.role === "user" ? "border-blue-200 bg-blue-50 text-blue-900" : "border-neutral-200 bg-white text-neutral-800"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{entry.text}</p>
                          {entry.role === "assistant" && Array.isArray(entry.citations) && entry.citations.length ? (
                            <div className="mt-2 space-y-1">
                              {entry.citations.slice(0, 3).map((c, cIdx) => (
                                <p key={`${idx}-citation-${cIdx}`} className="text-xs text-neutral-500">
                                  [{c.index}] {c.section}: {c.snippet}
                                </p>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-neutral-500">
                        Ask questions like &quot;What exclusions are risky?&quot; or &quot;Where is mobilization priced?&quot; after vectorizing.
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          askBidDocument();
                        }
                      }}
                      placeholder="Ask this bid document..."
                      className="h-10 flex-1 rounded-md border border-neutral-300 px-3 text-sm"
                    />
                    <button
                      type="button"
                      onClick={askBidDocument}
                      disabled={!chatInput.trim() || chatLoading || !selectedDoc?.id}
                      className="rounded-md bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-brand-light disabled:opacity-60"
                    >
                      {chatLoading ? "Asking..." : "Ask"}
                    </button>
                  </div>
                </div>
              </CollapsibleSection>

              {/* Raw Data */}
              <CollapsibleSection
                title="Raw Data"
                isOpen={expandedSections.debug}
                onToggle={() => toggleSection("debug")}
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowExtractedJson((prev) => !prev)}
                      className="rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
                    >
                      {showExtractedJson ? "Hide extracted JSON" : "View extracted JSON"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRawText((prev) => !prev)}
                      className="rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
                    >
                      {showRawText ? "Hide raw text" : "View raw text"}
                    </button>
                  </div>
                  {showExtractedJson ? (
                    <pre className="max-h-64 overflow-auto rounded-md bg-neutral-950 p-3 text-xs text-neutral-100">
                      {JSON.stringify(extracted, null, 2)}
                    </pre>
                  ) : null}
                  {showRawText ? (
                    <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-neutral-100 p-3 text-xs text-neutral-800">
                      {selectedDoc?.raw_text || "Raw text not loaded for this row yet."}
                    </pre>
                  ) : null}
                </div>
              </CollapsibleSection>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function SalesTW() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [wonLoadError, setWonLoadError] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 5;

  const [companyFilter, setCompanyFilter] = useState("");
  const [jobNameFilter, setJobNameFilter] = useState("");
  const [monthSoldFilter, setMonthSoldFilter] = useState("");
  const [scopeFilter, setScopeFilter] = useState("");
  const [estimatorFilter, setEstimatorFilter] = useState("");
  const wonJobsRequestRef = useRef(0);
  const tabFromRoute =
    router.isReady && (router.query.tab === "won" || router.query.tab === "pipeline" || router.query.tab === "assistant")
      ? router.query.tab
      : null;
  const tab = selectedTab || tabFromRoute || "pipeline";

  const loadWonJobs = useCallback(async () => {
    const requestId = ++wonJobsRequestRef.current;
    setLoading(true);
    setWonLoadError("");

    const { paginatedData, totalCount, error } = await getSalesData(page, pageSize, {
      company: companyFilter,
      jobName: jobNameFilter,
      monthSold: monthSoldFilter,
      scope: scopeFilter,
      estimator: estimatorFilter,
    });

    if (error) {
      if (requestId !== wonJobsRequestRef.current) return;
      setCustomers([]);
      setTotalPages(0);
      setWonLoadError(error);
      setLoading(false);
      return;
    }

    if (requestId !== wonJobsRequestRef.current) return;
    setCustomers(paginatedData || []);
    setTotalPages(Math.ceil((totalCount || 0) / pageSize));
    setLoading(false);
  }, [
    companyFilter,
    estimatorFilter,
    jobNameFilter,
    monthSoldFilter,
    page,
    pageSize,
    scopeFilter,
  ]);

  useEffect(() => {
    if (tab !== "won") return;
    const timeoutId = window.setTimeout(() => {
      loadWonJobs();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadWonJobs, tab]);

  const handlePreviousPage = () => {
    if (page > 0) setPage(page - 1);
  };
  const handleNextPage = () => {
    if (page < totalPages - 1) setPage(page + 1);
  };
  const handleCompanyFilterChange = (value) => {
    setCompanyFilter(value);
    setPage(0);
  };
  const handleJobNameFilterChange = (value) => {
    setJobNameFilter(value);
    setPage(0);
  };
  const handleScopeFilterChange = (value) => {
    setScopeFilter(value);
    setPage(0);
  };
  const handleMonthSoldFilterChange = (value) => {
    setMonthSoldFilter(value);
    setPage(0);
  };
  const handleEstimatorFilterChange = (value) => {
    setEstimatorFilter(value);
    setPage(0);
  };

  return (
    <>
      <Head>
        <title>Sales | Admin</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div>
        <div className="mb-6">
          <h1 className={`${lato.className} text-2xl font-extrabold text-brand`}>Sales</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Pipeline for open bids and pursuits, plus historical won-job data.
          </p>
        </div>

        <nav className="mb-8 flex gap-1 border-b border-neutral-200">
          {[
            { id: "pipeline", label: "Pipeline" },
            { id: "won", label: "Won Jobs" },
            { id: "assistant", label: "Bid Assistant" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTab(t.id)}
              className={`relative px-4 py-3 text-sm font-semibold transition-colors ${
                tab === t.id
                  ? "text-brand after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-brand"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {tab === "pipeline" ? (
          <SalesPipeline />
        ) : tab === "assistant" ? (
          <BidAssistantPanel />
        ) : (
          <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-card">
            <p className="mb-4 text-sm text-neutral-500">
              Records from the legacy <strong>Customer</strong> table (sold work). For active pursuits, use the{" "}
              <strong>Pipeline</strong> tab.
            </p>
            {wonLoadError ? (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <span>{wonLoadError} Use retry instead of refreshing the page.</span>
                <button
                  type="button"
                  onClick={loadWonJobs}
                  disabled={loading}
                  className="rounded-xl border border-amber-300 bg-white px-3 py-2.5 text-sm font-semibold text-amber-900 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Retrying..." : "Retry won jobs"}
                </button>
              </div>
            ) : null}
            <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
              <input className="h-11 rounded-xl border border-neutral-300 px-4 text-sm transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none" placeholder="Filter by Company" value={companyFilter} onChange={(e) => handleCompanyFilterChange(e.target.value)} />
              <input className="h-11 rounded-xl border border-neutral-300 px-4 text-sm transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none" placeholder="Filter by Job Name" value={jobNameFilter} onChange={(e) => handleJobNameFilterChange(e.target.value)} />
              <input className="h-11 rounded-xl border border-neutral-300 px-4 text-sm transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none" placeholder="Filter by Scope" value={scopeFilter} onChange={(e) => handleScopeFilterChange(e.target.value)} />
              <input className="h-11 rounded-xl border border-neutral-300 px-4 text-sm transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none" placeholder="Filter by Month Sold" value={monthSoldFilter} onChange={(e) => handleMonthSoldFilterChange(e.target.value)} />
              <input className="h-11 rounded-xl border border-neutral-300 px-4 text-sm transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none" placeholder="Filter by Estimator" value={estimatorFilter} onChange={(e) => handleEstimatorFilterChange(e.target.value)} />
            </div>

            {loading ? (
              <div className="py-8 text-center text-sm text-neutral-500">Loading...</div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden lg:block overflow-x-auto rounded-xl border border-neutral-200">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200 bg-neutral-50">
                        <th className="sticky top-0 bg-neutral-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Company</th>
                        <th className="sticky top-0 bg-neutral-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Job Name</th>
                        <th className="sticky top-0 bg-neutral-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Amount</th>
                        <th className="sticky top-0 bg-neutral-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Scope</th>
                        <th className="sticky top-0 bg-neutral-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Day Sold</th>
                        <th className="sticky top-0 bg-neutral-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Month Sold</th>
                        <th className="sticky top-0 bg-neutral-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Estimator</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {customers.map((c, idx) => (
                        <tr key={idx} className="transition-colors hover:bg-neutral-50/60 even:bg-neutral-50/30">
                          <td className="px-4 py-3 font-medium text-neutral-900">{c.name}</td>
                          <td className="px-4 py-3 text-neutral-700">{c.jobName}</td>
                          <td className="px-4 py-3 font-semibold text-brand">{c.amount}</td>
                          <td className="px-4 py-3 text-neutral-600">{c.scope}</td>
                          <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">{c.dateSold}</td>
                          <td className="px-4 py-3 text-neutral-500">{c.monthSold}</td>
                          <td className="px-4 py-3 text-neutral-600">{c.estimator}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="space-y-3 lg:hidden">
                  {customers.map((c, idx) => (
                    <div key={idx} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-card">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-neutral-900">{c.name}</p>
                          <p className="text-sm text-neutral-500">{c.jobName}</p>
                        </div>
                        <p className="text-sm font-bold text-brand">{c.amount}</p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
                        <span>Scope: {c.scope}</span>
                        <span>Sold: {c.dateSold}</span>
                        <span>Est: {c.estimator}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                className="rounded-xl bg-neutral-100 px-4 py-2 text-sm font-semibold ring-1 ring-neutral-200 disabled:opacity-50"
                onClick={handlePreviousPage}
                disabled={page === 0}
              >
                Previous
              </button>
              <span className="text-sm text-neutral-500">
                Page {page + 1} of {Math.max(1, totalPages)}
              </span>
              <button
                className="rounded-xl bg-neutral-100 px-4 py-2 text-sm font-semibold ring-1 ring-neutral-200 disabled:opacity-50"
                onClick={handleNextPage}
                disabled={page >= totalPages - 1}
              >
                Next
              </button>
            </div>
          </section>
        )}
      </div>
    </>
  );
}

SalesTW.getLayout = function getLayout(page) {
  return <TWAdminLayout>{page}</TWAdminLayout>;
};

export default withAuthTw(SalesTW);
