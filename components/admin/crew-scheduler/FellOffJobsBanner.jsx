/**
 * FellOffJobsBanner — Day-over-day "what dropped off" alert
 *
 * Surfaces jobs that were on the previous day's schedule but are missing
 * from the currently-selected day's schedule. Lets the user mark each one
 * complete (or dismiss) directly from the banner so stale active jobs
 * don't accumulate.
 */
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, X, Loader2 } from "lucide-react";
import supabase from "@/components/Supabase";

function previousDateString(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  if (Number.isNaN(d.getTime())) return null;
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function FellOffJobsBanner({
  selectedDate,
  todayScheduleDate,
  todayJobIds,
  onJobUpdated,
}) {
  const [fellOff, setFellOff] = useState([]);
  const [dismissed, setDismissed] = useState(new Set());
  const [working, setWorking] = useState(null);
  const [loadError, setLoadError] = useState(null);

  // Stable cache key for the dependency: a sorted, comma-joined string of
  // today's job ids. Using the array directly would re-run the effect on
  // every render because React compares array refs.
  const todayIdsKey = (todayJobIds || []).map(String).sort().join(",");

  // Reset dismissed selections only when the date actually changes — NOT on
  // every assignments update, otherwise dismissing a job and then editing
  // anything else makes the dismissed jobs reappear.
  const prevSelectedDateRef = useRef(selectedDate);
  useEffect(() => {
    if (prevSelectedDateRef.current !== selectedDate) {
      setDismissed(new Set());
      prevSelectedDateRef.current = selectedDate;
    }
  }, [selectedDate]);

  useEffect(() => {
    if (!selectedDate) return undefined;
    // Gate on the parent having actually loaded today's schedule. Without
    // this check, the first render runs with todayJobIds=[] (because the
    // parent's fetchSchedule hasn't completed yet) and the banner briefly
    // shows EVERY job from yesterday as "fell off" before correcting.
    // todayScheduleDate comes from currentSchedule.schedule_date in the
    // parent and only matches selectedDate after the fetch resolves.
    if (todayScheduleDate !== selectedDate) return undefined;

    let cancelled = false;
    setLoadError(null);

    const prev = previousDateString(selectedDate);
    if (!prev) return undefined;

    (async () => {
      try {
        const { data: prevSched, error: schedErr } = await supabase
          .from("crew_schedules")
          .select("id")
          .eq("schedule_date", prev)
          .maybeSingle();
        if (schedErr && schedErr.code !== "PGRST116") throw schedErr;
        if (!prevSched?.id) {
          if (!cancelled) setFellOff([]);
          return;
        }

        const { data: prevAssignments, error: aErr } = await supabase
          .from("crew_assignments")
          .select("job_id, crew_jobs(id, job_number, job_name, is_active, job_status)")
          .eq("schedule_id", prevSched.id)
          .not("job_id", "is", null);
        if (aErr) throw aErr;
        if (cancelled) return;

        const todaySet = new Set(todayIdsKey ? todayIdsKey.split(",") : []);
        const seen = new Set();
        const list = [];
        for (const row of prevAssignments || []) {
          if (!row.job_id || !row.crew_jobs) continue;
          const idStr = String(row.job_id);
          if (seen.has(idStr) || todaySet.has(idStr)) continue;
          // Only nag about jobs still flagged active — completed jobs
          // shouldn't trigger the banner.
          if (row.crew_jobs.is_active === false) continue;
          seen.add(idStr);
          list.push(row.crew_jobs);
        }

        if (!cancelled) setFellOff(list);
      } catch (err) {
        if (!cancelled) setLoadError(err.message || "Could not load previous day");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedDate, todayScheduleDate, todayIdsKey]);

  const updateJob = async (job, updates, label) => {
    setWorking(job.id);
    try {
      const { error } = await supabase
        .from("crew_jobs")
        .update(updates)
        .eq("id", job.id);
      if (error) throw error;
      setDismissed((prev) => {
        const next = new Set(prev);
        next.add(job.id);
        return next;
      });
      onJobUpdated?.();
    } catch (err) {
      alert(`Could not ${label} ${job.job_name || job.job_number}: ${err.message}`);
    } finally {
      setWorking(null);
    }
  };

  const handleMarkComplete = (job) =>
    updateJob(job, { is_active: false, job_status: "completed" }, "mark complete");

  const handleDismiss = (job) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(job.id);
      return next;
    });
  };

  const visible = fellOff.filter((j) => !dismissed.has(j.id));

  if (loadError) {
    return (
      <div className="print:hidden mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
        Could not load yesterday&apos;s jobs to compare: {loadError}
      </div>
    );
  }

  if (visible.length === 0) return null;

  const prev = previousDateString(selectedDate);
  return (
    <div className="print:hidden mb-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-amber-900">
            {visible.length} job{visible.length === 1 ? "" : "s"} from {prev} not on today&apos;s schedule
          </p>
          <p className="text-xs text-amber-800">
            Mark each one complete (sets <code className="rounded bg-amber-100 px-1">is_active=false</code>,{" "}
            <code className="rounded bg-amber-100 px-1">job_status=&quot;completed&quot;</code>) or dismiss to keep it active.
          </p>
        </div>
      </div>
      <ul className="divide-y divide-amber-200">
        {visible.map((job) => {
          const isWorking = working === job.id;
          return (
            <li key={job.id} className="flex items-center justify-between gap-3 py-1.5">
              <div className="min-w-0 text-sm text-amber-900">
                <span className="font-mono text-xs text-amber-700">
                  {job.job_number || "—"}
                </span>{" "}
                <span className="font-medium">{job.job_name || "(no name)"}</span>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button
                  onClick={() => handleMarkComplete(job)}
                  disabled={isWorking}
                  className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-white px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                >
                  {isWorking ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                  Mark Complete
                </button>
                <button
                  onClick={() => handleDismiss(job)}
                  disabled={isWorking}
                  className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-white px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-60"
                  title="Dismiss for this session — leaves the job active"
                >
                  <X className="h-3 w-3" />
                  Dismiss
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
