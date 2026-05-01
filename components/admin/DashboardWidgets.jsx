"use client";

/**
 * Dashboard widgets — rebuilt /admin/dashboard pieces.
 *
 * Kept lightweight (no chart libs); all visuals are inline SVG so the page
 * paints fast even on cold cache. Lives separately from dashboard.jsx so
 * the page file stays focused on layout + data loading.
 */
import Link from "next/link";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

const formatMoney = (n, opts = {}) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return "$0";
  if (opts.compact && Math.abs(v) >= 1000) {
    return v.toLocaleString("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 });
  }
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
};

const formatPct = (current, previous) => {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return null;
  const pct = ((current - previous) / previous) * 100;
  return pct;
};

// ---------------------------------------------------------------------------
// HeadlineKpi — large prominent KPI card with optional WoW delta arrow.
// Used for the top strip: revenue this week, active jobs, contract backlog,
// pipeline value. Bigger and more confident-looking than the existing cards.
// ---------------------------------------------------------------------------
export function HeadlineKpi({ label, value, sublabel, delta, deltaLabel, href, accent = "navy" }) {
  const accents = {
    navy: { bg: "bg-[#0b2a5a]", soft: "from-[#0b2a5a] to-[#173a73]" },
    emerald: { bg: "bg-emerald-700", soft: "from-emerald-700 to-emerald-500" },
    violet: { bg: "bg-violet-700", soft: "from-violet-700 to-violet-500" },
    amber: { bg: "bg-amber-600", soft: "from-amber-600 to-amber-400" },
  };
  const a = accents[accent] || accents.navy;

  const deltaTone =
    delta == null
      ? null
      : delta > 0.5
      ? "text-emerald-300"
      : delta < -0.5
      ? "text-rose-300"
      : "text-neutral-300";
  const arrow = delta == null ? null : delta > 0.5 ? "↑" : delta < -0.5 ? "↓" : "→";

  const inner = (
    <div className={`relative flex h-full flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br ${a.soft} p-5 text-white shadow-card hover:shadow-card-hover transition-shadow`}>
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/70">
        {label}
      </div>
      <div className="mt-1.5">
        <div className={`${lato.className} text-3xl font-black leading-tight tracking-tight`}>{value}</div>
        {sublabel ? <div className="mt-0.5 text-[11px] text-white/75">{sublabel}</div> : null}
      </div>
      {delta != null ? (
        <div className={`mt-3 inline-flex items-center gap-1 text-[12px] font-semibold ${deltaTone}`}>
          <span className="text-base leading-none">{arrow}</span>
          <span>{Math.abs(delta).toFixed(1)}%</span>
          {deltaLabel ? <span className="text-white/60">· {deltaLabel}</span> : null}
        </div>
      ) : (
        <div className="mt-3 h-[20px]" />
      )}
    </div>
  );
  return href ? <Link href={href} className="block h-full">{inner}</Link> : inner;
}

