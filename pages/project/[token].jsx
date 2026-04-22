"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Image from "next/image";
import { Lato } from "next/font/google";
import { useLiveData } from "@/hooks/useLiveData";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

const formatMoney = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return "—";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
};

const formatDate = (value) => {
  if (!value) return "";
  const str = String(value);
  const d = /^\d{4}-\d{2}-\d{2}$/.test(str) ? new Date(`${str}T12:00:00`) : new Date(value);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const STATUS_LABEL = {
  bid: "Bidding",
  awarded: "Awarded",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  on_hold: "On Hold",
  active: "Active",
};

const STATUS_COLOR = {
  bid: "bg-neutral-100 text-neutral-700",
  awarded: "bg-blue-100 text-blue-700",
  scheduled: "bg-sky-100 text-sky-700",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  on_hold: "bg-neutral-200 text-neutral-700",
  active: "bg-blue-100 text-blue-700",
};

export default function ClientPortalPage() {
  const router = useRouter();
  const { token } = router.query;
  const [portal, setPortal] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [globalDocs, setGlobalDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const loadPortal = useCallback(async (tokenValue) => {
    if (!tokenValue) return;
    try {
      const response = await fetch(`/api/public/portal/${tokenValue}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Portal not found");
      }
      setPortal(data.portal);
      setJobs(data.jobs || []);
      setGlobalDocs(data.documents || []);
      setErrorMessage("");
      if (!selectedJobId && (data.jobs || []).length > 0) {
        const active = data.jobs.find((j) => j.is_active) || data.jobs[0];
        setSelectedJobId(active?.id);
      }
    } catch (err) {
      setErrorMessage(err.message || "Portal error");
      setPortal(null);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [selectedJobId]);

  useEffect(() => {
    if (!token) return;
    loadPortal(token);
  }, [token, loadPortal]);

  const refresh = useCallback(() => {
    if (token) loadPortal(token);
  }, [token, loadPortal]);
  useLiveData(refresh, { pollIntervalMs: REFRESH_INTERVAL_MS });

  const selectedJob = useMemo(
    () => jobs.find((j) => j.id === selectedJobId) || jobs[0] || null,
    [jobs, selectedJobId]
  );

  if (loading) {
    return (
      <FullScreenFrame>
        <div className="flex items-center gap-3 text-neutral-500">
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading portal...
        </div>
      </FullScreenFrame>
    );
  }

  if (errorMessage) {
    return (
      <FullScreenFrame>
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50">
            <svg className="h-7 w-7 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 9v2m0 4h.01M4.93 19h14.14c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.2 16c-.77 1.33.19 3 1.73 3z" />
            </svg>
          </div>
          <h1 className={`${lato.className} text-xl font-bold text-neutral-900`}>Portal unavailable</h1>
          <p className="mt-2 text-sm text-neutral-600">{errorMessage}</p>
          <p className="mt-4 text-xs text-neutral-400">If you believe this is a mistake, please reach out to your S&amp;W contact.</p>
        </div>
      </FullScreenFrame>
    );
  }

  return (
    <>
      <Head>
        <title>{portal?.label || "Client Portal"} | S&amp;W Foundation Contractors</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className={`${lato.className} min-h-screen bg-neutral-50 text-neutral-900`}>
        {/* Header */}
        <header className="border-b border-neutral-200 bg-white shadow-sm">
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-6 py-4 lg:px-10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand shadow-sm">
                <Image src="/swlogorwb.png" alt="S&W" width={24} height={24} priority unoptimized loader={({ src }) => src} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                  Client Portal
                </p>
                <h1 className="text-lg font-extrabold leading-tight text-brand">
                  {portal?.label || "Project Overview"}
                </h1>
              </div>
            </div>
            {portal?.contact_name ? (
              <p className="text-xs font-semibold text-neutral-500">
                Welcome, {portal.contact_name}
              </p>
            ) : null}
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-6 py-8 lg:px-10">
          {jobs.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-neutral-300 bg-white py-24 text-center">
              <p className="text-2xl font-bold text-neutral-700">No active projects yet</p>
              <p className="mt-2 text-sm text-neutral-500">
                Your projects will appear here as work begins. Please contact S&amp;W for status updates.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
              {/* Job list */}
              <aside className="space-y-2">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-neutral-400">
                  Your Projects ({jobs.length})
                </p>
                {jobs.map((job) => (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => { setSelectedJobId(job.id); setActiveTab("overview"); }}
                    className={`block w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                      selectedJob?.id === job.id
                        ? "border-brand bg-white shadow-card-hover"
                        : "border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-card"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {job.job_number ? (
                          <p className="font-mono text-[11px] font-bold text-brand">
                            #{job.job_number}
                          </p>
                        ) : null}
                        <p className="mt-0.5 truncate text-sm font-bold text-neutral-900">
                          {job.job_name}
                        </p>
                        {job.city ? (
                          <p className="truncate text-[11px] text-neutral-500">{job.city}</p>
                        ) : null}
                      </div>
                      <StatusBadge status={job.job_status} />
                    </div>
                  </button>
                ))}
              </aside>

              {/* Selected job detail with tabs */}
              <section>
                {selectedJob ? (
                  <>
                    {/* Tab navigation */}
                    <nav className="mb-5 flex gap-1 rounded-xl bg-neutral-100 p-1">
                      {[
                        { id: "overview", label: "Overview" },
                        { id: "tracking", label: "Job Tracking" },
                        { id: "documents", label: "Documents", count: (selectedJob.documents?.length || 0) + globalDocs.length },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex-1 rounded-lg px-4 py-2.5 text-xs font-bold transition-all ${
                            activeTab === tab.id
                              ? "bg-white text-brand shadow-sm"
                              : "text-neutral-500 hover:text-neutral-700"
                          }`}
                        >
                          {tab.label}
                          {tab.count ? (
                            <span className="ml-1.5 rounded-full bg-brand/10 px-1.5 py-0.5 text-[10px] font-bold text-brand">
                              {tab.count}
                            </span>
                          ) : null}
                        </button>
                      ))}
                    </nav>

                    {activeTab === "overview" && <JobDetail job={selectedJob} />}
                    {activeTab === "tracking" && <JobTracking job={selectedJob} />}
                    {activeTab === "documents" && <JobDocuments job={selectedJob} globalDocs={globalDocs} />}
                  </>
                ) : null}
              </section>
            </div>
          )}
        </main>

        <footer className="border-t border-neutral-200 bg-white">
          <div className="mx-auto max-w-[1400px] px-6 py-4 text-center text-xs text-neutral-400 lg:px-10">
            &copy; {new Date().getFullYear()} S&amp;W Foundation Contractors &middot; Updates every 5 min
          </div>
        </footer>
      </div>
    </>
  );
}

function FullScreenFrame({ children }) {
  return (
    <div className={`${lato.className} flex min-h-screen items-center justify-center bg-neutral-50 px-6`}>
      {children}
    </div>
  );
}

function StatusBadge({ status }) {
  const label = STATUS_LABEL[status] || status || "Active";
  const cls = STATUS_COLOR[status] || STATUS_COLOR.active;
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cls}`}>
      {label}
    </span>
  );
}

function JobDetail({ job }) {
  const addressLine = [job.address, job.city].filter(Boolean).join(", ");
  const addressFull = [addressLine, job.zip].filter(Boolean).join(" ");
  const mapQuery = encodeURIComponent(addressFull || job.job_name || "");
  const progress = job.progress_pct !== null ? Math.round(job.progress_pct) : null;

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-card">
        <div className="bg-gradient-to-br from-brand to-brand-light px-6 py-6 text-white lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              {job.job_number ? (
                <p className="font-mono text-xs font-bold text-white/80">#{job.job_number}</p>
              ) : null}
              <h2 className="mt-1 text-2xl font-extrabold leading-tight lg:text-3xl">
                {job.job_name}
              </h2>
              {job.scope_description ? (
                <p className="mt-2 max-w-2xl text-sm font-semibold text-white/85">
                  {job.scope_description}
                </p>
              ) : null}
            </div>
            <StatusBadge status={job.job_status} />
          </div>
        </div>

        {addressFull ? (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 border-b border-neutral-100 bg-neutral-50 px-6 py-3 transition-colors hover:bg-neutral-100 lg:px-8"
          >
            <svg className="h-5 w-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <p className="text-sm font-semibold text-neutral-800">{addressFull}</p>
          </a>
        ) : null}

        <dl className="grid grid-cols-2 gap-px bg-neutral-100 sm:grid-cols-3 lg:grid-cols-6">
          <MetricCell label="Contract" value={formatMoney(job.adjusted_contract || job.contract_amount)} />
          <MetricCell
            label="Piers"
            value={job.pier_count ? job.pier_count.toLocaleString() : "—"}
          />
          <MetricCell
            label="Est. Days"
            value={job.estimated_days ? String(job.estimated_days) : "—"}
          />
          <MetricCell
            label="Days on Site"
            value={job.scheduled_days ? String(job.scheduled_days) : "—"}
          />
          <MetricCell
            label="Mob Days"
            value={job.actual_mob_days || job.mob_days || "—"}
          />
          <MetricCell
            label="Weather Days"
            value={job.weather_days || "0"}
          />
        </dl>

        {progress !== null ? (
          <div className="px-6 py-4 lg:px-8">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
              <span>Schedule Progress</span>
              <span className="tabular-nums">{progress}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100">
              <div
                className={`h-full transition-all ${
                  progress >= 90 ? "bg-emerald-500" : progress >= 50 ? "bg-blue-500" : "bg-sky-400"
                }`}
                style={{ width: `${Math.max(progress, 3)}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>

      {/* Change orders */}
      {job.change_orders && job.change_orders.length > 0 ? (
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-card lg:p-8">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-neutral-900">Change Orders</h3>
            <div className="flex items-center gap-3 text-xs font-semibold">
              {job.approved_co_total !== 0 ? (
                <span className={job.approved_co_total > 0 ? "text-emerald-700" : "text-rose-700"}>
                  Approved: {formatMoney(job.approved_co_total)}
                </span>
              ) : null}
              {job.pending_co_total > 0 ? (
                <span className="text-amber-700">Pending: {formatMoney(job.pending_co_total)}</span>
              ) : null}
            </div>
          </div>
          <div className="divide-y divide-neutral-100">
            {job.change_orders.map((co, idx) => (
              <div key={`${co.co_number || idx}-${idx}`} className="flex items-start justify-between gap-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {co.co_number ? (
                      <span className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-neutral-700">
                        {co.co_number}
                      </span>
                    ) : null}
                    <CoStatusBadge status={co.status} />
                  </div>
                  <p className="mt-1 text-sm text-neutral-700">{co.description}</p>
                </div>
                <p className={`shrink-0 font-mono text-sm font-bold tabular-nums ${co.amount < 0 ? "text-rose-700" : "text-neutral-900"}`}>
                  {co.amount >= 0 ? formatMoney(co.amount) : `(${formatMoney(Math.abs(co.amount))})`}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Recent field activity */}
      {job.recent_reports && job.recent_reports.length > 0 ? (
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-card lg:p-8">
          <h3 className="mb-4 text-lg font-bold text-neutral-900">Recent Field Activity</h3>
          <div className="space-y-3">
            {job.recent_reports.map((report, idx) => (
              <ReportRow key={`${report.report_date}-${idx}`} report={report} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ── Job Tracking section ────────────────────────────────────────────

function JobTracking({ job }) {
  const timeline = job.timeline || [];
  const hasTimeline = timeline.length > 0;

  return (
    <div className="space-y-5">
      {/* Tracking summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <TrackingCard
          label="Working Days"
          value={job.scheduled_days || 0}
          sub={job.estimated_days ? `of ${job.estimated_days} est.` : null}
          tone="blue"
        />
        <TrackingCard
          label="Mob Days"
          value={job.actual_mob_days || job.mob_days || 0}
          sub={job.mob_days ? `${job.mob_days} planned` : null}
          tone="sky"
        />
        <TrackingCard
          label="Weather Days"
          value={job.weather_days || 0}
          sub={job.weather_days > 0 ? "days with stops" : "no delays"}
          tone={job.weather_days > 0 ? "amber" : "emerald"}
        />
        <TrackingCard
          label="Piers Drilled"
          value={job.total_piers_drilled || 0}
          sub={job.pier_count ? `of ${job.pier_count} total` : null}
          tone="emerald"
        />
      </div>

      {/* Rig & crew info */}
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-card">
        <h3 className="mb-3 text-lg font-bold text-neutral-900">Assignment Details</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-neutral-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Rig</p>
            <p className="mt-1 text-lg font-bold text-neutral-900">{job.rig || "TBD"}</p>
          </div>
          <div className="rounded-xl bg-neutral-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Project Manager</p>
            <p className="mt-1 text-lg font-bold text-neutral-900">{job.pm_name || "TBD"}</p>
          </div>
          <div className="rounded-xl bg-neutral-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Total Labor Hours</p>
            <p className="mt-1 text-lg font-bold text-neutral-900">{job.total_crew_hours ? job.total_crew_hours.toLocaleString() : "—"}</p>
          </div>
        </div>
      </div>

      {/* Daily timeline */}
      {hasTimeline ? (
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-card">
          <h3 className="mb-4 text-lg font-bold text-neutral-900">Daily Progress</h3>
          <div className="space-y-2">
            {timeline.map((day, idx) => (
              <div
                key={`${day.date}-${idx}`}
                className={`flex flex-wrap items-start justify-between gap-3 rounded-2xl border p-4 ${
                  day.weather_stop
                    ? "border-amber-200 bg-amber-50/50"
                    : "border-neutral-200 bg-neutral-50"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-neutral-900">{formatDate(day.date)}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2.5 text-xs font-semibold text-neutral-600">
                    {day.crew_size ? <span>{day.crew_size} crew</span> : null}
                    {day.crew_hours ? <span>{Number(day.crew_hours).toFixed(1)}hr</span> : null}
                    {day.piers_drilled ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">
                        {day.piers_drilled} piers
                      </span>
                    ) : null}
                    {day.weather_stop ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">
                        Weather stop
                      </span>
                    ) : null}
                    {day.delays ? (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-rose-700">
                        Delay
                      </span>
                    ) : null}
                  </div>
                  {day.weather_notes ? (
                    <p className="mt-1.5 text-xs italic text-neutral-500">{day.weather_notes}</p>
                  ) : null}
                  {day.delays ? (
                    <p className="mt-1 text-xs text-rose-600">{day.delays}</p>
                  ) : null}
                </div>
                {day.photo_urls?.length > 0 ? (
                  <div className="flex gap-1.5">
                    {day.photo_urls.slice(0, 3).map((url, i) => (
                      <a key={`${url}-${i}`} href={url} target="_blank" rel="noopener noreferrer"
                        className="block h-12 w-12 overflow-hidden rounded-lg border border-neutral-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="h-full w-full object-cover" />
                      </a>
                    ))}
                    {day.photo_urls.length > 3 ? (
                      <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100 text-[10px] font-bold text-neutral-500">
                        +{day.photo_urls.length - 3}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border-2 border-dashed border-neutral-200 bg-white py-12 text-center">
          <p className="text-sm font-semibold text-neutral-500">No daily reports yet</p>
          <p className="mt-1 text-xs text-neutral-400">Progress updates will appear here as work is reported.</p>
        </div>
      )}
    </div>
  );
}

function TrackingCard({ label, value, sub, tone }) {
  const toneMap = {
    blue: "border-blue-200 bg-blue-50",
    sky: "border-sky-200 bg-sky-50",
    amber: "border-amber-200 bg-amber-50",
    emerald: "border-emerald-200 bg-emerald-50",
  };
  return (
    <div className={`rounded-2xl border p-4 text-center ${toneMap[tone] || toneMap.blue}`}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{label}</p>
      <p className="mt-1 text-2xl font-black tabular-nums text-neutral-900">{value}</p>
      {sub ? <p className="mt-0.5 text-[11px] font-semibold text-neutral-500">{sub}</p> : null}
    </div>
  );
}

// ── Documents section ──────────────────────────────────────────────

function JobDocuments({ job, globalDocs = [] }) {
  const jobDocs = job.documents || [];
  const allDocs = [...jobDocs, ...globalDocs];

  const FILE_TYPE_ICONS = {
    pdf: { bg: "bg-rose-100", text: "text-rose-600", label: "PDF" },
    docx: { bg: "bg-blue-100", text: "text-blue-600", label: "DOCX" },
    xlsx: { bg: "bg-emerald-100", text: "text-emerald-600", label: "XLSX" },
    bid_proposal: { bg: "bg-violet-100", text: "text-violet-600", label: "BID" },
    report: { bg: "bg-amber-100", text: "text-amber-600", label: "RPT" },
    other: { bg: "bg-neutral-100", text: "text-neutral-600", label: "DOC" },
  };

  if (allDocs.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-neutral-200 bg-white py-16 text-center">
        <svg className="mx-auto h-10 w-10 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
        <p className="mt-3 text-sm font-semibold text-neutral-500">No documents shared yet</p>
        <p className="mt-1 text-xs text-neutral-400">
          Your S&amp;W team will share bid proposals, reports, and other documents here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-card lg:p-8">
      <h3 className="mb-4 text-lg font-bold text-neutral-900">
        Shared Documents
        <span className="ml-2 text-sm font-normal text-neutral-400">({allDocs.length})</span>
      </h3>
      <div className="space-y-2">
        {allDocs.map((doc) => {
          const ft = FILE_TYPE_ICONS[doc.file_type] || FILE_TYPE_ICONS[doc.source] || FILE_TYPE_ICONS.other;
          return (
            <div key={doc.id} className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 transition-colors hover:bg-white">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${ft.bg}`}>
                <span className={`text-[10px] font-black ${ft.text}`}>{ft.label}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-neutral-900">{doc.title}</p>
                {doc.description ? (
                  <p className="mt-0.5 text-xs text-neutral-500">{doc.description}</p>
                ) : null}
                <p className="mt-0.5 text-[10px] text-neutral-400">
                  Shared {formatDate(doc.created_at)}
                  {doc.source === "bid_draft" ? " · From bid proposal" : ""}
                </p>
              </div>
              {doc.file_url ? (
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-brand-light hover:shadow-md"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </a>
              ) : (
                <span className="shrink-0 text-xs font-semibold text-neutral-400">No file</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MetricCell({ label, value }) {
  return (
    <div className="bg-white px-4 py-4 text-center lg:px-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-400">{label}</p>
      <p className="mt-1 text-xl font-black tabular-nums text-neutral-900 lg:text-2xl">{value}</p>
    </div>
  );
}

function CoStatusBadge({ status }) {
  const map = {
    approved: { label: "Approved", cls: "bg-emerald-100 text-emerald-700" },
    pending: { label: "Pending", cls: "bg-neutral-100 text-neutral-700" },
    submitted: { label: "Submitted", cls: "bg-blue-100 text-blue-700" },
    rejected: { label: "Rejected", cls: "bg-rose-100 text-rose-700" },
    invoiced: { label: "Invoiced", cls: "bg-violet-100 text-violet-700" },
  };
  const m = map[status] || map.pending;
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${m.cls}`}>
      {m.label}
    </span>
  );
}

function ReportRow({ report }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-neutral-900">{formatDate(report.report_date)}</p>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs font-semibold text-neutral-600">
            {report.crew_size ? <span>{report.crew_size} crew</span> : null}
            {report.crew_hours ? <span>{Number(report.crew_hours).toFixed(1)}hr workday</span> : null}
            {report.piers_drilled ? (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">
                {report.piers_drilled} piers drilled
              </span>
            ) : null}
            {report.weather_stop ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">
                Weather stop
              </span>
            ) : null}
          </div>
          {report.weather_notes ? (
            <p className="mt-2 text-xs italic text-neutral-500">{report.weather_notes}</p>
          ) : null}
        </div>
      </div>
      {Array.isArray(report.photo_urls) && report.photo_urls.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {report.photo_urls.slice(0, 5).map((url, idx) => (
            <a
              key={`${url}-${idx}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="block h-16 w-16 overflow-hidden rounded-lg border border-neutral-200 bg-white"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Field photo" className="h-full w-full object-cover" />
            </a>
          ))}
          {report.photo_urls.length > 5 ? (
            <span className="flex h-16 w-16 items-center justify-center rounded-lg border border-neutral-200 bg-white text-xs font-semibold text-neutral-500">
              +{report.photo_urls.length - 5}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// Full-screen (no site layout)
ClientPortalPage.getLayout = (page) => page;
