"use client";
import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import withAuthTw from "@/components/withAuthTw";
import TWAdminLayout from "@/components/TWAdminLayout";
import supabase from "@/components/Supabase";
import { useAuth } from "@/context/AuthContext";
import { readCachedValue, writeCachedValue } from "@/lib/client-cache";
import { Lato } from "next/font/google";

/* Chart components — loaded client-side only (Chart.js needs <canvas>) */
const SalesPipelineChart = dynamic(() => import("@/components/admin/DashboardCharts").then((m) => m.SalesPipelineChart), { ssr: false });
const HiringPipelineChart = dynamic(() => import("@/components/admin/DashboardCharts").then((m) => m.HiringPipelineChart), { ssr: false });
const PipelineValueChart = dynamic(() => import("@/components/admin/DashboardCharts").then((m) => m.PipelineValueChart), { ssr: false });
const JobStatusChart = dynamic(() => import("@/components/admin/DashboardCharts").then((m) => m.JobStatusChart), { ssr: false });
const LeadsTrendChart = dynamic(() => import("@/components/admin/DashboardCharts").then((m) => m.LeadsTrendChart), { ssr: false });
const CrewOverviewChart = dynamic(() => import("@/components/admin/DashboardCharts").then((m) => m.CrewOverviewChart), { ssr: false });

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });
const DASHBOARD_CACHE_KEY = "admin-dashboard-data";
const DASHBOARD_CACHE_TTL_MS = 5 * 60 * 1000;

function getGreeting(name) {
  const hour = new Date().getHours();
  const period = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return name ? `${period}, ${name}` : period;
}

function TodayCard({ label, value, hint, tone = "blue", href }) {
  const tones = {
    blue: { bar: "bg-blue-500", accent: "text-blue-700", bgSoft: "bg-blue-50" },
    emerald: { bar: "bg-emerald-500", accent: "text-emerald-700", bgSoft: "bg-emerald-50" },
    amber: { bar: "bg-amber-500", accent: "text-amber-700", bgSoft: "bg-amber-50" },
    rose: { bar: "bg-rose-500", accent: "text-rose-700", bgSoft: "bg-rose-50" },
    neutral: { bar: "bg-neutral-400", accent: "text-neutral-600", bgSoft: "bg-neutral-50" },
  };
  const t = tones[tone] || tones.blue;
  const content = (
    <div className={`group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 transition-all hover:shadow-card-hover ${href ? "cursor-pointer" : ""}`}>
      <div className={`absolute left-0 top-0 h-full w-1 ${t.bar}`} />
      <div className="flex-1 pl-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">{label}</p>
        <p className={`${lato.className} mt-1 text-2xl font-black text-neutral-900`}>{value}</p>
        {hint ? <p className={`mt-1 text-[11px] font-semibold ${t.accent}`}>{hint}</p> : null}
      </div>
      {href ? (
        <svg className="h-4 w-4 text-neutral-300 transition-all group-hover:text-neutral-500 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      ) : null}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

function StatCard({ label, value, change, changeLabel, icon, href, color = "blue" }) {
  const colors = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    violet: "bg-violet-50 text-violet-700 border-violet-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
    sky: "bg-sky-50 text-sky-700 border-sky-100",
  };
  const tone = colors[color] || colors.blue;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-wider text-neutral-400">{label}</div>
          <div className={`${lato.className} mt-1.5 text-3xl font-black text-neutral-900`}>{value}</div>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${tone}`}>
          {icon}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        {change !== undefined && change !== null ? (
          <span className={`text-xs font-semibold ${change >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {change >= 0 ? "+" : ""}{change} {changeLabel || "this week"}
          </span>
        ) : (
          <span />
        )}
        {href && (
          <Link href={href} className="text-xs font-semibold text-[#0b2a5a] hover:text-[#0b2a5a]/70 transition-colors">
            View all →
          </Link>
        )}
      </div>
    </div>
  );
}

function HealthRing({ score, label }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const ringColor = score >= 80 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-24 w-24 shrink-0">
        <svg className="h-24 w-24 -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r={radius} strokeWidth="6" stroke="#e5e7eb" fill="none" />
          <circle
            cx="48" cy="48" r={radius} strokeWidth="6" stroke={ringColor} fill="none"
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${lato.className} text-2xl font-black text-neutral-900`}>{score}</span>
        </div>
      </div>
      <div>
        <div className="text-sm font-bold text-neutral-900">{label}</div>
        <div className="mt-0.5 text-xs text-neutral-500">
          {score >= 80 ? "Healthy" : score >= 50 ? "Needs attention" : "Action required"}
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ label, detail, time, status }) {
  const statusColors = {
    new: "bg-blue-500",
    active: "bg-emerald-500",
    pending: "bg-amber-500",
    completed: "bg-neutral-400",
  };

  return (
    <div className="flex items-start gap-3 py-3">
      <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${statusColors[status] || "bg-neutral-300"}`} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-neutral-800">{label}</div>
        {detail && <div className="mt-0.5 text-xs text-neutral-500">{detail}</div>}
      </div>
      <div className="shrink-0 text-[11px] text-neutral-400">{time}</div>
    </div>
  );
}

