"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { Lato } from "next/font/google";
import withAuthTw from "@/components/withAuthTw";
import TWAdminLayout from "@/components/TWAdminLayout";
import supabase from "@/components/Supabase";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

const HOURS_PER_CREW_DAY = 10; // standard field-day length

const formatMoney = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "$0";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
};

const formatNumber = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString("en-US");
};

const formatPercent = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${n > 0 ? "+" : ""}${n.toFixed(0)}%`;
};

const SORT_OPTIONS = [
  { value: "variance_desc", label: "Most over budget" },
  { value: "variance_asc", label: "Most under budget" },
  { value: "contract_desc", label: "Largest contracts" },
  { value: "scheduled_desc", label: "Most scheduled days" },
  { value: "name_asc", label: "Job name (A–Z)" },
];

function JobCostsPage() {
  const [jobs, setJobs] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [schedulesById, setSchedulesById] = useState({});
  const [coTotalsByJob, setCoTotalsByJob] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [sortBy, setSortBy] = useState("variance_desc");
  const [search, setSearch] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const [jobsResult, assignmentsResult, schedulesResult, coResult] = await Promise.all([
        supabase.from("crew_jobs").select("*").order("job_number", { ascending: false }),
        supabase.from("crew_assignments").select("id, job_id, schedule_id, worker_id"),
        supabase.from("crew_schedules").select("id, schedule_date"),
        supabase.from("change_orders").select("job_id, amount, status"),
      ]);

      if (jobsResult.error) throw jobsResult.error;
      if (assignmentsResult.error) throw assignmentsResult.error;
      if (schedulesResult.error) throw schedulesResult.error;
      // change_orders may not exist yet pre-migration — treat as empty silently
      const coRows = coResult.error ? [] : (coResult.data || []);

      setJobs(jobsResult.data || []);
      setAssignments(assignmentsResult.data || []);
      const scheduleMap = {};
      (schedulesResult.data || []).forEach((row) => {
        scheduleMap[row.id] = row.schedule_date;
      });
      setSchedulesById(scheduleMap);

      const coTotals = {};
      coRows.forEach((row) => {
        if (!row.job_id) return;
        if (!coTotals[row.job_id]) coTotals[row.job_id] = { approved: 0, pending: 0, invoiced: 0 };
        const amt = Number(row.amount) || 0;
        if (row.status === "approved") coTotals[row.job_id].approved += amt;
        else if (row.status === "invoiced") coTotals[row.job_id].invoiced += amt;
        else if (row.status === "pending" || row.status === "submitted") coTotals[row.job_id].pending += amt;
      });
      setCoTotalsByJob(coTotals);

      setLastRefreshed(new Date());
    } catch (err) {
      setErrorMessage(err?.message || "Could not load job cost data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Aggregate scheduled-day stats per job
  const rows = useMemo(() => {
    const visibleJobs = includeInactive ? jobs : jobs.filter((j) => j.is_active !== false);
    const byJob = new Map();
    assignments.forEach((a) => {
      if (!a.job_id) return;
      const dateStr = schedulesById[a.schedule_id];
      if (!dateStr) return;
      if (!byJob.has(a.job_id)) byJob.set(a.job_id, { dates: new Set(), crewDays: 0 });
      const entry = byJob.get(a.job_id);
      entry.dates.add(dateStr);
      entry.crewDays += 1;
    });

    const searchLc = search.trim().toLowerCase();

    return visibleJobs
      .map((job) => {
        const agg = byJob.get(job.id) || { dates: new Set(), crewDays: 0 };
        const scheduledDays = agg.dates.size;
        const crewDays = agg.crewDays;
        const estimatedDays = Number(job.estimated_days) || 0;
        const contractAmount = Number(job.contract_amount) || 0;
        const bidAmount = Number(job.bid_amount) || 0;
        const coTotals = coTotalsByJob[job.id] || { approved: 0, pending: 0, invoiced: 0 };
        const coAdjustment = coTotals.approved + coTotals.invoiced;
        const adjustedContract = contractAmount + coAdjustment;
        const avgCrew = scheduledDays > 0 ? crewDays / scheduledDays : 0;
        const estimatedCrewHours = estimatedDays > 0 && avgCrew > 0
          ? estimatedDays * avgCrew * HOURS_PER_CREW_DAY
          : estimatedDays * HOURS_PER_CREW_DAY;
        const scheduledCrewHours = crewDays * HOURS_PER_CREW_DAY;
        const dayVariance = scheduledDays - estimatedDays;
        const variancePct = estimatedDays > 0 ? (dayVariance / estimatedDays) * 100 : null;

        return {
          id: job.id,
          job_number: job.job_number || "",
          job_name: job.job_name || "Untitled",
          customer_name: job.customer_name || "",
          hiring_contractor: job.hiring_contractor || "",
          city: job.city || "",
          is_active: job.is_active !== false,
          contract_amount: contractAmount,
          bid_amount: bidAmount,
          estimated_days: estimatedDays,
          scheduled_days: scheduledDays,
          crew_days: crewDays,
          avg_crew: avgCrew,
          scheduled_crew_hours: scheduledCrewHours,
          estimated_crew_hours: estimatedCrewHours,
          day_variance: dayVariance,
          variance_pct: variancePct,
          hasData: scheduledDays > 0 || estimatedDays > 0 || contractAmount > 0,
        };
      })
      .filter((row) => {
        if (!searchLc) return true;
        return (
          String(row.job_number).toLowerCase().includes(searchLc) ||
          row.job_name.toLowerCase().includes(searchLc) ||
          row.customer_name.toLowerCase().includes(searchLc) ||
          row.hiring_contractor.toLowerCase().includes(searchLc) ||
          row.city.toLowerCase().includes(searchLc)
        );
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "variance_asc":
            return (a.day_variance ?? 0) - (b.day_variance ?? 0);
          case "contract_desc":
            return b.contract_amount - a.contract_amount;
          case "scheduled_desc":
            return b.scheduled_days - a.scheduled_days;
          case "name_asc":
            return a.job_name.localeCompare(b.job_name);
          case "variance_desc":
          default:
            return (b.day_variance ?? 0) - (a.day_variance ?? 0);
        }
      });
  }, [jobs, assignments, schedulesById, includeInactive, search, sortBy]);

  // Topline stats
  const summary = useMemo(() => {
    const activeRows = rows.filter((r) => r.is_active);
    const totalContract = activeRows.reduce((sum, r) => sum + r.contract_amount, 0);
    const totalEstDays = activeRows.reduce((sum, r) => sum + r.estimated_days, 0);
    const totalScheduledDays = activeRows.reduce((sum, r) => sum + r.scheduled_days, 0);
    const jobsOverBudget = activeRows.filter((r) => r.estimated_days > 0 && r.day_variance > 0).length;
    const jobsOnTrack = activeRows.filter((r) => r.estimated_days > 0 && r.day_variance <= 0).length;
    return {
      activeJobs: activeRows.length,
      totalContract,
      totalEstDays,
      totalScheduledDays,
      jobsOverBudget,
      jobsOnTrack,
    };
  }, [rows]);

  return (
    <>
      <Head>
        <title>Job Costs | Admin</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div>
        {/* Page header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-light shadow-sm">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
              </svg>
            </div>
            <div>
              <h1 className={`${lato.className} text-2xl font-extrabold text-brand leading-tight`}>Job Costs</h1>
              <p className="mt-0.5 text-sm text-neutral-600">
                Quoted vs. scheduled days and contract backlog across active jobs.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="shrink-0 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 hover:border-neutral-400 disabled:opacity-60"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Summary stats */}
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="Active Jobs"
            value={summary.activeJobs}
            tone="blue"
            hint={lastRefreshed ? `Updated ${lastRefreshed.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}` : null}
          />
          <SummaryCard
            label="Active Backlog"
            value={formatMoney(summary.totalContract)}
            tone="emerald"
            hint="Sum of contract amounts"
          />
          <SummaryCard
            label="Est. vs Scheduled"
            value={`${formatNumber(summary.totalScheduledDays)} / ${formatNumber(summary.totalEstDays)}`}
            tone="violet"
            hint="Crew-days scheduled / estimated"
          />
          <SummaryCard
            label="Over / On-Track"
            value={`${summary.jobsOverBudget} / ${summary.jobsOnTrack}`}
            tone={summary.jobsOverBudget > 0 ? "amber" : "emerald"}
            hint="Jobs past est. days / within"
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
              placeholder="Search jobs, customer, city..."
              className="h-9 w-full rounded-lg border border-neutral-300 bg-white pl-9 pr-3 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm font-semibold text-neutral-700 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-xs font-semibold text-neutral-600">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-brand focus:ring-brand/20"
            />
            Include inactive jobs
          </label>
        </div>

        {/* Error state */}
        {errorMessage ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
            {errorMessage}
          </div>
        ) : null}

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-card">
          {loading && rows.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex items-center gap-3 text-neutral-500">
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading jobs...
              </div>
            </div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-neutral-500">
                {search ? "No jobs match your search." : "No jobs to show."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-neutral-200 bg-neutral-50 text-left">
                  <tr>
                    <Th>Job</Th>
                    <Th>Customer</Th>
                    <Th className="text-right">Contract</Th>
                    <Th className="text-right">Est. Days</Th>
                    <Th className="text-right">Scheduled</Th>
                    <Th className="text-right">Crew-Days</Th>
                    <Th className="text-right">Variance</Th>
                    <Th>Progress</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {rows.map((row) => (
                    <JobRow key={row.id} row={row} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="mt-3 text-xs text-neutral-400">
          Variance compares scheduled crew-days to estimated days. Add <code className="rounded bg-neutral-100 px-1 font-mono">actual_hours</code> on assignments to track real-time burn (next iteration).
        </p>
      </div>
    </>
  );
}

function SummaryCard({ label, value, hint, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    violet: "bg-violet-50 text-violet-700 border-violet-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
  };
  const toneClass = tones[tone] || tones.blue;
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">{label}</p>
          <p className={`${lato.className} mt-1.5 text-2xl font-black text-neutral-900`}>{value}</p>
        </div>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${toneClass}`}>
          <span className="h-2 w-2 rounded-full bg-current" />
        </div>
      </div>
      {hint ? <p className="mt-2 text-[11px] font-medium text-neutral-400">{hint}</p> : null}
    </div>
  );
}

