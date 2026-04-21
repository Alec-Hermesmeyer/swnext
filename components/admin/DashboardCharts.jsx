"use client";
import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

/* ── Shared palette & helpers ─────────────────────────────────────── */

const BRAND = "#0b2a5a";
const PALETTE = {
  blue: { bg: "rgba(11,42,90,0.75)", border: BRAND },
  emerald: { bg: "rgba(16,185,129,0.75)", border: "#10b981" },
  amber: { bg: "rgba(245,158,11,0.75)", border: "#f59e0b" },
  violet: { bg: "rgba(139,92,246,0.75)", border: "#8b5cf6" },
  rose: { bg: "rgba(244,63,94,0.75)", border: "#f43f5e" },
  sky: { bg: "rgba(14,165,233,0.75)", border: "#0ea5e9" },
  neutral: { bg: "rgba(163,163,163,0.65)", border: "#a3a3a3" },
};

const SALES_STAGE_COLORS = {
  qualify: PALETTE.sky,
  pursuing: PALETTE.blue,
  quoted: PALETTE.amber,
  negotiation: PALETTE.violet,
  won: PALETTE.emerald,
  lost: PALETTE.rose,
};

const HIRING_STAGE_COLORS = {
  new: PALETTE.sky,
  reviewing: PALETTE.blue,
  interview: PALETTE.amber,
  offer: PALETTE.violet,
  hired: PALETTE.emerald,
  declined: PALETTE.rose,
};

const CHART_FONT = { family: "'Lato', sans-serif", size: 11, weight: "600" };

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { font: CHART_FONT, padding: 12, usePointStyle: true, pointStyleWidth: 8 } },
    tooltip: {
      backgroundColor: "#1e293b",
      titleFont: { ...CHART_FONT, size: 12 },
      bodyFont: { ...CHART_FONT, weight: "400" },
      padding: 10,
      cornerRadius: 8,
      displayColors: true,
      boxPadding: 4,
    },
  },
};

/* ── 1. Sales Pipeline — Doughnut ─────────────────────────────────── */

export function SalesPipelineChart({ salesOpps = [] }) {
  const { labels, data, bgColors, borderColors } = useMemo(() => {
    const stageOrder = ["qualify", "pursuing", "quoted", "negotiation", "won", "lost"];
    const stageLabels = { qualify: "Qualify", pursuing: "Pursuing", quoted: "Quoted", negotiation: "Negotiation", won: "Won", lost: "Lost" };
    const counts = {};
    for (const o of salesOpps) {
      counts[o.stage] = (counts[o.stage] || 0) + 1;
    }
    const active = stageOrder.filter((s) => counts[s]);
    return {
      labels: active.map((s) => stageLabels[s] || s),
      data: active.map((s) => counts[s]),
      bgColors: active.map((s) => (SALES_STAGE_COLORS[s] || PALETTE.neutral).bg),
      borderColors: active.map((s) => (SALES_STAGE_COLORS[s] || PALETTE.neutral).border),
    };
  }, [salesOpps]);

  if (!data.length) return <EmptyState label="No sales data" />;

  return (
    <ChartCard title="Sales Pipeline" subtitle="Deals by stage">
      <div className="h-56">
        <Doughnut
          data={{
            labels,
            datasets: [{ data, backgroundColor: bgColors, borderColor: borderColors, borderWidth: 2, hoverOffset: 6 }],
          }}
          options={{
            ...baseOptions,
            cutout: "60%",
            plugins: {
              ...baseOptions.plugins,
              legend: { ...baseOptions.plugins.legend, position: "right" },
            },
          }}
        />
      </div>
    </ChartCard>
  );
}

/* ── 2. Hiring Pipeline — Doughnut ────────────────────────────────── */

