/**
 * /api/bid-recommendations — Operational context & bid-fit scoring.
 *
 * Queries Supabase for real-time workforce, scheduling, and pipeline data,
 * then returns a structured snapshot the Bid Assistant uses to generate
 * personalized go/no-go recommendations.
 *
 * GET  /api/bid-recommendations              → full operational snapshot
 * POST /api/bid-recommendations  { metrics } → snapshot + computed score
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ── Fetch operational snapshot from Supabase ───────────────────────

async function fetchOperationalContext() {
  const today = new Date().toISOString().split("T")[0];
  const twoWeeksOut = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];
  const thirtyDaysOut = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

  const [
    { count: activeJobCount },
    { count: activeWorkerCount },
    { data: todaySchedule },
    { data: salesOpps },
    { data: activeJobsList },
  ] = await Promise.all([
    supabase.from("crew_jobs").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("crew_workers").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("crew_schedules").select("id, is_finalized").eq("schedule_date", today).limit(5),
    supabase.from("sales_opportunities").select("id, stage, value_estimate, bid_due").order("updated_at", { ascending: false }).limit(100),
    supabase.from("crew_jobs").select("job_name, job_status, contract_amount, bid_amount").eq("is_active", true).limit(50),
  ]);

  // Count today's scheduled jobs
  let todayScheduledJobsCount = 0;
  try {
    const scheduleIds = (todaySchedule || []).map((s) => s.id).filter(Boolean);
    if (scheduleIds.length > 0) {
      const { data: assignments } = await supabase
        .from("crew_assignments")
        .select("job_id")
        .in("schedule_id", scheduleIds);
      todayScheduledJobsCount = new Set((assignments || []).map((a) => a.job_id).filter(Boolean)).size;
    }
  } catch { /* assignments table may not exist */ }

  // Pipeline analysis
  const opps = salesOpps || [];
  const activeOpps = opps.filter((o) => !["won", "lost"].includes(o.stage));
  const upcomingBids = activeOpps.filter((o) => {
    if (!o.bid_due) return false;
    return o.bid_due >= today && o.bid_due <= twoWeeksOut;
  });
  const totalPipelineValue = activeOpps.reduce((sum, o) => sum + (Number(o.value_estimate) || 0), 0);

  // Active jobs backlog value
  const jobs = activeJobsList || [];
  const totalBacklogValue = jobs.reduce((sum, j) => sum + (Number(j.contract_amount) || Number(j.bid_amount) || 0), 0);

  // Capacity signals
  const jobsPerWorker = activeWorkerCount > 0 ? (activeJobCount || 0) / activeWorkerCount : 0;
  // Simple capacity model: below 1.5 jobs/worker = capacity available
  const capacityUtilization = Math.min(jobsPerWorker / 2.0, 1.0); // normalize 0–1

  return {
    workforce: {
      active_workers: activeWorkerCount || 0,
      jobs_per_worker: Math.round(jobsPerWorker * 100) / 100,
      capacity_utilization: Math.round(capacityUtilization * 100) / 100,
    },
    scheduling: {
      active_jobs: activeJobCount || 0,
      today_scheduled_jobs: todayScheduledJobsCount,
      today_schedule_finalized: (todaySchedule || []).some((s) => s.is_finalized),
    },
    pipeline: {
      active_opportunities: activeOpps.length,
      upcoming_bids_2wk: upcomingBids.length,
      total_pipeline_value: totalPipelineValue,
    },
    backlog: {
      total_value: totalBacklogValue,
      job_count: jobs.length,
    },
    fetched_at: new Date().toISOString(),
  };
}

// ── Score a bid against metrics + operational context ───────────────

