"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import { Lato } from "next/font/google";
import { Upload, Download, Trash2, RefreshCw, AlertTriangle, CheckCircle2, FileText, Loader2, Pencil, Plus, Printer, X, Sparkles } from "lucide-react";
import withAuthTw from "@/components/withAuthTw";
import TWAdminLayout from "@/components/TWAdminLayout";
import supabase from "@/components/Supabase";
import JobCombobox from "@/components/admin/crew-scheduler/JobCombobox";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

const formatMoney = (n) => {
  const v = Number(n);
  if (!Number.isFinite(v) || v === 0) return "—";
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
};

const formatDate = (yyyymmdd) => {
  if (!yyyymmdd) return "—";
  const [y, m, d] = String(yyyymmdd).split("-");
  return `${parseInt(m, 10)}/${parseInt(d, 10)}/${y}`;
};

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const daysAgoStr = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function AdminRevenueReportsPage() {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [status, setStatus] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  // Date-range generator state — defaults to last 7 days.
  const [from, setFrom] = useState(() => daysAgoStr(7));
  const [to, setTo] = useState(() => todayStr());

  // Inline preview of one upload's parsed rows.
  const [previewUploadId, setPreviewUploadId] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Edit modal — null means closed; { mode: "edit"|"create", row: {...} } when open.
  const [editorState, setEditorState] = useState(null);

  // Manual rows (upload_id IS NULL) within the current date range. Shown
  // in a separate panel since they don't belong to any upload.
  const [manualRows, setManualRows] = useState([]);
  const [manualLoading, setManualLoading] = useState(false);

  // Canonical crew_jobs list for the typeahead in the row editor. Loaded
  // once on mount (and refreshed on demand if needed).
  const [crewJobs, setCrewJobs] = useState([]);

  const fileInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/crew-jobs/list?include_inactive=1");
        const data = await res.json();
        if (!cancelled && res.ok) setCrewJobs(data.jobs || []);
      } catch (_) { /* non-fatal — editor falls back to plain text fields */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const loadUploads = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/revenue-reports/list");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load uploads");
      setUploads(data.uploads || []);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUploads();
  }, [loadUploads]);

  const handleFile = async (file) => {
    if (!file) return;
    if (!/\.docx$/i.test(file.name)) {
      setStatus({ type: "error", message: "Only .docx files are accepted." });
      return;
    }
    setUploading(true);
    setStatus(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/revenue-reports/upload", {
        method: "POST",
        body: fd,
      });
      const text = await res.text();
      let data;
      try { data = text ? JSON.parse(text) : {}; } catch { data = null; }
      if (!res.ok) {
        const msg = data?.error || (text ? text.slice(0, 200) : `HTTP ${res.status}`);
        throw new Error(msg);
      }
      const lines = [
        `Parsed ${data.job_count} job${data.job_count === 1 ? "" : "s"} for ${formatDate(data.report_date)}.`,
      ];
      if (data.linked_count > 0) {
        lines.push(`Linked ${data.linked_count} to canonical crew_jobs.`);
      }
      if (data.enriched_count > 0) {
        const samples = (data.enriched || [])
          .slice(0, 3)
          .map((e) => `${e.job_number || "—"} (${e.filledFields.join(", ")})`);
        lines.push(
          `Backfilled ${data.enriched_count} crew_job${data.enriched_count === 1 ? "" : "s"}` +
            (samples.length ? ": " + samples.join("; ") + (data.enriched_count > samples.length ? "…" : "") : "") +
            "."
        );
      }
      setStatus({ type: "success", message: lines.join(" ") });
      await loadUploads();
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) await handleFile(f);
  };

  const handleDelete = async (uploadId) => {
    if (!confirm("Delete this upload and all its parsed rows? This cannot be undone.")) return;
    setDeletingId(uploadId);
    try {
      const res = await fetch("/api/revenue-reports/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upload_id: uploadId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setStatus({ type: "success", message: "Upload removed." });
      if (previewUploadId === uploadId) {
        setPreviewUploadId(null);
        setPreviewRows([]);
      }
      await loadUploads();
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setDeletingId("");
    }
  };

  const handlePreview = async (uploadId) => {
    if (previewUploadId === uploadId) {
      setPreviewUploadId(null);
      setPreviewRows([]);
      return;
    }
    setPreviewUploadId(uploadId);
    setPreviewLoading(true);
    try {
      // Use the API route (admin client) instead of the browser anon client.
      // RLS on the new tables can silently drop rows for the anon role —
      // going through the API guarantees we see what's actually there.
      const res = await fetch(`/api/revenue-reports/jobs/list?upload_id=${encodeURIComponent(uploadId)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Preview failed");
      setPreviewRows(data.rows || []);
    } catch (err) {
      setStatus({ type: "error", message: `Preview failed: ${err.message}` });
      setPreviewUploadId(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleGenerate = (format = "csv") => {
    if (!from || !to) {
      setStatus({ type: "error", message: "Pick a from and to date." });
      return;
    }
    if (from > to) {
      setStatus({ type: "error", message: "From date must be on or before To date." });
      return;
    }
    const url = `/api/revenue-reports/generate?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&format=${format}`;
    window.location.href = url;
  };

  const handleOpenPrint = () => {
    if (!from || !to || from > to) {
      setStatus({ type: "error", message: "Pick a valid date range first." });
      return;
    }
    const url = `/api/revenue-reports/print?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Reload the rows for whichever expanded preview is open. Used after edits
  // so the table reflects the change without a manual refresh.
  const reloadPreview = useCallback(async (uploadId) => {
    if (!uploadId) return;
    try {
      const res = await fetch(`/api/revenue-reports/jobs/list?upload_id=${encodeURIComponent(uploadId)}`);
      const data = await res.json();
      if (res.ok) setPreviewRows(data.rows || []);
    } catch (_) {
      // non-fatal; the row state stays as-is until the user refreshes
    }
  }, []);

  // Manual rows — query whenever the date range changes.
  const loadManualRows = useCallback(async () => {
    if (!from || !to) return;
    setManualLoading(true);
    try {
      const res = await fetch(
        `/api/revenue-reports/jobs/list?manual=1&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Manual rows load failed");
      setManualRows(data.rows || []);
    } catch (err) {
      setStatus({ type: "error", message: `Manual rows load failed: ${err.message}` });
    } finally {
      setManualLoading(false);
    }
  }, [from, to]);

  useEffect(() => { loadManualRows(); }, [loadManualRows]);

  const openEditRow = (row) => setEditorState({ mode: "edit", row: { ...row } });
  const openCreateRowForUpload = (upload) =>
    setEditorState({
      mode: "create",
      row: {
        upload_id: upload.id,
        report_date: upload.report_date || todayStr(),
      },
    });
  const openCreateManualRow = () =>
    setEditorState({
      mode: "create",
      row: {
        upload_id: null,
        report_date: to || todayStr(),
      },
    });

  const handleSaveRow = async (draft) => {
    const res = await fetch("/api/revenue-reports/jobs/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Save failed");
    setEditorState(null);
    setStatus({
      type: "success",
      message: data.mode === "inserted" ? "Row added." : "Row updated.",
    });
    // Refresh whichever views might have changed.
    if (previewUploadId) await reloadPreview(previewUploadId);
    await loadManualRows();
    await loadUploads();
  };

  const [reparsingId, setReparsingId] = useState("");
  const handleReparse = async (upload) => {
    if (!confirm(
      `Re-run the parser on "${upload.file_name}"?\n\n` +
      `This wipes the current parsed rows for this upload and replaces them ` +
      `with a fresh extraction from the saved text. Manual edits to these ` +
      `rows will be lost.`
    )) return;
    setReparsingId(upload.id);
    try {
      const res = await fetch("/api/revenue-reports/reparse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upload_id: upload.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reparse failed");
      const lines = [`Re-parsed ${data.job_count} job${data.job_count === 1 ? "" : "s"}.`];
      if (data.linked_count > 0) lines.push(`${data.linked_count} linked.`);
      if (data.enriched_count > 0) {
        const samples = (data.enriched || [])
          .slice(0, 3)
          .map((e) => `${e.job_number || "—"} (${e.filledFields.join(", ")})`);
        lines.push(
          `Backfilled ${data.enriched_count} crew_job${data.enriched_count === 1 ? "" : "s"}` +
            (samples.length ? ": " + samples.join("; ") : "") +
            "."
        );
      }
      setStatus({ type: "success", message: lines.join(" ") });
      if (previewUploadId === upload.id) await reloadPreview(upload.id);
      await loadUploads();
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setReparsingId("");
    }
  };

  const handleDeleteRow = async (row) => {
    if (!confirm(`Delete row for ${row.job_number || row.job_name || "(no label)"}?`)) return;
    const res = await fetch("/api/revenue-reports/jobs/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: row.id }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus({ type: "error", message: data.error || "Delete failed" });
      return;
    }
    setStatus({ type: "success", message: "Row deleted." });
    if (previewUploadId) await reloadPreview(previewUploadId);
    await loadManualRows();
    await loadUploads();
  };

  const summary = useMemo(() => {
    const inRange = uploads.filter(
      (u) => u.report_date && u.report_date >= from && u.report_date <= to
    );
    // Source-of-truth for daily totals is the doc's stated "Total: $X" line
    // (day_total). Fall back to parsed_revenue_sum, then to revenue_total
    // (legacy field from the list endpoint). This way the summary matches
    // what the export will actually show.
    const uploadRevenue = inRange.reduce((acc, u) => {
      if (u.day_total != null) return acc + Number(u.day_total);
      if (u.parsed_revenue_sum != null) return acc + Number(u.parsed_revenue_sum);
      return acc + (Number(u.revenue_total) || 0);
    }, 0);
    const uploadJobs = inRange.reduce((acc, u) => acc + (Number(u.job_count) || 0), 0);
    const manualRevenue = manualRows.reduce((acc, r) => acc + (Number(r.revenue) || 0), 0);
    return {
      uploads: inRange.length,
      jobs: uploadJobs + manualRows.length,
      revenue: uploadRevenue + manualRevenue,
      manualCount: manualRows.length,
      hasParseErrors: uploads.some((u) => u.status === "error"),
    };
  }, [uploads, manualRows, from, to]);

  return (
    <>
      <Head>
        <title>Revenue Reports | Admin</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div>
        {/* Header */}
        <div className="mb-6">
          <h1 className={`${lato.className} text-2xl font-extrabold text-brand`}>Revenue Reports</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Upload daily Jobs .docx files. Each gets parsed into structured rows.
            Pick a date range to generate a Job Detail-style export.
          </p>
        </div>

        {/* Upload */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="mb-5 cursor-pointer rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-8 text-center transition-colors hover:border-brand hover:bg-brand/5"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => handleFile(e.target.files?.[0])}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-2">
            {uploading ? (
              <>
                <Loader2 className="h-8 w-8 text-brand animate-spin" />
                <p className="text-sm font-semibold text-neutral-700">
                  Uploading and parsing…
                </p>
                <p className="text-xs text-neutral-500">This usually takes 5–15 seconds.</p>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-neutral-400" />
                <p className="text-sm font-semibold text-neutral-700">
                  Drop a daily Jobs .docx here, or click to browse
                </p>
                <p className="text-xs text-neutral-500">
                  Filename like “4-20-2026 Jobs.docx” auto-detects the report date.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Generate */}
        <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-4 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className={`${lato.className} text-base font-bold text-neutral-900`}>
              Generate Report
            </h2>
            <button
              onClick={loadUploads}
              disabled={loading}
              className="inline-flex items-center gap-1 rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-neutral-500">From</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm font-semibold text-neutral-700"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-neutral-500">To</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm font-semibold text-neutral-700"
              />
            </div>
            <div className="flex flex-1 flex-wrap items-end gap-3 justify-end">
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">In range</p>
                <p className="text-sm font-semibold text-neutral-800">
                  {summary.uploads} day{summary.uploads === 1 ? "" : "s"} · {summary.jobs} job rows · {formatMoney(summary.revenue)}
                </p>
              </div>
              <button
                onClick={() => handleGenerate("csv")}
                disabled={summary.jobs === 0}
                className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Download CSV
              </button>
              <button
                onClick={handleOpenPrint}
                disabled={summary.jobs === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-light disabled:opacity-50"
                title="Opens a branded preview — use browser Print to save as PDF"
              >
                <Printer className="h-4 w-4" />
                Branded PDF
              </button>
            </div>
          </div>
          {summary.hasParseErrors ? (
            <p className="mt-3 inline-flex items-center gap-1 text-xs text-amber-700">
              <AlertTriangle className="h-3 w-3" />
              One or more uploads failed to parse. Re-upload or delete them so the export stays clean.
            </p>
          ) : null}
        </div>

        {errorMessage ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
            {errorMessage}
          </div>
        ) : null}

        {/* Uploads list */}
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-card">
          {loading && uploads.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-neutral-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading uploads…
            </div>
          ) : uploads.length === 0 ? (
            <div className="py-16 text-center text-sm text-neutral-500">
              No uploads yet. Drop a daily Jobs .docx above to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-neutral-200 bg-neutral-50 text-left">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-neutral-500">Report Date</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-neutral-500">File</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-neutral-500">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-neutral-500">Jobs</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-neutral-500">Reconciliation</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-neutral-500">Uploaded</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-neutral-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {uploads.map((u) => {
                    const isExpanded = previewUploadId === u.id;
                    const isDeleting = deletingId === u.id;
                    return (
                      <Fragment key={u.id}>
                        <tr className="hover:bg-neutral-50 transition-colors">
                          <td className="px-4 py-3 font-mono text-neutral-800">{formatDate(u.report_date)}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1.5 text-neutral-700">
                              <FileText className="h-3.5 w-3.5 text-neutral-400" />
                              {u.file_name}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {u.status === "parsed" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                                <CheckCircle2 className="h-3 w-3" /> Parsed
                              </span>
                            ) : u.status === "error" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700" title={u.parse_error || "Parse error"}>
                                <AlertTriangle className="h-3 w-3" /> Error
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-bold text-neutral-600">
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">{u.job_count}</td>
                          <td className="px-4 py-3 text-right">
                            <ReconciliationCell
                              dayTotal={u.day_total}
                              parsedSum={u.parsed_revenue_sum ?? u.revenue_total}
                            />
                          </td>
                          <td className="px-4 py-3 text-xs text-neutral-500">
                            {u.uploaded_at ? new Date(u.uploaded_at).toLocaleString() : "—"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handlePreview(u.id)}
                                disabled={u.status !== "parsed"}
                                className="rounded-md bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-200 disabled:opacity-50"
                              >
                                {isExpanded ? "Hide" : "Preview"}
                              </button>
                              <button
                                onClick={() => handleReparse(u)}
                                disabled={reparsingId === u.id || !u.parser_model}
                                className="rounded-md p-1.5 text-neutral-400 hover:bg-amber-50 hover:text-amber-700 disabled:opacity-50"
                                title="Re-parse from saved text"
                              >
                                {reparsingId === u.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                              </button>
                              <button
                                onClick={() => handleDelete(u.id)}
                                disabled={isDeleting}
                                className="rounded-md p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                title="Delete this upload"
                              >
                                {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded ? (
                          <tr>
                            <td colSpan={7} className="bg-neutral-50 px-4 py-3">
                              <ReconciliationBanner
                                dayTotal={u.day_total}
                                parsedSum={u.parsed_revenue_sum ?? u.revenue_total}
                                note={u.notes}
                              />
                              <div className="mb-2 flex items-center justify-between">
                                <p className="text-xs font-semibold text-neutral-600">
                                  {previewRows.length} parsed row{previewRows.length === 1 ? "" : "s"}. Click any row to edit, or add one missed by the parser.
                                </p>
                                <button
                                  onClick={() => openCreateRowForUpload(u)}
                                  className="inline-flex items-center gap-1 rounded-md bg-brand px-2.5 py-1 text-xs font-semibold text-white hover:bg-brand-light"
                                >
                                  <Plus className="h-3 w-3" /> Add Row
                                </button>
                              </div>
                              {previewLoading ? (
                                <div className="text-xs text-neutral-500 inline-flex items-center gap-1">
                                  <Loader2 className="h-3 w-3 animate-spin" /> Loading rows…
                                </div>
                              ) : previewRows.length === 0 ? (
                                <p className="text-xs text-neutral-500">No parsed rows. Use Add Row to enter manually, or re-upload.</p>
                              ) : (
                                <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
                                  <table className="w-full text-xs">
                                    <thead className="bg-neutral-100 text-left">
                                      <tr>
                                        <th className="px-3 py-2 font-semibold text-neutral-600">Job #</th>
                                        <th className="px-3 py-2 font-semibold text-neutral-600">Job Name</th>
                                        <th className="px-3 py-2 font-semibold text-neutral-600">Customer</th>
                                        <th className="px-3 py-2 font-semibold text-neutral-600">Location</th>
                                        <th className="px-3 py-2 text-right font-semibold text-neutral-600">Revenue</th>
                                        <th className="px-3 py-2 font-semibold text-neutral-600">Rig / Crew</th>
                                        <th className="px-3 py-2 text-right font-semibold text-neutral-600">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100">
                                      {previewRows.map((r) => (
                                        <tr key={r.id} className="hover:bg-neutral-50">
                                          <td className="px-3 py-1.5 font-mono">{r.job_number || "—"}</td>
                                          <td className="px-3 py-1.5">
                                            {r.job_name || "—"}
                                            {r.crew_job_id ? (
                                              <span
                                                className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-blue-700"
                                                title="Linked to canonical job in crew_jobs"
                                              >
                                                linked
                                              </span>
                                            ) : null}
                                            {r.edited_at ? (
                                              <span
                                                className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-700"
                                                title={`Edited ${new Date(r.edited_at).toLocaleString()}`}
                                              >
                                                edited
                                              </span>
                                            ) : null}
                                          </td>
                                          <td className="px-3 py-1.5">{r.customer_name || "—"}</td>
                                          <td className="px-3 py-1.5 text-neutral-600">{r.location || "—"}</td>
                                          <td className="px-3 py-1.5 text-right tabular-nums font-semibold">
                                            {formatMoney(r.revenue)}
                                          </td>
                                          <td className="px-3 py-1.5 text-neutral-700">
                                            {[r.rig_name, r.crew_names].filter(Boolean).join(" • ") || "—"}
                                          </td>
                                          <td className="px-3 py-1.5 text-right">
                                            <div className="inline-flex gap-1">
                                              <button
                                                onClick={() => openEditRow(r)}
                                                className="rounded-md p-1 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-800"
                                                title="Edit"
                                              >
                                                <Pencil className="h-3 w-3" />
                                              </button>
                                              <button
                                                onClick={() => handleDeleteRow(r)}
                                                className="rounded-md p-1 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                                                title="Delete"
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                              {u.parse_error ? (
                                <p className="mt-2 text-xs text-red-700">
                                  <strong>Parse error:</strong> {u.parse_error}
                                </p>
                              ) : null}
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Manual Entries — rows added via the UI without an upload */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-4 py-3">
            <div>
              <h2 className={`${lato.className} text-sm font-bold text-neutral-900`}>
                Manual Entries
              </h2>
              <p className="text-[11px] text-neutral-500">
                Rows added by hand for the current date range. Useful when a daily file was missed or had a row the parser dropped.
              </p>
            </div>
            <button
              onClick={openCreateManualRow}
              className="inline-flex items-center gap-1 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-light"
            >
              <Plus className="h-3 w-3" /> Add Manual Row
            </button>
          </div>
          {manualLoading ? (
            <div className="px-4 py-6 text-xs text-neutral-500 inline-flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Loading…
            </div>
          ) : manualRows.length === 0 ? (
            <div className="px-4 py-6 text-xs text-neutral-500">
              No manual rows in {formatDate(from)} – {formatDate(to)}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-neutral-50 text-left">
                  <tr>
                    <th className="px-3 py-2 font-semibold text-neutral-600">Date</th>
                    <th className="px-3 py-2 font-semibold text-neutral-600">Job #</th>
                    <th className="px-3 py-2 font-semibold text-neutral-600">Job Name</th>
                    <th className="px-3 py-2 font-semibold text-neutral-600">Location</th>
                    <th className="px-3 py-2 text-right font-semibold text-neutral-600">Revenue</th>
                    <th className="px-3 py-2 font-semibold text-neutral-600">Rig / Crew</th>
                    <th className="px-3 py-2 text-right font-semibold text-neutral-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {manualRows.map((r) => (
                    <tr key={r.id} className="hover:bg-neutral-50">
                      <td className="px-3 py-1.5 font-mono text-neutral-700">{formatDate(r.report_date)}</td>
                      <td className="px-3 py-1.5 font-mono">{r.job_number || "—"}</td>
                      <td className="px-3 py-1.5">{r.job_name || "—"}</td>
                      <td className="px-3 py-1.5 text-neutral-600">{r.location || "—"}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums font-semibold">
                        {formatMoney(r.revenue)}
                      </td>
                      <td className="px-3 py-1.5 text-neutral-700">
                        {[r.rig_name, r.crew_names].filter(Boolean).join(" • ") || "—"}
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        <div className="inline-flex gap-1">
                          <button
                            onClick={() => openEditRow(r)}
                            className="rounded-md p-1 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-800"
                            title="Edit"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteRow(r)}
                            className="rounded-md p-1 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {editorState ? (
          <RowEditor
            mode={editorState.mode}
            initial={editorState.row}
            crewJobs={crewJobs}
            onSave={handleSaveRow}
            onClose={() => setEditorState(null)}
          />
        ) : null}

        {/* Toast */}
        {status ? (
          <div
            className={`fixed bottom-6 right-6 z-50 flex max-w-md items-start gap-3 rounded-xl border px-4 py-3 shadow-card-hover ${
              status.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {status.type === "success"
              ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />}
            <p className="flex-1 text-sm font-medium">{status.message}</p>
            <button
              onClick={() => setStatus(null)}
              className="text-sm font-bold opacity-60 hover:opacity-100"
            >
              ×
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// ReconciliationCell — compact "Doc says X / parsed Y" indicator in the
// uploads-list table. Green when they match (within 1 cent of tolerance),
// red with a delta when they don't.
// ---------------------------------------------------------------------------
function ReconciliationCell({ dayTotal, parsedSum }) {
  const hasDoc = dayTotal !== null && dayTotal !== undefined;
  const hasParsed = parsedSum !== null && parsedSum !== undefined;
  if (!hasDoc && !hasParsed) {
    return <span className="text-neutral-400">—</span>;
  }
  if (!hasDoc) {
    return (
      <div className="text-right">
        <span className="text-xs text-neutral-500">No doc total</span>
        <div className="text-sm font-semibold tabular-nums text-neutral-700">{formatMoney(parsedSum)}</div>
      </div>
    );
  }
  const diff = Math.abs(Number(dayTotal) - Number(parsedSum || 0));
  const matches = diff < 0.01;
  if (matches) {
    return (
      <div className="text-right">
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
          <CheckCircle2 className="h-3 w-3" /> Verified
        </span>
        <div className="text-sm font-semibold tabular-nums text-neutral-800 mt-0.5">{formatMoney(dayTotal)}</div>
      </div>
    );
  }
  return (
    <div className="text-right">
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700" title="Day total in doc doesn't match sum of parsed rows">
        <AlertTriangle className="h-3 w-3" /> Off by {formatMoney(diff)}
      </span>
      <div className="text-[10px] tabular-nums text-neutral-600 mt-0.5">
        Doc {formatMoney(dayTotal)} · Parsed {formatMoney(parsedSum)}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ReconciliationBanner — full-width version inside the Preview block. Tells
// the user EXACTLY what the discrepancy is and points at the actions that
// can fix it (edit a row, add a missing row, re-parse).
// ---------------------------------------------------------------------------
function ReconciliationBanner({ dayTotal, parsedSum, note }) {
  const hasDoc = dayTotal !== null && dayTotal !== undefined;
  const hasParsed = parsedSum !== null && parsedSum !== undefined;
  if (!hasDoc) return null;
  const sum = Number(parsedSum || 0);
  const diff = Number(dayTotal) - sum;
  const matches = Math.abs(diff) < 0.01;
  if (matches) {
    return (
      <div className="mb-3 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        <span>
          <strong>Verified.</strong> Document day total {formatMoney(dayTotal)} matches the sum of parsed rows.
        </span>
      </div>
    );
  }
  const direction = diff > 0 ? "short" : "over";
  const absDiff = Math.abs(diff);
  return (
    <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
        <div>
          <p className="font-semibold">
            Day total mismatch — parsed rows sum to {formatMoney(sum)}, document says {formatMoney(dayTotal)} ({formatMoney(absDiff)} {direction}).
          </p>
          <p className="mt-1 text-amber-800">
            Edit a row’s Revenue to close the gap, or use Add Row if a job is missing. If the original parse was off, the
            <Sparkles className="inline h-3 w-3 mx-1" />
            re-parse button on the upload row re-runs the AI extraction.
          </p>
          {note ? <p className="mt-1 italic text-amber-700">Parser note: {note}</p> : null}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RowEditor — single-row create/edit dialog. Field set mirrors the columns
// the generator and print page render, so what you see here is exactly what
// will appear on the export.
// ---------------------------------------------------------------------------
function RowEditor({ mode, initial, crewJobs = [], onSave, onClose }) {
  const [draft, setDraft] = useState(() => ({
    id: initial?.id ?? null,
    upload_id: initial?.upload_id ?? null,
    crew_job_id: initial?.crew_job_id ?? null,
    report_date: initial?.report_date || todayStr(),
    job_number: initial?.job_number || "",
    job_name: initial?.job_name || "",
    customer_name: initial?.customer_name || "",
    location: initial?.location || "",
    revenue: initial?.revenue ?? "",
    rig_name: initial?.rig_name || "",
    crew_names: initial?.crew_names || "",
    notes: initial?.notes || "",
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setDraft((prev) => ({ ...prev, [k]: v }));

  // When the user picks a job from the combobox, overlay the canonical
  // fields onto the draft. We replace job_number/job_name/customer/location
  // wholesale (those should match the database, not whatever transcription
  // the user/parser had); revenue/rig/crew/notes stay untouched.
  const handleJobPick = (jobId) => {
    if (!jobId) {
      setDraft((prev) => ({ ...prev, crew_job_id: null }));
      return;
    }
    const j = crewJobs.find((x) => String(x.id) === String(jobId));
    if (!j) return;
    const canonicalLoc = [j.address, j.city].filter(Boolean).join(", ");
    setDraft((prev) => ({
      ...prev,
      crew_job_id: j.id,
      job_number: j.job_number || prev.job_number,
      job_name: j.job_name || prev.job_name,
      customer_name: j.customer_name || j.hiring_contractor || prev.customer_name,
      location: canonicalLoc || prev.location,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!draft.report_date) {
      setError("Date is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(draft);
    } catch (err) {
      setError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-2xl rounded-xl bg-white shadow-2xl my-8"
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3">
          <h2 className="text-lg font-bold text-neutral-800">
            {mode === "edit" ? "Edit Job Row" : "Add Job Row"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
          <Field label="Link to existing job (optional)" full>
            <JobCombobox
              jobs={crewJobs}
              value={draft.crew_job_id || ""}
              onChange={handleJobPick}
              placeholder="Search jobs by number, name, customer, city…"
            />
            <p className="mt-1 text-[10px] text-neutral-500">
              Picking a job auto-fills #, name, customer, and location from the database — keeps reports consistent.
              {draft.crew_job_id ? <span className="ml-2 font-semibold text-emerald-700">Linked ✓</span> : null}
            </p>
          </Field>
          <Field label="Date" required>
            <input
              type="date"
              value={draft.report_date}
              onChange={(e) => set("report_date", e.target.value)}
              required
              className="h-9 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm"
            />
          </Field>
          <Field label="Job #">
            <input
              type="text"
              value={draft.job_number}
              onChange={(e) => {
                set("job_number", e.target.value);
                // If the user manually edits the job number away from the
                // linked job's value, drop the link so reports don't show
                // "Linked" while the data has drifted.
                if (draft.crew_job_id) {
                  const linked = crewJobs.find((j) => String(j.id) === String(draft.crew_job_id));
                  if (linked && linked.job_number !== e.target.value) set("crew_job_id", null);
                }
              }}
              placeholder="26/0356"
              className="h-9 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm font-mono"
            />
          </Field>
          <Field label="Job Name">
            <input
              type="text"
              value={draft.job_name}
              onChange={(e) => set("job_name", e.target.value)}
              className="h-9 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm"
            />
          </Field>
          <Field label="Customer">
            <input
              type="text"
              value={draft.customer_name}
              onChange={(e) => set("customer_name", e.target.value)}
              className="h-9 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm"
            />
          </Field>
          <Field label="Location" full>
            <input
              type="text"
              value={draft.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="Address, City"
              className="h-9 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm"
            />
          </Field>
          <Field label="Revenue ($)">
            <input
              type="text"
              inputMode="decimal"
              value={draft.revenue}
              onChange={(e) => set("revenue", e.target.value)}
              placeholder="17175.14"
              className="h-9 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm tabular-nums"
            />
          </Field>
          <Field label="Rig">
            <input
              type="text"
              value={draft.rig_name}
              onChange={(e) => set("rig_name", e.target.value)}
              placeholder="Sany 4"
              className="h-9 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm"
            />
          </Field>
          <Field label="Crew" full>
            <input
              type="text"
              value={draft.crew_names}
              onChange={(e) => set("crew_names", e.target.value)}
              placeholder="Luis R, Edgar, Alex D"
              className="h-9 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm"
            />
          </Field>
          <Field label="Notes / Status" full>
            <textarea
              value={draft.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              placeholder="Production lines, status notes, etc."
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
            />
          </Field>
        </div>

        {error ? (
          <div className="mx-5 mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        ) : null}

        <div className="flex justify-end gap-2 border-t border-neutral-200 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-light disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {mode === "edit" ? "Save Changes" : "Add Row"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, required, full, children }) {
  return (
    <label className={full ? "sm:col-span-2 block" : "block"}>
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-neutral-500">
        {label}{required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </span>
      {children}
    </label>
  );
}

AdminRevenueReportsPage.getLayout = function getLayout(page) {
  return <TWAdminLayout>{page}</TWAdminLayout>;
};

export default withAuthTw(AdminRevenueReportsPage);