export function HiringPipelineChart({ hiring = [] }) {
  const { labels, data, bgColors, borderColors } = useMemo(() => {
    const stageOrder = ["new", "reviewing", "interview", "offer", "hired", "declined"];
    const stageLabels = { new: "New", reviewing: "Reviewing", interview: "Interview", offer: "Offer", hired: "Hired", declined: "Declined" };
    const counts = {};
    for (const h of hiring) {
      counts[h.stage] = (counts[h.stage] || 0) + 1;
    }
    const active = stageOrder.filter((s) => counts[s]);
    return {
      labels: active.map((s) => stageLabels[s] || s),
      data: active.map((s) => counts[s]),
      bgColors: active.map((s) => (HIRING_STAGE_COLORS[s] || PALETTE.neutral).bg),
      borderColors: active.map((s) => (HIRING_STAGE_COLORS[s] || PALETTE.neutral).border),
    };
  }, [hiring]);

  if (!data.length) return <EmptyState label="No hiring data" />;

  return (
    <ChartCard title="Hiring Pipeline" subtitle="Candidates by stage">
      <div className="h-56">
        <Doughnut
          data={{
            labels,
            datasets: [{ data, backgroundColor: bgColors, borderColor: borderColors, borderWidth: 2, hoverOffset: 6 }],
          }}
          options={{
            ...baseOptions,
            cutout: "60%",
            plugins: {
              ...baseOptions.plugins,
              legend: { ...baseOptions.plugins.legend, position: "right" },
            },
          }}
        />
      </div>
    </ChartCard>
  );
}

/* ── 3. Pipeline Value by Stage — Horizontal Bar ──────────────────── */

export function PipelineValueChart({ salesOpps = [] }) {
  const { labels, values, bgColors } = useMemo(() => {
    const stageOrder = ["qualify", "pursuing", "quoted", "negotiation", "won"];
    const stageLabels = { qualify: "Qualify", pursuing: "Pursuing", quoted: "Quoted", negotiation: "Negotiation", won: "Won" };
    const sums = {};
    for (const o of salesOpps) {
      if (o.stage === "lost") continue;
      sums[o.stage] = (sums[o.stage] || 0) + (Number(o.value_estimate) || 0);
    }
    const active = stageOrder.filter((s) => sums[s]);
    return {
      labels: active.map((s) => stageLabels[s] || s),
      values: active.map((s) => sums[s]),
      bgColors: active.map((s) => (SALES_STAGE_COLORS[s] || PALETTE.neutral).bg),
    };
  }, [salesOpps]);

  if (!values.length) return <EmptyState label="No pipeline value data" />;

  return (
    <ChartCard title="Pipeline Value" subtitle="Dollar value by stage">
      <div className="h-56">
        <Bar
          data={{
            labels,
            datasets: [{
              label: "Value ($)",
              data: values,
              backgroundColor: bgColors,
              borderRadius: 6,
              borderSkipped: false,
            }],
          }}
          options={{
            ...baseOptions,
            indexAxis: "y",
            plugins: {
              ...baseOptions.plugins,
              legend: { display: false },
              tooltip: {
                ...baseOptions.plugins.tooltip,
                callbacks: {
                  label: (ctx) => `$${Number(ctx.raw).toLocaleString()}`,
                },
              },
            },
            scales: {
              x: {
                grid: { color: "rgba(0,0,0,0.04)" },
                ticks: {
                  font: CHART_FONT,
                  color: "#a3a3a3",
                  callback: (v) => `$${(v / 1000).toFixed(0)}k`,
                },
              },
              y: {
                grid: { display: false },
                ticks: { font: CHART_FONT, color: "#525252" },
              },
            },
          }}
        />
      </div>
    </ChartCard>
  );
}

/* ── 4. Active Jobs by Status — Bar ───────────────────────────────── */

export function JobStatusChart({ jobStatusCounts = {} }) {
  const { labels, values, bgColors } = useMemo(() => {
    const statusConfig = {
      in_progress: { label: "In Progress", color: PALETTE.blue },
      awarded: { label: "Awarded", color: PALETTE.amber },
      completed: { label: "Completed", color: PALETTE.emerald },
      pending: { label: "Pending", color: PALETTE.violet },
      on_hold: { label: "On Hold", color: PALETTE.rose },
    };
    const entries = Object.entries(jobStatusCounts).filter(([, v]) => v > 0);
    if (!entries.length) return { labels: [], values: [], bgColors: [] };

    // Sort by value descending
    entries.sort((a, b) => b[1] - a[1]);
    return {
      labels: entries.map(([k]) => statusConfig[k]?.label || k.replace(/_/g, " ")),
      values: entries.map(([, v]) => v),
      bgColors: entries.map(([k]) => (statusConfig[k]?.color || PALETTE.neutral).bg),
    };
  }, [jobStatusCounts]);

  if (!values.length) return <EmptyState label="No job data" />;

  return (
    <ChartCard title="Active Jobs" subtitle="Distribution by status">
      <div className="h-56">
        <Bar
          data={{
            labels,
            datasets: [{
              label: "Jobs",
              data: values,
              backgroundColor: bgColors,
              borderRadius: 6,
              borderSkipped: false,
              maxBarThickness: 48,
            }],
          }}
          options={{
            ...baseOptions,
            plugins: { ...baseOptions.plugins, legend: { display: false } },
            scales: {
              x: { grid: { display: false }, ticks: { font: CHART_FONT, color: "#525252" } },
              y: {
                beginAtZero: true,
                grid: { color: "rgba(0,0,0,0.04)" },
                ticks: { font: CHART_FONT, color: "#a3a3a3", stepSize: 1 },
              },
            },
          }}
        />
      </div>
    </ChartCard>
  );
}