function computeBidScore(metrics, opsContext, bidData) {
  const signals = [];
  let totalWeight = 0;
  let weightedScore = 0;

  // 1. Profitability signal
  const bidValue = Number(bidData?.value_estimate || 0);
  const estimatedCost = Number(metrics?.default_estimated_cost_usd || 550000);
  const targetMargin = Number(metrics?.target_margin_percent || 18) / 100;
  const minProfit = Number(metrics?.minimum_profit_usd || 75000);
  const minContract = Number(metrics?.minimum_contract_value_usd || 300000);

  const projectedProfit = bidValue - estimatedCost;
  const projectedMargin = bidValue > 0 ? projectedProfit / bidValue : 0;

  const marginScore = projectedMargin >= targetMargin ? 100
    : projectedMargin >= targetMargin * 0.7 ? 70
    : projectedMargin > 0 ? 40
    : 10;

  signals.push({
    id: "profitability",
    label: "Profitability",
    score: marginScore,
    weight: Number(metrics?.weight_profitability || 35),
    detail: bidValue > 0
      ? `Projected margin: ${(projectedMargin * 100).toFixed(1)}% (target: ${(targetMargin * 100).toFixed(0)}%). Profit: $${projectedProfit.toLocaleString()}`
      : "No bid value provided — unable to project margin",
    status: marginScore >= 70 ? "good" : marginScore >= 40 ? "caution" : "warning",
  });
  totalWeight += signals[signals.length - 1].weight;
  weightedScore += marginScore * signals[signals.length - 1].weight;

  // 2. Contract size signal
  const sizeScore = bidValue >= minContract ? 100
    : bidValue >= minContract * 0.6 ? 60
    : bidValue > 0 ? 30
    : 0;
  signals.push({
    id: "contract_size",
    label: "Contract Size",
    score: sizeScore,
    weight: Number(metrics?.weight_contract_size || 15),
    detail: bidValue > 0
      ? `$${bidValue.toLocaleString()} vs. minimum $${minContract.toLocaleString()}`
      : "No bid value available",
    status: sizeScore >= 60 ? "good" : sizeScore >= 30 ? "caution" : "warning",
  });
  totalWeight += signals[signals.length - 1].weight;
  weightedScore += sizeScore * signals[signals.length - 1].weight;

  // 3. Resource availability signal
  const utilization = opsContext?.workforce?.capacity_utilization || 0;
  const resourceScore = utilization < 0.6 ? 100
    : utilization < 0.8 ? 70
    : utilization < 0.95 ? 40
    : 15;
  signals.push({
    id: "resource_availability",
    label: "Resource Availability",
    score: resourceScore,
    weight: Number(metrics?.weight_resources || 20),
    detail: `${opsContext?.workforce?.active_workers || 0} active crew, ${opsContext?.scheduling?.active_jobs || 0} jobs. Utilization: ${Math.round(utilization * 100)}%`,
    status: resourceScore >= 70 ? "good" : resourceScore >= 40 ? "caution" : "warning",
  });
  totalWeight += signals[signals.length - 1].weight;
  weightedScore += resourceScore * signals[signals.length - 1].weight;

  // 4. Scheduling constraints signal
  const activeJobs = opsContext?.scheduling?.active_jobs || 0;
  const schedCapacity = Number(metrics?.max_concurrent_jobs || 20);
  const schedRatio = schedCapacity > 0 ? activeJobs / schedCapacity : 1;
  const schedScore = schedRatio < 0.6 ? 100
    : schedRatio < 0.8 ? 70
    : schedRatio < 1.0 ? 40
    : 15;
  signals.push({
    id: "scheduling",
    label: "Scheduling Capacity",
    score: schedScore,
    weight: Number(metrics?.weight_scheduling || 15),
    detail: `${activeJobs} of ${schedCapacity} max concurrent jobs (${Math.round(schedRatio * 100)}% used)`,
    status: schedScore >= 70 ? "good" : schedScore >= 40 ? "caution" : "warning",
  });
  totalWeight += signals[signals.length - 1].weight;
  weightedScore += schedScore * signals[signals.length - 1].weight;

  // 5. Pipeline competition signal
  const upcomingBids = opsContext?.pipeline?.upcoming_bids_2wk || 0;
  const pipeScore = upcomingBids <= 2 ? 100
    : upcomingBids <= 5 ? 70
    : upcomingBids <= 8 ? 45
    : 20;
  signals.push({
    id: "pipeline_load",
    label: "Pipeline Load",
    score: pipeScore,
    weight: Number(metrics?.weight_pipeline || 15),
    detail: `${upcomingBids} other bids due in the next 2 weeks. ${opsContext?.pipeline?.active_opportunities || 0} active opportunities total`,
    status: pipeScore >= 70 ? "good" : pipeScore >= 45 ? "caution" : "warning",
  });
  totalWeight += signals[signals.length - 1].weight;
  weightedScore += pipeScore * signals[signals.length - 1].weight;

  // Composite score
  const composite = totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;

  // Build recommendation
  let recommendation;
  if (composite >= 75) {
    recommendation = { verdict: "strong_bid", label: "Strong Bid", tone: "emerald", summary: "This opportunity aligns well with your capacity, financial targets, and scheduling." };
  } else if (composite >= 55) {
    recommendation = { verdict: "conditional_bid", label: "Conditional Bid", tone: "amber", summary: "This bid has merit but some factors need attention. Review the caution signals below." };
  } else if (composite >= 35) {
    recommendation = { verdict: "proceed_with_caution", label: "Proceed with Caution", tone: "amber", summary: "Multiple risk factors present. Consider negotiating terms or adjusting scope before committing." };
  } else {
    recommendation = { verdict: "reconsider", label: "Reconsider", tone: "rose", summary: "This opportunity has significant challenges. The margins, resources, or timing may not justify pursuit." };
  }

  return {
    composite_score: composite,
    signals,
    recommendation,
    projected: {
      profit_usd: projectedProfit,
      margin_percent: Math.round(projectedMargin * 10000) / 100,
      bid_value_usd: bidValue,
      estimated_cost_usd: estimatedCost,
    },
  };
}

// ── Handler ────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const opsContext = await fetchOperationalContext();

    if (req.method === "GET") {
      return res.status(200).json({ context: opsContext });
    }

    // POST — compute score with provided metrics + bid data
    const { metrics, bid_data } = req.body || {};
    const score = computeBidScore(metrics || {}, opsContext, bid_data || {});

    return res.status(200).json({
      context: opsContext,
      score,
    });
  } catch (error) {
    console.error("bid-recommendations error:", error);
    return res.status(500).json({
      error: "Failed to compute recommendations",
      detail: error.message || "Unknown error",
    });
  }
}
