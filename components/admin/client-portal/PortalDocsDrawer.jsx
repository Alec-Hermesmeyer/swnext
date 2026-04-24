import { useCallback, useEffect, useState } from "react";
import { Lato } from "next/font/google";
import supabase from "@/components/Supabase";
import { EMPTY_DOC_FORM } from "./constants";
import { formatDateTime } from "./helpers";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

export default function PortalDocsDrawer({ portal, onClose, onStatus }) {
  const [docs, setDocs] = useState([]);
  const [portalJobs, setPortalJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_DOC_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [docsRes, jobsRes] = await Promise.all([
        fetch(`/api/portal-documents?portal_id=${portal.id}`),
        supabase.from("crew_jobs").select("id, job_name, job_number").ilike("customer_name", portal.match_name),
      ]);
      const docsData = await docsRes.json().catch(() => ({}));
      setDocs(docsData.documents || []);
      setPortalJobs(jobsRes.data || []);
    } catch {
      setDocs([]);
      setPortalJobs([]);
    } finally {
      setLoading(false);
    }
  }, [portal.id, portal.match_name]);

  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/portal-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, portal_id: portal.id, job_id: form.job_id || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not add document");
      setDocs((prev) => [data.document, ...prev]);
      setShowForm(false);
      setForm(EMPTY_DOC_FORM);
      onStatus?.({ type: "success", message: "Document shared with portal." });
    } catch (err) {
      onStatus?.({ type: "error", message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (docId) => {
    if (!confirm("Remove this document from the portal?")) return;
    try {
      const res = await fetch(`/api/portal-documents?id=${docId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not delete");
      setDocs((prev) => prev.filter((d) => d.id !== docId));
      onStatus?.({ type: "success", message: "Document removed." });
    } catch (err) {
      onStatus?.({ type: "error", message: err.message });
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-end bg-black/30">
      <div className="flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <div>
            <h2 className={`${lato.className} text-lg font-bold text-neutral-900`}>Portal Documents</h2>
            <p className="text-xs text-neutral-500">Shared with the client via their portal link</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setShowForm(true); setForm(EMPTY_DOC_FORM); }}
              className="inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-light"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Document
            </button>
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
        </header>

        {showForm ? (
          <form onSubmit={submit} className="border-b border-neutral-100 bg-neutral-50 p-4 space-y-3">
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Document title (e.g., Bid Proposal — Phase 1)"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
              required
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Brief description (optional)"
              rows={2}
              className="w-full resize-none rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
            />
            <input
              type="url"
              value={form.file_url}
              onChange={(e) => setForm((p) => ({ ...p, file_url: e.target.value }))}
              placeholder="File URL (https://...)"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={form.file_type}
                onChange={(e) => setForm((p) => ({ ...p, file_type: e.target.value }))}
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              >
                <option value="other">General Document</option>
                <option value="pdf">PDF</option>
                <option value="docx">Word (DOCX)</option>
                <option value="xlsx">Excel (XLSX)</option>
                <option value="bid_proposal">Bid Proposal</option>
                <option value="report">Report</option>
              </select>
              <select
                value={form.document_source}
                onChange={(e) => setForm((p) => ({ ...p, document_source: e.target.value }))}
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              >
                <option value="upload">Manual Upload</option>
                <option value="bid_draft">Bid Assistant Draft</option>
                <option value="field_report">Field Report</option>
              </select>
            </div>
            {portalJobs.length > 0 ? (
              <select
                value={form.job_id}
                onChange={(e) => setForm((p) => ({ ...p, job_id: e.target.value }))}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              >
                <option value="">All jobs (global document)</option>
                {portalJobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.job_number ? `#${j.job_number} — ` : ""}{j.job_name}
                  </option>
                ))}
              </select>
            ) : null}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-brand px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-light disabled:opacity-60"
              >
                {saving ? "Sharing..." : "Share Document"}
              </button>
            </div>
          </form>
        ) : null}

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-neutral-400">
              <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading documents...
            </div>
          ) : docs.length === 0 ? (
            <div className="py-12 text-center text-sm text-neutral-400">
              No documents shared yet. Add one above.
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {docs.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between px-5 py-3 hover:bg-neutral-50">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-neutral-900 truncate">{doc.title}</p>
                    {doc.description ? <p className="text-xs text-neutral-500 truncate">{doc.description}</p> : null}
                    <p className="mt-0.5 text-[10px] text-neutral-400">
                      {doc.document_source === "bid_draft" ? "From Bid Assistant" : doc.file_type?.toUpperCase() || "DOC"}
                      {" · "}{formatDateTime(doc.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-3">
                    {doc.file_url ? (
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                        className="rounded-md px-2 py-1 text-[11px] font-semibold text-brand hover:bg-brand-50">
                        Open
                      </a>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => remove(doc.id)}
                      className="rounded-md px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
