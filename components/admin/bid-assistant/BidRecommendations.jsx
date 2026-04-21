/**
 * BidRecommendations — visual recommendation panel.
 * Shows the composite bid score, per-signal breakdowns, projected
 * financials, and a go/no-go recommendation with plain-language rationale.
 */

import { useMemo } from "react";

// ── Score ring (reusable circular indicator) ───────────────────────

function ScoreRing({ score, size = 80 }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? "#10b981" : score >= 55 ? "#f59e0b" : score >= 35 ? "#f97316" : "#ef4444";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth="5" stroke="#e5e7eb" fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} strokeWidth="5" stroke={color} fill="none"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-black text-neutral-900">{score}</span>
      </div>
    </div>
  );
}

// ── Signal bar (horizontal progress) ───────────────────────────────

function SignalBar({ signal }) {
  const statusColors = {
    good: { bg: "bg-emerald-100", fill: "bg-emerald-500", text: "text-emerald-700", badge: "bg-emerald-50 text-emerald-700" },
    caution: { bg: "bg-amber-100", fill: "bg-amber-500", text: "text-amber-700", badge: "bg-amber-50 text-amber-700" },
    warning: { bg: "bg-rose-100", fill: "bg-rose-500", text: "text-rose-700", badge: "bg-rose-50 text-rose-700" },
  };
  const c = statusColors[signal.status] || statusColors.caution;

  return (
    <div className="py-2.5">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-neutral-700">{signal.label}</span>
          <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${c.badge}`}>
            {signal.score}
          </span>
        </div>
        <span className="text-[10px] text-neutral-400">wt: {signal.weight}</span>
      </div>
      <div className={`h-1.5 w-full rounded-full ${c.bg}`}>
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${c.fill}`}
          style={{ width: `${signal.score}%` }}
        />
      </div>
      <p className="mt-1 text-[10px] text-neutral-500 leading-tight">{signal.detail}</p>
    </div>
  );
}

// ── Financial projections card ─────────────────────────────────────

function FinancialProjection({ projected }) {
  if (!projected || !projected.bid_value_usd) return null;

  const fmt = (v) => `$${Number(v || 0).toLocaleString()}`;
  const marginColor = projected.margin_percent >= 18 ? "text-emerald-700"
    : projected.margin_percent >= 10 ? "text-amber-700"
    : "text-rose-700";

  return (
    <div className="mt-3 rounded-lg bg-neutral-50 p-3">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400">Projected Financials</p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-neutral-500">Bid Value</span>
          <span className="ml-1 font-semibold text-neutral-800">{fmt(projected.bid_value_usd)}</span>
        </div>
        <div>
          <span className="text-neutral-500">Est. Cost</span>
          <span className="ml-1 font-semibold text-neutral-800">{fmt(projected.estimated_cost_usd)}</span>
        </div>
        <div>
          <span className="text-neutral-500">Profit</span>
          <span className={`ml-1 font-semibold ${projected.profit_usd >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
            {fmt(projected.profit_usd)}
          </span>
        </div>
        <div>
          <span className="text-neutral-500">Margin</span>
          <span className={`ml-1 font-semibold ${marginColor}`}>
            {projected.margin_percent}%
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Operational context badges ─────────────────────────────────────

function OpsContextBadges({ context }) {
  if (!context) return null;

  const badges = [
    { label: `${context.workforce?.active_workers || 0} crew active`, tone: "blue" },
    { label: `${context.scheduling?.active_jobs || 0} active jobs`, tone: "blue" },
    { label: `${context.pipeline?.upcoming_bids_2wk || 0} bids due (2wk)`, tone: context.pipeline?.upcoming_bids_2wk > 5 ? "amber" : "blue" },
    { label: `${Math.round((context.workforce?.capacity_utilization || 0) * 100)}% capacity used`, tone: (context.workforce?.capacity_utilization || 0) > 0.8 ? "rose" : "emerald" },
  ];

  const toneClasses = {
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
  };

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {badges.map((b, i) => (
        <span key={i} className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${toneClasses[b.tone]}`}>
          {b.label}
        </span>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────

export default function BidRecommendations({ score, context, loading, onRefresh }) {
  const hasScore = score && typeof score.composite_score === "number";
  const rec = score?.recommendation;

  const toneClasses = useMemo(() => {
    if (!rec) return {};
    const tones = {
      emerald: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", icon: "text-emerald-600" },
      amber: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", icon: "text-amber-600" },
      rose: { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-800", icon: "text-rose-600" },
    };
    return tones[rec.tone] || tones.amber;
  }, [rec]);

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <div className="flex items-center gap-3 text-neutral-400">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-xs">Analyzing operational context...</span>
        </div>
      </div>
    );
  }

  if (!hasScore) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50 p-5">
        <div className="text-center">
          <svg className="mx-auto h-8 w-8 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="mt-2 text-xs text-neutral-500">
            Select a bid document and add a value estimate to see personalized recommendations.
          </p>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="mt-2 text-[11px] font-semibold text-brand hover:text-brand-light transition-colors"
            >
              Refresh operational data
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
      {/* Header with score ring */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-neutral-100">
        <ScoreRing score={score.composite_score} size={64} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-neutral-900">Bid Score</h3>
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="rounded p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
                title="Re-score"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
          </div>
          <OpsContextBadges context={context} />
        </div>
      </div>

      {/* Recommendation banner */}
      {rec && (
        <div className={`px-4 py-3 ${toneClasses.bg} border-b ${toneClasses.border}`}>
          <div className="flex items-start gap-2">
            <span className={`mt-0.5 text-lg ${toneClasses.icon}`}>
              {rec.verdict === "strong_bid" ? "✓" : rec.verdict === "reconsider" ? "✗" : "⚠"}
            </span>
            <div>
              <p className={`text-sm font-bold ${toneClasses.text}`}>{rec.label}</p>
              <p className={`text-xs ${toneClasses.text} opacity-80 mt-0.5`}>{rec.summary}</p>
            </div>
          </div>
        </div>
      )}

      {/* Signal breakdowns */}
      <div className="px-4 py-2 divide-y divide-neutral-100">
        {(score.signals || []).map((signal) => (
          <SignalBar key={signal.id} signal={signal} />
        ))}
      </div>

      {/* Financial projection */}
      <div className="px-4 pb-3">
        <FinancialProjection projected={score.projected} />
      </div>
    </div>
  );
}
