import { useState, useMemo, memo } from "react";
import { ChevronDown, ChevronRight, Search, Plus } from "lucide-react";

const normalizeJobText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const isCrewJobActive = (job) => job?.is_active !== false;

const sortCrewJobs = (rows = []) =>
  [...rows].sort((a, b) => {
    const activeDiff = Number(isCrewJobActive(b)) - Number(isCrewJobActive(a));
    if (activeDiff) return activeDiff;

    const nameDiff = String(a?.job_name || "").localeCompare(String(b?.job_name || ""), undefined, {
      sensitivity: "base",
    });
    if (nameDiff) return nameDiff;

    return Number(a?.id || 0) - Number(b?.id || 0);
  });

const JobManagementPanel = memo(({
  jobs,
  onAddJob,
  onEditJob,
  onToggleActive,
  onUpdateProgress,
  jobProgress
}) => {
  const [jobSearchQuery, setJobSearchQuery] = useState("");
  const [expandedJobId, setExpandedJobId] = useState(null);

  const filteredJobs = useMemo(() => {
    if (!jobSearchQuery.trim()) return sortCrewJobs(jobs);

    const query = normalizeJobText(jobSearchQuery);
    return sortCrewJobs(
      jobs.filter((job) => {
        const searchableText = [
          job.job_name,
          job.job_number,
          job.customer_name,
          job.city,
          job.address,
        ]
          .filter(Boolean)
          .join(" ");
        return normalizeJobText(searchableText).includes(query);
      })
    );
  }, [jobs, jobSearchQuery]);

  const activeJobsCount = useMemo(() =>
    jobs.filter(isCrewJobActive).length,
    [jobs]
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-neutral-200">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-neutral-900">Jobs</h2>
          <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-full">
            {activeJobsCount} active
          </span>
        </div>
        <button
          onClick={onAddJob}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Job
        </button>
      </div>

      {/* Search */}
      <div className="px-6 py-3 border-b border-neutral-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={jobSearchQuery}
            onChange={(e) => setJobSearchQuery(e.target.value)}
            placeholder="Search jobs..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Jobs List */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-neutral-100">
          {filteredJobs.map((job) => {
            const isExpanded = expandedJobId === job.id;
            const isActive = isCrewJobActive(job);
            const progress = jobProgress[job.id];

            return (
              <div key={job.id} className="group hover:bg-neutral-50 transition-colors">
                <div
                  className="px-6 py-3 cursor-pointer"
                  onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                >
                  <div className="flex items-start gap-3">
                    <button className="mt-1 p-0.5">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-neutral-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-neutral-500" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-medium truncate ${
                          isActive ? "text-neutral-900" : "text-neutral-500"
                        }`}>
                          {job.job_name || "Untitled Job"}
                        </h3>
                        {!isActive && (
                          <span className="px-2 py-0.5 text-xs font-medium text-neutral-500 bg-neutral-100 rounded">
                            Inactive
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mt-1 text-sm text-neutral-600">
                        {job.job_number && (
                          <span>#{job.job_number}</span>
                        )}
                        {job.customer_name && (
                          <span>{job.customer_name}</span>
                        )}
                        {job.city && (
                          <span>{job.city}</span>
                        )}
                      </div>

                      {progress && (
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                              progress.status === 'complete'
                                ? 'text-green-700 bg-green-50'
                                : progress.status === 'active'
                                ? 'text-blue-700 bg-blue-50'
                                : progress.status === 'on_hold'
                                ? 'text-amber-700 bg-amber-50'
                                : 'text-neutral-600 bg-neutral-100'
                            }`}>
                              {progress.status_label || progress.status}
                            </span>
                          </div>

                          {(progress.holes_completed || progress.holes_target) && (
                            <div className="text-xs text-neutral-600">
                              {progress.holes_completed || 0} / {progress.holes_target || '?'} holes
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions - visible on hover */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateProgress(job);
                        }}
                        className="px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        Progress
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditJob(job);
                        }}
                        className="px-3 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleActive(job);
                        }}
                        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                          isActive
                            ? "text-red-600 hover:bg-red-50"
                            : "text-green-600 hover:bg-green-50"
                        }`}
                      >
                        {isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-6 pl-14 pb-3 space-y-2 text-sm text-neutral-600">
                    {job.address && (
                      <div>
                        <span className="font-medium">Address:</span> {job.address}
                        {job.zip && `, ${job.zip}`}
                      </div>
                    )}
                    {job.hiring_contractor && (
                      <div>
                        <span className="font-medium">Contractor:</span> {job.hiring_contractor}
                      </div>
                    )}
                    {job.pm_name && (
                      <div>
                        <span className="font-medium">Project Manager:</span> {job.pm_name}
                        {job.pm_phone && ` (${job.pm_phone})`}
                      </div>
                    )}
                    {job.default_rig && (
                      <div>
                        <span className="font-medium">Default Rig:</span> {job.default_rig}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {filteredJobs.length === 0 && (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-neutral-500">
                {jobSearchQuery ? "No jobs found matching your search" : "No jobs available"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

JobManagementPanel.displayName = "JobManagementPanel";

export default JobManagementPanel;