import { useState, useMemo, memo, useCallback, useRef, useEffect } from "react";
import { ChevronDown, ChevronRight, Search, Plus, Filter } from "lucide-react";

// Virtual scrolling implementation without external dependency
const VirtualList = memo(({
  items,
  itemHeight = 80,
  containerHeight = 600,
  renderItem,
  overscan = 3
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef(null);

  const visibleRange = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const end = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return { start, end };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end + 1);
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  return (
    <div
      ref={scrollElementRef}
      onScroll={handleScroll}
      style={{ height: containerHeight, overflow: 'auto', position: 'relative' }}
      className="scrollbar-thin scrollbar-thumb-neutral-400 scrollbar-track-neutral-100"
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) =>
            renderItem(item, visibleRange.start + index)
          )}
        </div>
      </div>
    </div>
  );
});

VirtualList.displayName = "VirtualList";

const normalizeJobText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const isCrewJobActive = (job) => job?.is_active !== false;

const sortCrewJobs = (rows = [], sortConfig) => {
  return [...rows].sort((a, b) => {
    if (sortConfig?.key) {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      const comparison = sortConfig.direction === 'asc'
        ? String(aVal || "").localeCompare(String(bVal || ""))
        : String(bVal || "").localeCompare(String(aVal || ""));
      if (comparison !== 0) return comparison;
    }

    // Default sorting
    const activeDiff = Number(isCrewJobActive(b)) - Number(isCrewJobActive(a));
    if (activeDiff) return activeDiff;

    const nameDiff = String(a?.job_name || "").localeCompare(String(b?.job_name || ""), undefined, {
      sensitivity: "base",
    });
    if (nameDiff) return nameDiff;

    return Number(a?.id || 0) - Number(b?.id || 0);
  });
};

const JobItem = memo(({
  job,
  isExpanded,
  onToggleExpand,
  onEditJob,
  onToggleActive,
  onUpdateProgress,
  progress
}) => {
  const isActive = isCrewJobActive(job);

  return (
    <div className="group border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
      <div
        className="px-6 py-3 cursor-pointer"
        onClick={onToggleExpand}
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

      {isExpanded && (
        <div className="px-6 pl-14 pb-3 space-y-2 text-sm text-neutral-600 animate-in slide-in-from-top-1 duration-200">
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
});

JobItem.displayName = "JobItem";

const VirtualJobList = memo(({
  jobs,
  onAddJob,
  onEditJob,
  onToggleActive,
  onUpdateProgress,
  jobProgress,
  containerHeight = 600
}) => {
  const [jobSearchQuery, setJobSearchQuery] = useState("");
  const [expandedJobIds, setExpandedJobIds] = useState(new Set());
  const [sortConfig, setSortConfig] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const filteredJobs = useMemo(() => {
    let filtered = [...jobs];

    // Apply status filter
    if (statusFilter === "active") {
      filtered = filtered.filter(isCrewJobActive);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter(job => !isCrewJobActive(job));
    }

    // Apply search filter
    if (jobSearchQuery.trim()) {
      const query = normalizeJobText(jobSearchQuery);
      filtered = filtered.filter((job) => {
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
      });
    }

    return sortCrewJobs(filtered, sortConfig);
  }, [jobs, jobSearchQuery, sortConfig, statusFilter]);

  // Pagination
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredJobs.slice(start, end);
  }, [filteredJobs, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);

  const activeJobsCount = useMemo(() =>
    jobs.filter(isCrewJobActive).length,
    [jobs]
  );

  const toggleJobExpansion = useCallback((jobId) => {
    setExpandedJobIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  }, []);

  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev?.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const renderJobItem = useCallback((job, index) => (
    <JobItem
      key={job.id}
      job={job}
      isExpanded={expandedJobIds.has(job.id)}
      onToggleExpand={() => toggleJobExpansion(job.id)}
      onEditJob={onEditJob}
      onToggleActive={onToggleActive}
      onUpdateProgress={onUpdateProgress}
      progress={jobProgress[job.id]}
    />
  ), [expandedJobIds, toggleJobExpansion, onEditJob, onToggleActive, onUpdateProgress, jobProgress]);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-neutral-200">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-neutral-900">Jobs</h2>
          <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-full">
            {activeJobsCount} active / {jobs.length} total
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

      {/* Filters */}
      <div className="px-6 py-3 border-b border-neutral-100 space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={jobSearchQuery}
              onChange={(e) => {
                setJobSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search jobs..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        {/* Sort buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => handleSort('job_name')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              sortConfig?.key === 'job_name'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Name {sortConfig?.key === 'job_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSort('customer_name')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              sortConfig?.key === 'customer_name'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Customer {sortConfig?.key === 'customer_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSort('city')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              sortConfig?.key === 'city'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            City {sortConfig?.key === 'city' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>

      {/* Jobs List with Virtual Scrolling */}
      <div className="flex-1 overflow-hidden">
        {paginatedJobs.length > 20 ? (
          <VirtualList
            items={paginatedJobs}
            itemHeight={80}
            containerHeight={containerHeight - 200}
            renderItem={renderJobItem}
            overscan={3}
          />
        ) : (
          <div className="overflow-y-auto h-full">
            {paginatedJobs.map((job, index) => renderJobItem(job, index))}
          </div>
        )}

        {filteredJobs.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-neutral-500">
              {jobSearchQuery || statusFilter !== "all"
                ? "No jobs found matching your filters"
                : "No jobs available"}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-3 border-t border-neutral-200 flex items-center justify-between">
          <div className="text-sm text-neutral-600">
            Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredJobs.length)} of {filteredJobs.length}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = currentPage <= 3 ? i + 1 : currentPage + i - 2;
              if (pageNum > totalPages) return null;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 text-sm font-medium rounded ${
                    pageNum === currentPage
                      ? 'bg-blue-600 text-white'
                      : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

VirtualJobList.displayName = "VirtualJobList";

export default VirtualJobList;