/* ── 5. Leads & Applications Trend — Line ─────────────────────────── */

export function LeadsTrendChart({ weeklyLeads = [], weeklyApps = [] }) {
  const chartData = useMemo(() => {
    // Both arrays should have same length of week labels
    const len = Math.max(weeklyLeads.length, weeklyApps.length);
    if (!len) return null;

    // Build labels like "Week 1", "Week 2" etc. going back from current
    const labels = [];
    for (let i = len - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 7 * 86400000);
      labels.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
    }

    return {
      labels,
      datasets: [
        {
          label: "Leads",
          data: weeklyLeads,
          borderColor: PALETTE.violet.border,
          backgroundColor: "rgba(139,92,246,0.1)",
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: PALETTE.violet.border,
          borderWidth: 2,
        },
        {
          label: "Applications",
          data: weeklyApps,
          borderColor: PALETTE.rose.border,
          backgroundColor: "rgba(244,63,94,0.1)",
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: PALETTE.rose.border,
          borderWidth: 2,
        },
      ],
    };
  }, [weeklyLeads, weeklyApps]);

  if (!chartData) return <EmptyState label="No lead or application data" />;

  return (
    <ChartCard title="Leads & Applications" subtitle="Weekly trend (last 6 weeks)">
      <div className="h-56">
        <Line
          data={chartData}
          options={{
            ...baseOptions,
            plugins: {
              ...baseOptions.plugins,
              legend: { ...baseOptions.plugins.legend, position: "top" },
            },
            scales: {
              x: { grid: { display: false }, ticks: { font: CHART_FONT, color: "#a3a3a3" } },
              y: {
                beginAtZero: true,
                grid: { color: "rgba(0,0,0,0.04)" },
                ticks: { font: CHART_FONT, color: "#a3a3a3", stepSize: 1 },
              },
            },
          }}
        />
      </div>
    </ChartCard>
  );
}

/* ── 6. Crew Overview — Stacked summary bar ───────────────────────── */

export function CrewOverviewChart({ activeWorkers = 0, activeJobs = 0, todayScheduledJobs = 0 }) {
  if (!activeWorkers && !activeJobs && !todayScheduledJobs) return <EmptyState label="No crew data" />;

  return (
    <ChartCard title="Crew Overview" subtitle="Current workforce snapshot">
      <div className="h-56">
        <Bar
          data={{
            labels: ["Crew Members", "Active Jobs", "Today's Jobs"],
            datasets: [{
              label: "Count",
              data: [activeWorkers, activeJobs, todayScheduledJobs],
              backgroundColor: [PALETTE.emerald.bg, PALETTE.blue.bg, PALETTE.amber.bg],
              borderRadius: 6,
              borderSkipped: false,
              maxBarThickness: 56,
            }],
          }}
          options={{
            ...baseOptions,
            plugins: { ...baseOptions.plugins, legend: { display: false } },
            scales: {
              x: { grid: { display: false }, ticks: { font: CHART_FONT, color: "#525252" } },
              y: {
                beginAtZero: true,
                grid: { color: "rgba(0,0,0,0.04)" },
                ticks: { font: CHART_FONT, color: "#a3a3a3", stepSize: 1 },
              },
            },
          }}
        />
      </div>
    </ChartCard>
  );
}

/* ── Shared wrappers ──────────────────────────────────────────────── */

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 transition-shadow hover:shadow-md">
      <div className="mb-3">
        <h3 className="text-sm font-bold text-neutral-900">{title}</h3>
        {subtitle && <p className="text-[11px] text-neutral-400">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ label }) {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/50 p-5">
      <div className="flex h-40 items-center justify-center text-sm text-neutral-400">{label}</div>
    </div>
  );
}
