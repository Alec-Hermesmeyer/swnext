/**
 * BidAssistantPanel — the top-level Bid Assistant component.
 * Renders a split-pane layout: chat interface (left) + document editor (right).
 * Manages document upload, selection, and the shared state reducer that
 * coordinates chat actions with the document editor.
 */

import { useCallback, useEffect, useState } from "react";
import BidChatInterface from "./BidChatInterface";
import BidDocumentEditor from "./BidDocumentEditor";
import BidMetricsEditor from "./BidMetricsEditor";
import BidRecommendations from "./BidRecommendations";
import { useBidAssistantReducer } from "./useBidAssistantReducer";
import {
  normalizeDraftPayload,
  getDefaultBidFitMetrics,
  METRICS_SOURCE_LABEL,
  METRICS_PROFILE_KEY,
} from "./bid-assistant-utils";

// ── Document sidebar list ───────────────────────────────────────────

function DocumentSidebar({ documents, selectedDoc, onSelect, onDelete, deletingDocId, uploading, onUpload, onRefresh, loadingDocs }) {
  return (
    <div className="border-b border-neutral-100 lg:border-b-0 lg:border-r lg:h-full lg:w-[220px] lg:shrink-0 lg:overflow-y-auto bg-white">
      <div className="p-3">
        {/* Upload + Refresh */}
        <div className="mb-3 flex items-center gap-2">
          <label className="flex-1 cursor-pointer rounded-lg bg-brand px-3 py-2 text-center text-xs font-semibold text-white shadow-sm transition-colors hover:bg-brand-light">
            {uploading ? "Analyzing..." : "Upload Bid"}
            <input
              type="file"
              accept=".pdf,.docx,.xlsx,.csv,.txt"
              className="hidden"
              disabled={uploading}
              onChange={onUpload}
            />
          </label>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loadingDocs}
            className="rounded-lg border border-neutral-300 bg-white px-2.5 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 disabled:opacity-60 transition-colors"
            title="Refresh documents"
          >
            <svg className={`h-3.5 w-3.5 ${loadingDocs ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Document list */}
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400">Documents</p>
        <div className="space-y-1.5 max-h-[50vh] overflow-y-auto lg:max-h-none">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className={`rounded-lg border p-2.5 transition-all cursor-pointer ${
                selectedDoc?.id === doc.id
                  ? "border-brand bg-brand-50 shadow-sm"
                  : "border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm"
              }`}
            >
              <div className="flex items-start justify-between gap-1.5">
                <button type="button" onClick={() => onSelect(doc)} className="min-w-0 flex-1 text-left">
                  <p className="font-semibold text-neutral-800 truncate text-xs leading-tight">{doc.filename}</p>
                  <p className="mt-0.5 text-[10px] text-neutral-400">
                    {doc.file_type?.toUpperCase() || "FILE"} &middot; {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDelete(doc); }}
                  disabled={deletingDocId === doc.id}
                  className="rounded p-1 text-neutral-300 hover:text-red-500 disabled:opacity-60 transition-colors"
                  title="Delete"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
          {!documents.length ? (
            <div className="py-6 text-center">
              <p className="text-xs text-neutral-400">No uploads yet.</p>
              <p className="mt-0.5 text-[10px] text-neutral-400">Upload a bid file to start.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ── Mobile tab bar — Chat / Editor only (Insights lives in drawer) ──

function MobileTabBar({ activeTab, onChange }) {
  return (
    <div className="flex border-b border-neutral-200 lg:hidden">
      {[
        { id: "chat", label: "Chat" },
        { id: "editor", label: "Editor" },
      ].map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={`flex-1 px-4 py-2.5 text-xs font-semibold transition-colors ${
            activeTab === t.id
              ? "text-brand border-b-2 border-brand"
              : "text-neutral-500 hover:text-neutral-700"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── Score toast badge — clickable pill that opens the insights drawer ─

function ScoreToast({ score, loading, onClick }) {
  if (loading) {
    return (
      <button type="button" onClick={onClick} className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 transition-colors hover:bg-neutral-100">
        <svg className="h-3 w-3 animate-spin text-neutral-400" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-[11px] font-semibold text-neutral-400">Scoring...</span>
      </button>
    );
  }

  if (!score || typeof score.composite_score !== "number") {
    return (
      <button type="button" onClick={onClick} className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 transition-colors hover:bg-neutral-100">
        <svg className="h-3.5 w-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-[11px] font-semibold text-neutral-500">Insights</span>
      </button>
    );
  }

  const s = score.composite_score;
  const rec = score.recommendation;
  const toneMap = {
    emerald: { ring: "border-emerald-400 bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
    amber: { ring: "border-amber-400 bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
    rose: { ring: "border-rose-400 bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
  };
  const tone = toneMap[rec?.tone] || toneMap.amber;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full border-2 px-3 py-1.5 transition-all hover:shadow-md ${tone.ring}`}
    >
      <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
      <span className={`text-sm font-black ${tone.text}`}>{s}</span>
      <span className={`text-[11px] font-semibold ${tone.text}`}>{rec?.label || "Score"}</span>
      <svg className="h-3 w-3 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

// ── Insights drawer — slides in from the right as an overlay ────────

function InsightsDrawer({ open, onClose, children }) {
  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] transition-opacity"
          onClick={onClose}
        />
      )}
      {/* Drawer panel */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3.5 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50">
              <svg className="h-3.5 w-3.5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Bid Insights</h3>
              <p className="text-[11px] text-neutral-500">Score, recommendations & metrics</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Drawer body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {children}
        </div>
      </div>
    </>
  );
}

// ── Main panel ──────────────────────────────────────────────────────

export default function BidAssistantPanel() {
  const { state, actions } = useBidAssistantReducer();
  const [mobileTab, setMobileTab] = useState("chat");
  const [deletingDocId, setDeletingDocId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // ── Fetch document by ID ───────────────────────────────────────

  const fetchDocumentById = useCallback(async (documentId) => {
    if (!documentId) return null;
    const response = await fetch(`/api/bidding/ai-bidding/documents/${documentId}`);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.detail || data?.error || "Could not load document details");
    return data?.document || null;
  }, []);

  // ── Load all documents ─────────────────────────────────────────

  const loadDocuments = useCallback(async () => {
    setLoadingDocs(true);
    try {
      const response = await fetch("/api/bidding/ai-bidding/documents");
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.detail || data?.error || "Could not load documents");
      const rows = Array.isArray(data?.documents) ? data.documents : [];
      actions.setDocuments(rows);

      if (state.selectedDoc?.id) {
        const fresh = rows.find((doc) => doc.id === state.selectedDoc.id) || null;
        if (!fresh) {
          actions.clearSelection();
        } else {
          try {
            const detailed = await fetchDocumentById(fresh.id);
            actions.setDocumentDetail(detailed || fresh);
          } catch {
            actions.setDocumentDetail(fresh);
          }
        }
      }
    } catch (error) {
      actions.setStatus(error.message || "Could not load documents");
    } finally {
      setLoadingDocs(false);
    }
  }, [fetchDocumentById, state.selectedDoc?.id, actions]);

  // Initial load
  useEffect(() => {
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load draft when document changes ───────────────────────────

  const loadDraft = useCallback(async (documentId) => {
    if (!documentId) {
      actions.setDraft({});
      return;
    }
    actions.setLoading("loadingDraft", true);
    try {
      const response = await fetch(`/api/bidding/ai-bidding/documents/${documentId}/draft`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.detail || data?.error || "Could not load draft");
      actions.setDraft(data?.draft || {});
    } catch (error) {
      actions.setStatus(error.message || "Could not load draft");
    } finally {
      actions.setLoading("loadingDraft", false);
    }
  }, [actions]);

  useEffect(() => {
    loadDraft(state.selectedDoc?.id);
  }, [loadDraft, state.selectedDoc?.id]);

  // ── Load metrics ───────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      actions.setLoading("loadingMetrics", true);
      try {
        const params = new URLSearchParams({
          source_label: METRICS_SOURCE_LABEL,
          profile_key: METRICS_PROFILE_KEY,
        });
        const response = await fetch(`/api/bidding/ai-bidding/metrics?${params.toString()}`);
        const data = await response.json().catch(() => ({}));
        if (response.ok) {
          actions.setMetrics(data?.metrics || {});
        }
      } catch {
        // Silently fallback to defaults
      } finally {
        actions.setLoading("loadingMetrics", false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch recommendations (operational context + score) ─────────

  const fetchRecommendations = useCallback(async () => {
    actions.setLoading("loadingRecommendations", true);
    try {
      // Build bid_data from the selected document's extracted pricing
      const extracted = state.selectedDoc?.extracted_json || {};
      const summary = extracted?.summary || {};
      const headlineTotals = Array.isArray(summary.headline_totals) ? summary.headline_totals : [];
      // Use the highest headline total as the value estimate
      const bestValue = headlineTotals.reduce((max, t) => {
        const amt = Number(String(t?.amount || "").replace(/[^0-9.-]/g, "")) || 0;
        return amt > max ? amt : max;
      }, 0);

      const response = await fetch("/api/bid-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metrics: state.metrics,
          bid_data: { value_estimate: bestValue },
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        actions.setOpsContext(data.context || null);
        actions.setBidScore(data.score || null);
      }
    } catch {
      // Silent — recommendations are non-critical
    } finally {
      actions.setLoading("loadingRecommendations", false);
    }
  }, [state.selectedDoc, state.metrics, actions]);

  // Auto-fetch recommendations when a document is selected or metrics change
  useEffect(() => {
    if (state.selectedDoc?.id) {
      fetchRecommendations();
    } else {
      actions.setOpsContext(null);
      actions.setBidScore(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selectedDoc?.id]);

  // ── Upload handler ─────────────────────────────────────────────

  const handleUpload = useCallback(async (event) => {
    const file = event.target.files?.[0];
    const inputEl = event.target; // capture before any await
    if (!file || uploading) return;
    setUploading(true);
    actions.setStatus("");
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
      actions.setStatus("Bid document analyzed. Select it to start the assistant.");
      await loadDocuments();
      if (data?.document?.id) {
        // Auto-select the new document
        try {
          const detailed = await fetchDocumentById(data.document.id);
          actions.selectDocument(detailed || data.document);
        } catch {
          actions.selectDocument(data.document);
        }
      }
    } catch (error) {
      actions.setStatus(error.message || "Could not analyze uploaded file");
    } finally {
      setUploading(false);
      if (inputEl) inputEl.value = "";
    }
  }, [uploading, actions, loadDocuments, fetchDocumentById]);

  // ── Select document handler ────────────────────────────────────

  const handleSelectDocument = useCallback(async (doc) => {
    if (!doc?.id) return;
    actions.selectDocument(doc);
    try {
      const detailed = await fetchDocumentById(doc.id);
      if (detailed) actions.setDocumentDetail(detailed);
    } catch (error) {
      actions.setStatus(error.message || "Could not load document details");
    }
  }, [actions, fetchDocumentById]);

  // ── Delete document handler ────────────────────────────────────

  const handleDeleteDocument = useCallback(async (doc) => {
    if (!doc?.id || deletingDocId) return;
    const confirmed = window.confirm(`Delete "${doc.filename}"? This cannot be undone.`);
    if (!confirmed) return;

    setDeletingDocId(doc.id);
    actions.setStatus("");
    try {
      const response = await fetch(`/api/bidding/ai-bidding/documents/${doc.id}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.detail || data?.error || "Could not delete document");
      if (state.selectedDoc?.id === doc.id) {
        actions.clearSelection();
      }
      await loadDocuments();
    } catch (error) {
      actions.setStatus(error.message || "Could not delete document");
    } finally {
      setDeletingDocId("");
    }
  }, [deletingDocId, actions, state.selectedDoc?.id, loadDocuments]);

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white shadow-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-light">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold text-neutral-900">Bid Assistant</h2>
            <p className="text-[11px] text-neutral-500">
              Upload bid docs, chat with AI, and build proposals
            </p>
          </div>
        </div>
        {state.status ? (
          <div className="rounded-lg bg-blue-50 px-3 py-1.5 text-[11px] text-blue-700 max-w-xs truncate">
            {state.status}
          </div>
        ) : null}
      </div>

      {/* Mobile tab bar */}
      <MobileTabBar activeTab={mobileTab} onChange={setMobileTab} />

      {/* Main layout: sidebar + three-pane (chat | editor | insights) */}
      <div className="flex flex-col lg:flex-row overflow-hidden" style={{ height: "calc(100vh - 16rem)" }}>
        {/* Document sidebar */}
        <DocumentSidebar
          documents={state.documents}
          selectedDoc={state.selectedDoc}
          onSelect={handleSelectDocument}
          onDelete={handleDeleteDocument}
          deletingDocId={deletingDocId}
          uploading={uploading}
          onUpload={handleUpload}
          onRefresh={loadDocuments}
          loadingDocs={loadingDocs}
        />

        {/* Chat pane */}
        <div className={`flex-1 min-h-0 min-w-0 border-r border-neutral-100 ${
          mobileTab !== "chat" ? "hidden lg:flex" : "flex"
        } flex-col`}>
          <BidChatInterface state={state} actions={actions} />
        </div>

        {/* Editor pane */}
        <div className={`flex-1 min-h-0 min-w-0 border-r border-neutral-100 ${
          mobileTab !== "editor" ? "hidden lg:flex" : "flex"
        } flex-col`}>
          <BidDocumentEditor state={state} actions={actions} />
        </div>

        {/* Insights pane — Recommendations + Metrics */}
        <div className={`lg:w-[340px] lg:shrink-0 min-h-0 overflow-y-auto ${
          mobileTab !== "insights" ? "hidden lg:block" : "block"
        }`}>
          <div className="p-3 space-y-3">
            <BidRecommendations
              score={state.bidScore}
              context={state.opsContext}
              loading={state.loadingRecommendations}
              onRefresh={fetchRecommendations}
            />
            <BidMetricsEditor
              metrics={state.metrics}
              onUpdateField={actions.updateMetricField}
              onSetMetrics={actions.setMetrics}
              isJobOverride={state.jobMetricsOverride}
              onToggleJobOverride={actions.toggleJobOverride}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
