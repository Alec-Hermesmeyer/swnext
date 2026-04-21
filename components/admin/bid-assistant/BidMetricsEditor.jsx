/**
 * BidMetricsEditor — user-configurable metrics panel.
 * Allows setting financial thresholds, capacity limits, and signal weights
 * that personalise the bid-fit scoring engine.  Metrics can be global
 * (profile-level) or overridden per-job when a document is selected.
 */

import { useCallback, useState } from "react";

// ── Metric field definitions ───────────────────────────────────────

const FIELD_GROUPS = [
  {
    id: "financial",
    label: "Financial Thresholds",
    fields: [
      { key: "target_margin_percent", label: "Target Margin %", type: "number", suffix: "%", hint: "Minimum acceptable profit margin" },
      { key: "minimum_profit_usd", label: "Min Profit ($)", type: "currency", hint: "Walk away below this dollar amount" },
      { key: "minimum_contract_value_usd", label: "Min Contract Value ($)", type: "currency", hint: "Smallest job worth pursuing" },
      { key: "risk_buffer_percent", label: "Risk Buffer %", type: "number", suffix: "%", hint: "Extra margin for unknowns" },
      { key: "default_estimated_cost_usd", label: "Default Est. Cost ($)", type: "currency", hint: "Fallback when per-bid cost isn't entered" },
    ],
  },
  {
    id: "capacity",
    label: "Capacity & Scheduling",
    fields: [
      { key: "max_concurrent_jobs", label: "Max Concurrent Jobs", type: "number", hint: "Scheduling ceiling for your operation" },
      { key: "min_crew_available", label: "Min Crew Available", type: "number", hint: "Minimum idle crew before taking new work" },
    ],
  },
  {
    id: "weights",
    label: "Signal Weights",
    description: "How much each factor influences the final bid score (should total 100).",
    fields: [
      { key: "weight_profitability", label: "Profitability", type: "weight" },
      { key: "weight_contract_size", label: "Contract Size", type: "weight" },
      { key: "weight_resources", label: "Resources", type: "weight" },
      { key: "weight_scheduling", label: "Scheduling", type: "weight" },
      { key: "weight_pipeline", label: "Pipeline Load", type: "weight" },
    ],
  },
];

// ── Field rendering helpers ────────────────────────────────────────

function MetricInput({ field, value, onChange }) {
  const display = field.type === "currency"
    ? String(value || "").replace(/[^0-9]/g, "")
    : String(value ?? "");

  const handleChange = (e) => {
    let v = e.target.value;
    if (field.type === "currency") {
      v = Number(v.replace(/[^0-9]/g, "")) || 0;
    } else if (field.type === "number" || field.type === "weight") {
      v = Number(v) || 0;
    }
    onChange(field.key, v);
  };

  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold text-neutral-500">
        {field.label}
      </label>
      <div className="relative">
        {field.type === "currency" && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">$</span>
        )}
        <input
          type="text"
          inputMode="numeric"
          value={field.type === "currency" ? Number(display).toLocaleString() : display}
          onChange={handleChange}
          className={`w-full rounded-lg border border-neutral-300 bg-white text-sm transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none ${
            field.type === "currency" ? "pl-7 pr-3 py-2" : "px-3 py-2"
          }`}
        />
        {field.suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
            {field.suffix}
          </span>
        )}
      </div>
      {field.hint && <p className="mt-0.5 text-[10px] text-neutral-400">{field.hint}</p>}
    </div>
  );
}

// ── Weight bar visualization ───────────────────────────────────────

