"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { Lato } from "next/font/google";
import withAuthTw from "@/components/withAuthTw";
import TWAdminLayout from "@/components/TWAdminLayout";
import supabase from "@/components/Supabase";
import { useAuth } from "@/context/AuthContext";
import { useLiveData } from "@/hooks/useLiveData";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", badge: "bg-neutral-100 text-neutral-700 border-neutral-200" },
  { value: "submitted", label: "Submitted", badge: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "approved", label: "Approved", badge: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { value: "rejected", label: "Rejected", badge: "bg-rose-100 text-rose-700 border-rose-200" },
  { value: "invoiced", label: "Invoiced", badge: "bg-violet-100 text-violet-700 border-violet-200" },
];
const STATUS_META = Object.fromEntries(STATUS_OPTIONS.map((s) => [s.value, s]));

const EMPTY_FORM = {
  job_id: "",
  co_number: "",
  description: "",
  amount: "",
  status: "pending",
  requested_by: "",
  notes: "",
};

const todayInput = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const formatMoney = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "$0";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
};

const toDisplayDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

function ChangeOrdersPage() {
  const { user } = useAuth() || {};
  const [cos, setCos] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [status, setStatus] = useState(null);
  const [savingId, setSavingId] = useState("");

  const [filterStatus, setFilterStatus] = useState("all");
  const [filterJobId, setFilterJobId] = useState("");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const [coResult, jobsResult] = await Promise.all([
        supabase
          .from("change_orders")
          .select("*, crew_jobs(id, job_name, job_number, customer_name, contract_amount)")
          .order("requested_at", { ascending: false }),
        supabase
          .from("crew_jobs")
          .select("id, job_name, job_number, customer_name, contract_amount, is_active")
          .order("job_number", { ascending: false }),
      ]);
      if (coResult.error) throw coResult.error;
      if (jobsResult.error) throw jobsResult.error;
      setCos(coResult.data || []);
      setJobs(jobsResult.data || []);
    } catch (err) {
      setErrorMessage(err?.message || "Could not load change orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useLiveData(loadData, { realtimeTables: ["change_orders"] });

  const filtered = useMemo(() => {
    const searchLc = search.trim().toLowerCase();
    return cos.filter((co) => {
      if (filterStatus !== "all" && co.status !== filterStatus) return false;
      if (filterJobId && co.job_id !== filterJobId) return false;
      if (!searchLc) return true;
      const job = co.crew_jobs || {};
      return (
        String(co.co_number || "").toLowerCase().includes(searchLc) ||
        String(co.description || "").toLowerCase().includes(searchLc) ||
        String(job.job_name || "").toLowerCase().includes(searchLc) ||
        String(job.job_number || "").toLowerCase().includes(searchLc) ||
        String(job.customer_name || "").toLowerCase().includes(searchLc)
      );
    });
  }, [cos, filterStatus, filterJobId, search]);

  const summary = useMemo(() => {
    const totals = { pending: 0, submitted: 0, approved: 0, rejected: 0, invoiced: 0 };
    const counts = { pending: 0, submitted: 0, approved: 0, rejected: 0, invoiced: 0 };
    cos.forEach((co) => {
      const amt = Number(co.amount) || 0;
      if (totals[co.status] !== undefined) {
        totals[co.status] += amt;
        counts[co.status] += 1;
      }
    });
    return { totals, counts };
  }, [cos]);

  const openNewForm = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      requested_by: user?.email || "",
    });
    setShowForm(true);
  };

  const openEditForm = (co) => {
    setEditingId(co.id);
    setForm({
      job_id: co.job_id || "",
      co_number: co.co_number || "",
      description: co.description || "",
      amount: co.amount ?? "",
      status: co.status || "pending",
      requested_by: co.requested_by || "",
      notes: co.notes || "",
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
    if (!form.job_id || !form.description) {
      setStatus({ type: "error", message: "Job and description are required." });
      return;
    }
    setSavingId(editingId || "new");
    setStatus(null);
    try {
      const payload = {
        job_id: form.job_id,
        co_number: form.co_number.trim() || null,
        description: form.description.trim(),
        amount: form.amount === "" ? 0 : Number(form.amount),
        status: form.status || "pending",
        requested_by: form.requested_by.trim() || null,
        notes: form.notes.trim() || null,
      };
      if (editingId) {
        // If transitioning to approved, stamp approved_by/approved_at
        const existing = cos.find((c) => c.id === editingId);
        if (payload.status === "approved" && existing?.status !== "approved") {
          payload.approved_by = user?.email || null;
          payload.approved_at = new Date().toISOString();
        }
        const { error } = await supabase.from("change_orders").update(payload).eq("id", editingId);
        if (error) throw error;
        setStatus({ type: "success", message: "Change order updated." });
      } else {
        const { error } = await supabase.from("change_orders").insert(payload);
        if (error) throw error;
        setStatus({ type: "success", message: "Change order created." });
      }
      closeForm();
      await loadData();
    } catch (err) {
      setStatus({ type: "error", message: err?.message || "Could not save." });
    } finally {
      setSavingId("");
    }
  };

  const quickStatusUpdate = async (co, nextStatus) => {
    if (co.status === nextStatus) return;
    setSavingId(co.id);
    try {
      const payload = { status: nextStatus };
      if (nextStatus === "approved") {
        payload.approved_by = user?.email || null;
        payload.approved_at = new Date().toISOString();
      }
      const { error } = await supabase.from("change_orders").update(payload).eq("id", co.id);
      if (error) throw error;
      setStatus({ type: "success", message: `Marked ${STATUS_META[nextStatus]?.label || nextStatus}.` });
      await loadData();
    } catch (err) {
      setStatus({ type: "error", message: err?.message || "Could not update status." });
    } finally {
      setSavingId("");
    }
  };

  const deleteCo = async (co) => {
    if (!confirm(`Delete change order${co.co_number ? ` ${co.co_number}` : ""}?`)) return;
    setSavingId(co.id);
    try {
      const { error } = await supabase.from("change_orders").delete().eq("id", co.id);
      if (error) throw error;
      setStatus({ type: "success", message: "Change order deleted." });
      await loadData();
    } catch (err) {
      setStatus({ type: "error", message: err?.message || "Could not delete." });
    } finally {
      setSavingId("");
    }
  };

  return (
    <>
      <Head>
        <title>Change Orders | Admin</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-light shadow-sm">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M16.862 4.487 18.549 2.799a2.122 2.122 0 1 1 3 3L19.862 7.487m-3-3L6.34 15.01a4.5 4.5 0 0 0-1.13 1.897l-.869 2.872a.75.75 0 0 0 .933.933l2.872-.869a4.5 4.5 0 0 0 1.897-1.13l10.52-10.52m-3-3 3 3" />
              </svg>
            </div>
            <div>
              <h1 className={`${lato.className} text-2xl font-extrabold text-brand leading-tight`}>Change Orders</h1>
              <p className="mt-0.5 text-sm text-neutral-600">
                Scope changes per job with approval workflow. Approved COs roll into adjusted contract totals.
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
            New Change Order
          </button>
        </div>

        {/* Summary */}
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <SummaryCard
            label="Pending"
            value={formatMoney(summary.totals.pending)}
            sub={`${summary.counts.pending} ${summary.counts.pending === 1 ? "CO" : "COs"}`}
            tone="neutral"
            onClick={() => setFilterStatus("pending")}
          />
          <SummaryCard
            label="Submitted"
            value={formatMoney(summary.totals.submitted)}
            sub={`${summary.counts.submitted} ${summary.counts.submitted === 1 ? "CO" : "COs"}`}
            tone="blue"
            onClick={() => setFilterStatus("submitted")}
          />
          <SummaryCard
            label="Approved"
            value={formatMoney(summary.totals.approved)}
            sub={`${summary.counts.approved} ${summary.counts.approved === 1 ? "CO" : "COs"}`}
            tone="emerald"
            onClick={() => setFilterStatus("approved")}
          />
          <SummaryCard
            label="Rejected"
            value={formatMoney(summary.totals.rejected)}
            sub={`${summary.counts.rejected} ${summary.counts.rejected === 1 ? "CO" : "COs"}`}
            tone="rose"
            onClick={() => setFilterStatus("rejected")}
          />
          <SummaryCard
            label="Invoiced"
            value={formatMoney(summary.totals.invoiced)}
            sub={`${summary.counts.invoiced} ${summary.counts.invoiced === 1 ? "CO" : "COs"}`}
            tone="violet"
            onClick={() => setFilterStatus("invoiced")}
          />
        </div>

        {/* Controls */}
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-card">
          <div className="relative flex-1 min-w-[200px]">
            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search CO #, description, job..."
              className="h-9 w-full rounded-lg border border-neutral-300 bg-white pl-9 pr-3 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
            />
          </div>
          <select
            value={filterJobId}
            onChange={(e) => setFilterJobId(e.target.value)}
            className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm font-semibold text-neutral-700 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
          >
            <option value="">All jobs</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.job_number ? `#${j.job_number} — ` : ""}{j.job_name}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-neutral-100 p-1">
            <button
              type="button"
              onClick={() => setFilterStatus("all")}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                filterStatus === "all" ? "bg-white text-brand shadow-sm" : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              All
            </button>
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFilterStatus(opt.value)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  filterStatus === opt.value ? "bg-white text-brand shadow-sm" : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {errorMessage ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
            {errorMessage}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-card">
          {loading && filtered.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex items-center gap-3 text-neutral-500">
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading...
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-neutral-500">
                {search || filterStatus !== "all" || filterJobId ? "No change orders match your filter." : "No change orders yet. Tap New to log the first one."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-neutral-200 bg-neutral-50 text-left">
                  <tr>
                    <Th>CO #</Th>
                    <Th>Job</Th>
                    <Th>Description</Th>
                    <Th className="text-right">Amount</Th>
                    <Th>Status</Th>
                    <Th>Requested</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filtered.map((co) => (
                    <CoRow
                      key={co.id}
                      co={co}
                      busy={savingId === co.id}
                      onEdit={() => openEditForm(co)}
                      onDelete={() => deleteCo(co)}
                      onStatus={(next) => quickStatusUpdate(co, next)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showForm ? (
          <CoFormModal
            form={form}
            editing={Boolean(editingId)}
            jobs={jobs}
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

function SummaryCard({ label, value, sub, tone = "blue", onClick }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    violet: "bg-violet-50 text-violet-700 border-violet-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
    neutral: "bg-neutral-50 text-neutral-700 border-neutral-200",
  };
  const toneClass = tones[tone] || tones.blue;
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-neutral-200 bg-white p-4 text-left shadow-card transition-shadow hover:shadow-card-hover"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">{label}</p>
          <p className={`${lato.className} mt-1.5 text-xl font-black text-neutral-900`}>{value}</p>
          <p className="mt-0.5 text-[11px] font-semibold text-neutral-500">{sub}</p>
        </div>
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg border ${toneClass}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
        </div>
      </div>
    </button>
  );
}

function Th({ children, className = "" }) {
  return (
    <th className={`px-4 py-3 text-[11px] font-bold uppercase tracking-[0.1em] text-neutral-500 ${className}`}>
      {children}
    </th>
  );
}

function CoRow({ co, busy, onEdit, onDelete, onStatus }) {
  const job = co.crew_jobs || {};
  const meta = STATUS_META[co.status] || STATUS_META.pending;
  const amt = Number(co.amount) || 0;
  return (
    <tr className="transition-colors hover:bg-neutral-50">
      <td className="px-4 py-3 font-mono text-xs font-semibold text-neutral-700">
        {co.co_number || <span className="text-neutral-300">—</span>}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          {job.job_number ? (
            <span className="rounded bg-brand-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-brand">
              #{job.job_number}
            </span>
          ) : null}
          <span className="text-sm font-semibold text-neutral-900">{job.job_name || "—"}</span>
        </div>
        {job.customer_name ? (
          <p className="text-[11px] text-neutral-500">{job.customer_name}</p>
        ) : null}
      </td>
      <td className="px-4 py-3">
        <p className="max-w-md truncate text-sm text-neutral-700" title={co.description}>
          {co.description}
        </p>
      </td>
      <td className="px-4 py-3 text-right">
        <span className={`font-mono text-sm font-bold tabular-nums ${amt < 0 ? "text-rose-700" : "text-neutral-900"}`}>
          {amt >= 0 ? formatMoney(amt) : `(${formatMoney(Math.abs(amt))})`}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold ${meta.badge}`}>
          {meta.label}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-neutral-500">
        <p>{toDisplayDate(co.requested_at)}</p>
        {co.requested_by ? <p className="truncate text-[11px] text-neutral-400">by {co.requested_by}</p> : null}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="inline-flex items-center gap-1">
          {co.status === "pending" || co.status === "submitted" ? (
            <>
              <button
                type="button"
                onClick={() => onStatus("approved")}
                disabled={busy}
                className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-60"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => onStatus("rejected")}
                disabled={busy}
                className="rounded-md bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-60"
              >
                Reject
              </button>
            </>
          ) : null}
          {co.status === "approved" ? (
            <button
              type="button"
              onClick={() => onStatus("invoiced")}
              disabled={busy}
              className="rounded-md bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-100 disabled:opacity-60"
            >
              Mark Invoiced
            </button>
          ) : null}
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
      </td>
    </tr>
  );
}

function CoFormModal({ form, editing, jobs, saving, onChange, onSubmit, onCancel }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <div>
            <h2 className={`${lato.className} text-lg font-bold text-neutral-900`}>
              {editing ? "Edit Change Order" : "New Change Order"}
            </h2>
            <p className="text-xs text-neutral-500">Capture the scope change and dollar impact while it's fresh.</p>
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
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-neutral-700">
              Job
              <select
                value={form.job_id}
                onChange={(e) => onChange("job_id", e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
                required
              >
                <option value="">Select job...</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.job_number ? `#${j.job_number} — ` : ""}{j.job_name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold text-neutral-700">
              CO Number
              <input
                type="text"
                value={form.co_number}
                onChange={(e) => onChange("co_number", e.target.value)}
                placeholder="CO-001"
                className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
              />
            </label>
          </div>

          <label className="block text-sm font-semibold text-neutral-700">
            Description
            <textarea
              value={form.description}
              onChange={(e) => onChange("description", e.target.value)}
              placeholder="Added 8 extra piers on east elevation at GC's request"
              className="mt-1 min-h-[80px] w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
              required
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-neutral-700">
              Amount ($)
              <input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => onChange("amount", e.target.value)}
                placeholder="8500.00"
                className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
              />
              <span className="mt-1 block text-[11px] font-normal text-neutral-400">
                Use negative for scope deductions.
              </span>
            </label>
            <label className="block text-sm font-semibold text-neutral-700">
              Status
              <select
                value={form.status}
                onChange={(e) => onChange("status", e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="block text-sm font-semibold text-neutral-700">
            Requested By
            <input
              type="text"
              value={form.requested_by}
              onChange={(e) => onChange("requested_by", e.target.value)}
              placeholder="Your name or email"
              className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
            />
          </label>

          <label className="block text-sm font-semibold text-neutral-700">
            Notes
            <textarea
              value={form.notes}
              onChange={(e) => onChange("notes", e.target.value)}
              placeholder="GC signed off via email 4/15. Waiting on final markup."
              className="mt-1 min-h-[60px] w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
            />
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
              editing ? "Save changes" : "Create CO"
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}

ChangeOrdersPage.getLayout = function getLayout(page) {
  return <TWAdminLayout>{page}</TWAdminLayout>;
};

export default withAuthTw(ChangeOrdersPage);