function Th({ children, className = "" }) {
  return (
    <th className={`px-4 py-3 text-[11px] font-bold uppercase tracking-[0.1em] text-neutral-500 ${className}`}>
      {children}
    </th>
  );
}

function JobRow({ row }) {
  const hasEstimate = row.estimated_days > 0;
  const overBudget = hasEstimate && row.day_variance > 0;
  const onTrack = hasEstimate && row.day_variance <= 0;
  const progress = hasEstimate
    ? Math.min((row.scheduled_days / row.estimated_days) * 100, 100)
    : 0;
  const progressColor = !hasEstimate
    ? "bg-neutral-300"
    : row.variance_pct >= 10
      ? "bg-rose-500"
      : row.variance_pct >= 0
        ? "bg-amber-500"
        : row.variance_pct >= -25
          ? "bg-emerald-500"
          : "bg-blue-500";

  return (
    <tr className="transition-colors hover:bg-neutral-50">
      {/* Job */}
      <td className="px-4 py-3">
        <div className="flex items-start gap-2">
          {row.job_number ? (
            <span className="mt-0.5 rounded bg-brand-50 px-1.5 py-0.5 font-mono text-[11px] font-bold text-brand">
              #{row.job_number}
            </span>
          ) : null}
          <div className="min-w-0">
            <p className="truncate font-semibold text-neutral-900">{row.job_name}</p>
            {row.city ? (
              <p className="truncate text-[11px] text-neutral-500">{row.city}</p>
            ) : null}
          </div>
          {!row.is_active ? (
            <span className="ml-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
              Inactive
            </span>
          ) : null}
        </div>
      </td>

      {/* Customer */}
      <td className="px-4 py-3">
        <p className="text-sm text-neutral-700">{row.customer_name || row.hiring_contractor || "—"}</p>
        {row.hiring_contractor && row.customer_name && row.hiring_contractor !== row.customer_name ? (
          <p className="text-[11px] text-neutral-400">GC: {row.hiring_contractor}</p>
        ) : null}
      </td>

      {/* Contract */}
      <td className="px-4 py-3 text-right tabular-nums">
        <p className="font-semibold text-neutral-900">{formatMoney(row.contract_amount)}</p>
        {row.bid_amount > 0 && row.bid_amount !== row.contract_amount ? (
          <p className="text-[11px] text-neutral-400">Bid {formatMoney(row.bid_amount)}</p>
        ) : null}
      </td>

      {/* Est. Days */}
      <td className="px-4 py-3 text-right tabular-nums font-semibold text-neutral-700">
        {hasEstimate ? row.estimated_days : <span className="text-neutral-300">—</span>}
      </td>

      {/* Scheduled */}
      <td className="px-4 py-3 text-right tabular-nums font-semibold text-neutral-700">
        {row.scheduled_days || <span className="text-neutral-300">0</span>}
      </td>

      {/* Crew-Days */}
      <td className="px-4 py-3 text-right tabular-nums">
        <p className="font-semibold text-neutral-700">{row.crew_days || <span className="text-neutral-300">0</span>}</p>
        {row.avg_crew > 0 ? (
          <p className="text-[11px] text-neutral-400">{row.avg_crew.toFixed(1)} avg crew</p>
        ) : null}
      </td>

      {/* Variance */}
      <td className="px-4 py-3 text-right">
        {hasEstimate ? (
          <div className="inline-flex flex-col items-end">
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                overBudget
                  ? "bg-rose-50 text-rose-700"
                  : onTrack
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-neutral-100 text-neutral-600"
              }`}
            >
              {row.day_variance > 0 ? "+" : ""}{row.day_variance}d
            </span>
            {row.variance_pct !== null ? (
              <span className="mt-0.5 text-[10px] font-semibold text-neutral-400">
                {formatPercent(row.variance_pct)}
              </span>
            ) : null}
          </div>
        ) : (
          <span className="text-[11px] text-neutral-300">No est.</span>
        )}
      </td>

      {/* Progress bar */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100">
            <div
              className={`h-full transition-all ${progressColor}`}
              style={{ width: `${Math.max(progress, 3)}%` }}
            />
          </div>
          <span className="w-10 text-right text-[11px] font-semibold tabular-nums text-neutral-500">
            {hasEstimate ? `${Math.round(progress)}%` : "—"}
          </span>
        </div>
      </td>
    </tr>
  );
}

JobCostsPage.getLayout = function getLayout(page) {
  return <TWAdminLayout>{page}</TWAdminLayout>;
};

export default withAuthTw(JobCostsPage);
