"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { Lato } from "next/font/google";
import withAuthTw from "@/components/withAuthTw";
import TWAdminLayout from "@/components/TWAdminLayout";
import supabase from "@/components/Supabase";
import { useLiveData } from "@/hooks/useLiveData";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

const EMPTY_FORM = {
  label: "",
  match_name: "",
  contact_name: "",
  contact_email: "",
  notes: "",
  is_active: true,
};

const EMPTY_DOC_FORM = {
  title: "",
  description: "",
  file_url: "",
  file_type: "other",
  document_source: "upload",
  job_id: "",
};

const generateToken = () => {
  // 32-char URL-safe random token
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(36).padStart(2, "0"))
      .join("")
      .slice(0, 32);
  }
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
};

const formatDateTime = (value) => {
  if (!value) return "Never";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

function ClientPortalAdminPage() {
  const [portals, setPortals] = useState([]);
  const [customerNames, setCustomerNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [status, setStatus] = useState(null);
  const [savingId, setSavingId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [copiedToken, setCopiedToken] = useState("");
  const [docsPortalId, setDocsPortalId] = useState(null);
  const [portalDocs, setPortalDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [showDocForm, setShowDocForm] = useState(false);
  const [docForm, setDocForm] = useState(EMPTY_DOC_FORM);
  const [savingDoc, setSavingDoc] = useState(false);
  const [portalJobs, setPortalJobs] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const [portalsResult, jobsResult] = await Promise.all([
        supabase.from("client_portals").select("*").order("created_at", { ascending: false }),
        supabase.from("crew_jobs").select("customer_name, hiring_contractor"),
      ]);
      if (portalsResult.error) throw portalsResult.error;
      if (jobsResult.error) throw jobsResult.error;
      setPortals(portalsResult.data || []);

      const names = new Set();
      (jobsResult.data || []).forEach((j) => {
        if (j.customer_name) names.add(j.customer_name.trim());
        if (j.hiring_contractor) names.add(j.hiring_contractor.trim());
      });
      setCustomerNames(Array.from(names).filter(Boolean).sort((a, b) => a.localeCompare(b)));
    } catch (err) {
      setErrorMessage(err?.message || "Could not load portals.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useLiveData(loadData, { realtimeTables: ["client_portals"] });

  const openNewForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEditForm = (portal) => {
    setEditingId(portal.id);
    setForm({
      label: portal.label || "",
      match_name: portal.match_name || "",
      contact_name: portal.contact_name || "",
      contact_email: portal.contact_email || "",
      notes: portal.notes || "",
      is_active: Boolean(portal.is_active),
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submitForm = async (event) => {
    event.preventDefault();
    if (!form.label.trim() || !form.match_name.trim()) {
      setStatus({ type: "error", message: "Label and matching customer name are required." });
      return;
    }
    setSavingId(editingId || "new");
    setStatus(null);
    try {
      const payload = {
        label: form.label.trim(),
        match_name: form.match_name.trim(),
        contact_name: form.contact_name.trim() || null,
        contact_email: form.contact_email.trim() || null,
        notes: form.notes.trim() || null,
        is_active: Boolean(form.is_active),
      };
      if (editingId) {
        const { error } = await supabase.from("client_portals").update(payload).eq("id", editingId);
        if (error) throw error;
        setStatus({ type: "success", message: "Portal updated." });
      } else {
        payload.access_token = generateToken();
        const { error } = await supabase.from("client_portals").insert(payload);
        if (error) throw error;
        setStatus({ type: "success", message: "Portal created. Share the URL with your client." });
      }
      closeForm();
      await loadData();
    } catch (err) {
      setStatus({ type: "error", message: err?.message || "Could not save." });
    } finally {
      setSavingId("");
    }
  };

  const rotateToken = async (portal) => {
    if (!confirm(`Rotate token for ${portal.label}? The old URL will stop working immediately.`)) return;
    setSavingId(portal.id);
    try {
      const { error } = await supabase
        .from("client_portals")
        .update({ access_token: generateToken(), access_count: 0, last_accessed_at: null })
        .eq("id", portal.id);
      if (error) throw error;
      setStatus({ type: "success", message: "Token rotated. Send the new URL." });
      await loadData();
    } catch (err) {
      setStatus({ type: "error", message: err?.message || "Could not rotate token." });
    } finally {
      setSavingId("");
    }
  };

  const deletePortal = async (portal) => {
    if (!confirm(`Delete portal for ${portal.label}? This cannot be undone.`)) return;
    setSavingId(portal.id);
    try {
      const { error } = await supabase.from("client_portals").delete().eq("id", portal.id);
      if (error) throw error;
      setStatus({ type: "success", message: "Portal deleted." });
      await loadData();
    } catch (err) {
      setStatus({ type: "error", message: err?.message || "Could not delete." });
    } finally {
      setSavingId("");
    }
  };

  const toggleActive = async (portal) => {
    setSavingId(portal.id);
    try {
      const { error } = await supabase
        .from("client_portals")
        .update({ is_active: !portal.is_active })
        .eq("id", portal.id);
      if (error) throw error;
      setStatus({ type: "success", message: portal.is_active ? "Portal paused." : "Portal activated." });
      await loadData();
    } catch (err) {
      setStatus({ type: "error", message: err?.message || "Could not toggle." });
    } finally {
      setSavingId("");
    }
  };

  const copyPortalUrl = async (portal) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/project/${portal.access_token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedToken(portal.access_token);
      setTimeout(() => setCopiedToken(""), 1800);
    } catch {
      setStatus({ type: "error", message: "Could not copy to clipboard." });
    }
  };

  // ── Document management handlers ────────────────────────────────

  const openDocPanel = useCallback(async (portal) => {
    setDocsPortalId(portal.id);
    setLoadingDocs(true);
    try {
      const [docsRes, jobsRes] = await Promise.all([
        fetch(`/api/portal-documents?portal_id=${portal.id}`),
        supabase.from("crew_jobs").select("id, job_name, job_number").ilike("customer_name", portal.match_name),
      ]);
      const docsData = await docsRes.json().catch(() => ({}));
      setPortalDocs(docsData.documents || []);
      setPortalJobs(jobsRes.data || []);
    } catch {
      setPortalDocs([]);
      setPortalJobs([]);
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  const closeDocPanel = () => {
    setDocsPortalId(null);
    setPortalDocs([]);
    setShowDocForm(false);
  };

  const submitDocument = async (e) => {
    e.preventDefault();
    if (!docForm.title.trim() || !docsPortalId) return;
    setSavingDoc(true);
    try {
      const res = await fetch("/api/portal-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...docForm, portal_id: docsPortalId, job_id: docForm.job_id || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not add document");
      setPortalDocs((prev) => [data.document, ...prev]);
      setShowDocForm(false);
      setDocForm(EMPTY_DOC_FORM);
      setStatus({ type: "success", message: "Document shared with portal." });
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setSavingDoc(false);
    }
  };

  const deleteDocument = async (docId) => {
    if (!confirm("Remove this document from the portal?")) return;
    try {
      const res = await fetch(`/api/portal-documents?id=${docId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not delete");
      setPortalDocs((prev) => prev.filter((d) => d.id !== docId));
      setStatus({ type: "success", message: "Document removed." });
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    }
  };

  return (
    <>
      <Head>
        <title>Client Portals | Admin</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-light shadow-sm">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
              </svg>
            </div>
            <div>
              <h1 className={`${lato.className} text-2xl font-extrabold text-brand leading-tight`}>Client Portals</h1>
              <p className="mt-0.5 text-sm text-neutral-600">
                Share read-only project views with GCs and owners — no signup required.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openNewForm}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-light hover:shadow-md"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Portal
          </button>
        </div>

        {errorMessage ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
            {errorMessage}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-card">
          {loading && portals.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex items-center gap-3 text-neutral-500">
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading...
              </div>
            </div>
          ) : portals.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-neutral-500">No portals yet. Tap New Portal to create one.</p>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {portals.map((portal) => (
                <PortalRow
                  key={portal.id}
                  portal={portal}
                  busy={savingId === portal.id}
                  justCopied={copiedToken === portal.access_token}
                  onEdit={() => openEditForm(portal)}
                  onDelete={() => deletePortal(portal)}
                  onToggle={() => toggleActive(portal)}
                  onRotate={() => rotateToken(portal)}
                  onCopy={() => copyPortalUrl(portal)}
                  onManageDocs={() => openDocPanel(portal)}
                />
              ))}
            </ul>
          )}
        </div>

        {showForm ? (
          <PortalFormModal
            form={form}
            editing={Boolean(editingId)}
            customerNames={customerNames}
            saving={Boolean(savingId)}
            onChange={updateField}
            onSubmit={submitForm}
            onCancel={closeForm}
          />
        ) : null}

        {status ? (
          <div
            className={`fixed bottom-6 right-6 z-50 flex max-w-md items-start gap-3 rounded-xl border px-4 py-3 shadow-card-hover ${
              status.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            <svg
              className={`mt-0.5 h-4 w-4 shrink-0 ${status.type === "success" ? "text-emerald-600" : "text-red-600"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {status.type === "success" ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M4.93 19h14.14c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.2 16c-.77 1.33.19 3 1.73 3z" />
              )}
            </svg>
            <p className="flex-1 text-sm font-medium">{status.message}</p>
            <button
              type="button"
              onClick={() => setStatus(null)}
              className="shrink-0 rounded-md p-0.5 text-current/60 transition-colors hover:bg-black/5 hover:text-current"
              aria-label="Dismiss"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}

function PortalRow({ portal, busy, justCopied, onEdit, onDelete, onToggle, onRotate, onCopy, onManageDocs }) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${origin}/project/${portal.access_token}`;

  return (
    <li className="flex flex-wrap items-center gap-4 px-4 py-4 transition-colors hover:bg-neutral-50">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-bold text-neutral-900">{portal.label}</p>
          {portal.is_active ? (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
              Active
            </span>
          ) : (
            <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-neutral-600">
              Paused
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[11px] text-neutral-500">
          Matches jobs for <span className="font-mono font-semibold text-neutral-700">{portal.match_name}</span>
          {portal.contact_name ? <> · Contact: {portal.contact_name}</> : null}
        </p>
        <div className="mt-2 flex items-center gap-1.5">
          <code className="max-w-[420px] truncate rounded bg-neutral-100 px-2 py-1 font-mono text-[11px] text-neutral-600">
            {url}
          </code>
          <button
            type="button"
            onClick={onCopy}
            className="rounded-md px-2 py-1 text-[11px] font-semibold text-brand transition-colors hover:bg-brand-50"
          >
            {justCopied ? "Copied" : "Copy"}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md px-2 py-1 text-[11px] font-semibold text-neutral-600 transition-colors hover:bg-neutral-100"
          >
            Preview
          </a>
        </div>
      </div>

      <div className="flex items-center gap-4 text-[11px] text-neutral-500">
        <div className="text-center">
          <p className="font-bold text-neutral-400">Views</p>
          <p className="font-mono text-neutral-700">{portal.access_count || 0}</p>
        </div>
        <div className="text-center">
          <p className="font-bold text-neutral-400">Last Seen</p>
          <p className="text-neutral-700">{formatDateTime(portal.last_accessed_at)}</p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onToggle}
          disabled={busy}
          className="rounded-md px-2 py-1 text-xs font-semibold text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-60"
        >
          {portal.is_active ? "Pause" : "Activate"}
        </button>
        <button
          type="button"
          onClick={onRotate}
          disabled={busy}
          className="rounded-md px-2 py-1 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-50 disabled:opacity-60"
        >
          Rotate token
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-md px-2 py-1 text-xs font-semibold text-neutral-600 transition-colors hover:bg-neutral-100"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={busy}
          className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
        >
          {busy ? "..." : "Delete"}
        </button>
      </div>
    </li>
  );
}

function PortalFormModal({ form, editing, customerNames, saving, onChange, onSubmit, onCancel }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <div>
            <h2 className={`${lato.className} text-lg font-bold text-neutral-900`}>
              {editing ? "Edit Portal" : "New Client Portal"}
            </h2>
            <p className="text-xs text-neutral-500">
              One portal per customer. Auto-matches any job where{" "}
              <code className="rounded bg-neutral-100 px-1 font-mono">customer_name</code> or{" "}
              <code className="rounded bg-neutral-100 px-1 font-mono">hiring_contractor</code> matches.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <form onSubmit={onSubmit} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          <label className="block text-sm font-semibold text-neutral-700">
            Portal Label
            <input
              type="text"
              value={form.label}
              onChange={(e) => onChange("label", e.target.value)}
              placeholder="Acme GC Portal"
              className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
              required
            />
            <span className="mt-1 block text-[11px] font-normal text-neutral-400">
              Shown at the top of the client's view.
            </span>
          </label>

          <label className="block text-sm font-semibold text-neutral-700">
            Matching Customer Name
            <input
              type="text"
              value={form.match_name}
              onChange={(e) => onChange("match_name", e.target.value)}
              placeholder="Acme General Contractors"
              list="customer-suggestions"
              className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
              required
            />
            <datalist id="customer-suggestions">
              {customerNames.map((name) => <option key={name} value={name} />)}
            </datalist>
            <span className="mt-1 block text-[11px] font-normal text-neutral-400">
              Case-insensitive exact match on customer_name or hiring_contractor.
            </span>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-neutral-700">
              Contact Name
              <input
                type="text"
                value={form.contact_name}
                onChange={(e) => onChange("contact_name", e.target.value)}
                placeholder="John Smith"
                className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
              />
            </label>
            <label className="block text-sm font-semibold text-neutral-700">
              Contact Email
              <input
                type="email"
                value={form.contact_email}
                onChange={(e) => onChange("contact_email", e.target.value)}
                placeholder="john@acme.com"
                className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
              />
            </label>
          </div>

          <label className="block text-sm font-semibold text-neutral-700">
            Notes
            <textarea
              value={form.notes}
              onChange={(e) => onChange("notes", e.target.value)}
              placeholder="Internal notes — e.g., sent initial link 4/12"
              className="mt-1 min-h-[60px] w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
            />
          </label>

          <label className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-semibold text-neutral-700">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => onChange("is_active", e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-brand focus:ring-brand/20"
            />
            Active (client can access the URL)
          </label>
        </form>

        <footer className="flex items-center justify-end gap-2 border-t border-neutral-100 px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            onClick={onSubmit}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-light hover:shadow-md disabled:opacity-60"
          >
            {saving ? (
              <>
                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </>
            ) : (
              editing ? "Save changes" : "Create portal"
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}

ClientPortalAdminPage.getLayout = function getLayout(page) {
  return <TWAdminLayout>{page}</TWAdminLayout>;
};

export default withAuthTw(ClientPortalAdminPage);