async function fetchDashboardSnapshot() {
  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
  const thirtyDaysOut = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

  const [
    { count: activeJobs },
    { count: totalJobs },
    { data: recentJobs },
    { count: activeWorkers },
    { data: todaySchedule },
    { count: contactSubs },
    { count: recentContactSubs },
    { count: jobApps },
    { count: recentJobApps },
    { data: salesOpps },
    { data: hiringRows },
    { count: socialPosts },
    { data: recentSubmissions },
  ] = await Promise.all([
    supabase.from("crew_jobs").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("crew_jobs").select("*", { count: "exact", head: true }),
    supabase.from("crew_jobs").select("id, job_name, job_number, customer_name, job_status, bid_amount, contract_amount, created_at").eq("is_active", true).order("created_at", { ascending: false }).limit(5),
    supabase.from("crew_workers").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("crew_schedules").select("id, is_finalized").eq("schedule_date", today).limit(1),
    supabase.from("contact_form").select("*", { count: "exact", head: true }),
    supabase.from("contact_form").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
    supabase.from("job_form").select("*", { count: "exact", head: true }),
    supabase.from("job_form").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
    supabase.from("sales_opportunities").select("id, title, company, stage, value_estimate, updated_at").order("updated_at", { ascending: false }).limit(50),
    supabase.from("hiring_opportunities").select("id, title, applicant_name, stage, position_applied, updated_at").order("created_at", { ascending: false }).limit(20),
    supabase.from("social_posts").select("*", { count: "exact", head: true }),
    supabase.from("contact_form").select("name, email, message, created_at").order("created_at", { ascending: false }).limit(5),
  ]);

  const opps = salesOpps || [];
  const pipelineValue = opps
    .filter((o) => o.stage !== "lost")
    .reduce((sum, o) => sum + (Number(o.value_estimate) || 0), 0);
  const wonCount = opps.filter((o) => o.stage === "won").length;
  const activeOpps = opps.filter((o) => !["won", "lost"].includes(o.stage)).length;
  const hiring = hiringRows || [];
  const activeHiring = hiring.filter((h) => !["hired", "declined"].includes(h.stage)).length;

  // Field-ops signals — wrapped so a missing table (pre-migration) doesn't break the dashboard
  let todayReportsCount = 0;
  let todayScheduledJobsCount = 0;
  let expiringCertsCount = 0;
  let expiredCertsCount = 0;
  let pendingScheduleRequestsCount = 0;
  let pendingChangeOrdersCount = 0;
  let pendingChangeOrdersValue = 0;
  let totalActiveContract = 0;

  try {
    const scheduleIds = (todaySchedule || []).map((s) => s.id).filter(Boolean);
    if (scheduleIds.length > 0) {
      const { data: todayAssignments } = await supabase
        .from("crew_assignments")
        .select("job_id")
        .in("schedule_id", scheduleIds);
      const distinctJobs = new Set((todayAssignments || []).map((a) => a.job_id).filter(Boolean));
      todayScheduledJobsCount = distinctJobs.size;
    }

    const [reportResult, expiringResult, expiredResult] = await Promise.allSettled([
      supabase
        .from("crew_daily_reports")
        .select("job_id", { count: "exact", head: false })
        .eq("report_date", today),
      supabase
        .from("crew_worker_certifications")
        .select("*", { count: "exact", head: true })
        .gte("expires_date", today)
        .lte("expires_date", thirtyDaysOut),
      supabase
        .from("crew_worker_certifications")
        .select("*", { count: "exact", head: true })
        .lt("expires_date", today),
    ]);

    if (reportResult.status === "fulfilled" && !reportResult.value.error) {
      const reportRows = reportResult.value.data || [];
      todayReportsCount = new Set(reportRows.map((r) => r.job_id).filter(Boolean)).size;
    }
    if (expiringResult.status === "fulfilled" && !expiringResult.value.error) {
      expiringCertsCount = expiringResult.value.count || 0;
    }
    if (expiredResult.status === "fulfilled" && !expiredResult.value.error) {
      expiredCertsCount = expiredResult.value.count || 0;
    }

    // Action-item queue sizes (graceful fallback if tables missing)
    const [schedReqResult, coResult] = await Promise.allSettled([
      supabase
        .from("schedule_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("change_orders")
        .select("amount, status")
        .in("status", ["pending", "submitted"]),
    ]);
    if (schedReqResult.status === "fulfilled" && !schedReqResult.value.error) {
      pendingScheduleRequestsCount = schedReqResult.value.count || 0;
    }
    if (coResult.status === "fulfilled" && !coResult.value.error) {
      const rows = coResult.value.data || [];
      pendingChangeOrdersCount = rows.length;
      pendingChangeOrdersValue = rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    }

    // Total active contract backlog — one aggregated select (not limited to 5)
    const { data: backlogRows } = await supabase
      .from("crew_jobs")
      .select("contract_amount")
      .eq("is_active", true);
    totalActiveContract = (backlogRows || []).reduce((sum, j) => sum + (Number(j.contract_amount) || 0), 0);
  } catch {
    // Silent — field-ops tables may not exist yet before migrations run
  }

  // ── Chart-specific data ──────────────────────────────────────────
  // Job status distribution (for bar chart)
  let jobStatusCounts = {};
  try {
    const { data: allActiveJobs } = await supabase
      .from("crew_jobs")
      .select("job_status")
      .eq("is_active", true);
    for (const j of allActiveJobs || []) {
      const status = j.job_status || "active";
      jobStatusCounts[status] = (jobStatusCounts[status] || 0) + 1;
    }
  } catch { /* silent */ }

  // Weekly lead & application counts (last 6 weeks, for line chart)
  let weeklyLeads = [];
  let weeklyApps = [];
  try {
    const weeks = 6;
    const leadCounts = [];
    const appCounts = [];
    for (let i = weeks - 1; i >= 0; i--) {
      const wStart = new Date(Date.now() - (i + 1) * 7 * 86400000).toISOString();
      const wEnd = new Date(Date.now() - i * 7 * 86400000).toISOString();
      const [leadRes, appRes] = await Promise.all([
        supabase.from("contact_form").select("*", { count: "exact", head: true }).gte("created_at", wStart).lt("created_at", wEnd),
        supabase.from("job_form").select("*", { count: "exact", head: true }).gte("created_at", wStart).lt("created_at", wEnd),
      ]);
      leadCounts.push(leadRes.count || 0);
      appCounts.push(appRes.count || 0);
    }
    weeklyLeads = leadCounts;
    weeklyApps = appCounts;
  } catch { /* silent */ }

  return {
    activeJobs: activeJobs || 0,
    totalJobs: totalJobs || 0,
    recentJobs: recentJobs || [],
    activeWorkers: activeWorkers || 0,
    todayFinalized: todaySchedule?.[0]?.is_finalized || false,
    hasTodaySchedule: (todaySchedule || []).length > 0,
    contactSubs: contactSubs || 0,
    recentContactSubs: recentContactSubs || 0,
    jobApps: jobApps || 0,
    recentJobApps: recentJobApps || 0,
    pipelineValue,
    wonCount,
    activeOpps,
    totalOpps: opps.length,
    activeHiring,
    totalHiring: hiring.length,
    socialPosts: socialPosts || 0,
    recentSubmissions: recentSubmissions || [],
    hiring,
    salesOpps: opps,
    todayReportsCount,
    todayScheduledJobsCount,
    expiringCertsCount,
    expiredCertsCount,
    pendingScheduleRequestsCount,
    pendingChangeOrdersCount,
    pendingChangeOrdersValue,
    totalActiveContract,
    jobStatusCounts,
    weeklyLeads,
    weeklyApps,
  };
}

function DashboardTW() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const firstName = useMemo(() => {
    const name = profile?.full_name || profile?.username || "";
    return name.split(" ")[0] || "";
  }, [profile]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const cached = readCachedValue(DASHBOARD_CACHE_KEY, DASHBOARD_CACHE_TTL_MS);
        if (cached?.value && active) {
          setData(cached.value);
          setLoading(false);
          setLastUpdatedAt(cached.savedAt || null);
        }

        const nextData = await fetchDashboardSnapshot();
        if (!active) return;
        setData(nextData);
        writeCachedValue(DASHBOARD_CACHE_KEY, nextData);
        setLastUpdatedAt(Date.now());
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        if (active) setLoading(false);
        if (active) setRefreshing(false);
      }
    };

    load();
    return () => { active = false; };
  }, []);

  // Calculate health score from real metrics
  const healthScore = useMemo(() => {
    if (!data) return 0;
    let score = 50; // base
    if (data.hasTodaySchedule) score += 10;
    if (data.todayFinalized) score += 10;
    if (data.activeJobs > 0) score += 10;
    if (data.activeOpps > 0) score += 5;
    if (data.recentContactSubs > 0 || data.recentJobApps > 0) score += 5;
    if (data.activeHiring > 0) score += 5;
    if (data.socialPosts > 0) score += 5;
    return Math.min(score, 100);
  }, [data]);

  const healthLabel = useMemo(() => {
    if (healthScore >= 80) return "Operations Healthy";
    if (healthScore >= 60) return "Needs Attention";
    return "Action Required";
  }, [healthScore]);

  const money = (n) =>
    n != null
      ? Number(n).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
      : "$0";

  const timeAgo = (iso) => {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const nextData = await fetchDashboardSnapshot();
      setData(nextData);
      writeCachedValue(DASHBOARD_CACHE_KEY, nextData);
      setLastUpdatedAt(Date.now());
    } catch (err) {
      console.error("Dashboard refresh error:", err);
    } finally {
      setRefreshing(false);
    }
  };

  // Derive action items — only shown when something actually needs attention
  const actionItems = useMemo(() => {
    if (!data) return [];
    const missingReports = Math.max(0, (data.todayScheduledJobsCount || 0) - (data.todayReportsCount || 0));
    const items = [
      data.pendingScheduleRequestsCount > 0 && {
        label: "Schedule requests pending",
        count: data.pendingScheduleRequestsCount,
        href: "/admin/schedule-requests",
        tone: "amber",
      },
      data.expiredCertsCount > 0 && {
        label: "Certs expired",
        count: data.expiredCertsCount,
        href: "/admin/certifications",
        tone: "rose",
      },
      data.expiringCertsCount > 0 && {
        label: "Certs expiring ≤30d",
        count: data.expiringCertsCount,
        href: "/admin/certifications",
        tone: "amber",
      },
      missingReports > 0 && {
        label: "Jobs missing today's report",
        count: missingReports,
        href: "/admin/field-reports",
        tone: "amber",
      },
      data.pendingChangeOrdersCount > 0 && {
        label: "Change orders awaiting approval",
        count: data.pendingChangeOrdersCount,
        href: "/admin/change-orders",
        tone: "amber",
      },
    ].filter(Boolean);
    return items;
  }, [data]);

  const todayTone = useMemo(() => {
    if (!data) return "neutral";
    if (data.todayScheduledJobsCount === 0) return "neutral";
    if (data.todayReportsCount >= data.todayScheduledJobsCount) return "emerald";
    if (data.todayReportsCount > 0) return "amber";
    return "rose";
  }, [data]);

  return (
    <>
      <Head>
        <title>Dashboard | Admin</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div>
        {/* ── Hero: compact greeting + 3 KPI tiles ── */}
        <header className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className={`${lato.className} text-2xl font-black text-neutral-900`}>
                {getGreeting(firstName)}
              </h1>
              <p className="mt-0.5 text-sm text-neutral-500">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </p>
              {lastUpdatedAt ? (
                <p className="mt-0.5 text-[11px] text-neutral-400">
                  Updated {new Date(lastUpdatedAt).toLocaleTimeString()}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 disabled:opacity-60"
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {!loading && data ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {/* Backlog */}
              <Link
                href="/admin/job-costs"
                className="group block rounded-xl border border-neutral-200 bg-gradient-to-br from-brand/5 to-white p-4 transition-all hover:shadow-card-hover hover:border-brand/30"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-400">Active Backlog</p>
                <p className={`${lato.className} mt-1 text-3xl font-black text-brand`}>{money(data.totalActiveContract)}</p>
                <p className="mt-1 text-xs font-semibold text-neutral-500">
                  {data.activeJobs} active job{data.activeJobs === 1 ? "" : "s"} <span className="text-brand transition-transform group-hover:translate-x-0.5 inline-block">→</span>
                </p>
              </Link>
              {/* Pipeline */}
              <Link
                href="/admin/sales"
                className="group block rounded-xl border border-neutral-200 bg-gradient-to-br from-amber-50 to-white p-4 transition-all hover:shadow-card-hover hover:border-amber-300"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-400">Sales Pipeline</p>
                <p className={`${lato.className} mt-1 text-3xl font-black text-amber-700`}>{money(data.pipelineValue)}</p>
                <p className="mt-1 text-xs font-semibold text-neutral-500">
                  {data.activeOpps} open{data.wonCount ? ` · ${data.wonCount} won` : ""} <span className="text-amber-700 transition-transform group-hover:translate-x-0.5 inline-block">→</span>
                </p>
              </Link>
              {/* Today */}
              {(() => {
                const toneBg = {
                  neutral: "from-neutral-50 to-white",
                  emerald: "from-emerald-50 to-white",
                  amber: "from-amber-50 to-white",
                  rose: "from-rose-50 to-white",
                }[todayTone];
                const toneText = {
                  neutral: "text-neutral-700",
                  emerald: "text-emerald-700",
                  amber: "text-amber-700",
                  rose: "text-rose-700",
                }[todayTone];
                const toneBorder = {
                  neutral: "hover:border-neutral-300",
                  emerald: "hover:border-emerald-300",
                  amber: "hover:border-amber-300",
                  rose: "hover:border-rose-300",
                }[todayTone];
                const subLine = data.todayScheduledJobsCount === 0
                  ? "No jobs scheduled today"
                  : data.todayReportsCount >= data.todayScheduledJobsCount
                    ? "All reports filed"
                    : `${data.todayScheduledJobsCount - data.todayReportsCount} outstanding`;
                return (
                  <Link
                    href="/admin/daily-board"
                    className={`group block rounded-xl border border-neutral-200 bg-gradient-to-br p-4 transition-all hover:shadow-card-hover ${toneBg} ${toneBorder}`}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-400">Today's Reports</p>
                    <p className={`${lato.className} mt-1 text-3xl font-black ${toneText}`}>
                      {data.todayReportsCount}<span className="text-neutral-400 font-bold"> / {data.todayScheduledJobsCount}</span>
                    </p>
                    <p className="mt-1 text-xs font-semibold text-neutral-500">
                      {subLine} <span className={`${toneText} transition-transform group-hover:translate-x-0.5 inline-block`}>→</span>
                    </p>
                  </Link>
                );
              })()}
            </div>
          ) : null}
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-neutral-400">
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
              Loading dashboard...
            </div>
          </div>
        ) : data ? (
          <>
            {/* ── Action Items (only renders when something needs attention) ── */}
            {actionItems.length > 0 ? (
              <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-amber-800">Needs attention</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {actionItems.map((item, i) => (
                    <Link
                      key={i}
                      href={item.href}
                      className={`group inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                        item.tone === "rose"
                          ? "border-rose-300 bg-white text-rose-800 hover:bg-rose-50 hover:border-rose-400"
                          : "border-amber-300 bg-white text-amber-900 hover:bg-amber-50 hover:border-amber-400"
                      }`}
                    >
                      <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white ${
                        item.tone === "rose" ? "bg-rose-600" : "bg-amber-500"
                      }`}>
                        {item.count}
                      </span>
                      <span>{item.label}</span>
                      <span className="transition-transform group-hover:translate-x-0.5">→</span>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {/* ── Main grid: Sales (wider) + Jobs ── */}
            <div className="mb-6 grid gap-6 lg:grid-cols-5">
              {/* Sales panel — charts + mini stats */}
              <section className="rounded-2xl border border-neutral-200 bg-white p-5 lg:col-span-3">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className={`${lato.className} text-base font-bold text-neutral-900`}>Sales Pipeline</h2>
                  <Link href="/admin/sales" className="text-xs font-semibold text-brand hover:underline">View all →</Link>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <SalesPipelineChart salesOpps={data.salesOpps || []} />
                  <PipelineValueChart salesOpps={data.salesOpps || []} />
                </div>
                {data.totalOpps > 0 ? (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <MiniStat label="Active Deals" value={data.activeOpps} tone="blue" />
                    <MiniStat label="Won" value={data.wonCount} tone="emerald" />
                    <MiniStat label="Pipeline $" value={money(data.pipelineValue)} tone="amber" />
                    <MiniStat label="Total Tracked" value={data.totalOpps} tone="neutral" />
                  </div>
                ) : null}
              </section>

              {/* Jobs panel — status chart + recent list */}
              <section className="rounded-2xl border border-neutral-200 bg-white p-5 lg:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className={`${lato.className} text-base font-bold text-neutral-900`}>Active Jobs</h2>
                  <Link href="/admin/jobs" className="text-xs font-semibold text-brand hover:underline">View all →</Link>
                </div>
                <JobStatusChart jobStatusCounts={data.jobStatusCounts || {}} />
                <div className="mt-4">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-400">Recently added</p>
                  <ul className="divide-y divide-neutral-100">
                    {(data.recentJobs || []).slice(0, 5).map((job) => (
                      <li key={job.id || (job.job_name + job.created_at)} className="flex items-center justify-between gap-2 py-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-neutral-800">{job.job_name}</p>
                          <p className="text-[10px] text-neutral-400">
                            {job.job_number ? <span className="font-mono">#{job.job_number}</span> : null}
                            {job.job_number && job.customer_name ? " · " : ""}
                            {job.customer_name || ""}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          job.job_status === "completed" ? "bg-emerald-100 text-emerald-700" :
                          job.job_status === "in_progress" ? "bg-blue-100 text-blue-700" :
                          job.job_status === "awarded" ? "bg-amber-100 text-amber-700" :
                          "bg-neutral-100 text-neutral-600"
                        }`}>
                          {job.job_status || "active"}
                        </span>
                      </li>
                    ))}
                    {!data.recentJobs?.length ? (
                      <li className="py-4 text-center text-xs text-neutral-400">No active jobs</li>
                    ) : null}
                  </ul>
                </div>
              </section>
            </div>

            {/* ── Trends: 3-col ── */}
            <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <LeadsTrendChart weeklyLeads={data.weeklyLeads || []} weeklyApps={data.weeklyApps || []} />
              <CrewOverviewChart
                activeWorkers={data.activeWorkers}
                activeJobs={data.activeJobs}
                todayScheduledJobs={data.todayScheduledJobsCount}
              />
              <HiringPipelineChart hiring={data.hiring || []} />
            </div>

            {/* ── Recent Activity (full-width feed) ── */}
            <section className="rounded-2xl border border-neutral-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className={`${lato.className} text-base font-bold text-neutral-900`}>Recent Activity</h2>
                <Link href="/admin/contact" className="text-xs font-semibold text-brand hover:underline">View submissions →</Link>
              </div>
              <div className="divide-y divide-neutral-100">
                {(data.recentSubmissions || []).map((sub, i) => (
                  <ActivityItem
                    key={`sub-${i}`}
                    label={sub.name || "Unknown"}
                    detail={sub.message ? (sub.message.length > 60 ? sub.message.slice(0, 60) + "..." : sub.message) : sub.email}
                    time={timeAgo(sub.created_at)}
                    status="new"
                  />
                ))}
                {(data.hiring || []).slice(0, 3).map((h) => (
                  <ActivityItem
                    key={h.id}
                    label={h.applicant_name || h.title}
                    detail={`Hiring: ${h.position_applied || "General"} — ${h.stage}`}
                    time={timeAgo(h.updated_at)}
                    status={h.stage === "hired" || h.stage === "declined" ? "completed" : "active"}
                  />
                ))}
                {!data.recentSubmissions?.length && !data.hiring?.length ? (
                  <div className="py-6 text-center text-sm text-neutral-400">No recent activity</div>
                ) : null}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </>
  );
}

DashboardTW.getLayout = function getLayout(page) {
  return <TWAdminLayout>{page}</TWAdminLayout>;
};

export default withAuthTw(DashboardTW);
