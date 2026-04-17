"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Searchable combobox for selecting crew jobs.
 *
 * Features:
 * - Type-ahead search by job name, number, customer, city, address
 * - Jobs grouped by customer/hiring contractor (with "Other" for jobs without)
 * - Assigned-to-rig indicator showing which rigs already use a job
 * - "No job assigned" option at the top for clearing selection
 * - Keyboard navigation (ArrowDown/Up, Enter, Escape)
 * - Click-outside to close
 *
 * Props:
 *   jobs            – array of active crew job objects
 *   assignedJobMap  – Map<jobId, rigName[]> showing which rigs use each job
 *   value           – currently selected job ID (or "")
 *   onChange         – (jobId: string) => void — "" means "no job"
 *   placeholder     – optional placeholder text
 *   disabled        – disable the combobox
 */
export default function JobCombobox({
  jobs = [],
  assignedJobMap = {},
  value = "",
  onChange,
  placeholder = "Search jobs...",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Current selection display
  const selectedJob = useMemo(
    () => jobs.find((j) => String(j.id) === String(value)),
    [jobs, value]
  );

  // Filter jobs by search query
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter((j) => {
      const haystack = [
        j.job_name,
        j.job_number,
        j.customer_name,
        j.hiring_contractor,
        j.city,
        j.address,
        j.zip,
        j.pm_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [jobs, search]);

  // Group filtered jobs by customer/hiring contractor
  const grouped = useMemo(() => {
    const groups = new Map();
    for (const j of filtered) {
      const groupKey = j.customer_name || j.hiring_contractor || "Other";
      if (!groups.has(groupKey)) groups.set(groupKey, []);
      groups.get(groupKey).push(j);
    }
    // Sort groups alphabetically, "Other" last
    const sorted = [...groups.entries()].sort(([a], [b]) => {
      if (a === "Other") return 1;
      if (b === "Other") return -1;
      return a.localeCompare(b);
    });
    return sorted;
  }, [filtered]);

  // Flat list for keyboard navigation: index 0 = "No job", then real items
  const flatItems = useMemo(() => {
    const items = [{ id: "", _isNone: true }];
    for (const [, groupJobs] of grouped) {
      for (const j of groupJobs) {
        items.push(j);
      }
    }
    return items;
  }, [grouped]);

  // Close on click outside
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIdx < 0 || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${highlightIdx}"]`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [highlightIdx]);

  const handleSelect = useCallback(
    (jobId) => {
      onChange(jobId);
      setOpen(false);
      setSearch("");
      setHighlightIdx(-1);
    },
    [onChange]
  );

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        e.preventDefault();
        setOpen(true);
        return;
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIdx((prev) => {
          const next = prev + 1;
          return next >= flatItems.length ? 0 : next;
        });
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIdx((prev) => {
          const next = prev - 1;
          return next < 0 ? flatItems.length - 1 : next;
        });
        break;
      case "Enter":
        e.preventDefault();
        if (highlightIdx >= 0 && highlightIdx < flatItems.length) {
          const item = flatItems[highlightIdx];
          handleSelect(item._isNone ? "" : item.id);
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        setSearch("");
        setHighlightIdx(-1);
        break;
      default:
        break;
    }
  };

  const handleInputChange = (e) => {
    setSearch(e.target.value);
    setHighlightIdx(-1);
    if (!open) setOpen(true);
  };

  const handleInputFocus = () => {
    if (!disabled) setOpen(true);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setSearch("");
    setOpen(false);
  };

  // Track flat index for keyboard highlight
  let flatIdx = 0; // 0 = the "No job" item

  return (
    <div ref={containerRef} className="relative">
      {/* Input area */}
      <div
        className={`flex h-10 items-center gap-1.5 rounded-lg border bg-white px-2.5 transition-colors ${
          open
            ? "border-blue-500 ring-1 ring-blue-500"
            : "border-neutral-300 hover:border-neutral-400"
        } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-text"}`}
        onClick={() => {
          if (!disabled) {
            inputRef.current?.focus();
            setOpen(true);
          }
        }}
      >
        {/* Search icon */}
        <svg
          className="h-3.5 w-3.5 flex-shrink-0 text-neutral-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={open ? search : selectedJob ? formatJobDisplay(selectedJob) : ""}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={selectedJob ? formatJobDisplay(selectedJob) : placeholder}
          disabled={disabled}
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-autocomplete="list"
        />

        {/* Clear / chevron */}
        {value && !disabled ? (
          <button
            type="button"
            onClick={handleClear}
            className="flex-shrink-0 rounded p-0.5 text-neutral-400 hover:text-neutral-600"
            title="Clear job selection"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : (
          <svg
            className={`h-3.5 w-3.5 flex-shrink-0 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute left-0 right-0 z-30 mt-1 max-h-72 overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-lg"
          role="listbox"
          ref={listRef}
        >
          {/* Summary header */}
          <div className="sticky top-0 z-10 border-b border-neutral-100 bg-neutral-50 px-3 py-1.5 text-[11px] font-semibold text-neutral-500">
            {filtered.length} job{filtered.length !== 1 ? "s" : ""}
            {search && ` matching "${search}"`}
          </div>

          {/* "No job assigned" option */}
          <button
            type="button"
            data-idx={0}
            onClick={() => handleSelect("")}
            className={`flex w-full items-center gap-2 border-b border-neutral-100 px-3 py-2 text-left text-sm transition-colors ${
              highlightIdx === 0 ? "bg-blue-50" : "hover:bg-neutral-50"
            } ${!value ? "font-medium text-neutral-900" : "text-neutral-500"}`}
            role="option"
            aria-selected={!value}
          >
            <span className="inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-neutral-300" />
            <span className="italic">No job assigned</span>
            {!value && (
              <svg className="ml-auto h-4 w-4 flex-shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          {grouped.length === 0 && search ? (
            <div className="px-3 py-4 text-center text-sm text-neutral-400">
              No jobs matching &ldquo;{search}&rdquo;
            </div>
          ) : (
            grouped.map(([groupLabel, groupJobs]) => (
              <div key={groupLabel}>
                {/* Customer/contractor group header */}
                <div className="sticky top-7 z-[5] border-b border-neutral-100 bg-neutral-50/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-neutral-500 backdrop-blur-sm">
                  {groupLabel}
                  <span className="ml-1.5 font-normal text-neutral-400">
                    ({groupJobs.length})
                  </span>
                </div>

                {groupJobs.map((job) => {
                  flatIdx++;
                  const isSelected = String(job.id) === String(value);
                  const isHighlighted = flatIdx === highlightIdx;
                  const assignedRigs = assignedJobMap[job.id] || [];
                  const currentIdx = flatIdx;

                  return (
                    <button
                      key={job.id}
                      type="button"
                      data-idx={currentIdx}
                      onClick={() => handleSelect(job.id)}
                      className={`flex w-full items-start justify-between gap-2 px-3 py-2 text-left text-sm transition-colors ${
                        isHighlighted ? "bg-blue-50" : "hover:bg-neutral-50"
                      } cursor-pointer`}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full ${
                              isSelected ? "bg-blue-500" : "bg-emerald-500"
                            }`}
                          />
                          <span className="truncate font-medium text-neutral-900">
                            {job.job_name || "Untitled Job"}
                          </span>
                          {job.job_number && (
                            <span className="flex-shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-500">
                              #{job.job_number}
                            </span>
                          )}
                        </div>
                        {/* Secondary info line */}
                        <div className="ml-3 mt-0.5 flex flex-wrap gap-x-2 text-[11px] text-neutral-400">
                          {job.city && <span>{job.city}{job.zip ? `, ${job.zip}` : ""}</span>}
                          {job.hiring_contractor && job.hiring_contractor !== groupLabel && (
                            <span>GC: {job.hiring_contractor}</span>
                          )}
                          {job.pm_name && <span>PM: {job.pm_name}</span>}
                        </div>
                        {/* Show which rigs already use this job */}
                        {assignedRigs.length > 0 && (
                          <div className="ml-3 mt-0.5 text-[11px] text-blue-500">
                            Assigned to: {assignedRigs.join(", ")}
                          </div>
                        )}
                      </div>

                      {/* Selected check */}
                      {isSelected && (
                        <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function formatJobDisplay(job) {
  if (!job?.job_name) return "";
  const parts = [job.job_name];
  if (job.job_number) parts[0] += ` #${job.job_number}`;
  if (job.city) parts.push(job.city);
  return parts.join(" · ");
}