// ---------------------------------------------------------------------------
// Sparkline — inline SVG of a daily series. No axes, no library. Fits in a
// card. Renders area fill + line for visual weight. Skips empty rendering
// gracefully when the dataset is all zeros.
// ---------------------------------------------------------------------------
export function Sparkline({ points = [], height = 56, color = "#0b2a5a", fillOpacity = 0.12 }) {
  if (points.length === 0) return null;
  const values = points.map((p) => (typeof p === "number" ? p : Number(p?.value ?? p?.total ?? 0)));
  const max = Math.max(...values, 1);
  const min = 0; // zero-floored so a flat zero day reads as "no revenue"
  const range = max - min || 1;
  const w = 100 / Math.max(values.length - 1, 1);

  const coords = values.map((v, i) => {
    const x = i * w;
    const y = ((max - v) / range) * height;
    return [x, y];
  });

  const linePath = coords.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(" ");
  const areaPath = `${linePath} L${coords[coords.length - 1][0]},${height} L0,${height} Z`;

  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      <path d={areaPath} fill={color} fillOpacity={fillOpacity} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// RevenueIntelligence — sparkline + last-7 vs prev-7 + 30-day total + top jobs.
// Self-contained card; takes the data shape from fetchDashboardSnapshot.
// ---------------------------------------------------------------------------
export function RevenueIntelligence({
  revenueLast7,
  revenuePrev7,
  revenueLast30,
  revenueDaily14 = [],
  topJobs7 = [],
}) {
  const wow = formatPct(revenueLast7, revenuePrev7);
  const wowTone =
    wow == null ? "text-neutral-400" : wow > 0 ? "text-emerald-700" : wow < 0 ? "text-rose-700" : "text-neutral-500";
  const wowArrow = wow == null ? "" : wow > 0 ? "↑" : wow < 0 ? "↓" : "→";

  const sparkPoints = (revenueDaily14 || []).map((d) => Number(d.total) || 0);
  const peak = sparkPoints.length ? Math.max(...sparkPoints) : 0;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-card">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className={`${lato.className} text-base font-bold text-neutral-900`}>Revenue Intelligence</h2>
          <p className="text-[11px] text-neutral-500">From daily Jobs reports — totals come from the source documents.</p>
        </div>
        <Link
          href="/admin/revenue-reports"
          className="rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-neutral-700 hover:bg-neutral-50"
        >
          Open
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">Last 7 Days</div>
              <div className={`${lato.className} mt-0.5 text-2xl font-black text-neutral-900`}>
                {formatMoney(revenueLast7)}
              </div>
              {wow != null ? (
                <div className={`mt-0.5 text-[11px] font-semibold ${wowTone}`}>
                  {wowArrow} {Math.abs(wow).toFixed(1)}% vs prior 7
                </div>
              ) : (
                <div className="mt-0.5 text-[11px] text-neutral-400">No prior week data</div>
              )}
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">Prior 7 Days</div>
              <div className={`${lato.className} mt-0.5 text-2xl font-black text-neutral-700`}>
                {formatMoney(revenuePrev7)}
              </div>
              <div className="mt-0.5 text-[11px] text-neutral-400">Days 8–14 ago</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">Last 30 Days</div>
              <div className={`${lato.className} mt-0.5 text-2xl font-black text-neutral-700`}>
                {formatMoney(revenueLast30)}
              </div>
              <div className="mt-0.5 text-[11px] text-neutral-400">Rolling window</div>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wide text-neutral-400">
              <span>Daily Revenue · Last 14 Days</span>
              {peak > 0 ? <span>peak {formatMoney(peak, { compact: true })}</span> : null}
            </div>
            {peak > 0 ? (
              <Sparkline points={sparkPoints} />
            ) : (
              <div className="rounded-md border border-dashed border-neutral-200 bg-neutral-50 px-3 py-4 text-center text-[11px] text-neutral-500">
                No revenue uploads in the last 14 days. Drop a daily Jobs .docx into{" "}
                <Link href="/admin/revenue-reports" className="font-semibold text-brand underline">
                  Revenue Reports
                </Link>{" "}
                to start the trendline.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">Top Jobs · Last 7 Days</h3>
            <span className="text-[10px] text-neutral-400">{topJobs7.length} of top 5</span>
          </div>
          {topJobs7.length === 0 ? (
            <p className="py-4 text-center text-[11px] text-neutral-500">No revenue data yet.</p>
          ) : (
            <ol className="space-y-2">
              {topJobs7.map((j, idx) => (
                <li key={`${j.job_number || j.job_name}-${idx}`} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[10px] font-bold text-neutral-400">#{idx + 1}</span>
                      <span className="font-mono text-[11px] text-neutral-700">{j.job_number || "—"}</span>
                    </div>
                    <div className="truncate text-xs font-semibold text-neutral-900">
                      {j.job_name || "(no name)"}
                    </div>
                    {j.customer_name ? (
                      <div className="truncate text-[10px] text-neutral-500">{j.customer_name}</div>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-mono text-sm font-bold text-neutral-900 tabular-nums">
                      {formatMoney(j.total)}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// OperationsStatus — replaces the hand-wavy health ring. Shows specific,
// concrete signals with traffic-light colors. Each row is clickable to its
// remediation page.
// ---------------------------------------------------------------------------
export function OperationsStatus({
  hasTodaySchedule,
  todayFinalized,
  todayScheduledJobsCount,
  todayReportsCount,
  expiredCertsCount,
  expiringCertsCount,
  pendingScheduleRequestsCount,
  pendingChangeOrdersCount,
  incompleteActiveCount,
  staleActiveCount,
}) {
  const missingReports = Math.max(0, (todayScheduledJobsCount || 0) - (todayReportsCount || 0));

  const items = [
    {
      label: "Today's schedule",
      tone: !hasTodaySchedule ? "rose" : todayFinalized ? "emerald" : "amber",
      detail: !hasTodaySchedule
        ? "Not built yet"
        : todayFinalized
        ? "Finalized & emailed"
        : "Built, not finalized",
      href: "/admin/crew-scheduler",
    },
    {
      label: "Daily reports",
      tone: missingReports > 0 ? "amber" : "emerald",
      detail:
        todayScheduledJobsCount > 0
          ? `${todayReportsCount || 0} of ${todayScheduledJobsCount} jobs reported`
          : "No jobs scheduled today",
      href: "/admin/field-reports",
    },
    {
      label: "Certifications",
      tone: expiredCertsCount > 0 ? "rose" : expiringCertsCount > 0 ? "amber" : "emerald",
      detail:
        expiredCertsCount > 0
          ? `${expiredCertsCount} expired`
          : expiringCertsCount > 0
          ? `${expiringCertsCount} expiring ≤30d`
          : "All current",
      href: "/admin/certifications",
    },
    {
      label: "Schedule requests",
      tone: pendingScheduleRequestsCount > 0 ? "amber" : "emerald",
      detail:
        pendingScheduleRequestsCount > 0
          ? `${pendingScheduleRequestsCount} pending`
          : "Inbox clear",
      href: "/admin/schedule-requests",
    },
    {
      label: "Change orders",
      tone: pendingChangeOrdersCount > 0 ? "amber" : "emerald",
      detail:
        pendingChangeOrdersCount > 0
          ? `${pendingChangeOrdersCount} awaiting approval`
          : "All approved",
      href: "/admin/change-orders",
    },
    {
      label: "Job completeness",
      tone: incompleteActiveCount > 5 ? "amber" : incompleteActiveCount > 0 ? "amber" : "emerald",
      detail:
        incompleteActiveCount > 0
          ? `${incompleteActiveCount} active jobs incomplete`
          : "All active jobs complete",
      href: "/admin/jobs",
    },
    staleActiveCount > 0 && {
      label: "Stale active jobs",
      tone: "neutral",
      detail: `${staleActiveCount} flagged active but no schedule in 30d — review`,
      href: "/admin/jobs?activeFilter=all",
    },
  ].filter(Boolean);

  const tones = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    neutral: "bg-neutral-300",
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-card">
      <h2 className={`${lato.className} mb-3 text-base font-bold text-neutral-900`}>Operations</h2>
      <ul className="divide-y divide-neutral-100">
        {items.map((item, i) => (
          <li key={i}>
            <Link
              href={item.href}
              className="group flex items-center justify-between gap-3 py-2 transition-colors hover:bg-neutral-50 rounded -mx-2 px-2"
            >
              <div className="flex items-center gap-2.5">
                <span className={`h-2 w-2 shrink-0 rounded-full ${tones[item.tone]}`} />
                <span className="text-sm font-semibold text-neutral-900">{item.label}</span>
              </div>
              <div className="text-right">
                <span className="text-[12px] text-neutral-600 group-hover:text-neutral-900">{item.detail}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ActionQueue — focused list of items that need human attention. Replaces
// the older catch-all action items strip. Each chip shows count + label and
// links to the remediation page.
// ---------------------------------------------------------------------------
export function ActionQueue({ items = [] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
        <div className={`${lato.className} text-base font-bold text-emerald-800`}>All caught up</div>
        <p className="mt-1 text-xs text-emerald-700">Nothing in the action queue right now.</p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-card">
      <h2 className={`${lato.className} mb-3 text-base font-bold text-neutral-900`}>Action Queue</h2>
      <div className="flex flex-wrap gap-2">
        {items.map((it, i) => {
          const tones = {
            rose: "border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100",
            amber: "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100",
            blue: "border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100",
          };
          const cls = tones[it.tone] || tones.amber;
          return (
            <Link
              key={i}
              href={it.href}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${cls}`}
            >
              <span className="font-mono text-sm font-black">{it.count}</span>
              <span>{it.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
