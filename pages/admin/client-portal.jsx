"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { Lato } from "next/font/google";
import withAuthTw from "@/components/withAuthTw";
import TWAdminLayout from "@/components/TWAdminLayout";
import supabase from "@/components/Supabase";
import { useLiveData } from "@/hooks/useLiveData";
import {
  EMPTY_FORM,
  PortalDocsDrawer,
  PortalFormModal,
  PortalJobsDrawer,
  PortalRow,
  generateToken,
  getPortalUrl,
} from "@/components/admin/client-portal";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

const SORT_OPTIONS = [
  { value: "recent", label: "Recent" },
  { value: "alpha", label: "Alphabetical" },
  { value: "last_seen", label: "Last seen" },
  { value: "most_viewed", label: "Most viewed" },
];

function ClientPortalAdminPage() {
  const [portals, setPortals] = useState([]);
  const [customerNames, setCustomerNames] = useState([]);
  const [portalJobCounts, setPortalJobCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [status, setStatus] = useState(null);
  const [savingId, setSavingId] = useState("");
  const [copiedToken, setCopiedToken] = useState("");

  // Form modal state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // Drawer state
  const [docsPortal, setDocsPortal] = useState(null);
  const [jobsPortal, setJobsPortal] = useState(null);

  // List controls
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | active | paused
  const [sortBy, setSortBy] = useState("recent");

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const [portalsResult, jobsResult] = await Promise.all([
        supabase.from("client_portals").select("*").order("created_at", { ascending: false }),
        supabase.from("crew_jobs").select("id, customer_name, hiring_contractor, job_status, is_active"),
      ]);
      if (portalsResult.error) throw portalsResult.error;
      if (jobsResult.error) throw jobsResult.error;
      setPortals(portalsResult.data || []);

      const names = new Set();
      const allJobs = jobsResult.data || [];
      allJobs.forEach((j) => {
        if (j.customer_name) names.add(j.customer_name.trim());
        if (j.hiring_contractor) names.add(j.hiring_contractor.trim());
      });
      setCustomerNames(Array.from(names).filter(Boolean).sort((a, b) => a.localeCompare(b)));

      const counts = {};
      (portalsResult.data || []).forEach((portal) => {
        const mn = (portal.match_name || "").trim().toLowerCase();
        if (!mn) { counts[portal.id] = 0; return; }
        const matched = allJobs.filter(
          (j) =>
            ((j.customer_name || "").trim().toLowerCase() === mn ||
              (j.hiring_contractor || "").trim().toLowerCase() === mn) &&
            j.is_active !== false &&
            j.job_status !== "completed"
        );
        counts[portal.id] = matched.length;
      });
      setPortalJobCounts(counts);
    } catch (err) {
      setErrorMessage(err?.message || "Could not load portals.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useLiveData(loadData, { realtimeTables: ["client_portals"] });

  const summary = useMemo(() => {
    const active = portals.filter((p) => p.is_active).length;
    const neverAccessed = portals.filter((p) => p.is_active && !p.last_accessed_at).length;
    return { total: portals.length, active, paused: portals.length - active, neverAccessed };
  }, [portals]);

  const visiblePortals = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = portals;
    if (statusFilter === "active") list = list.filter((p) => p.is_active);
    else if (statusFilter === "paused") list = list.filter((p) => !p.is_active);
    if (q) {
      list = list.filter((p) =>
        [p.label, p.match_name, p.contact_name, p.contact_email]
          .filter(Boolean)
          .some((s) => s.toLowerCase().includes(q))
      );
    }
    const sorted = [...list];
    if (sortBy === "alpha") {
      sorted.sort((a, b) => (a.label || "").localeCompare(b.label || ""));
    } else if (sortBy === "last_seen") {
      sorted.sort((a, b) => {
        const ax = a.last_accessed_at ? new Date(a.last_accessed_at).getTime() : 0;
        const bx = b.last_accessed_at ? new Date(b.last_accessed_at).getTime() : 0;
        return bx - ax;
      });
    } else if (sortBy === "most_viewed") {
      sorted.sort((a, b) => (b.access_count || 0) - (a.access_count || 0));
    }
    // "recent" keeps the incoming created_at desc order from loadData
    return sorted;
  }, [portals, searchQuery, statusFilter, sortBy]);

  // ── Form handlers ─────────────────────────────────────────────────

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

  const closeForm = () => { setShowForm(false); setEditingId(null); };

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

  // ── Row action handlers ───────────────────────────────────────────

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
    const url = getPortalUrl(portal);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedToken(portal.access_token);
      setTimeout(() => setCopiedToken(""), 1800);
    } catch {
      setStatus({ type: "error", message: "Could not copy to clipboard." });
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

        {summary.total > 0 ? (
          <p className="mb-3 text-xs font-semibold text-neutral-500">
            <span className="tabular-nums text-neutral-900">{summary.total}</span> portals ·{" "}
            <span className="tabular-nums text-emerald-700">{summary.active}</span> active
            {summary.paused > 0 ? <> · <span className="tabular-nums text-neutral-600">{summary.paused}</span> paused</> : null}
            {summary.neverAccessed > 0 ? <> · <span className="tabular-nums text-rose-700">{summary.neverAccessed}</span> never accessed</> : null}
          </p>
        ) : null}

        {/* List controls */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <svg
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search label, customer, contact..."
              className="h-9 w-full rounded-lg border border-neutral-300 bg-white pl-8 pr-3 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
            />
          </div>
          <div className="inline-flex rounded-lg border border-neutral-200 bg-white p-0.5 text-xs font-semibold">
            {["all", "active", "paused"].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value)}
                className={`rounded-md px-3 py-1.5 capitalize transition-colors ${
                  statusFilter === value
                    ? "bg-brand text-white"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600">
            Sort
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-9 rounded-lg border border-neutral-300 bg-white px-2 text-xs font-semibold text-neutral-700 focus:border-brand focus:outline-none"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
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
          ) : visiblePortals.length === 0 ? (
            <div className="py-12 text-center text-sm text-neutral-500">
              No portals match the current filters.
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {visiblePortals.map((portal) => (
                <PortalRow
                  key={portal.id}
                  portal={portal}
                  busy={savingId === portal.id}
                  justCopied={copiedToken === portal.access_token}
                  jobCount={portalJobCounts[portal.id] || 0}
                  onEdit={() => openEditForm(portal)}
                  onDelete={() => deletePortal(portal)}
                  onToggle={() => toggleActive(portal)}
                  onRotate={() => rotateToken(portal)}
                  onCopy={() => copyPortalUrl(portal)}
                  onManageDocs={() => setDocsPortal(portal)}
                  onViewJobs={() => setJobsPortal(portal)}
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

        {docsPortal ? (
          <PortalDocsDrawer
            portal={docsPortal}
            onClose={() => setDocsPortal(null)}
            onStatus={setStatus}
          />
        ) : null}

        {jobsPortal ? (
          <PortalJobsDrawer
            portal={jobsPortal}
            onClose={() => setJobsPortal(null)}
            onStatus={setStatus}
            onChanged={loadData}
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

ClientPortalAdminPage.getLayout = function getLayout(page) {
  return <TWAdminLayout>{page}</TWAdminLayout>;
};

export default withAuthTw(ClientPortalAdminPage);
