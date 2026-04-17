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

const EMPTY_FORM = {
  job_id: "",
  report_date: "",
  crew_size: "",
  crew_hours: "",
  piers_drilled: "",
  weather_stop: false,
  weather_notes: "",
  delays: "",
  notes: "",
  photo_urls_text: "",
};

const todayInput = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const toDisplayDate = (value) => {
  if (!value) return "";
  const str = String(value);
  const d = /^\d{4}-\d{2}-\d{2}$/.test(str) ? new Date(`${str}T12:00:00`) : new Date(value);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
};

const toTimeLabel = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

function FieldReportsPage() {
  const { user } = useAuth() || {};
  const [reports, setReports] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [status, setStatus] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM, report_date: todayInput() });
  const [filterFrom, setFilterFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 13);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  });
  const [filterTo, setFilterTo] = useState(todayInput());
  const [filterJobId, setFilterJobId] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const [reportsResult, jobsResult] = await Promise.all([
        supabase
          .from("crew_daily_reports")
          .select("*, crew_jobs(id, job_name, job_number, customer_name, address, city)")
          .gte("report_date", filterFrom)
          .lte("report_date", filterTo)
          .order("report_date", { ascending: false })
          .order("submitted_at", { ascending: false }),
        supabase.from("crew_jobs").select("id, job_name, job_number, customer_name, is_active").order("job_number", { ascending: false }),
      ]);
      if (reportsResult.error) throw reportsResult.error;
      if (jobsResult.error) throw jobsResult.error;
      setReports(reportsResult.data || []);
      setJobs(jobsResult.data || []);
    } catch (err) {
      setErrorMessage(err?.message || "Could not load field reports.");
    } finally {
      setLoading(false);
    }
  }, [filterFrom, filterTo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredReports = useMemo(() => {
    if (!filterJobId) return reports;
    return reports.filter((r) => r.job_id === filterJobId);
  }, [reports, filterJobId]);

  const summary = useMemo(() => {
    let totalHours = 0;
    let totalPiers = 0;
    let weatherStops = 0;
    filteredReports.forEach((r) => {
      totalHours += (Number(r.crew_hours) || 0) * (Number(r.crew_size) || 0);
      totalPiers += Number(r.piers_drilled) || 0;
      if (r.weather_stop) weatherStops += 1;
    });
    return {
      count: filteredReports.length,
      totalHours,
      totalPiers,
      weatherStops,
    };
  }, [filteredReports]);

  const openNewForm = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, report_date: todayInput() });
    setShowForm(true);
  };

  const openEditForm = (report) => {
    setEditingId(report.id);
    setForm({
      job_id: report.job_id || "",
      report_date: report.report_date || todayInput(),
      crew_size: report.crew_size ?? "",
      crew_hours: report.crew_hours ?? "",
      piers_drilled: report.piers_drilled ?? "",
      weather_stop: Boolean(report.weather_stop),
      weather_notes: report.weather_notes || "",
      delays: report.delays || "",
      notes: report.notes || "",
      photo_urls_text: Array.isArray(report.photo_urls) ? report.photo_urls.join("\n") : "",
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
    if (!form.job_id || !form.report_date) {
      setStatus({ type: "error", message: "Pick a job and a date." });
      return;
    }
    setSavingId(editingId || "new");
    setStatus(null);
    try {
      const photoUrls = form.photo_urls_text
        .split(/\r?\n/)
        .map((u) => u.trim())
        .filter(Boolean);

      const payload = {
        job_id: form.job_id,
        report_date: form.report_date,
        crew_size: form.crew_size === "" ? null : Number(form.crew_size),
        crew_hours: form.crew_hours === "" ? null : Number(form.crew_hours),
        piers_drilled: form.piers_drilled === "" ? null : Number(form.piers_drilled),
        weather_stop: Boolean(form.weather_stop),
        weather_notes: form.weather_notes || null,
        delays: form.delays || null,
        notes: form.notes || null,
        photo_urls: photoUrls,
        submitted_by: user?.email || null,
      };

      // Link to schedule if one exists for that date (best-effort)
      const { data: scheduleRow } = await supabase
        .from("crew_schedules")
        .select("id")
        .eq("schedule_date", form.report_date)
        .maybeSingle();
      if (scheduleRow?.id) payload.schedule_id = scheduleRow.id;

      if (editingId) {
        const { error } = await supabase
          .from("crew_daily_reports")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
        setStatus({ type: "success", message: "Report updated." });
      } else {
        const { error } = await supabase
          .from("crew_daily_reports")
          .insert(payload);
        if (error) {
          if (String(error.code) === "23505") {
            throw new Error("A report for this job + date already exists. Edit that one instead.");
          }
          throw error;
        }
        setStatus({ type: "success", message: "Report submitted." });
      }

      closeForm();
      await loadData();
    } catch (err) {
      setStatus({ type: "error", message: err?.message || "Could not save report." });
    } finally {
      setSavingId("");
    }
  };

  const deleteReport = async (report) => {
    if (!confirm(`Delete report for ${report.crew_jobs?.job_name || "this job"} on ${toDisplayDate(report.report_date)}?`)) return;
    setSavingId(report.id);
    try {
      const { error } = await supabase.from("crew_daily_reports").delete().eq("id", report.id);
      if (error) throw error;
      setStatus({ type: "success", message: "Report deleted." });
      await loadData();
    } catch (err) {
      setStatus({ type: "error", message: err?.message || "Could not delete report." });
    } finally {
      setSavingId("");
    }
  };

  const activeJobs = useMemo(() => jobs.filter((j) => j.is_active !== false), [jobs]);

  return (
    <>
      <Head>
        <title>Field Reports | Admin</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div>
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-light shadow-sm">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
              </svg>
            </div>
            <div>
              <h1 className={`${lato.className} text-2xl font-extrabold text-brand leading-tight`}>Field Reports</h1>
              <p className="mt-0.5 text-sm text-neutral-600">
                End-of-day reports from each job. Hours, piers drilled, weather stops, delays.
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
            New Report
          </button>
        </div>

        {/* Summary */}
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Reports" value={summary.count} tone="blue" />
          <SummaryCard label="Total Labor-Hours" value={summary.totalHours.toLocaleString("en-US", { maximumFractionDigits: 0 })} tone="violet" />
          <SummaryCard label="Piers Drilled" value={summary.totalPiers.toLocaleString("en-US")} tone="emerald" />
          <SummaryCard label="Weather Stops" value={summary.weatherStops} tone={summary.weatherStops > 0 ? "amber" : "emerald"} />
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-card">
          <label className="flex flex-col text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-500">
            From
            <input
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className="mt-1 h-9 rounded-lg border border-neutral-300 px-3 text-sm font-semibold text-neutral-700 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
            />
          </label>
          <label className="flex flex-col text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-500">
            To
            <input
              type="date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              className="mt-1 h-9 rounded-lg border border-neutral-300 px-3 text-sm font-semibold text-neutral-700 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
            />
          </label>
          <label className="flex flex-1 min-w-[200px] flex-col text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-500">
            Job
            <select
              value={filterJobId}
              onChange={(e) => setFilterJobId(e.target.value)}
              className="mt-1 h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm font-semibold text-neutral-700 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
            >
              <option value="">All jobs</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.job_number ? `#${j.job_number} — ` : ""}{j.job_name}
                </option>
              ))}
            </select>
          </label>
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

        {/* Reports list */}
        {loading && filteredReports.length === 0 ? (
          <div className="flex items-center justify-center rounded-2xl border border-neutral-200 bg-white py-16 shadow-card">
            <div className="flex items-center gap-3 text-neutral-500">
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading field reports...
            </div>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-neutral-300 bg-white py-16 text-center">
            <p className={`${lato.className} text-lg font-bold text-neutral-700`}>No field reports yet</p>
            <p className="mt-1 text-sm text-neutral-500">
              {activeJobs.length === 0
                ? "Add a job in the Crew Scheduler first."
                : "Tap New Report to log the day's progress."}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filteredReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                deleting={savingId === report.id}
                onEdit={() => openEditForm(report)}
                onDelete={() => deleteReport(report)}
              />
            ))}
          </div>
        )}

        {/* New/Edit form modal */}
        {showForm ? (
          <ReportFormModal
            form={form}
            editing={Boolean(editingId)}
            jobs={activeJobs}
            allJobs={jobs}
            saving={Boolean(savingId)}
            onChange={updateField}
            onSubmit={submitForm}
            onCancel={closeForm}
          />
        ) : null}

        {/* Status toast */}
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

