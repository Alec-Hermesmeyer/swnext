"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Searchable, keyboard-navigable job picker.
 *
 * Props:
 *   jobs        – array of { id, job_name, job_number, customer_name, hiring_contractor, city }
 *   value       – selected job id (string)
 *   onChange    – (id: string) => void; passes "" when allowNone is true and user picks "none"
 *   placeholder – input placeholder
 *   allowNone   – show a leading "none" option (e.g. "All jobs (global)")
 *   noneLabel   – label text for the none option
 *   excludeIds  – job ids to hide from the list (e.g. already-linked)
 *   disabled    – disable the trigger
 */
export default function JobSearchSelect({
  jobs = [],
  value = "",
  onChange,
  placeholder = "Search by #number, name, or customer...",
  allowNone = false,
  noneLabel = "None",
  excludeIds = [],
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const excludedSet = useMemo(
    () => new Set((excludeIds || []).map((id) => String(id))),
    [excludeIds]
  );

  const visibleJobs = useMemo(
    () => jobs.filter((j) => !excludedSet.has(String(j.id))),
    [jobs, excludedSet]
  );

  const selectedJob = useMemo(
    () => jobs.find((j) => String(j.id) === String(value)),
    [jobs, value]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return visibleJobs;
    return visibleJobs.filter((j) => {
      const hay = [j.job_name, j.job_number, j.customer_name, j.hiring_contractor, j.city]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [visibleJobs, search]);

  const items = useMemo(() => {
    const list = [];
    if (allowNone) list.push({ id: "", _isNone: true });
    for (const j of filtered) list.push(j);
    return list;
  }, [allowNone, filtered]);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    if (highlightIdx < 0 || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${highlightIdx}"]`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [highlightIdx]);

  const select = useCallback(
    (id) => {
      onChange?.(id);
      setOpen(false);
      setSearch("");
      setHighlightIdx(-1);
    },
    [onChange]
  );

  const onKeyDown = (e) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = items[highlightIdx] || items[0];
      if (target) select(target._isNone ? "" : target.id);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  const renderDisplay = () => {
    if (selectedJob) {
      return (
        <span className="flex min-w-0 items-center gap-2">
          {selectedJob.job_number ? (
            <span className="shrink-0 rounded bg-brand-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-brand">
              #{selectedJob.job_number}
            </span>
          ) : null}
          <span className="truncate text-neutral-900">{selectedJob.job_name}</span>
        </span>
      );
    }
    if (value === "" && allowNone) {
      return <span className="text-neutral-600">{noneLabel}</span>;
    }
    return <span className="text-neutral-400">{placeholder}</span>;
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => { if (!disabled) setOpen((o) => !o); }}
        onKeyDown={onKeyDown}
        className="flex h-10 w-full items-center justify-between rounded-lg border border-neutral-300 bg-white px-3 text-left text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="min-w-0 flex-1 truncate">{renderDisplay()}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open ? (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg">
          <div className="border-b border-neutral-100 p-2">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setHighlightIdx(allowNone && !e.target.value ? -1 : 0);
              }}
              onKeyDown={onKeyDown}
              placeholder="Type to filter..."
              className="w-full rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <ul ref={listRef} className="max-h-64 overflow-y-auto py-1">
            {items.length === 0 ? (
              <li className="px-3 py-4 text-center text-xs text-neutral-400">No jobs match.</li>
            ) : (
              items.map((item, idx) => {
                const active = idx === highlightIdx;
                if (item._isNone) {
                  return (
                    <li
                      key="__none__"
                      data-idx={idx}
                      onMouseEnter={() => setHighlightIdx(idx)}
                      onClick={() => select("")}
                      className={`cursor-pointer border-b border-neutral-100 px-3 py-2 text-xs font-semibold ${
                        active ? "bg-brand-50 text-brand" : "text-neutral-600 hover:bg-neutral-50"
                      }`}
                    >
                      {noneLabel}
                    </li>
                  );
                }
                return (
                  <li
                    key={item.id}
                    data-idx={idx}
                    onMouseEnter={() => setHighlightIdx(idx)}
                    onClick={() => select(item.id)}
                    className={`cursor-pointer px-3 py-2 ${active ? "bg-brand-50" : "hover:bg-neutral-50"}`}
                  >
                    <div className="flex items-center gap-2">
                      {item.job_number ? (
                        <span className="shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-brand">
                          #{item.job_number}
                        </span>
                      ) : null}
                      <span className="truncate text-sm font-semibold text-neutral-900">{item.job_name}</span>
                    </div>
                    {(item.customer_name || item.hiring_contractor || item.city) ? (
                      <p className="mt-0.5 truncate text-[11px] text-neutral-500">
                        {item.customer_name || item.hiring_contractor}
                        {item.city ? ` · ${item.city}` : ""}
                      </p>
                    ) : null}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
