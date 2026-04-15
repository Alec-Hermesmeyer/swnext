"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Searchable combobox for selecting crew workers.
 *
 * Features:
 * - Type-ahead search filtering by name and role
 * - Workers grouped by role (with an "Other" bucket for workers without roles)
 * - Assigned-elsewhere workers shown greyed out with their current rig name
 * - Keyboard navigation (ArrowDown/Up, Enter, Escape)
 * - Click-outside to close
 *
 * Props:
 *   workers        – full workers array (all active workers)
 *   availableIds   – Set of worker IDs that are unassigned (selectable)
 *   assignedMap    – Map<workerId, rigName[]> for showing where a worker is assigned
 *   value          – currently selected worker ID (or "")
 *   onChange        – (workerId: string) => void
 *   placeholder    – optional placeholder text
 *   disabled       – disable the combobox
 */
export default function CrewCombobox({
  workers = [],
  availableIds,
  assignedMap = {},
  value = "",
  onChange,
  placeholder = "Search crew...",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Build available set for quick lookups
  const availableSet = useMemo(
    () => (availableIds instanceof Set ? availableIds : new Set(availableIds || [])),
    [availableIds]
  );

  // Current selection display
  const selectedWorker = useMemo(
    () => workers.find((w) => String(w.id) === String(value)),
    [workers, value]
  );

  // Filter workers by search query
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return workers;
    return workers.filter((w) => {
      const haystack = [w.name, w.role, w.phone].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [workers, search]);

  // Group filtered workers by role
  const grouped = useMemo(() => {
    const groups = new Map();
    for (const w of filtered) {
      const role = w.role || "Other";
      if (!groups.has(role)) groups.set(role, []);
      groups.get(role).push(w);
    }
    // Sort roles alphabetically, but "Other" goes last
    const sorted = [...groups.entries()].sort(([a], [b]) => {
      if (a === "Other") return 1;
      if (b === "Other") return -1;
      return a.localeCompare(b);
    });
    return sorted;
  }, [filtered]);

  // Flat list of items for keyboard navigation
  const flatItems = useMemo(() => {
    const items = [];
    for (const [, groupWorkers] of grouped) {
      for (const w of groupWorkers) {
        items.push(w);
      }
    }
    return items;
  }, [grouped]);

  const totalAvailable = useMemo(
    () => filtered.filter((w) => availableSet.has(w.id)).length,
    [filtered, availableSet]
  );

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
    (workerId) => {
      onChange(workerId);
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
          if (availableSet.has(item.id)) {
            handleSelect(item.id);
          }
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
  let flatIdx = -1;

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
          value={open ? search : selectedWorker ? formatDisplay(selectedWorker) : ""}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={selectedWorker ? formatDisplay(selectedWorker) : placeholder}
          disabled={disabled}
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-autocomplete="list"
        />

        {/* Clear button */}
        {value && !disabled ? (
          <button
            type="button"
            onClick={handleClear}
            className="flex-shrink-0 rounded p-0.5 text-neutral-400 hover:text-neutral-600"
            title="Clear selection"
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
          className="absolute left-0 right-0 z-30 mt-1 max-h-64 overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-lg"
          role="listbox"
          ref={listRef}
        >
          {/* Summary header */}
          <div className="sticky top-0 z-10 border-b border-neutral-100 bg-neutral-50 px-3 py-1.5 text-[11px] font-semibold text-neutral-500">
            {totalAvailable} available
            {filtered.length !== totalAvailable && ` · ${filtered.length - totalAvailable} assigned elsewhere`}
            {search && ` · matching "${search}"`}
          </div>

          {grouped.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-neutral-400">
              {search ? `No workers matching "${search}"` : "No workers available"}
            </div>
          ) : (
            grouped.map(([role, groupWorkers]) => (
              <div key={role}>
                {/* Role group header */}
                <div className="sticky top-7 z-[5] border-b border-neutral-100 bg-neutral-50/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-neutral-500 backdrop-blur-sm">
                  {role}
                  <span className="ml-1.5 font-normal text-neutral-400">
                    ({groupWorkers.filter((w) => availableSet.has(w.id)).length}/{groupWorkers.length})
                  </span>
                </div>

                {groupWorkers.map((worker) => {
                  flatIdx++;
                  const isAvailable = availableSet.has(worker.id);
                  const isHighlighted = flatIdx === highlightIdx;
                  const assignedRigs = assignedMap[worker.id] || [];
                  const currentIdx = flatIdx;

                  return (
                    <button
                      key={worker.id}
                      type="button"
                      data-idx={currentIdx}
                      onClick={() => {
                        if (isAvailable) handleSelect(worker.id);
                      }}
                      disabled={!isAvailable}
                      className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors ${
                        isHighlighted && isAvailable
                          ? "bg-blue-50"
                          : isAvailable
                            ? "hover:bg-neutral-50"
                            : ""
                      } ${!isAvailable ? "cursor-default opacity-50" : "cursor-pointer"}`}
                      role="option"
                      aria-selected={String(worker.id) === String(value)}
                      aria-disabled={!isAvailable}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          {/* Availability dot */}
                          <span
                            className={`inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full ${
                              isAvailable ? "bg-emerald-500" : "bg-neutral-300"
                            }`}
                          />
                          <span className={`truncate font-medium ${isAvailable ? "text-neutral-900" : "text-neutral-500"}`}>
                            {worker.name}
                          </span>
                        </div>
                        {!isAvailable && assignedRigs.length > 0 && (
                          <div className="ml-3 mt-0.5 text-[11px] text-neutral-400">
                            On: {assignedRigs.join(", ")}
                          </div>
                        )}
                      </div>

                      {/* Right side: role badge or selected check */}
                      {String(worker.id) === String(value) ? (
                        <svg className="h-4 w-4 flex-shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : worker.role && isAvailable ? (
                        <span className="flex-shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-500">
                          {worker.role}
                        </span>
                      ) : null}
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

function formatDisplay(worker) {
  if (!worker?.name) return "";
  return worker.role ? `${worker.name} — ${worker.role}` : worker.name;
}
