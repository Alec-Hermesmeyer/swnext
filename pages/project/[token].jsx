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
                    onClick={() => setSelectedJobId(job.id)}
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

              {/* Selected job detail */}
              <section>
                {selectedJob ? <JobDetail job={selectedJob} /> : null}
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

        <dl className="grid grid-cols-2 gap-px bg-neutral-100 sm:grid-cols-4">
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
