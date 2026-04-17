"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import { Lato } from "next/font/google";
import withAuthTw from "@/components/withAuthTw";
import supabase from "@/components/Supabase";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

const REFRESH_INTERVAL_MS = 60 * 1000;
const CLOCK_TICK_MS = 1000;

const toLocalDate = (value) => {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  const str = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return new Date(`${str}T12:00:00`);
  return new Date(value);
};

const formatDateLong = (date) =>
  toLocalDate(date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

const formatDateInputValue = (date) => {
  const d = toLocalDate(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const formatClock = (date) =>
  date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

const formatWorkerLabel = (worker) => {
  if (!worker?.name) return "";
  return worker.role ? `${worker.name} (${worker.role})` : worker.name;
};

function DailyBoardPage() {
  const [selectedDate, setSelectedDate] = useState(() => formatDateInputValue(new Date()));
  const [schedule, setSchedule] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [rigDetails, setRigDetails] = useState({});
  const [reportsByJob, setReportsByJob] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [clock, setClock] = useState(() => new Date());
  const requestRef = useRef(0);

  // Tick the clock every second
  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), CLOCK_TICK_MS);
    return () => clearInterval(id);
  }, []);

  // Auto-roll the selected date forward when midnight passes
  useEffect(() => {
    const today = formatDateInputValue(clock);
    if (today !== selectedDate && selectedDate === formatDateInputValue(new Date(clock.getTime() - 24 * 60 * 60 * 1000))) {
      setSelectedDate(today);
    }
  }, [clock, selectedDate]);

  const loadBoard = useCallback(async (date) => {
    const requestId = ++requestRef.current;
    setErrorMessage("");

    try {
      const { data: scheduleRow, error: scheduleError } = await supabase
        .from("crew_schedules")
        .select("*")
        .eq("schedule_date", date)
        .maybeSingle();

      if (scheduleError) throw scheduleError;

      if (!scheduleRow) {
        if (requestId !== requestRef.current) return;
        setSchedule(null);
        setAssignments([]);
        setRigDetails({});
        setReportsByJob({});
        setLastRefreshed(new Date());
        setLoading(false);
        return;
      }

      const [assignmentResult, rigResult, reportResult] = await Promise.all([
        supabase
          .from("crew_assignments")
          .select("*, crew_workers(*), crew_categories(*), crew_jobs(*)")
          .eq("schedule_id", scheduleRow.id)
          .order("sort_order"),
        supabase
          .from("schedule_rig_details")
          .select("*, crew_superintendents(*), crew_trucks(*)")
          .eq("schedule_id", scheduleRow.id),
        supabase
          .from("crew_daily_reports")
          .select("id, job_id, crew_hours, crew_size, piers_drilled, weather_stop, submitted_at")
          .eq("report_date", date),
      ]);

      if (assignmentResult.error) throw assignmentResult.error;
      if (rigResult.error) throw rigResult.error;
      // crew_daily_reports may not exist yet if migration hasn't been run — treat as empty
      const reports = reportResult.error ? [] : (reportResult.data || []);

      if (requestId !== requestRef.current) return;

      const detailsMap = {};
      (rigResult.data || []).forEach((rd) => {
        detailsMap[rd.category_id] = {
          superintendent_name: rd.crew_superintendents?.name || "",
          superintendent_phone: rd.crew_superintendents?.phone || "",
          truck_number: rd.crew_trucks?.truck_number || "",
          crane_info: rd.crane_info || "",
          notes: rd.notes || "",
        };
      });

      const reportMap = {};
      reports.forEach((r) => {
        if (r.job_id) reportMap[r.job_id] = r;
      });

      setSchedule(scheduleRow);
      setAssignments(assignmentResult.data || []);
      setRigDetails(detailsMap);
      setReportsByJob(reportMap);
      setLastRefreshed(new Date());
    } catch (err) {
      if (requestId !== requestRef.current) return;
      setErrorMessage(err?.message || "Could not load daily board.");
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, []);

  // Initial + date-change load
  useEffect(() => {
    setLoading(true);
    loadBoard(selectedDate);
  }, [selectedDate, loadBoard]);

  // Background auto-refresh
  useEffect(() => {
    const id = setInterval(() => loadBoard(selectedDate), REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [selectedDate, loadBoard]);

  // Group assignments by job, preserving order, with crew + rig info
  const jobGroups = useMemo(() => {
    const groups = new Map();
    assignments.forEach((a) => {
      if (!a.job_id || !a.crew_jobs) return;
      const jobId = a.job_id;
      if (!groups.has(jobId)) {
        const cat = a.crew_categories || {};
        const detail = rigDetails[a.category_id] || {};
        groups.set(jobId, {
          job_id: jobId,
          job_name: a.crew_jobs.job_name || "",
          job_number: a.crew_jobs.job_number || "",
          address: a.crew_jobs.address || "",
          city: a.crew_jobs.city || "",
          zip: a.crew_jobs.zip || "",
          customer_name: a.crew_jobs.customer_name || "",
          crane_required: Boolean(a.crew_jobs.crane_required),
          pm_name: a.crew_jobs.pm_name || "",
          rig_name: cat.name || "",
          superintendent_name: detail.superintendent_name || "",
          truck_number: detail.truck_number || "",
          crane_info: detail.crane_info || "",
          workers: [],
        });
      }
      const workerLabel = formatWorkerLabel(a.crew_workers);
      if (workerLabel) groups.get(jobId).workers.push(workerLabel);
    });

    // Attach field-report summary per job
    groups.forEach((group, jobId) => {
      group.report = reportsByJob[jobId] || null;
    });

    return Array.from(groups.values()).sort((a, b) => {
      const an = String(a.job_number || "");
      const bn = String(b.job_number || "");
      return an.localeCompare(bn, undefined, { numeric: true });
    });
  }, [assignments, rigDetails, reportsByJob]);

  const totalCrew = useMemo(
    () => jobGroups.reduce((sum, g) => sum + g.workers.length, 0),
    [jobGroups]
  );

  const goToRelativeDay = (offsetDays) => {
    const next = toLocalDate(selectedDate);
    next.setDate(next.getDate() + offsetDays);
    setSelectedDate(formatDateInputValue(next));
  };

  return (
    <>
      <Head>
        <title>Daily Crew Board</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className={`${lato.className} min-h-screen bg-neutral-100 text-neutral-900`}>
        {/* ── Header ── */}
        <header className="sticky top-0 z-20 border-b border-neutral-200 bg-gradient-to-r from-brand to-brand-light text-white shadow-sm">
          <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-4 px-6 py-4 lg:px-10">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
                <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
                  Daily Crew Board
                </p>
                <h1 className="text-3xl font-extrabold leading-tight lg:text-4xl">
                  {formatDateLong(selectedDate)}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                  Now
                </p>
                <p className="font-mono text-2xl font-bold tabular-nums leading-tight lg:text-3xl">
                  {formatClock(clock)}
                </p>
              </div>

              <div className="flex items-center gap-1 rounded-xl bg-white/10 p-1 backdrop-blur-sm ring-1 ring-white/15">
                <button
                  type="button"
                  onClick={() => goToRelativeDay(-1)}
                  className="rounded-lg px-2.5 py-1.5 text-sm font-semibold text-white/90 transition-colors hover:bg-white/15"
                  title="Previous day"
                  aria-label="Previous day"
                >
                  ‹
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="rounded-lg bg-transparent px-2 py-1.5 text-sm font-semibold text-white outline-none [color-scheme:dark]"
                />
                <button
                  type="button"
                  onClick={() => goToRelativeDay(1)}
                  className="rounded-lg px-2.5 py-1.5 text-sm font-semibold text-white/90 transition-colors hover:bg-white/15"
                  title="Next day"
                  aria-label="Next day"
                >
                  ›
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDate(formatDateInputValue(new Date()))}
                  className="ml-1 rounded-lg bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-brand transition-colors hover:bg-white/90"
                >
                  Today
                </button>
              </div>
            </div>
          </div>

          {/* Summary strip */}
          <div className="border-t border-white/10 bg-black/10 px-6 py-2 lg:px-10">
            <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-3 text-sm">
              <div className="flex flex-wrap items-center gap-5 font-semibold text-white/85">
                <span>
                  <span className="text-xl font-extrabold text-white">{jobGroups.length}</span>{" "}
                  {jobGroups.length === 1 ? "job" : "jobs"}
                </span>
                <span className="h-3 w-px bg-white/25" />
                <span>
                  <span className="text-xl font-extrabold text-white">{totalCrew}</span>{" "}
                  {totalCrew === 1 ? "crew member" : "crew members"}
                </span>
              </div>
              <p className="text-xs font-medium text-white/70">
                {loading
                  ? "Refreshing..."
                  : lastRefreshed
                    ? `Updated ${formatClock(lastRefreshed)} · auto-refresh 60s`
                    : "Auto-refresh every 60s"}
              </p>
            </div>
          </div>
        </header>

        {/* ── Body ── */}
        <main className="mx-auto max-w-[1800px] px-6 py-8 lg:px-10">
          {errorMessage ? (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-800">
              {errorMessage}
            </div>
          ) : null}

          {loading && jobGroups.length === 0 ? (
            <div className="flex items-center justify-center py-24">
              <div className="flex items-center gap-3 text-neutral-500">
                <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-lg font-semibold">Loading daily board...</span>
              </div>
            </div>
          ) : jobGroups.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-neutral-300 bg-white py-24 text-center">
              <p className={`${lato.className} text-3xl font-extrabold text-neutral-700`}>
                No crews scheduled for this day
              </p>
              <p className="mt-2 text-base text-neutral-500">
                Assign crews in the Crew Scheduler and they'll appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
              {jobGroups.map((group) => (
                <JobCard key={group.job_id} group={group} />
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}

function JobCard({ group }) {
  const addressLine = [group.address, group.city].filter(Boolean).join(", ");
  const addressFull = [addressLine, group.zip].filter(Boolean).join(" ");
  const mapQuery = encodeURIComponent(addressFull || group.job_name || "");

  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-card transition-shadow hover:shadow-card-hover">
      {/* Job header */}
      <header className="border-b border-neutral-200 bg-gradient-to-br from-brand to-brand-light px-6 py-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {group.job_number ? (
                <span className="rounded-md bg-white/20 px-2 py-0.5 font-mono text-sm font-bold text-white ring-1 ring-white/25">
                  #{group.job_number}
                </span>
              ) : null}
              {group.rig_name ? (
                <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white/90 ring-1 ring-white/15">
                  {group.rig_name}
                </span>
              ) : null}
              {group.crane_required ? (
                <span className="rounded-md bg-amber-300 px-2 py-0.5 text-xs font-extrabold uppercase tracking-wider text-amber-900">
                  Crane
                </span>
              ) : null}
              {group.report ? (
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-extrabold uppercase tracking-wider ${
                    group.report.weather_stop
                      ? "bg-amber-300 text-amber-900"
                      : "bg-emerald-300 text-emerald-900"
                  }`}
                  title={`Report filed${group.report.piers_drilled ? ` · ${group.report.piers_drilled} piers` : ""}${group.report.crew_hours ? ` · ${group.report.crew_hours}hr` : ""}`}
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  {group.report.weather_stop ? "Weather" : "Reported"}
                </span>
              ) : null}
            </div>
            <h2 className="mt-2 text-2xl font-extrabold leading-tight lg:text-[26px]">
              {group.job_name || "Untitled Job"}
            </h2>
            {group.customer_name ? (
              <p className="mt-1 text-sm font-semibold text-white/80">{group.customer_name}</p>
            ) : null}
          </div>
        </div>
      </header>

      {/* Address */}
      {addressFull ? (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-3 border-b border-neutral-100 bg-neutral-50 px-6 py-4 transition-colors hover:bg-neutral-100"
        >
          <svg className="mt-1 h-5 w-5 shrink-0 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
              d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          <div className="min-w-0">
            <p className="text-base font-semibold leading-snug text-neutral-900 lg:text-lg">
              {addressLine || addressFull}
            </p>
            {group.zip ? (
              <p className="text-sm text-neutral-500">{group.zip}</p>
            ) : null}
          </div>
        </a>
      ) : null}

      {/* Meta row */}
      <dl className="grid grid-cols-2 gap-px border-b border-neutral-100 bg-neutral-100">
        <MetaCell label="Superintendent" value={group.superintendent_name} />
        <MetaCell label="Truck" value={group.truck_number} mono />
        {group.pm_name ? <MetaCell label="PM" value={group.pm_name} /> : null}
        {group.crane_info ? <MetaCell label="Crane Info" value={group.crane_info} /> : null}
      </dl>

      {/* Crew list */}
      <div className="flex-1 px-6 py-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">
          Crew on site ({group.workers.length})
        </p>
        {group.workers.length === 0 ? (
          <p className="text-sm italic text-neutral-400">No crew assigned.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {group.workers.map((worker, idx) => (
              <li
                key={`${worker}-${idx}`}
                className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                  {getInitials(worker)}
                </span>
                <span className="truncate text-base font-semibold text-neutral-800">
                  {worker}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

function MetaCell({ label, value, mono = false }) {
  if (!value) {
    return (
      <div className="bg-white px-6 py-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">{label}</p>
        <p className="text-sm italic text-neutral-400">—</p>
      </div>
    );
  }
  return (
    <div className="bg-white px-6 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">{label}</p>
      <p className={`text-base font-semibold text-neutral-900 ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function getInitials(label) {
  const first = String(label || "").trim().split(/\s+/)[0] || "";
  const rest = String(label || "").trim().split(/\s+/)[1] || "";
  return `${first[0] || ""}${rest[0] || ""}`.toUpperCase() || "?";
}

// Full-screen TV layout — no admin sidebar
DailyBoardPage.getLayout = (page) => page;

export default withAuthTw(DailyBoardPage);
