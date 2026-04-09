import { memo, useMemo } from "react";
import { Calendar, MapPin, User, Clock } from "lucide-react";

const formatShortDate = (date) =>
  new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

const formatTime = (time) => {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
};

const ScheduleGrid = memo(({
  schedules,
  selectedDate,
  jobs,
  workers,
  onEditSchedule,
  onDeleteSchedule
}) => {
  const dateSchedules = useMemo(() => {
    return schedules
      .filter(s => s.schedule_date === selectedDate)
      .sort((a, b) => {
        // Sort by start time, then by job name
        if (a.start_time && b.start_time) {
          return a.start_time.localeCompare(b.start_time);
        }
        if (a.start_time) return -1;
        if (b.start_time) return 1;

        const jobA = jobs.find(j => j.id === a.job_id);
        const jobB = jobs.find(j => j.id === b.job_id);
        return (jobA?.job_name || "").localeCompare(jobB?.job_name || "");
      });
  }, [schedules, selectedDate, jobs]);

  const groupedSchedules = useMemo(() => {
    const groups = {};

    dateSchedules.forEach(schedule => {
      const jobId = schedule.job_id;
      if (!groups[jobId]) {
        groups[jobId] = {
          job: jobs.find(j => j.id === jobId),
          schedules: []
        };
      }
      groups[jobId].schedules.push(schedule);
    });

    return Object.values(groups);
  }, [dateSchedules, jobs]);

  if (groupedSchedules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Calendar className="w-12 h-12 text-neutral-300 mb-4" />
        <h3 className="text-lg font-medium text-neutral-700 mb-2">
          No schedules for {formatShortDate(selectedDate)}
        </h3>
        <p className="text-sm text-neutral-500">
          Add crew assignments to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groupedSchedules.map(({ job, schedules: jobSchedules }) => (
        <div
          key={job?.id || 'unknown'}
          className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden"
        >
          {/* Job Header */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 border-b border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-neutral-900">
                    {job?.job_name || "Unknown Job"}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-neutral-600">
                    {job?.job_number && (
                      <span>#{job.job_number}</span>
                    )}
                    {job?.customer_name && (
                      <span>{job.customer_name}</span>
                    )}
                    {job?.city && (
                      <span>{job.city}</span>
                    )}
                  </div>
                </div>
              </div>

              {job?.default_rig && (
                <div className="text-sm font-medium text-blue-700 bg-white px-3 py-1 rounded">
                  {job.default_rig}
                </div>
              )}
            </div>
          </div>

          {/* Crew Assignments */}
          <div className="divide-y divide-neutral-100">
            {jobSchedules.map((schedule) => {
              const worker = workers.find(w => w.id === schedule.worker_id);

              return (
                <div
                  key={schedule.id}
                  className="px-4 py-3 hover:bg-neutral-50 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <User className="w-4 h-4 text-neutral-400" />

                      <div>
                        <div className="font-medium text-neutral-900">
                          {worker?.name || "Unknown Worker"}
                        </div>
                        {worker?.role && (
                          <div className="text-sm text-neutral-600">
                            {worker.role}
                          </div>
                        )}
                      </div>

                      {(schedule.start_time || schedule.end_time) && (
                        <div className="flex items-center gap-1 text-sm text-neutral-600">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {schedule.start_time && formatTime(schedule.start_time)}
                            {schedule.start_time && schedule.end_time && " - "}
                            {schedule.end_time && formatTime(schedule.end_time)}
                          </span>
                        </div>
                      )}

                      {schedule.rig && (
                        <div className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded">
                          {schedule.rig}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEditSchedule(schedule)}
                        className="px-3 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteSchedule(schedule.id)}
                        className="px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {schedule.notes && (
                    <div className="mt-2 pl-8 text-sm text-neutral-600">
                      {schedule.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
});

ScheduleGrid.displayName = "ScheduleGrid";

export default ScheduleGrid;