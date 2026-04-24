import { useCallback, useEffect, useState } from "react";
import { Lato } from "next/font/google";
import supabase from "@/components/Supabase";
import { JOB_STATUS_COLOR, JOB_STATUS_LABEL, SOURCE_BADGE } from "./constants";
import JobSearchSelect from "./JobSearchSelect";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

export default function PortalJobsDrawer({ portal, onClose, onStatus, onChanged }) {
  const [jobs, setJobs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [allJobsList, setAllJobsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkingJobId, setLinkingJobId] = useState("");
  const [savingLink, setSavingLink] = useState(false);

  const load = useCallback(async (withInactive) => {
    setLoading(true);
    try {
      const qs = withInactive ? "&include_inactive=true" : "";
      const [jobsRes, allJobsRes] = await Promise.all([
        fetch(`/api/portal-jobs?portal_id=${portal.id}${qs}`),
        supabase.from("crew_jobs").select("id, job_name, job_number, customer_name").order("job_name"),
      ]);
      const data = await jobsRes.json().catch(() => ({}));
      if (!jobsRes.ok) throw new Error(data.error || "Could not load jobs");
      setJobs(data.jobs || []);
      setSummary(data.summary || null);
      setAllJobsList(allJobsRes.data || []);
    } catch {
      setJobs([]);
      setSummary(null);
      setAllJobsList([]);
    } finally {
      setLoading(false);
    }
  }, [portal.id]);

  useEffect(() => { load(includeInactive); }, [load, includeInactive]);

  const linkJob = async () => {
    if (!linkingJobId) return;
    setSavingLink(true);
    try {
      const res = await fetch("/api/portal-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portal_id: portal.id, job_id: linkingJobId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not link job");
      onStatus?.({ type: "success", message: "Job linked to portal." });
      setShowLinkForm(false);
      setLinkingJobId("");
      await load(includeInactive);
      onChanged?.();
    } catch (err) {
      onStatus?.({ type: "error", message: err.message });
    } finally {
      setSavingLink(false);
    }
  };

  const unlinkJob = async (jobId) => {
    try {
      const res = await fetch(`/api/portal-jobs?portal_id=${portal.id}&job_id=${jobId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not unlink");
      }
      onStatus?.({ type: "success", message: "Job unlinked from portal." });
      await load(includeInactive);
      onChanged?.();
    } catch (err) {
      onStatus?.({ type: "error", message: err.message });
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-end bg-black/30">
      <div className="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <div>
            <h2 className={`${lato.className} text-lg font-bold text-neutral-900`}>Portal Jobs</h2>
            <p className="text-xs text-neutral-500">
              Jobs associated with this portal
              {summary ? (
                <span className="ml-2 font-semibold text-neutral-700">
                  ({summary.active_jobs} active of {summary.total_jobs} total)
                </span>
              ) : null}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setShowLinkForm(true); setLinkingJobId(""); }}
              className="inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-light"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Link Job
            </button>
            <label className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-[11px] font-semibold text-neutral-600 cursor-pointer hover:bg-neutral-50">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
                className="h-3 w-3 rounded border-neutral-300 text-brand focus:ring-brand/20"
              />
              Show completed
            </label>
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

        {showLinkForm ? (
          <div className="border-b border-neutral-100 bg-neutral-50 p-4 space-y-3">
            <p className="text-xs font-semibold text-neutral-700">
              Manually link a job that isn&apos;t auto-matched by customer name:
            </p>
            <JobSearchSelect
              jobs={allJobsList}
              value={linkingJobId}
              onChange={setLinkingJobId}
              placeholder="Search by #number, name, or customer..."
              excludeIds={jobs.map((j) => j.id)}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowLinkForm(false)}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!linkingJobId || savingLink}
                onClick={linkJob}
                className="rounded-lg bg-brand px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-light disabled:opacity-60"
              >
                {savingLink ? "Linking..." : "Link Job"}
              </button>
            </div>
          </div>
        ) : null}

        {summary && summary.total_jobs > 0 ? (
          <div className="grid grid-cols-4 gap-px border-b border-neutral-100 bg-neutral-100">
            <div className="bg-white px-4 py-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Active</p>
              <p className="mt-0.5 text-lg font-black tabular-nums text-brand">{summary.active_jobs}</p>
            </div>
            <div className="bg-white px-4 py-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Total Value</p>
              <p className="mt-0.5 text-lg font-black tabular-nums text-neutral-900">
                {summary.total_contract_value > 0
                  ? `$${(summary.total_contract_value / 1000).toFixed(0)}k`
                  : "—"}
              </p>
            </div>
            <div className="bg-white px-4 py-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Piers</p>
              <p className="mt-0.5 text-lg font-black tabular-nums text-neutral-900">
                {summary.total_piers || "—"}
              </p>
            </div>
            <div className="bg-white px-4 py-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Total Jobs</p>
              <p className="mt-0.5 text-lg font-black tabular-nums text-neutral-900">{summary.total_jobs}</p>
            </div>
          </div>
        ) : null}

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-neutral-400">
              <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading jobs...
            </div>
          ) : jobs.length === 0 ? (
            <div className="py-12 text-center text-sm text-neutral-400">
              <p>No matching jobs found for this portal.</p>
              <button
                type="button"
                onClick={() => { setShowLinkForm(true); setLinkingJobId(""); }}
                className="mt-3 inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-light"
              >
                Link a job manually
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {jobs.map((job) => (
                <JobPanelRow
                  key={job.id}
                  job={job}
                  onUnlink={job.source === "linked" || job.source === "both" ? () => unlinkJob(job.id) : null}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function JobPanelRow({ job, onUnlink }) {
  const statusLabel = JOB_STATUS_LABEL[job.job_status] || job.job_status || "Unknown";
  const statusCls = JOB_STATUS_COLOR[job.job_status] || JOB_STATUS_COLOR.active;
  const contractStr = job.contract_amount > 0
    ? `$${(job.contract_amount / 1000).toFixed(0)}k`
    : "—";
  const progress = job.estimated_days > 0
    ? Math.min(Math.round((job.actual_days / job.estimated_days) * 100), 100)
    : null;
  const srcBadge = SOURCE_BADGE[job.source] || SOURCE_BADGE.matched;

  return (
    <li className="px-5 py-4 hover:bg-neutral-50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {job.job_number ? (
              <span className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-brand">
                #{job.job_number}
              </span>
            ) : null}
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusCls}`}>
              {statusLabel}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${srcBadge.cls}`}>
              {srcBadge.label}
            </span>
          </div>
          <p className="mt-1 text-sm font-bold text-neutral-900 truncate">{job.job_name}</p>
          {job.scope_description ? (
            <p className="mt-0.5 text-xs text-neutral-500 line-clamp-2">{job.scope_description}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-neutral-500">
            {job.city ? (
              <span className="flex items-center gap-1">
                <svg className="h-3 w-3 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {job.city}
              </span>
            ) : null}
            {job.rig ? <span>Rig: {job.rig}</span> : null}
            {job.pm_name ? <span>PM: {job.pm_name}</span> : null}
            {job.pier_count ? <span>{job.pier_count} piers</span> : null}
            {job.start_date ? (
              <span>
                Start: {new Date(job.start_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            ) : null}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-bold tabular-nums text-neutral-900">{contractStr}</p>
          <p className="text-[10px] font-semibold text-neutral-400">contract</p>
          {job.estimated_days > 0 ? (
            <p className="mt-1 text-[10px] font-semibold text-neutral-500">
              {job.actual_days || 0}/{job.estimated_days} days
            </p>
          ) : null}
          {onUnlink ? (
            <button
              type="button"
              onClick={onUnlink}
              className="mt-2 rounded-md px-2 py-1 text-[11px] font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              Unlink
            </button>
          ) : null}
        </div>
      </div>
      {progress !== null ? (
        <div className="mt-2">
          <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
            <div
              className={`h-full transition-all ${
                progress >= 90 ? "bg-emerald-500" : progress >= 50 ? "bg-blue-500" : "bg-sky-400"
              }`}
              style={{ width: `${Math.max(progress, 3)}%` }}
            />
          </div>
        </div>
      ) : null}
    </li>
  );
}
