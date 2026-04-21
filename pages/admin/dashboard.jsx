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

  return (
    <>
      <Head>
        <title>Dashboard | Admin</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div>
        {/* ── Greeting + Health Score ── */}
        <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <h1 className={`${lato.className} text-2xl font-black text-neutral-900`}>
                {getGreeting(firstName)}
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </p>
              {lastUpdatedAt ? (
                <p className="mt-1 text-xs text-neutral-400">
                  Last updated {new Date(lastUpdatedAt).toLocaleTimeString()}
                </p>
              ) : null}
              {!loading && data && (
                <div className="mt-3 flex flex-wrap gap-3 text-xs">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 font-medium text-neutral-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {data.activeJobs} active jobs
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 font-medium text-neutral-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    {data.activeWorkers} crew members
                  </span>
                  {data.hasTodaySchedule && (
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium ${data.todayFinalized ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${data.todayFinalized ? "bg-emerald-500" : "bg-amber-500"}`} />
                      Today's schedule {data.todayFinalized ? "finalized" : "draft"}
                    </span>
                  )}
                  {(data.recentContactSubs + data.recentJobApps) > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 font-medium text-violet-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                      {data.recentContactSubs + data.recentJobApps} new leads this week
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={async () => {
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
                }}
                className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 disabled:opacity-60"
                disabled={refreshing}
              >
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
              {!loading && <HealthRing score={healthScore} label={healthLabel} />}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-neutral-400">
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
              Loading dashboard...
            </div>
          </div>
        ) : data ? (
          <>
            {/* ── Today's Field Ops Strip ── */}
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <TodayCard
                label="Field Reports Today"
                value={`${data.todayReportsCount} / ${data.todayScheduledJobsCount}`}
                hint={
                  data.todayScheduledJobsCount === 0
                    ? "No jobs scheduled"
                    : data.todayReportsCount >= data.todayScheduledJobsCount
                      ? "All jobs reported"
                      : `${data.todayScheduledJobsCount - data.todayReportsCount} outstanding`
                }
                tone={
                  data.todayScheduledJobsCount === 0
                    ? "neutral"
                    : data.todayReportsCount >= data.todayScheduledJobsCount
                      ? "emerald"
                      : data.todayReportsCount > 0
                        ? "amber"
                        : "rose"
                }
                href="/admin/field-reports"
              />
              <TodayCard
                label="Certs Expiring ≤30d"
                value={data.expiringCertsCount}
                hint={
                  data.expiredCertsCount > 0
                    ? `${data.expiredCertsCount} already expired`
                    : "Nothing expired"
                }
                tone={
                  data.expiredCertsCount > 0
                    ? "rose"
                    : data.expiringCertsCount > 0
                      ? "amber"
                      : "emerald"
                }
                href="/admin/certifications"
              />
              <TodayCard
                label="Active Backlog"
                value={money(
                  (data.recentJobs || []).reduce(
                    (sum, j) => sum + (Number(j.contract_amount) || 0),
                    0
                  )
                )}
                hint={`${data.activeJobs} active jobs`}
                tone="blue"
                href="/admin/job-costs"
              />
            </div>

            {/* ── Metric Cards ── */}
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
              <StatCard
                label="Active Jobs"
                value={data.activeJobs}
                change={null}
                icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>}
                href="/admin/crew-scheduler"
                color="blue"
              />
              <StatCard
                label="Crew Members"
                value={data.activeWorkers}
                icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>}
                href="/admin/crew-scheduler"
                color="green"
              />
              <StatCard
                label="Pipeline Value"
                value={money(data.pipelineValue)}
                change={null}
                changeLabel={`${data.activeOpps} active`}
                icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>}
                href="/admin/sales"
                color="amber"
              />
              <StatCard
                label="Leads"
                value={data.contactSubs}
                change={data.recentContactSubs}
                changeLabel="this week"
                icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z" /></svg>}
                href="/admin/contact"
                color="violet"
              />
              <StatCard
                label="Applications"
                value={data.jobApps}
                change={data.recentJobApps}
                changeLabel="this week"
                icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>}
                href="/admin/hiring"
                color="rose"
              />
              <StatCard
                label="Hiring Pipeline"
                value={data.activeHiring}
                change={null}
                changeLabel={`${data.totalHiring} total`}
                icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" /></svg>}
                href="/admin/hiring"
                color="sky"
              />
            </div>

            {/* ── Two-column layout: Recent Jobs + Activity ── */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
              {/* Active Jobs */}
              <section className="rounded-2xl border border-neutral-200 bg-white p-5 lg:col-span-3">
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`${lato.className} text-base font-bold text-neutral-900`}>Active Jobs</h2>
                  <Link href="/admin/crew-scheduler" className="text-xs font-semibold text-[#0b2a5a] hover:text-[#0b2a5a]/70">
                    View all →
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-100 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                        <td className="py-2 pr-4">Job</td>
                        <td className="py-2 pr-4">Customer</td>
                        <td className="py-2 pr-4">Status</td>
                        <td className="py-2 text-right">Value</td>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
                      {(data.recentJobs || []).map((job) => (
                        <tr key={job.job_name + job.created_at} className="hover:bg-neutral-50/50">
                          <td className="py-3 pr-4">
                            <div className="font-medium text-neutral-800">{job.job_name}</div>
                            {job.job_number && <div className="text-xs text-neutral-400">#{job.job_number}</div>}
                          </td>
                          <td className="py-3 pr-4 text-neutral-600">{job.customer_name || "—"}</td>
                          <td className="py-3 pr-4">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                              job.job_status === "completed" ? "bg-emerald-50 text-emerald-700" :
                              job.job_status === "in_progress" ? "bg-blue-50 text-blue-700" :
                              job.job_status === "awarded" ? "bg-amber-50 text-amber-700" :
                              "bg-neutral-100 text-neutral-600"
                            }`}>
                              {job.job_status || "active"}
                            </span>
                          </td>
                          <td className="py-3 text-right font-medium text-neutral-700">
                            {job.contract_amount || job.bid_amount ? money(job.contract_amount || job.bid_amount) : "—"}
                          </td>
                        </tr>
                      ))}
                      {!data.recentJobs?.length && (
                        <tr><td colSpan={4} className="py-6 text-center text-neutral-400">No active jobs</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Recent Activity */}
              <section className="rounded-2xl border border-neutral-200 bg-white p-5 lg:col-span-2">
                <h2 className={`${lato.className} mb-4 text-base font-bold text-neutral-900`}>Recent Activity</h2>
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
                      status={h.stage === "hired" ? "completed" : h.stage === "declined" ? "completed" : "active"}
                    />
                  ))}
                  {!data.recentSubmissions?.length && !data.hiring?.length && (
                    <div className="py-6 text-center text-sm text-neutral-400">No recent activity</div>
                  )}
                </div>
              </section>
            </div>

            {/* ── Sales Pipeline Summary ── */}
            {data.totalOpps > 0 && (
              <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`${lato.className} text-base font-bold text-neutral-900`}>Sales Pipeline</h2>
                  <Link href="/admin/sales" className="text-xs font-semibold text-[#0b2a5a] hover:text-[#0b2a5a]/70">
                    View pipeline →
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-xl bg-neutral-50 p-4 text-center">
                    <div className={`${lato.className} text-2xl font-black text-neutral-900`}>{data.activeOpps}</div>
                    <div className="mt-1 text-xs font-medium text-neutral-500">Active Deals</div>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-4 text-center">
                    <div className={`${lato.className} text-2xl font-black text-emerald-700`}>{data.wonCount}</div>
                    <div className="mt-1 text-xs font-medium text-emerald-600">Won</div>
                  </div>
                  <div className="rounded-xl bg-amber-50 p-4 text-center">
                    <div className={`${lato.className} text-2xl font-black text-amber-700`}>{money(data.pipelineValue)}</div>
                    <div className="mt-1 text-xs font-medium text-amber-600">Pipeline Value</div>
                  </div>
                  <div className="rounded-xl bg-blue-50 p-4 text-center">
                    <div className={`${lato.className} text-2xl font-black text-blue-700`}>{data.totalOpps}</div>
                    <div className="mt-1 text-xs font-medium text-blue-600">Total Tracked</div>
                  </div>
                </div>
              </section>
            )}

            {/* ── Analytics Charts ── */}
            <section className="mt-6">
              <h2 className={`${lato.className} mb-4 text-base font-bold text-neutral-900`}>Analytics</h2>

              {/* Row 1: Pipeline doughnuts + Jobs bar */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <SalesPipelineChart salesOpps={data.salesOpps || []} />
                <HiringPipelineChart hiring={data.hiring || []} />
                <JobStatusChart jobStatusCounts={data.jobStatusCounts || {}} />
              </div>

              {/* Row 2: Pipeline value + Leads trend + Crew overview */}
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <PipelineValueChart salesOpps={data.salesOpps || []} />
                <LeadsTrendChart weeklyLeads={data.weeklyLeads || []} weeklyApps={data.weeklyApps || []} />
                <CrewOverviewChart
                  activeWorkers={data.activeWorkers}
                  activeJobs={data.activeJobs}
                  todayScheduledJobs={data.todayScheduledJobsCount}
                />
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