function WeightBar({ fields, metrics }) {
  const weights = fields.map((f) => ({
    key: f.key,
    label: f.label,
    value: Number(metrics[f.key] || 0),
  }));
  const total = weights.reduce((s, w) => s + w.value, 0);
  const colors = ["bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-violet-500", "bg-rose-500"];

  return (
    <div className="mt-2">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-neutral-100">
        {weights.map((w, i) => (
          <div
            key={w.key}
            className={`${colors[i % colors.length]} transition-all duration-300`}
            style={{ width: total > 0 ? `${(w.value / total) * 100}%` : "0%" }}
            title={`${w.label}: ${w.value}`}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-neutral-400">
        <span>Total: {total}</span>
        {total !== 100 && <span className="text-amber-600 font-semibold">Target: 100</span>}
      </div>
    </div>
  );
}

// ── Presets ─────────────────────────────────────────────────────────

const PRESETS = [
  {
    id: "conservative",
    label: "Conservative",
    hint: "Higher margins, lower risk tolerance",
    values: {
      target_margin_percent: 25,
      minimum_profit_usd: 100000,
      minimum_contract_value_usd: 400000,
      risk_buffer_percent: 12,
      default_estimated_cost_usd: 550000,
      max_concurrent_jobs: 15,
      min_crew_available: 5,
      weight_profitability: 40,
      weight_contract_size: 15,
      weight_resources: 20,
      weight_scheduling: 15,
      weight_pipeline: 10,
    },
  },
  {
    id: "balanced",
    label: "Balanced",
    hint: "Standard mix of profitability and growth",
    values: {
      target_margin_percent: 18,
      minimum_profit_usd: 75000,
      minimum_contract_value_usd: 300000,
      risk_buffer_percent: 8,
      default_estimated_cost_usd: 550000,
      max_concurrent_jobs: 20,
      min_crew_available: 3,
      weight_profitability: 35,
      weight_contract_size: 15,
      weight_resources: 20,
      weight_scheduling: 15,
      weight_pipeline: 15,
    },
  },
  {
    id: "aggressive",
    label: "Aggressive",
    hint: "Lower margins, maximize volume",
    values: {
      target_margin_percent: 12,
      minimum_profit_usd: 40000,
      minimum_contract_value_usd: 150000,
      risk_buffer_percent: 5,
      default_estimated_cost_usd: 550000,
      max_concurrent_jobs: 30,
      min_crew_available: 1,
      weight_profitability: 25,
      weight_contract_size: 10,
      weight_resources: 25,
      weight_scheduling: 20,
      weight_pipeline: 20,
    },
  },
];

// ── Main component ─────────────────────────────────────────────────

export default function BidMetricsEditor({ metrics, onUpdateField, onSetMetrics, isJobOverride, onToggleJobOverride }) {
  const [expanded, setExpanded] = useState(true);

  const handlePreset = useCallback((preset) => {
    onSetMetrics({ ...metrics, ...preset.values });
  }, [metrics, onSetMetrics]);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-neutral-50"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-50">
            <svg className="h-3.5 w-3.5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <span className="text-sm font-bold text-neutral-800">Bid Metrics</span>
            {isJobOverride && (
              <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                Job Override
              </span>
            )}
          </div>
        </div>
        <svg className={`h-4 w-4 text-neutral-400 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-neutral-100 px-4 py-3 space-y-4">
          {/* Job-specific override toggle */}
          {onToggleJobOverride && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!isJobOverride}
                onChange={() => onToggleJobOverride()}
                className="h-3.5 w-3.5 rounded border-neutral-300 text-brand focus:ring-brand/30"
              />
              <span className="text-xs text-neutral-600">
                Override metrics for this bid only
              </span>
            </label>
          )}

          {/* Presets */}
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-400">Quick Presets</p>
            <div className="flex gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePreset(preset)}
                  className="flex-1 rounded-lg border border-neutral-200 px-2.5 py-2 text-center transition-all hover:border-brand/30 hover:bg-brand-50"
                  title={preset.hint}
                >
                  <span className="block text-[11px] font-semibold text-neutral-700">{preset.label}</span>
                  <span className="block text-[9px] text-neutral-400">{preset.hint}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Field groups */}
          {FIELD_GROUPS.map((group) => (
            <div key={group.id}>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                {group.label}
              </p>
              {group.description && (
                <p className="mb-2 text-[10px] text-neutral-400">{group.description}</p>
              )}
              <div className={`grid gap-3 ${group.id === "weights" ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" : "grid-cols-2 sm:grid-cols-3"}`}>
                {group.fields.map((field) => (
                  <MetricInput
                    key={field.key}
                    field={field}
                    value={metrics[field.key]}
                    onChange={onUpdateField}
                  />
                ))}
              </div>
              {group.id === "weights" && (
                <WeightBar fields={group.fields} metrics={metrics} />
              )}
            </div>
          ))}

          {/* Notes */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-neutral-500">Notes</label>
            <textarea
              value={metrics.notes || ""}
              onChange={(e) => onUpdateField("notes", e.target.value)}
              rows={2}
              placeholder="Internal notes about these metric choices..."
              className="w-full resize-none rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
