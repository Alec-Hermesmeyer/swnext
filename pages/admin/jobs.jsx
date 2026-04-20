"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { Lato } from "next/font/google";
import withAuthTw from "@/components/withAuthTw";
import TWAdminLayout from "@/components/TWAdminLayout";
import supabase from "@/components/Supabase";
import { useLiveData } from "@/hooks/useLiveData";
import JobFormModal from "@/components/admin/crew-scheduler/JobFormModal";
import ImportJobsModal from "@/components/admin/ImportJobsModal";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

const STATUS_OPTIONS = [
  { value: "bid", label: "Bid", tone: "bg-neutral-100 text-neutral-700 border-neutral-200" },
  { value: "awarded", label: "Awarded", tone: "bg-sky-100 text-sky-700 border-sky-200" },
  { value: "scheduled", label: "Scheduled", tone: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  { value: "in_progress", label: "In Progress", tone: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "active", label: "Active", tone: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "completed", label: "Completed", tone: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { value: "on_hold", label: "On Hold", tone: "bg-neutral-200 text-neutral-700 border-neutral-300" },
];
const STATUS_META = Object.fromEntries(STATUS_OPTIONS.map((s) => [s.value, s]));

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "contract_desc", label: "Largest contracts" },
  { value: "job_number_desc", label: "Job # (high → low)" },
  { value: "job_name_asc", label: "Job name (A–Z)" },
  { value: "status", label: "By status" },
];

const formatMoney = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return "—";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
};

// normalizeJobInput: mirrors the scheduler's version so the admin jobs page
// can insert / update without importing from the giant scheduler file.
function normalizeJobInput(job) {
  const intOrNull = (v) => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n >= 0 ? n : null;
  };
  const numOrNull = (v) => {
    const s = String(v || "").replace(/[$,\s]/g, "");
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : null;
  };
  const dateOrNull = (v) => (v && /^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? v : null);
  return {
    job_name: (job.job_name || "").trim(),
    job_number: (job.job_number || "").trim() || null,
    dig_tess_number: (job.dig_tess_number || "").trim() || null,
    customer_name: (job.customer_name || "").trim() || null,
    hiring_contractor: (job.hiring_contractor || "").trim() || null,
    hiring_contact_name: (job.hiring_contact_name || "").trim() || null,
    hiring_contact_phone: (job.hiring_contact_phone || "").trim() || null,
    hiring_contact_email: (job.hiring_contact_email || "").trim() || null,
    address: (job.address || "").trim() || null,
    city: (job.city || "").trim() || null,
    zip: (job.zip || "").trim() || null,
    pm_name: (job.pm_name || "").trim() || null,
    pm_phone: (job.pm_phone || "").trim() || null,
    default_rig: (job.default_rig || "").trim() || null,
    crane_required: Boolean(job.crane_required),
    is_active: job.is_active !== false,
    job_status: (job.job_status || "active").trim(),
    estimated_days: intOrNull(job.estimated_days),
    mob_days: intOrNull(job.mob_days),
    actual_days: intOrNull(job.actual_days),
    actual_mob_days: intOrNull(job.actual_mob_days),
    pier_count: intOrNull(job.pier_count),
    scope_description: (job.scope_description || "").trim() || null,
    bid_amount: numOrNull(job.bid_amount),
    contract_amount: numOrNull(job.contract_amount),
    start_date: dateOrNull(job.start_date),
    end_date: dateOrNull(job.end_date),
  };
}

function AdminJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [status, setStatus] = useState(null);
  const [savingId, setSavingId] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("active"); // active | inactive | all
  const [sortBy, setSortBy] = useState("newest");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const { data, error } = await supabase.from("crew_jobs").select("*");
      if (error) throw error;
      setJobs(data || []);
    } catch (err) {
      setErrorMessage(err?.message || "Could not load jobs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useLiveData(loadData, { realtimeTables: ["crew_jobs"] });

  const customerNames = useMemo(() => {
    const set = new Set();
    jobs.forEach((j) => {
      if (j.customer_name) set.add(j.customer_name.trim());
      if (j.hiring_contractor) set.add(j.hiring_contractor.trim());
    });
    return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [jobs]);

  const summary = useMemo(() => {
    let active = 0, inactive = 0, inProgress = 0, completed = 0;
    let contractTotal = 0;
    jobs.forEach((j) => {
      if (j.is_active === false) inactive += 1;
      else active += 1;
      if (j.job_status === "in_progress") inProgress += 1;
      if (j.job_status === "completed") completed += 1;
      if (j.is_active !== false && j.contract_amount) {
        contractTotal += Number(j.contract_amount) || 0;
      }
    });
    return { active, inactive, inProgress, completed, contractTotal, total: jobs.length };
  }, [jobs]);

  const filtered = useMemo(() => {
    const searchLc = search.trim().toLowerCase();
    let rows = jobs.filter((j) => {
      if (activeFilter === "active" && j.is_active === false) return false;
      if (activeFilter === "inactive" && j.is_active !== false) return false;
      if (statusFilter !== "all" && (j.job_status || "active") !== statusFilter) return false;
      if (!searchLc) return true;
      return (
        String(j.job_name || "").toLowerCase().includes(searchLc) ||
        String(j.job_number || "").toLowerCase().includes(searchLc) ||
        String(j.customer_name || "").toLowerCase().includes(searchLc) ||
        String(j.hiring_contractor || "").toLowerCase().includes(searchLc) ||
        String(j.city || "").toLowerCase().includes(searchLc) ||
        String(j.address || "").toLowerCase().includes(searchLc)
      );
    });
    rows = rows.slice().sort((a, b) => {
      switch (sortBy) {
        case "contract_desc":
          return (Number(b.contract_amount) || 0) - (Number(a.contract_amount) || 0);
        case "job_number_desc": {
          const an = String(a.job_number || "");
          const bn = String(b.job_number || "");
          return bn.localeCompare(an, undefined, { numeric: true });
        }
        case "job_name_asc":
          return String(a.job_name || "").localeCompare(String(b.job_name || ""));
        case "status":
          return String(a.job_status || "").localeCompare(String(b.job_status || ""));
        case "newest":
        default: {
          const at = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bt = b.created_at ? new Date(b.created_at).getTime() : 0;
          return bt - at;
        }
      }
    });
    return rows;
  }, [jobs, search, statusFilter, activeFilter, sortBy]);

  const openNew = () => {
    setEditingJob(null);
    setModalOpen(true);
  };

  const openEdit = (job) => {
    setEditingJob(job);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingJob(null);
  };

  const handleSave = async (draft) => {
    const payload = normalizeJobInput(draft);
    if (!payload.job_name) throw new Error("Job name is required.");
    if (editingJob?.id) {
      const { error } = await supabase.from("crew_jobs").update(payload).eq("id", editingJob.id);
      if (error) throw error;
      setStatus({ type: "success", message: `Updated ${payload.job_name}.` });
    } else {
      const { error } = await supabase.from("crew_jobs").insert(payload);
      if (error) throw error;
      setStatus({ type: "success", message: `Created ${payload.job_name}.` });
    }
    closeModal();
    await loadData();
  };

  const toggleActive = async (job) => {
    setSavingId(job.id);
    try {
      const next = !(job.is_active !== false);
      const { error } = await supabase.from("crew_jobs").update({ is_active: next }).eq("id", job.id);
      if (error) throw error;
      setStatus({ type: "success", message: next ? "Job activated." : "Job marked inactive." });
      await loadData();
    } catch (err) {
      setStatus({ type: "error", message: err?.message || "Could not update." });
    } finally {
      setSavingId("");
    }
  };

  const quickStatus = async (job, nextStatus) => {
    if (job.job_status === nextStatus) return;
    setSavingId(job.id);
    try {
      const { error } = await supabase.from("crew_jobs").update({ job_status: nextStatus }).eq("id", job.id);
      if (error) throw error;
      setStatus({ type: "success", message: `Status → ${STATUS_META[nextStatus]?.label || nextStatus}` });
      await loadData();
    } catch (err) {
      setStatus({ type: "error", message: err?.message || "Could not update status." });
    } finally {
      setSavingId("");
    }
  };

  return (
    <>
      <Head>
        <title>Jobs | Admin</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div>
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-light shadow-sm">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </div>
            <div>
              <h1 className={`${lato.className} text-2xl font-extrabold text-brand leading-tight`}>Jobs</h1>
              <p className="mt-0.5 text-sm text-neutral-600">
                The single source of truth for every project. Feeds{" "}
                <Link href="/admin/crew-scheduler" className="font-semibold text-brand underline">Crew Scheduler</Link>,{" "}
                <Link href="/admin/job-costs" className="font-semibold text-brand underline">Job Costs</Link>,{" "}
                <Link href="/admin/client-portal" className="font-semibold text-brand underline">Client Portal</Link>.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-light hover:shadow-md"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Job
          </button>
        </div>

        {/* Summary */}
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <SummaryCard label="Active" value={summary.active} tone="blue" onClick={() => setActiveFilter("active")} />
          <SummaryCard label="In Progress" value={summary.inProgress} tone="amber" onClick={() => { setActiveFilter("active"); setStatusFilter("in_progress"); }} />
          <SummaryCard label="Completed" value={summary.completed} tone="emerald" onClick={() => setStatusFilter("completed")} />
          <SummaryCard label="Inactive" value={summary.inactive} tone="neutral" onClick={() => setActiveFilter("inactive")} />
          <SummaryCard label="Active Backlog" value={formatMoney(summary.contractTotal)} tone="violet" />
        </div>

        {/* Controls */}
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-card">
          <div className="relative flex-1 min-w-[220px]">
            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, number, customer, city..."
              className="h-9 w-full rounded-lg border border-neutral-300 bg-white pl-9 pr-3 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm font-semibold text-neutral-700 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
          >
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <div className="flex items-center gap-1 rounded-lg bg-neutral-100 p-1">
            <SegButton value="active" current={activeFilter} onChange={setActiveFilter}>Active</SegButton>
            <SegButton value="inactive" current={activeFilter} onChange={setActiveFilter}>Inactive</SegButton>
            <SegButton value="all" current={activeFilter} onChange={setActiveFilter}>All</SegButton>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm font-semibold text-neutral-700 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
          >
            {SORT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 hover:border-neutral-400 disabled:opacity-60"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {errorMessage ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
            {errorMessage}
          </div>
        ) : null}

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-card">
          {loading && jobs.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex items-center gap-3 text-neutral-500">
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading jobs...
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-neutral-500">
                {search || statusFilter !== "all" || activeFilter !== "active"
                  ? "No jobs match your filters."
                  : "No jobs yet. Tap New Job to create the first one."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-neutral-200 bg-neutral-50 text-left">
                  <tr>
                    <Th>Job</Th>
                    <Th>Customer / GC</Th>
                    <Th>Location</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Contract</Th>
                    <Th className="text-right">Est / Piers</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filtered.map((job) => (
                    <JobRow
                      key={job.id}
                      job={job}
                      busy={savingId === job.id}
                      onEdit={() => openEdit(job)}
                      onToggleActive={() => toggleActive(job)}
                      onQuickStatus={(next) => quickStatus(job, next)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <JobFormModal
          isOpen={modalOpen}
          mode={editingJob ? "edit" : "create"}
          initialJob={editingJob}
          customerNames={customerNames}
          onClose={closeModal}
          onSave={handleSave}
        />

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

function SummaryCard({ label, value, tone = "blue", onClick }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    violet: "bg-violet-50 text-violet-700 border-violet-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
    neutral: "bg-neutral-100 text-neutral-700 border-neutral-200",
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
          <p className={`${lato.className} mt-1.5 text-2xl font-black text-neutral-900`}>{value}</p>
        </div>
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg border ${toneClass}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
        </div>
      </div>
    </button>
  );
}

function SegButton({ value, current, onChange, children }) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
        active ? "bg-white text-brand shadow-sm" : "text-neutral-600 hover:text-neutral-900"
      }`}
    >
      {children}
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

function JobRow({ job, busy, onEdit, onToggleActive, onQuickStatus }) {
  const isActive = job.is_active !== false;
  const statusMeta = STATUS_META[job.job_status || "active"] || STATUS_META.active;
  const addressLine = [job.address, job.city].filter(Boolean).join(", ");

  return (
    <tr className={`transition-colors hover:bg-neutral-50 ${isActive ? "" : "opacity-60"}`}>
      <td className="px-4 py-3">
        <div className="flex items-start gap-2">
          {job.job_number ? (
            <span className="mt-0.5 shrink-0 rounded bg-brand-50 px-1.5 py-0.5 font-mono text-[11px] font-bold text-brand">
              #{job.job_number}
            </span>
          ) : null}
          <div className="min-w-0">
            <p className="font-semibold text-neutral-900">{job.job_name || "Untitled"}</p>
            {job.scope_description ? (
              <p className="mt-0.5 truncate text-[11px] text-neutral-500">{job.scope_description}</p>
            ) : null}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-neutral-800">{job.customer_name || "—"}</p>
        {job.hiring_contractor && job.hiring_contractor !== job.customer_name ? (
          <p className="text-[11px] text-neutral-500">GC: {job.hiring_contractor}</p>
        ) : null}
      </td>
      <td className="px-4 py-3 text-sm text-neutral-700">
        {addressLine || <span className="text-neutral-400">—</span>}
      </td>
      <td className="px-4 py-3">
        <select
          value={job.job_status || "active"}
          onChange={(e) => onQuickStatus(e.target.value)}
          disabled={busy}
          className={`appearance-none rounded-full border px-2.5 py-0.5 pr-6 text-[11px] font-bold cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-brand/20 ${statusMeta.tone}`}
          style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 20 20' fill='currentColor'><path d='M5 8l5 5 5-5H5z'/></svg>\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 4px center" }}
        >
          {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </td>
      <td className="px-4 py-3 text-right tabular-nums">
        <p className="font-semibold text-neutral-900">{formatMoney(job.contract_amount)}</p>
        {job.bid_amount && Number(job.bid_amount) !== Number(job.contract_amount) ? (
          <p className="text-[11px] text-neutral-400">Bid {formatMoney(job.bid_amount)}</p>
        ) : null}
      </td>
      <td className="px-4 py-3 text-right text-xs text-neutral-600">
        {job.estimated_days ? `${job.estimated_days}d` : <span className="text-neutral-300">—</span>}
        {job.pier_count ? <span className="ml-1 text-neutral-400">/ {job.pier_count}pc</span> : null}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-md px-2 py-1 text-xs font-semibold text-brand transition-colors hover:bg-brand-50"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onToggleActive}
            disabled={busy}
            className="rounded-md px-2 py-1 text-xs font-semibold text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-60"
          >
            {busy ? "..." : isActive ? "Deactivate" : "Activate"}
          </button>
        </div>
      </td>
    </tr>
  );
}

AdminJobsPage.getLayout = function getLayout(page) {
  return <TWAdminLayout>{page}</TWAdminLayout>;
};

export default withAuthTw(AdminJobsPage);
