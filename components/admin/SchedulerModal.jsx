"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Lato } from "next/font/google";
import supabase from "@/components/Supabase";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

const todayInput = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const tomorrowInput = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const formatLongDate = (value) => {
  if (!value) return "";
  const d = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
};

/**
 * Focused "assign this job to a schedule day" modal — replaces the iframe
 * version. Given a job, captures: date, rig, super, truck, crane, crew,
 * then persists:
 *   - crew_schedules (get-or-create for the date)
 *   - schedule_rig_details (super + truck + crane per rig per schedule)
 *   - crew_assignments (one per worker)
 */
export default function SchedulerModal({ isOpen, onClose, focusJobId }) {
  const [job, setJob] = useState(null);
  const [rigs, setRigs] = useState([]);
  const [supers, setSupers] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [cranes, setCranes] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [existingAssignments, setExistingAssignments] = useState([]);
  const [loadingRefs, setLoadingRefs] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  // Form state
  const [date, setDate] = useState(todayInput());
  const [rigId, setRigId] = useState("");
  const [superId, setSuperId] = useState("");
  const [truckId, setTruckId] = useState("");
  const [craneId, setCraneId] = useState("");
  const [craneInfoText, setCraneInfoText] = useState("");
  const [selectedWorkerIds, setSelectedWorkerIds] = useState(() => new Set());
  const [workerSearch, setWorkerSearch] = useState("");

  // Body-scroll lock + Escape close
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  // Reset form when opened or focusJobId changes
  useEffect(() => {
    if (!isOpen) return;
    setDate(todayInput());
    setRigId("");
    setSuperId("");
    setTruckId("");
    setCraneId("");
    setCraneInfoText("");
    setSelectedWorkerIds(new Set());
    setWorkerSearch("");
    setErrorMessage("");
    setStatus(null);
  }, [isOpen, focusJobId]);

  // Load reference data. Uses allSettled so one bad query can't black out
  // the whole form — each list loads independently, and any per-query error
  // is surfaced in the banner so we can see exactly what failed.
  const loadReferences = useCallback(async () => {
    if (!isOpen || !focusJobId) return;
    setLoadingRefs(true);
    setErrorMessage("");

    const runQuery = async (label, queryBuilder) => {
      try {
        const res = await queryBuilder();
        if (res.error) {
          console.warn(`[SchedulerModal] ${label} failed:`, res.error);
          return { label, error: res.error, data: null };
        }
        return { label, error: null, data: res.data };
      } catch (err) {
        console.warn(`[SchedulerModal] ${label} threw:`, err);
        return { label, error: err, data: null };
      }
    };

    const results = await Promise.allSettled([
      runQuery("job", () => supabase.from("crew_jobs").select("*").eq("id", focusJobId).maybeSingle()),
      runQuery("rigs (crew_categories)", () => supabase.from("crew_categories").select("*").order("sort_order", { ascending: true })),
      runQuery("superintendents", () => supabase.from("crew_superintendents").select("*").eq("is_active", true).order("name")),
      runQuery("trucks", () => supabase.from("crew_trucks").select("*").eq("is_active", true).order("truck_number")),
      runQuery("cranes", () => supabase.from("crew_cranes").select("*").eq("is_active", true).order("name")),
      runQuery("workers", () => supabase.from("crew_workers").select("*").eq("is_active", true).order("name")),
    ]);

    const [jobR, rigsR, supersR, trucksR, cranesR, workersR] = results.map((r) => r.status === "fulfilled" ? r.value : { error: r.reason });

    setJob(jobR.data || null);
    setRigs(Array.isArray(rigsR.data) ? rigsR.data : []);
    setSupers(Array.isArray(supersR.data) ? supersR.data : []);
    setTrucks(Array.isArray(trucksR.data) ? trucksR.data : []);
    setCranes(Array.isArray(cranesR.data) ? cranesR.data : []);
    setWorkers(Array.isArray(workersR.data) ? workersR.data : []);

    // Preselect rig if job has a default_rig hint
    if (jobR.data?.default_rig && Array.isArray(rigsR.data)) {
      const guessRig = rigsR.data.find((r) => (r.name || "").toLowerCase() === String(jobR.data.default_rig).toLowerCase());
      if (guessRig) setRigId(guessRig.id);
    }

    // Surface any errors (but don't block — if workers loaded but rigs didn't,
    // show both the list and the error).
    const failures = [];
    if (jobR.error) failures.push(`job (${jobR.error.message || "unknown"})`);
    if (rigsR.error) failures.push(`rigs (${rigsR.error.message || "unknown"})`);
    if (supersR.error) failures.push(`supers (${supersR.error.message || "unknown"})`);
    if (trucksR.error) failures.push(`trucks (${trucksR.error.message || "unknown"})`);
    // crew_cranes is expected to be missing pre-migration — only flag if it's a different error
    if (cranesR.error && !String(cranesR.error.message || "").toLowerCase().includes("does not exist")) {
      failures.push(`cranes (${cranesR.error.message})`);
    }
    if (workersR.error) failures.push(`workers (${workersR.error.message || "unknown"})`);
    if (failures.length > 0) {
      setErrorMessage(`Could not load: ${failures.join("; ")}. Check browser console for details.`);
    }

    setLoadingRefs(false);
  }, [isOpen, focusJobId]);

  useEffect(() => { loadReferences(); }, [loadReferences]);

  // Load existing assignments for (date, rig) when either changes
  useEffect(() => {
    if (!isOpen || !date || !rigId) { setExistingAssignments([]); return; }
    let cancelled = false;
    (async () => {
      try {
        const { data: sched } = await supabase
          .from("crew_schedules")
          .select("id")
          .eq("schedule_date", date)
          .maybeSingle();
        if (!sched?.id) { if (!cancelled) setExistingAssignments([]); return; }
        const { data } = await supabase
          .from("crew_assignments")
          .select("id, worker_id, job_id, crew_workers(name), crew_jobs(job_name, job_number)")
          .eq("schedule_id", sched.id)
          .eq("category_id", rigId);
        if (!cancelled) setExistingAssignments(data || []);
      } catch {
        if (!cancelled) setExistingAssignments([]);
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen, date, rigId]);

  // Crane dropdown change: auto-fill craneInfoText
  useEffect(() => {
    if (!craneId) return;
    const crane = cranes.find((c) => c.id === craneId);
    if (!crane) return;
    const label = [
      crane.name,
      crane.unit_number ? `(Unit ${crane.unit_number})` : null,
      crane.capacity ? `· ${crane.capacity}` : null,
    ].filter(Boolean).join(" ");
    setCraneInfoText(label);
  }, [craneId, cranes]);

  const toggleWorker = (id) => {
    setSelectedWorkerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredWorkers = useMemo(() => {
    const q = workerSearch.trim().toLowerCase();
    if (!q) return workers;
    return workers.filter((w) =>
      String(w.name || "").toLowerCase().includes(q) ||
      String(w.role || "").toLowerCase().includes(q)
    );
  }, [workers, workerSearch]);

  const canSubmit = Boolean(focusJobId && date && rigId && selectedWorkerIds.size > 0);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit || saving) return;
    setSaving(true);
    setErrorMessage("");
    setStatus(null);
    try {
      // 1. Get-or-create schedule for the date
      let scheduleId;
      const { data: existingSched, error: schedFindErr } = await supabase
        .from("crew_schedules")
        .select("id")
        .eq("schedule_date", date)
        .maybeSingle();
      if (schedFindErr && schedFindErr.code !== "PGRST116") throw schedFindErr;
      if (existingSched?.id) {
        scheduleId = existingSched.id;
      } else {
        const { data: created, error: schedInsErr } = await supabase
          .from("crew_schedules")
          .insert({ schedule_date: date })
          .select()
          .single();
        if (schedInsErr) throw schedInsErr;
        scheduleId = created.id;
      }

      // 2. Upsert schedule_rig_details for (schedule, rig)
      const rigDetailsPayload = {
        schedule_id: scheduleId,
        category_id: rigId,
        superintendent_id: superId || null,
        truck_id: truckId || null,
        crane_info: craneInfoText.trim() || null,
      };
      const { data: existingRigDetail } = await supabase
        .from("schedule_rig_details")
        .select("id")
        .eq("schedule_id", scheduleId)
        .eq("category_id", rigId)
        .maybeSingle();
      if (existingRigDetail?.id) {
        const { error: updErr } = await supabase
          .from("schedule_rig_details")
          .update(rigDetailsPayload)
          .eq("id", existingRigDetail.id);
        if (updErr) throw updErr;
      } else {
        const { error: insErr } = await supabase
          .from("schedule_rig_details")
          .insert(rigDetailsPayload);
        if (insErr) throw insErr;
      }

      // 3. Insert crew_assignments for each selected worker (dedup against existing)
      const existingKeys = new Set(
        existingAssignments
          .filter((a) => a.job_id === focusJobId)
          .map((a) => `${a.worker_id}|${a.job_id}`)
      );
      const rowsToInsert = Array.from(selectedWorkerIds)
        .filter((wid) => !existingKeys.has(`${wid}|${focusJobId}`))
        .map((wid) => ({
          schedule_id: scheduleId,
          job_id: focusJobId,
          category_id: rigId,
          worker_id: wid,
        }));
      if (rowsToInsert.length > 0) {
        const { error: asgnErr } = await supabase.from("crew_assignments").insert(rowsToInsert);
        if (asgnErr) throw asgnErr;
      }

      setStatus({
        type: "success",
        message: `Scheduled ${rowsToInsert.length} crew for ${formatLongDate(date)}.${selectedWorkerIds.size - rowsToInsert.length > 0 ? ` ${selectedWorkerIds.size - rowsToInsert.length} already assigned.` : ""}`,
      });

      // Reload existing assignments so they show in the "already assigned" list
      const { data: reloaded } = await supabase
        .from("crew_assignments")
        .select("id, worker_id, job_id, crew_workers(name), crew_jobs(job_name, job_number)")
        .eq("schedule_id", scheduleId)
        .eq("category_id", rigId);
      setExistingAssignments(reloaded || []);
      setSelectedWorkerIds(new Set());
    } catch (err) {
      setErrorMessage(err?.message || "Could not save assignment.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const fullSchedulerHref = `/admin/crew-scheduler${focusJobId ? `?focus_job_id=${focusJobId}` : ""}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className={`${lato.className} flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-start justify-between gap-3 border-b border-neutral-200 bg-gradient-to-r from-brand to-brand-light px-5 py-4 text-white">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/80">Assign to Schedule</p>
              <h2 className="truncate text-base font-extrabold leading-tight">
                {job ? (
                  <>
                    {job.job_number ? <span className="font-mono text-white/90">#{job.job_number}</span> : null}
                    {job.job_number ? " · " : ""}
                    {job.job_name}
                  </>
                ) : loadingRefs ? "Loading…" : "Job"}
              </h2>
              {job?.customer_name || job?.hiring_contractor ? (
                <p className="truncate text-[11px] font-semibold text-white/80">
                  {job.customer_name || job.hiring_contractor}
                  {job.city ? ` · ${job.city}` : ""}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href={fullSchedulerHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md px-2 py-1 text-[11px] font-semibold text-white/85 hover:bg-white/15"
              title="Open the full crew scheduler in a new tab"
            >
              Open full scheduler
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-white/80 hover:bg-white/15 hover:text-white"
              aria-label="Close"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {errorMessage ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                {errorMessage}
              </div>
            ) : null}

            {/* Date */}
            <Field label="Date" required>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className={inputClass}
                />
                <button type="button" onClick={() => setDate(todayInput())} className="rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-neutral-600 hover:bg-neutral-50">Today</button>
                <button type="button" onClick={() => setDate(tomorrowInput())} className="rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-neutral-600 hover:bg-neutral-50">Tomorrow</button>
                {date ? <span className="text-[11px] text-neutral-500">{formatLongDate(date)}</span> : null}
              </div>
            </Field>

            {/* Rig / Super / Truck */}
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label={`Rig${rigs.length > 0 ? ` (${rigs.length})` : ""}`} required>
                <select value={rigId} onChange={(e) => setRigId(e.target.value)} required className={inputClass} disabled={loadingRefs || rigs.length === 0}>
                  <option value="">{loadingRefs ? "Loading…" : rigs.length === 0 ? "No rigs — add one in the scheduler" : "Select rig…"}</option>
                  {rigs.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </Field>
              <Field label={`Superintendent${supers.length > 0 ? ` (${supers.length})` : ""}`}>
                <select value={superId} onChange={(e) => setSuperId(e.target.value)} className={inputClass} disabled={loadingRefs}>
                  <option value="">{loadingRefs ? "Loading…" : supers.length === 0 ? "No supers configured" : "—"}</option>
                  {supers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Field>
              <Field label={`Truck${trucks.length > 0 ? ` (${trucks.length})` : ""}`}>
                <select value={truckId} onChange={(e) => setTruckId(e.target.value)} className={inputClass} disabled={loadingRefs}>
                  <option value="">{loadingRefs ? "Loading…" : trucks.length === 0 ? "No trucks configured" : "—"}</option>
                  {trucks.map((t) => <option key={t.id} value={t.id}>{t.truck_number}{t.make ? ` · ${t.make}` : ""}</option>)}
                </select>
              </Field>
            </div>

            {/* Crane */}
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={job?.crane_required ? "Crane (required)" : "Crane"}>
                <select value={craneId} onChange={(e) => setCraneId(e.target.value)} className={inputClass}>
                  <option value="">No crane</option>
                  {cranes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.unit_number ? ` (Unit ${c.unit_number})` : ""}{c.capacity ? ` · ${c.capacity}` : ""}
                    </option>
                  ))}
                </select>
                {cranes.length === 0 ? (
                  <span className="mt-1 block text-[11px] text-neutral-400">
                    No cranes in <Link href="/admin/cranes" className="font-semibold text-brand underline">/admin/cranes</Link> yet. Use free text →
                  </span>
                ) : null}
              </Field>
              <Field label="Crane Info (free text)">
                <input
                  type="text"
                  value={craneInfoText}
                  onChange={(e) => setCraneInfoText(e.target.value)}
                  placeholder="e.g., Crane 1 — Link-Belt 138 (70-ton)"
                  className={inputClass}
                />
              </Field>
            </div>

            {/* Existing assignments for this (date, rig) — prevent duplicates */}
            {rigId && existingAssignments.length > 0 ? (
              <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Already on this rig / date</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {existingAssignments.map((a) => (
                    <span key={a.id} className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-blue-800 ring-1 ring-blue-200">
                      {a.crew_workers?.name || "—"}
                      {a.crew_jobs?.job_number ? (
                        <span className="text-[10px] font-mono text-blue-500">#{a.crew_jobs.job_number}</span>
                      ) : null}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Crew multi-select */}
            <Field label={`Crew${selectedWorkerIds.size > 0 ? ` — ${selectedWorkerIds.size} selected` : ""}`} required>
              <div className="rounded-xl border border-neutral-200 bg-white">
                <div className="border-b border-neutral-100 p-2">
                  <input
                    type="text"
                    value={workerSearch}
                    onChange={(e) => setWorkerSearch(e.target.value)}
                    placeholder="Search name or role…"
                    className="h-8 w-full rounded-md border border-neutral-300 bg-white px-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {filteredWorkers.length === 0 ? (
                    <p className="p-4 text-center text-xs text-neutral-500">No crew match.</p>
                  ) : (
                    filteredWorkers.map((w) => {
                      const selected = selectedWorkerIds.has(w.id);
                      return (
                        <label
                          key={w.id}
                          className={`flex cursor-pointer items-center gap-2 border-b border-neutral-50 px-3 py-2 text-sm transition-colors last:border-b-0 ${
                            selected ? "bg-brand-50" : "hover:bg-neutral-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleWorker(w.id)}
                            className="h-4 w-4 rounded border-neutral-300 text-brand focus:ring-brand/20"
                          />
                          <span className="flex-1 font-semibold text-neutral-800">{w.name}</span>
                          {w.role ? (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">{w.role}</span>
                          ) : null}
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            </Field>
          </div>

          {/* Footer */}
          <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-200 bg-neutral-50 px-5 py-3">
            <p className="text-[11px] text-neutral-500">
              {selectedWorkerIds.size === 0 ? (
                "Pick a date, rig, and at least one crew member."
              ) : (
                <>Assigning <strong>{selectedWorkerIds.size}</strong> {selectedWorkerIds.size === 1 ? "person" : "people"}{rigs.find((r) => r.id === rigId) ? <> to <strong>{rigs.find((r) => r.id === rigId).name}</strong></> : null} on <strong>{date}</strong>.</>
              )}
            </p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">
                Close
              </button>
              <button
                type="submit"
                disabled={!canSubmit || saving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-light hover:shadow-md disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Assigning…
                  </>
                ) : (
                  "Assign to Schedule"
                )}
              </button>
            </div>
          </footer>
        </form>

        {status ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-20 flex justify-center">
            <div className="pointer-events-auto rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 shadow-card-hover">
              ✓ {status.message}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

const inputClass =
  "h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10";

function Field({ label, required, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-500">
        {label}{required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </span>
      {children}
    </label>
  );
}