function SummaryCard({ label, value, tone = "blue" }) {
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
    </div>
  );
}

function ReportCard({ report, deleting, onEdit, onDelete }) {
  const job = report.crew_jobs || {};
  const totalHours = (Number(report.crew_hours) || 0) * (Number(report.crew_size) || 0);
  return (
    <article className="flex flex-col rounded-2xl border border-neutral-200 bg-white shadow-card transition-shadow hover:shadow-card-hover">
      <header className="flex items-start justify-between gap-2 border-b border-neutral-100 px-4 py-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            {job.job_number ? (
              <span className="rounded bg-brand-50 px-1.5 py-0.5 font-mono text-[11px] font-bold text-brand">
                #{job.job_number}
              </span>
            ) : null}
            <p className="truncate text-sm font-bold text-neutral-900">{job.job_name || "Untitled"}</p>
          </div>
          <p className="mt-0.5 text-[11px] text-neutral-500">
            {toDisplayDate(report.report_date)}
            {report.submitted_at ? ` · filed ${toTimeLabel(report.submitted_at)}` : ""}
          </p>
          {job.city ? <p className="text-[11px] text-neutral-400">{job.city}</p> : null}
        </div>
        <div className="flex items-center gap-1">
          {report.weather_stop ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
              Weather
            </span>
          ) : null}
        </div>
      </header>

      <dl className="grid grid-cols-3 gap-px bg-neutral-100">
        <MetricCell label="Crew" value={report.crew_size ?? "—"} />
        <MetricCell label="Hours" value={report.crew_hours != null ? Number(report.crew_hours).toFixed(1) : "—"} />
        <MetricCell label="Piers" value={report.piers_drilled ?? "—"} />
      </dl>

      <div className="flex-1 px-4 py-3 text-sm text-neutral-700 space-y-2">
        {totalHours > 0 ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-400">
            Labor-hours: <span className="font-bold text-neutral-700">{totalHours.toFixed(1)}</span>
          </p>
        ) : null}
        {report.weather_notes ? (
          <Detail label="Weather" value={report.weather_notes} />
        ) : null}
        {report.delays ? (
          <Detail label="Delays" value={report.delays} accent="rose" />
        ) : null}
        {report.notes ? (
          <Detail label="Notes" value={report.notes} />
        ) : null}
        {Array.isArray(report.photo_urls) && report.photo_urls.length > 0 ? (
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-400">
              Photos ({report.photo_urls.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {report.photo_urls.slice(0, 4).map((url, idx) => (
                <a
                  key={`${url}-${idx}`}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block h-14 w-14 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="Field photo" className="h-full w-full object-cover" />
                </a>
              ))}
              {report.photo_urls.length > 4 ? (
                <span className="flex h-14 w-14 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-xs font-semibold text-neutral-500">
                  +{report.photo_urls.length - 4}
                </span>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <footer className="flex items-center justify-between gap-2 border-t border-neutral-100 px-4 py-2">
        <p className="truncate text-[11px] text-neutral-400">
          {report.submitted_by ? `by ${report.submitted_by}` : "—"}
        </p>
        <div className="flex items-center gap-1">
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
            disabled={deleting}
            className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
          >
            {deleting ? "..." : "Delete"}
          </button>
        </div>
      </footer>
    </article>
  );
}

function MetricCell({ label, value }) {
  return (
    <div className="bg-white px-3 py-2 text-center">
      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-neutral-400">{label}</p>
      <p className="text-lg font-black tabular-nums text-neutral-900">{value}</p>
    </div>
  );
}

function Detail({ label, value, accent = "neutral" }) {
  const accentClass = accent === "rose" ? "text-rose-700" : "text-neutral-700";
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-400">{label}</p>
      <p className={`text-sm ${accentClass} whitespace-pre-wrap`}>{value}</p>
    </div>
  );
}

function ReportFormModal({ form, editing, jobs, allJobs, saving, onChange, onSubmit, onCancel }) {
  const jobOptions = jobs.length > 0 ? jobs : allJobs;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col">
        <header className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <div>
            <h2 className={`${lato.className} text-lg font-bold text-neutral-900`}>
              {editing ? "Edit Field Report" : "New Field Report"}
            </h2>
            <p className="text-xs text-neutral-500">
              End-of-day log. One report per job per date.
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

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
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
                {jobOptions.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.job_number ? `#${j.job_number} — ` : ""}{j.job_name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold text-neutral-700">
              Date
              <input
                type="date"
                value={form.report_date}
                onChange={(e) => onChange("report_date", e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
                required
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-sm font-semibold text-neutral-700">
              Crew Size
              <input
                type="number"
                min="0"
                value={form.crew_size}
                onChange={(e) => onChange("crew_size", e.target.value)}
                placeholder="6"
                className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
              />
            </label>
            <label className="block text-sm font-semibold text-neutral-700">
              Crew Hours
              <input
                type="number"
                min="0"
                step="0.25"
                value={form.crew_hours}
                onChange={(e) => onChange("crew_hours", e.target.value)}
                placeholder="10"
                className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
              />
            </label>
            <label className="block text-sm font-semibold text-neutral-700">
              Piers Drilled
              <input
                type="number"
                min="0"
                value={form.piers_drilled}
                onChange={(e) => onChange("piers_drilled", e.target.value)}
                placeholder="12"
                className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
              />
            </label>
          </div>

          <label className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-semibold text-neutral-700">
            <input
              type="checkbox"
              checked={form.weather_stop}
              onChange={(e) => onChange("weather_stop", e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-brand focus:ring-brand/20"
            />
            Weather stop (partial or full)
          </label>

          {form.weather_stop ? (
            <label className="block text-sm font-semibold text-neutral-700">
              Weather Notes
              <textarea
                value={form.weather_notes}
                onChange={(e) => onChange("weather_notes", e.target.value)}
                placeholder="Rain from 10am; sent crew home at noon"
                className="mt-1 min-h-[60px] w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
              />
            </label>
          ) : null}

          <label className="block text-sm font-semibold text-neutral-700">
            Delays / Issues
            <textarea
              value={form.delays}
              onChange={(e) => onChange("delays", e.target.value)}
              placeholder="GC moved access point; 2hr delay waiting on survey"
              className="mt-1 min-h-[60px] w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
            />
          </label>

          <label className="block text-sm font-semibold text-neutral-700">
            Notes
            <textarea
              value={form.notes}
              onChange={(e) => onChange("notes", e.target.value)}
              placeholder="Ground wetter than expected on east side; flagged for tomorrow"
              className="mt-1 min-h-[80px] w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
            />
          </label>

          <label className="block text-sm font-semibold text-neutral-700">
            Photo URLs
            <textarea
              value={form.photo_urls_text}
              onChange={(e) => onChange("photo_urls_text", e.target.value)}
              placeholder={"One URL per line\nhttps://...\nhttps://..."}
              className="mt-1 min-h-[60px] w-full rounded-lg border border-neutral-300 px-3 py-2 font-mono text-xs transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
            />
            <span className="mt-1 block text-[11px] font-normal text-neutral-400">
              Paste public photo URLs (one per line). Direct phone upload coming in v2.
            </span>
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
              editing ? "Save changes" : "Submit report"
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}

FieldReportsPage.getLayout = function getLayout(page) {
  return <TWAdminLayout>{page}</TWAdminLayout>;
};

export default withAuthTw(FieldReportsPage);
