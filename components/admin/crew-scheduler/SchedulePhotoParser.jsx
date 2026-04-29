/**
 * SchedulePhotoParser — Upload + review UI for handwritten schedule OCR
 *
 * Integrates into the crew-scheduler admin page. Handles photo upload,
 * displays parsed results with confidence indicators, and lets the user
 * review/fix matches before applying them to the digital schedule.
 */
import { useState, useRef, useCallback } from "react";
import { Camera, Upload, CheckCircle, AlertTriangle, XCircle, Loader2, X, ChevronDown, ChevronUp } from "lucide-react";

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

  return (
    <div className={`rounded-lg border-l-4 border border-neutral-200 ${rowBg} p-3 mb-2`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-bold text-neutral-800 truncate">{rigDisplay}</span>
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
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFiles = useCallback((newFiles) => {
    const fileArr = Array.from(newFiles).slice(0, 4);
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
      const formData = new FormData();
      files.forEach((f) => formData.append("photos", f));

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

  // Apply parsed results to the schedule
  const handleApply = async () => {
    if (!result?.matched_rows || !onApply) return;
    setApplying(true);
    try {
      await onApply({
        schedule_date: result.schedule_date || selectedDate,
        rows: result.matched_rows,
        overrides,
        entities: result.entities,
      });
      onClose?.();
    } catch (err) {
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
                      Accepts HEIC, PNG, JPEG — up to 4 photos
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

          {/* Parse button */}
          {files.length > 0 && !result && (
            <button
              onClick={handleParse}
              disabled={parsing}
              className="w-full rounded-lg bg-[#0b2a5a] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0a2350] disabled:opacity-60"
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
          )}

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Results */}
          {result && (
            <>
              {/* Summary bar */}
              <div className="flex items-center justify-between rounded-lg bg-neutral-50 border border-neutral-200 px-4 py-2">
                <div className="flex items-center gap-4 text-xs">
                  <span className="font-semibold text-neutral-700">
                    {result.matched_rows?.length || 0} rows extracted
                  </span>
                  {result.schedule_date && (
                    <span className="text-neutral-500">
                      Date: {result.schedule_date}
                    </span>
                  )}
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
                  className="flex-1 rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-60"
                >
                  {applying ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Applying to schedule...
                    </span>
                  ) : (
                    `Apply ${result.matched_rows?.length || 0} Rows to Schedule`
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
