/**
 * SchedulePhotoParser — Upload + review UI for handwritten schedule OCR
 *
 * Integrates into the crew-scheduler admin page. Handles photo upload,
 * displays parsed results with confidence indicators, and lets the user
 * review/fix matches before applying them to the digital schedule.
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, Upload, CheckCircle, AlertTriangle, XCircle, Loader2, X, ChevronDown, ChevronUp, CalendarDays, RotateCcw } from "lucide-react";

// ---------------------------------------------------------------------------
// Client-side image compression — converts any image to ≤1MB JPEG before upload.
// Eliminates HEIC entirely, shrinks upload 4-6x, removes server HEIC conversion.
// ---------------------------------------------------------------------------
const MAX_DIM = 1600;
const JPEG_QUALITY = 0.82;

function compressImage(file) {
  return new Promise((resolve, reject) => {
    // If the file is already small JPEG/PNG (< 800KB), skip compression
    if (file.size < 800 * 1024 && /^image\/(jpeg|png)$/.test(file.type)) {
      return resolve(file);
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      // Scale down to MAX_DIM on the longest side
      if (width > MAX_DIM || height > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Canvas compression failed"));
          const name = file.name.replace(/\.\w+$/, ".jpg");
          resolve(new File([blob], name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        JPEG_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      // Browser can't decode (e.g. HEIC on Chrome) — send raw, let server handle it
      resolve(file);
    };

    img.src = url;
  });
}

async function compressAll(files) {
  return Promise.all(files.map(compressImage));
}

// ---------------------------------------------------------------------------
// Confidence badge component
// ---------------------------------------------------------------------------
const ConfidenceBadge = ({ confidence }) => {
  if (confidence === "high") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
        <CheckCircle className="h-3 w-3" /> Matched
      </span>
    );
  }
  if (confidence === "medium") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
        <AlertTriangle className="h-3 w-3" /> Confirm
      </span>
    );
  }
  if (confidence === "new") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
        — Empty
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
      <XCircle className="h-3 w-3" /> Review
    </span>
  );
};

// ---------------------------------------------------------------------------
// Dropdown selector for overriding a match
// ---------------------------------------------------------------------------
const EntitySelector = ({ value, options, labelKey, onChange, placeholder }) => (
  <select
    value={value || ""}
    onChange={(e) => onChange(e.target.value || null)}
    className="h-7 rounded border border-neutral-300 bg-white px-2 text-xs text-neutral-700"
  >
    <option value="">{placeholder || "— Select —"}</option>
    {options.map((opt) => (
      <option key={opt.id} value={opt.id}>
        {opt[labelKey] || opt.name || opt.id}
      </option>
    ))}
  </select>
);

// ---------------------------------------------------------------------------
// Single parsed row card
// ---------------------------------------------------------------------------
const ParsedRowCard = ({ row, entities, overrides, onOverride }) => {
  const [expanded, setExpanded] = useState(false);
  const status = row.dayStatus;
  const isNonWorking = status.type !== "working";

  const rowBg = row.highlight_color === "orange"
    ? "border-l-orange-400 bg-orange-50/40"
    : row.highlight_color === "yellow"
    ? "border-l-yellow-400 bg-yellow-50/40"
    : "border-l-neutral-300 bg-white";

  const rigDisplay = row.raw?.rig_name || "Unknown Rig";
  const jobDisplay = row.job?.match?.job_name || row.raw?.job_name || (isNonWorking ? status.label : "—");
  const jobNum = row.job?.match?.job_number || row.raw?.job_number || "";
  const truckDisplay = row.truck?.match?.truck_number || row.raw?.truck_number || "";
  const superDisplay = row.superintendent?.match?.name || row.raw?.superintendent || "";
  const catAssigned = row.category?.match?.name;
  const catAutoMethod = row.category?.auto_assigned; // "color", "keyword", "fallback", or undefined
  const noCat = !row.category?.match?.id;

  return (
    <div className={`rounded-lg border-l-4 border ${noCat ? "border-red-300 bg-red-50/30" : "border-neutral-200"} ${noCat ? "" : rowBg} p-3 mb-2`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-bold text-neutral-800 truncate">{rigDisplay}</span>
          {catAssigned && (
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
              catAutoMethod ? "bg-blue-100 text-blue-700" : "bg-neutral-100 text-neutral-600"
            }`}>
              → {catAssigned}
            </span>
          )}
          {noCat && (
            <span className="rounded bg-red-200 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
              No category — select below
            </span>
          )}
          {isNonWorking && (
            <span className="rounded bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-800">
              {status.label}
            </span>
          )}
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700"
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {expanded ? "Less" : "Details"}
        </button>
      </div>

      {/* Summary line */}
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-600">
        {jobDisplay && jobDisplay !== "—" && (
          <span>
            <span className="font-medium">Job:</span> {jobDisplay}
            {jobNum ? ` (#${jobNum})` : ""}
            <ConfidenceBadge confidence={row.job?.confidence} />
          </span>
        )}
        {truckDisplay && (
          <span>
            <span className="font-medium">Truck:</span> {truckDisplay}
            <ConfidenceBadge confidence={row.truck?.confidence} />
          </span>
        )}
        {superDisplay && (
          <span>
            <span className="font-medium">Super:</span> {superDisplay}
            <ConfidenceBadge confidence={row.superintendent?.confidence} />
          </span>
        )}
        {row.start_time && (
          <span>
            <span className="font-medium">Time:</span> {row.start_time}
          </span>
        )}
      </div>

      {/* Crew chips */}
      {row.crew?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {row.crew.map((c, i) => (
            <span
              key={i}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                c.confidence === "high"
                  ? "bg-green-100 text-green-700"
                  : c.confidence === "medium"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {c.match?.name || c.raw}
              {c.confidence !== "high" && (
                <span className="text-[10px] opacity-60">({c.raw})</span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Expanded details with override selectors */}
      {expanded && (
        <div className="mt-3 space-y-2 rounded bg-white/80 p-2 border border-neutral-100">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="font-medium text-neutral-500">Category/Rig Override:</label>
              <EntitySelector
                value={overrides?.category_id || row.category?.match?.id}
                options={entities.categories}
                labelKey="name"
                onChange={(v) => onOverride(row.row_number, "category_id", v)}
                placeholder="— Select category —"
              />
            </div>
            <div>
              <label className="font-medium text-neutral-500">Job Override:</label>
              <EntitySelector
                value={overrides?.job_id || row.job?.match?.id}
                options={entities.jobs}
                labelKey="job_name"
                onChange={(v) => onOverride(row.row_number, "job_id", v)}
                placeholder="— Select job —"
              />
            </div>
            <div>
              <label className="font-medium text-neutral-500">Truck Override:</label>
              <EntitySelector
                value={overrides?.truck_id || row.truck?.match?.id}
                options={entities.trucks}
                labelKey="truck_number"
                onChange={(v) => onOverride(row.row_number, "truck_id", v)}
                placeholder="— Select truck —"
              />
            </div>
            <div>
              <label className="font-medium text-neutral-500">Superintendent Override:</label>
              <EntitySelector
                value={overrides?.superintendent_id || row.superintendent?.match?.id}
                options={entities.superintendents}
                labelKey="name"
                onChange={(v) => onOverride(row.row_number, "superintendent_id", v)}
                placeholder="— Select super —"
              />
            </div>
          </div>
          {row.raw?.notes && (
            <p className="text-xs text-neutral-500">
              <span className="font-medium">Notes:</span> {row.raw.notes}
            </p>
          )}
          {row.crane_info && (
            <p className="text-xs text-neutral-500">
              <span className="font-medium">Crane:</span> {row.crane_info}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function SchedulePhotoParser({
  onApply,
  onClose,
  selectedDate,
}) {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [overrides, setOverrides] = useState({});
  const [applying, setApplying] = useState(false);
  const [applyFailed, setApplyFailed] = useState(false);
  const [targetDate, setTargetDate] = useState(selectedDate);
  const fileInputRef = useRef(null);

  // When the vision model detects a date, update targetDate — but only if it's
  // within ±60 days of today. The model frequently hallucinates the year on
  // handwritten dates that only show MM/DD (it once saved a whole schedule to
  // April 29, **2024** because the photo just said "4/29"). For anything
  // outside that window, keep the user's currently-selected date.
  useEffect(() => {
    if (!result?.schedule_date) return;
    const p = new Date(result.schedule_date + "T12:00:00");
    if (Number.isNaN(p.getTime())) return;
    const norm = `${p.getFullYear()}-${String(p.getMonth() + 1).padStart(2, "0")}-${String(p.getDate()).padStart(2, "0")}`;
    const diffDays = Math.abs((p.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diffDays > 60) {
      console.warn("[parse-apply] ignoring photo date — too far from today", { detected: norm, diffDays: Math.round(diffDays) });
      return;
    }
    setTargetDate(norm);
  }, [result?.schedule_date]);

  // Handle file selection
  const handleFiles = useCallback((newFiles) => {
    const fileArr = Array.from(newFiles).slice(0, 5);
    setFiles(fileArr);
    setResult(null);
    setError(null);
    setOverrides({});

    // Generate previews
    const urls = fileArr.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  // Submit photos for parsing
  const handleParse = async () => {
    if (files.length === 0) return;
    setParsing(true);
    setError(null);
    setResult(null);

    try {
      // Compress images client-side before upload (HEIC→JPEG, resize to 1600px)
      const compressed = await compressAll(files);

      const formData = new FormData();
      compressed.forEach((f) => formData.append("photos", f));

      const res = await fetch("/api/parse-schedule-photo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to parse schedule photos");
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setParsing(false);
    }
  };

  // Handle override changes
  const handleOverride = (rowNum, field, value) => {
    setOverrides((prev) => ({
      ...prev,
      [rowNum]: {
        ...(prev[rowNum] || {}),
        [field]: value,
      },
    }));
  };

  // Apply parsed results to the schedule (with retry support)
  const handleApply = async () => {
    console.log("[parse-apply] handleApply clicked", {
      has_result: !!result,
      matched_rows: result?.matched_rows?.length,
      has_onApply: typeof onApply === "function",
      targetDate,
    });
    if (!result?.matched_rows || !onApply) {
      console.warn("[parse-apply] handleApply bailed: missing result or onApply");
      return;
    }
    if (!targetDate) {
      setError("Please select a date for this schedule.");
      return;
    }
    setApplying(true);
    setApplyFailed(false);
    setError(null);
    try {
      await onApply({
        schedule_date: targetDate,
        rows: result.matched_rows,
        overrides,
        entities: result.entities,
      });
      onClose?.();
    } catch (err) {
      console.error("[parse-apply] onApply threw", err);
      setApplyFailed(true);
      setError(err.message || "Failed to apply schedule data");
    } finally {
      setApplying(false);
    }
  };

  // Reset
  const handleReset = () => {
    setFiles([]);
    setPreviews((prev) => { prev.forEach(URL.revokeObjectURL); return []; });
    setResult(null);
    setError(null);
    setOverrides({});
    setTargetDate(selectedDate);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto p-4">
      <div className="w-full max-w-3xl rounded-xl bg-white shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3">
          <div>
            <h2 className="text-lg font-bold text-neutral-800">
              Parse Schedule Photo
            </h2>
            <p className="text-xs text-neutral-500">
              Upload handwritten schedule photos to auto-populate today&apos;s schedule
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Upload area */}
          {!result && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-8 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/30"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.heic,.heif"
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-2">
                {files.length === 0 ? (
                  <>
                    <div className="flex gap-3">
                      <Camera className="h-8 w-8 text-neutral-400" />
                      <Upload className="h-8 w-8 text-neutral-400" />
                    </div>
                    <p className="text-sm font-medium text-neutral-600">
                      Drop schedule photos here or click to browse
                    </p>
                    <p className="text-xs text-neutral-400">
                      Accepts HEIC, PNG, JPEG — up to 5 photos
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-green-700">
                      {files.length} photo{files.length > 1 ? "s" : ""} selected
                    </p>
                    <p className="text-xs text-neutral-400">
                      Click to change or drop new files
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Previews */}
          {previews.length > 0 && !result && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {previews.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Schedule photo ${i + 1}`}
                  className="h-24 w-auto rounded-lg border border-neutral-200 object-cover"
                />
              ))}
            </div>
          )}

          {/* Date picker + Parse button */}
          {files.length > 0 && !result && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-1.5">
                <CalendarDays className="h-4 w-4 text-neutral-400" />
                <label className="text-xs font-medium text-neutral-500 whitespace-nowrap">Apply to:</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="border-0 bg-transparent text-sm font-semibold text-neutral-800 outline-none"
                />
              </div>
              <button
                onClick={handleParse}
                disabled={parsing}
                className="flex-1 rounded-lg bg-[#0b2a5a] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0a2350] disabled:opacity-60"
              >
                {parsing ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing {files.length} photo{files.length > 1 ? "s" : ""}...
                  </span>
                ) : (
                  `Parse Schedule Photo${files.length > 1 ? "s" : ""}`
                )}
              </button>
            </div>
          )}

          {/* Error with retry */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-red-700">
                  <strong>Error:</strong> {error}
                </p>
                {applyFailed && (
                  <button
                    onClick={handleApply}
                    disabled={applying}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Retry
                  </button>
                )}
                {!applyFailed && !result && files.length > 0 && (
                  <button
                    onClick={handleParse}
                    disabled={parsing}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Retry Parse
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Results */}
          {result && (
            <>
              {/* Summary bar */}
              <div className="rounded-lg bg-neutral-50 border border-neutral-200 px-4 py-2 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs">
                    <span className="font-semibold text-neutral-700">
                      {result.matched_rows?.length || 0} rows extracted
                    </span>
                    {result.provider && (
                      <span className="rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] font-mono text-neutral-600">
                        {result.provider === "groq" ? "Groq" : "Anthropic"}
                        {result.duration_ms ? ` ${(result.duration_ms / 1000).toFixed(1)}s` : ""}
                      </span>
                    )}
                    {result.summary && (
                      <>
                        <span className="text-green-600">
                          {result.summary.high_confidence} auto-matched
                        </span>
                        {result.summary.medium_confidence > 0 && (
                          <span className="text-yellow-600">
                            {result.summary.medium_confidence} to confirm
                          </span>
                        )}
                        {result.summary.low_confidence > 0 && (
                          <span className="text-red-600">
                            {result.summary.low_confidence} to review
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <button
                    onClick={handleReset}
                    className="text-xs text-neutral-500 hover:text-neutral-700 underline"
                  >
                    Re-upload
                  </button>
                </div>
                {/* Date selector row */}
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-2 rounded border border-neutral-300 bg-white px-2 py-1">
                    <CalendarDays className="h-3.5 w-3.5 text-neutral-400" />
                    <span className="font-medium text-neutral-500">Apply to:</span>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="border-0 bg-transparent text-xs font-semibold text-neutral-800 outline-none"
                    />
                  </div>
                  {result.schedule_date && targetDate !== result.schedule_date && (
                    <span className="inline-flex items-center gap-1 text-amber-600">
                      <AlertTriangle className="h-3 w-3" />
                      Photo shows {result.schedule_date}
                    </span>
                  )}
                </div>
                {result.schedule_date && targetDate !== result.schedule_date && (
                  <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    <strong>Heads up:</strong> the vision model read the date as{" "}
                    <span className="font-mono">{result.schedule_date}</span>, but you&apos;re applying to{" "}
                    <span className="font-mono">{targetDate}</span>. Handwritten dates without a year often get the year wrong — double-check this is what you want before clicking Apply.
                  </div>
                )}
              </div>

              {/* Parsed rows */}
              <div className="max-h-[50vh] overflow-y-auto space-y-1 pr-1">
                {(result.matched_rows || []).map((row, i) => (
                  <ParsedRowCard
                    key={row.row_number ?? i}
                    row={row}
                    entities={result.entities || {}}
                    overrides={overrides[row.row_number]}
                    onOverride={handleOverride}
                  />
                ))}
              </div>

              {/* Apply button */}
              <div className="flex gap-3 pt-2 border-t border-neutral-200">
                <button
                  onClick={handleApply}
                  disabled={applying}
                  className={`flex-1 rounded-lg py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60 ${
                    applyFailed
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {applying ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {applyFailed ? "Retrying..." : `Applying to ${targetDate}...`}
                    </span>
                  ) : applyFailed ? (
                    <span className="inline-flex items-center gap-2">
                      <RotateCcw className="h-4 w-4" />
                      Retry Apply to {targetDate}
                    </span>
                  ) : (
                    `Apply ${result.matched_rows?.length || 0} Rows to ${targetDate}`
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
