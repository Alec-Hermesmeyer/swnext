/**
 * BidDocumentEditor — live document editor for the Bid Assistant.
 * Provides section-based editing with inline AI assist, drag reordering,
 * real-time sync with the chat interface, and live preview.
 */

import { useCallback, useRef, useState } from "react";
import {
  normalizeDraftPayload,
  formatCurrencyAmount,
  parseCurrencyAmount,
} from "./bid-assistant-utils";

// Stable key counter for reorderable list items
let _keyCounter = 0;
function nextKey() {
  return `bid-item-${++_keyCounter}`;
}

// ── Section wrapper with AI assist button ───────────────────────────

function EditorSection({ title, icon, children, onAiAssist, aiLoading, reverted, onRevert, hasHistory }) {
  return (
    <div className="group rounded-xl border border-neutral-200 bg-white transition-shadow hover:shadow-card">
      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-2.5">
        <div className="flex items-center gap-2">
          {icon ? (
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-neutral-100 text-neutral-500">
              {icon}
            </div>
          ) : null}
          <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-500">{title}</h4>
        </div>
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {hasHistory ? (
            <button
              type="button"
              onClick={onRevert}
              className="rounded-md px-2 py-1 text-[10px] font-semibold text-amber-600 hover:bg-amber-50 transition-colors"
              title="Undo last AI change"
            >
              Undo
            </button>
          ) : null}
          {onAiAssist ? (
            <button
              type="button"
              onClick={onAiAssist}
              disabled={aiLoading}
              className="flex items-center gap-1 rounded-md bg-brand-50 px-2 py-1 text-[10px] font-semibold text-brand hover:bg-brand-100 transition-colors disabled:opacity-50"
            >
              {aiLoading ? (
                <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )}
              AI Assist
            </button>
          ) : null}
        </div>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

// ── Pricing table editor ────────────────────────────────────────────

function PricingTableEditor({ items, onChange }) {
  const safeItems = Array.isArray(items) ? items : [];
  // Assign stable keys to items that don't have one
  const keysRef = useRef(new WeakMap());
  const getItemKey = (item, index) => {
    if (typeof item === "object" && item !== null) {
      if (!keysRef.current.has(item)) keysRef.current.set(item, nextKey());
      return keysRef.current.get(item);
    }
    return `pricing-fallback-${index}`;
  };

  const updateRow = (index, field, value) => {
    const next = safeItems.map((row, idx) =>
      idx === index ? { ...row, [field]: value } : row
    );
    onChange(next);
  };

  const addRow = () => onChange([...safeItems, { label: "", amount: "", _key: nextKey() }]);
  const removeRow = (index) => onChange(safeItems.filter((_, idx) => idx !== index));

  const moveRow = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= safeItems.length) return;
    const next = [...safeItems];
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    onChange(next);
  };

  const total = safeItems.reduce((sum, row) => sum + parseCurrencyAmount(row?.amount), 0);

  return (
    <div>
      {!safeItems.length ? (
        <div className="py-4 text-center text-sm text-neutral-400">
          No pricing lines yet.{" "}
          <button type="button" onClick={addRow} className="font-semibold text-brand hover:underline">
            Add the first row
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {safeItems.map((row, index) => (
            <div key={row?._key || getItemKey(row, index)} className="flex items-center gap-2">
              {/* Drag handle / reorder */}
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => moveRow(index, -1)}
                  disabled={index === 0}
                  className="rounded p-0.5 text-neutral-300 hover:text-neutral-500 disabled:opacity-30"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => moveRow(index, 1)}
                  disabled={index === safeItems.length - 1}
                  className="rounded p-0.5 text-neutral-300 hover:text-neutral-500 disabled:opacity-30"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              <input
                type="text"
                value={row?.label || ""}
                onChange={(e) => updateRow(index, "label", e.target.value)}
                placeholder="Line description"
                className="h-9 flex-1 rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
              />
              <input
                type="text"
                value={row?.amount || ""}
                onChange={(e) => updateRow(index, "amount", e.target.value)}
                placeholder="$0.00"
                className="h-9 w-32 rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => removeRow(index)}
                className="rounded-lg p-1.5 text-neutral-300 transition-colors hover:bg-red-50 hover:text-red-500"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1 rounded-lg border border-dashed border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-500 hover:border-brand hover:text-brand transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add row
        </button>
        {total > 0 ? (
          <p className="text-sm font-semibold text-neutral-700">
            Total: <span className="text-brand">{formatCurrencyAmount(total)}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}

// ── List editor (scope / assumptions / exclusions) ──────────────────

function ListEditor({ items, onChange, placeholder }) {
  const safeItems = Array.isArray(items) ? items : [];
  // Stable keys for reorderable string items
  const keysRef = useRef([]);
  while (keysRef.current.length < safeItems.length) {
    keysRef.current.push(nextKey());
  }
  if (keysRef.current.length > safeItems.length) {
    keysRef.current.length = safeItems.length;
  }

  const updateItem = (index, value) => {
    const next = [...safeItems];
    next[index] = value;
    onChange(next);
  };

  const addItem = () => {
    keysRef.current.push(nextKey());
    onChange([...safeItems, ""]);
  };

  const removeItem = (index) => {
    keysRef.current.splice(index, 1);
    onChange(safeItems.filter((_, idx) => idx !== index));
  };

  const moveItem = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= safeItems.length) return;
    const next = [...safeItems];
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    const keys = keysRef.current;
    [keys[index], keys[newIndex]] = [keys[newIndex], keys[index]];
    onChange(next);
  };

  return (
    <div>
      {safeItems.length === 0 ? (
        <div className="py-3 text-center text-sm text-neutral-400">
          None yet.{" "}
          <button type="button" onClick={addItem} className="font-semibold text-brand hover:underline">
            Add one
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          {safeItems.map((item, index) => (
            <div key={keysRef.current[index] || `list-${index}`} className="flex items-center gap-2">
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => moveItem(index, -1)}
                  disabled={index === 0}
                  className="rounded p-0.5 text-neutral-300 hover:text-neutral-500 disabled:opacity-30"
                >
                  <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(index, 1)}
                  disabled={index === safeItems.length - 1}
                  className="rounded p-0.5 text-neutral-300 hover:text-neutral-500 disabled:opacity-30"
                >
                  <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              <input
                type="text"
                value={item || ""}
                onChange={(e) => updateItem(index, e.target.value)}
                placeholder={placeholder || "Enter item..."}
                className="h-8 flex-1 rounded-lg border border-neutral-200 px-3 text-sm transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="rounded p-1 text-neutral-300 hover:text-red-500 transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
      {safeItems.length > 0 ? (
        <button
          type="button"
          onClick={addItem}
          className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-neutral-400 hover:text-brand transition-colors"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add item
        </button>
      ) : null}
    </div>
  );
}

// ── Live preview pane ───────────────────────────────────────────────

function LivePreview({ draft }) {
  const pricingRows = Array.isArray(draft?.pricing_items) ? draft.pricing_items : [];
  const total = pricingRows.reduce((sum, r) => sum + parseCurrencyAmount(r?.amount), 0);

  return (
    <div className="rounded-xl border border-neutral-200 bg-gradient-to-br from-neutral-50 to-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Live Preview</p>
        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-neutral-400 ring-1 ring-neutral-200">
          DOCX layout
        </span>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-4 text-sm shadow-sm">
        <h3 className="text-base font-bold text-neutral-900">{draft?.title || "Bid Proposal"}</h3>
        <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-0.5 text-xs text-neutral-500">
          <p><span className="font-semibold text-neutral-700">Project:</span> {draft?.project_name || "—"}</p>
          <p><span className="font-semibold text-neutral-700">Client:</span> {draft?.client_name || "—"}</p>
          <p><span className="font-semibold text-neutral-700">Due:</span> {draft?.due_date || "—"}</p>
        </div>

        {draft?.intro ? (
          <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-700 leading-relaxed">{draft.intro}</p>
        ) : null}

        {pricingRows.length ? (
          <div className="mt-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1.5">Pricing</p>
            <div className="overflow-hidden rounded-md border border-neutral-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-[10px] uppercase tracking-wide text-neutral-400">
                  <tr>
                    <th className="px-3 py-1.5 font-bold">Description</th>
                    <th className="px-3 py-1.5 font-bold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {pricingRows.map((row, idx) => (
                    <tr key={`preview-${idx}`} className="border-t border-neutral-100">
                      <td className="px-3 py-1.5">{row?.label || "—"}</td>
                      <td className="px-3 py-1.5 text-right font-medium">{row?.amount || "—"}</td>
                    </tr>
                  ))}
                  {total > 0 ? (
                    <tr className="border-t-2 border-neutral-200 bg-neutral-50">
                      <td className="px-3 py-1.5 font-bold">Total</td>
                      <td className="px-3 py-1.5 text-right font-bold text-brand">{formatCurrencyAmount(total)}</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {(draft?.scope_items || []).length ? (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Scope</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-3.5 text-xs text-neutral-600">
                {draft.scope_items.map((item, idx) => <li key={idx}>{item}</li>)}
              </ul>
            </div>
          ) : null}
          {(draft?.assumptions || []).length ? (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Assumptions</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-3.5 text-xs text-neutral-600">
                {draft.assumptions.map((item, idx) => <li key={idx}>{item}</li>)}
              </ul>
            </div>
          ) : null}
          {(draft?.exclusions || []).length ? (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Exclusions</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-3.5 text-xs text-neutral-600">
                {draft.exclusions.map((item, idx) => <li key={idx}>{item}</li>)}
              </ul>
            </div>
          ) : null}
        </div>

        {draft?.terms ? (
          <div className="mt-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Terms</p>
            <p className="mt-1 whitespace-pre-wrap text-xs text-neutral-600">{draft.terms}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ── Main document editor ────────────────────────────────────────────

export default function BidDocumentEditor({ state, actions }) {
  const { selectedDoc, draft, savingDraft, loadingDraft, exportingDraft, draftHistory, status } = state;
  const [showPreview, setShowPreview] = useState(false);
  const [aiAssistLoading, setAiAssistLoading] = useState({});

  // ── AI assist for a specific section ───────────────────────────

  const handleAiAssist = useCallback(async (section) => {
    if (!selectedDoc?.id) return;
    setAiAssistLoading((prev) => ({ ...prev, [section]: true }));

    const prompts = {
      intro: "Generate a professional introduction paragraph for our bid proposal based on the project details in this document.",
      scope_items: "List the key scope items that should be included in our bid proposal based on this document.",
      assumptions: "List reasonable assumptions we should include in our bid proposal based on this document.",
      exclusions: "Suggest exclusions we should include in our bid proposal to protect our interests.",
      terms: "Draft standard terms and conditions appropriate for this type of project based on the bid document.",
    };

    try {
      const response = await fetch("/api/bid-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: selectedDoc.id, message: prompts[section] || `Generate content for the ${section} section.` }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.detail || data?.error || "AI assist failed");

      const answer = data?.answer || "";

      // Parse the response for list items or text
      if (["scope_items", "assumptions", "exclusions"].includes(section)) {
        const lines = answer.split("\n");
        const items = [];
        for (const line of lines) {
          const match = line.match(/^\s*[-*]\s+(.+)/);
          const numbered = line.match(/^\s*\d+[.)]\s+(.+)/);
          if (match) items.push(match[1].trim());
          else if (numbered) items.push(numbered[1].trim());
        }
        if (items.length) {
          actions.applyChatSuggestion({ field: section, value: items, source: "ai_assist" });
          actions.addChatMessage({
            role: "assistant",
            text: `I've generated ${items.length} ${section.replace(/_/g, " ")} and applied them to the draft. Review them in the editor and adjust as needed.`,
            timestamp: Date.now(),
          });
        }
      } else {
        // For text fields, use the full answer
        const cleanText = answer.replace(/^(?:#+\s+.*\n|(?:\*\*.*\*\*)\n)/, "").trim();
        actions.applyChatSuggestion({ field: section, value: cleanText, source: "ai_assist" });
        actions.addChatMessage({
          role: "assistant",
          text: `I've generated the ${section.replace(/_/g, " ")} and applied it to the draft. Review it in the editor.`,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      actions.setStatus(`AI assist failed: ${error.message}`);
    } finally {
      setAiAssistLoading((prev) => ({ ...prev, [section]: false }));
    }
  }, [selectedDoc?.id, actions]);

  // ── Save draft to backend ─────────────────────────────────────

  const saveDraft = useCallback(async () => {
    if (!selectedDoc?.id) return;
    actions.setLoading("savingDraft", true);
    actions.setStatus("");
    const payload = normalizeDraftPayload(draft);
    try {
      const response = await fetch(`/api/bidding/ai-bidding/documents/${selectedDoc.id}/draft`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.detail || data?.error || "Could not save draft");
      actions.setDraft(data?.draft || payload);
      actions.setStatus("Bid draft saved.");
    } catch (error) {
      actions.setStatus(error.message || "Could not save draft");
    } finally {
      actions.setLoading("savingDraft", false);
    }
  }, [selectedDoc?.id, draft, actions]);

  // ── Export draft ──────────────────────────────────────────────
  // Always saves the draft first so the backend has the latest edits,
  // then requests the file export.  This prevents the common issue where
  // a download contains stale content because the user forgot to save.

  const exportDraft = useCallback(async (format = "docx") => {
    if (!selectedDoc?.id) return;
    actions.setLoading("exportingDraft", true);
    actions.setStatus("");
    const payload = normalizeDraftPayload(draft);

    try {
      // 1. Save the current draft so the backend has the latest content
      const saveResponse = await fetch(
        `/api/bidding/ai-bidding/documents/${selectedDoc.id}/draft`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!saveResponse.ok) {
        const saveErr = await saveResponse.json().catch(() => ({}));
        throw new Error(saveErr?.detail || saveErr?.error || "Could not save draft before export");
      }
      const savedData = await saveResponse.json().catch(() => ({}));
      // Update local state so it reflects what was saved
      if (savedData?.draft) actions.setDraft(savedData.draft);

      // 2. Now request the export — backend will use the just-saved draft
      const response = await fetch(
        `/api/bidding/ai-bidding/documents/${selectedDoc.id}/draft/export`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ format, draft: payload }),
        }
      );
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
      actions.setStatus(`Saved & exported ${fileName}`);
    } catch (error) {
      actions.setStatus(error.message || "Could not export draft");
    } finally {
      actions.setLoading("exportingDraft", false);
    }
  }, [selectedDoc, draft, actions]);

  // ── Empty state ────────────────────────────────────────────────

  if (!selectedDoc) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 py-16 text-center">
        <div className="rounded-2xl bg-neutral-50 p-6">
          <svg className="mx-auto h-10 w-10 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <p className="mt-4 text-sm font-medium text-neutral-500">No document selected</p>
        <p className="mt-1 text-xs text-neutral-400">Select a bid document to start editing the proposal draft.</p>
      </div>
    );
  }

  const hasIntroHistory = draftHistory.some((h) => h.field === "intro");
  const hasScopeHistory = draftHistory.some((h) => h.field === "scope_items");
  const hasAssumptionsHistory = draftHistory.some((h) => h.field === "assumptions");
  const hasExclusionsHistory = draftHistory.some((h) => h.field === "exclusions");
  const hasTermsHistory = draftHistory.some((h) => h.field === "terms");

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="shrink-0 flex items-center justify-between border-b border-neutral-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50">
            <svg className="h-3.5 w-3.5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-800">Proposal Editor</h3>
            <p className="text-[11px] text-neutral-400 truncate max-w-[200px]">{selectedDoc.filename}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors ${
              showPreview
                ? "bg-brand-50 text-brand"
                : "text-neutral-500 hover:bg-neutral-100"
            }`}
          >
            {showPreview ? "Hide Preview" : "Preview"}
          </button>
          <button
            type="button"
            onClick={saveDraft}
            disabled={savingDraft || loadingDraft}
            className="rounded-lg bg-brand px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-brand-light disabled:opacity-60 transition-colors"
          >
            {savingDraft ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => exportDraft("docx")}
            disabled={exportingDraft || loadingDraft}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-neutral-700 hover:bg-neutral-100 disabled:opacity-60 transition-colors"
          >
            {exportingDraft ? "Exporting..." : "DOCX"}
          </button>
          <button
            type="button"
            onClick={() => exportDraft("txt")}
            disabled={exportingDraft || loadingDraft}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-neutral-700 hover:bg-neutral-100 disabled:opacity-60 transition-colors"
          >
            TXT
          </button>
        </div>
      </div>

      {/* Status bar */}
      {status ? (
        <div className="shrink-0 border-b border-blue-100 bg-blue-50 px-4 py-2">
          <p className="text-xs text-blue-800">{status}</p>
        </div>
      ) : null}

      {/* Scrollable editor content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loadingDraft ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-3 text-neutral-500">
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Loading draft...
            </div>
          </div>
        ) : (
          <>
            {/* Header fields */}
            <EditorSection
              title="Project Details"
              icon={<svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Draft title</span>
                  <input
                    type="text"
                    value={draft.title}
                    onChange={(e) => actions.updateDraftField("title", e.target.value)}
                    placeholder="Bid Proposal"
                    className="mt-1 h-9 w-full rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Due date</span>
                  <input
                    type="text"
                    value={draft.due_date}
                    onChange={(e) => actions.updateDraftField("due_date", e.target.value)}
                    placeholder="MM/DD/YYYY"
                    className="mt-1 h-9 w-full rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Project name</span>
                  <input
                    type="text"
                    value={draft.project_name}
                    onChange={(e) => actions.updateDraftField("project_name", e.target.value)}
                    className="mt-1 h-9 w-full rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Client name</span>
                  <input
                    type="text"
                    value={draft.client_name}
                    onChange={(e) => actions.updateDraftField("client_name", e.target.value)}
                    className="mt-1 h-9 w-full rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
                  />
                </label>
              </div>
            </EditorSection>

            {/* Intro */}
            <EditorSection
              title="Introduction / Cover Letter"
              icon={<svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>}
              onAiAssist={() => handleAiAssist("intro")}
              aiLoading={aiAssistLoading.intro}
              hasHistory={hasIntroHistory}
              onRevert={() => actions.revertSection("intro")}
            >
              <textarea
                rows={4}
                value={draft.intro}
                onChange={(e) => actions.updateDraftField("intro", e.target.value)}
                placeholder="Write or generate a professional introduction for the bid proposal..."
                className="w-full resize-y rounded-lg border border-neutral-200 px-3 py-2 text-sm leading-relaxed transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
              />
            </EditorSection>

            {/* Pricing */}
            <EditorSection
              title="Pricing Table"
              icon={<svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            >
              <PricingTableEditor
                items={draft.pricing_items}
                onChange={(items) => actions.updateDraftField("pricing_items", normalizeDraftPayload({ pricing_items: items }).pricing_items)}
              />
            </EditorSection>

            {/* Scope */}
            <EditorSection
              title="Scope Items"
              icon={<svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
              onAiAssist={() => handleAiAssist("scope_items")}
              aiLoading={aiAssistLoading.scope_items}
              hasHistory={hasScopeHistory}
              onRevert={() => actions.revertSection("scope_items")}
            >
              <ListEditor
                items={draft.scope_items}
                onChange={(items) => actions.updateDraftField("scope_items", items)}
                placeholder="Describe a scope item..."
              />
            </EditorSection>

            {/* Assumptions */}
            <EditorSection
              title="Assumptions"
              icon={<svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              onAiAssist={() => handleAiAssist("assumptions")}
              aiLoading={aiAssistLoading.assumptions}
              hasHistory={hasAssumptionsHistory}
              onRevert={() => actions.revertSection("assumptions")}
            >
              <ListEditor
                items={draft.assumptions}
                onChange={(items) => actions.updateDraftField("assumptions", items)}
                placeholder="State an assumption..."
              />
            </EditorSection>

            {/* Exclusions */}
            <EditorSection
              title="Exclusions"
              icon={<svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>}
              onAiAssist={() => handleAiAssist("exclusions")}
              aiLoading={aiAssistLoading.exclusions}
              hasHistory={hasExclusionsHistory}
              onRevert={() => actions.revertSection("exclusions")}
            >
              <ListEditor
                items={draft.exclusions}
                onChange={(items) => actions.updateDraftField("exclusions", items)}
                placeholder="State an exclusion..."
              />
            </EditorSection>

            {/* Terms */}
            <EditorSection
              title="Terms & Conditions"
              icon={<svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
              onAiAssist={() => handleAiAssist("terms")}
              aiLoading={aiAssistLoading.terms}
              hasHistory={hasTermsHistory}
              onRevert={() => actions.revertSection("terms")}
            >
              <textarea
                rows={3}
                value={draft.terms}
                onChange={(e) => actions.updateDraftField("terms", e.target.value)}
                placeholder="Standard terms and conditions..."
                className="w-full resize-y rounded-lg border border-neutral-200 px-3 py-2 text-sm leading-relaxed transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
              />
            </EditorSection>

            {/* Internal notes */}
            <EditorSection
              title="Internal Notes"
              icon={<svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>}
            >
              <textarea
                rows={2}
                value={draft.notes}
                onChange={(e) => actions.updateDraftField("notes", e.target.value)}
                placeholder="Not exported — for your team only."
                className="w-full resize-y rounded-lg border border-neutral-200 px-3 py-2 text-sm leading-relaxed transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
              />
            </EditorSection>

            {/* Live preview toggle */}
            {showPreview ? <LivePreview draft={draft} /> : null}
          </>
        )}
      </div>
    </div>
  );
}
