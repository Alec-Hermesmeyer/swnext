import { createClient } from "@supabase/supabase-js";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Server-side Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Format a date string for display
const fmtDate = (d) =>
  new Date(`${d}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

// Get today and nearby dates as YYYY-MM-DD
const getDateRange = () => {
  const today = new Date();
  const fmt = (d) => d.toISOString().split("T")[0];
  const offset = (days) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return fmt(d);
  };
  return { today: fmt(today), weekAgo: offset(-7), weekAhead: offset(7), monthAhead: offset(30) };
};

// Pull a snapshot of all relevant data for the AI context
async function fetchDataContext() {
  const { today, weekAgo, weekAhead } = getDateRange();

  const [
    { data: workers },
    { data: categories },
    { data: jobs },
    { data: superintendents },
    { data: trucks },
    { data: schedules },
    { data: assignments },
    { data: rigDetails },
  ] = await Promise.all([
    supabase.from("crew_workers").select("id, name, phone, role, is_active"),
    supabase.from("crew_categories").select("id, name, color, sort_order").order("sort_order"),
    supabase.from("crew_jobs").select("id, job_name, job_number, customer_name, address, city, pm_name, crane_required, is_active, default_rig"),
    supabase.from("crew_superintendents").select("id, name, phone, is_active"),
    supabase.from("crew_trucks").select("id, truck_number, description, is_active"),
    supabase.from("crew_schedules").select("id, schedule_date, is_finalized, finalized_at").gte("schedule_date", weekAgo).lte("schedule_date", weekAhead).order("schedule_date"),
    supabase.from("crew_assignments").select("id, schedule_id, category_id, worker_id, job_id, job_name, notes, sort_order, crew_workers(name, role), crew_categories(name)").order("sort_order"),
    supabase.from("schedule_rig_details").select("id, schedule_id, category_id, superintendent_id, truck_id, crane_info, notes, crew_superintendents(name), crew_trucks(truck_number)"),
  ]);

  // Build schedule map for easy lookup
  const scheduleMap = {};
  for (const s of schedules || []) {
    scheduleMap[s.id] = s;
  }

  // Attach schedule dates to assignments
  const enrichedAssignments = (assignments || [])
    .filter((a) => scheduleMap[a.schedule_id])
    .map((a) => ({
      date: scheduleMap[a.schedule_id].schedule_date,
      worker: a.crew_workers?.name || "Unassigned",
      workerRole: a.crew_workers?.role || "",
      job: a.job_name || "",
      rig: a.crew_categories?.name || "",
      notes: a.notes || "",
    }));

  // Attach schedule dates to rig details
  const enrichedRigDetails = (rigDetails || [])
    .filter((r) => scheduleMap[r.schedule_id])
    .map((r) => ({
      date: scheduleMap[r.schedule_id].schedule_date,
      superintendent: r.crew_superintendents?.name || "",
      truck: r.crew_trucks?.truck_number || "",
      craneInfo: r.crane_info || "",
      notes: r.notes || "",
    }));

  const activeWorkers = (workers || []).filter((w) => w.is_active !== false);
  const inactiveWorkers = (workers || []).filter((w) => w.is_active === false);
  const activeJobs = (jobs || []).filter((j) => j.is_active !== false);

  return {
    today,
    summary: {
      totalActiveWorkers: activeWorkers.length,
      totalInactiveWorkers: inactiveWorkers.length,
      totalActiveJobs: activeJobs.length,
      totalRigs: (categories || []).length,
      totalSuperintendents: (superintendents || []).filter((s) => s.is_active !== false).length,
      totalTrucks: (trucks || []).filter((t) => t.is_active !== false).length,
    },
    workers: activeWorkers.map((w) => ({ name: w.name, role: w.role || "", phone: w.phone || "" })),
    jobs: activeJobs.map((j) => ({
      name: j.job_name,
      number: j.job_number || "",
      customer: j.customer_name || "",
      address: [j.address, j.city].filter(Boolean).join(", "),
      pm: j.pm_name || "",
      crane: j.crane_required ? "Yes" : "No",
    })),
    rigs: (categories || []).map((c) => c.name),
    superintendents: (superintendents || []).filter((s) => s.is_active !== false).map((s) => s.name),
    trucks: (trucks || []).filter((t) => t.is_active !== false).map((t) => t.truck_number),
    schedules: (schedules || []).map((s) => ({
      date: s.schedule_date,
      dateFormatted: fmtDate(s.schedule_date),
      finalized: s.is_finalized || false,
    })),
    assignments: enrichedAssignments,
    rigDetails: enrichedRigDetails,
  };
}

// Build the system prompt with data context
function buildSystemPrompt(data) {
  return `You are the S&W Foundation Contractors assistant. You help the admin team with questions about crew schedules, jobs, workers, and equipment. You are friendly, concise, and practical.

Today is ${fmtDate(data.today)} (${data.today}).

COMPANY DATA SNAPSHOT:
- ${data.summary.totalActiveWorkers} active workers, ${data.summary.totalInactiveWorkers} inactive
- ${data.summary.totalActiveJobs} active jobs
- ${data.summary.totalRigs} rigs/categories
- ${data.summary.totalSuperintendents} superintendents
- ${data.summary.totalTrucks} trucks

WORKERS:
${data.workers.map((w) => `- ${w.name}${w.role ? ` (${w.role})` : ""}${w.phone ? ` - ${w.phone}` : ""}`).join("\n")}

ACTIVE JOBS:
${data.jobs.map((j) => `- ${j.name}${j.number ? ` #${j.number}` : ""}${j.customer ? ` | Customer: ${j.customer}` : ""}${j.address ? ` | ${j.address}` : ""}${j.pm ? ` | PM: ${j.pm}` : ""}${j.crane === "Yes" ? " | CRANE REQUIRED" : ""}`).join("\n")}

RIGS: ${data.rigs.join(", ")}
SUPERINTENDENTS: ${data.superintendents.join(", ")}
TRUCKS: ${data.trucks.join(", ")}

SCHEDULES (recent & upcoming):
${data.schedules.map((s) => `- ${s.dateFormatted} (${s.date})${s.finalized ? " - FINALIZED" : " - draft"}`).join("\n") || "No schedules in range."}

CREW ASSIGNMENTS (recent & upcoming):
${data.assignments.length > 0 ? data.assignments.map((a) => `- ${a.date}: ${a.worker}${a.workerRole ? ` (${a.workerRole})` : ""} → ${a.job || "No job"} [${a.rig}]${a.notes ? ` (${a.notes})` : ""}`).join("\n") : "No assignments in range."}

RULES:
- Only answer from the data above. If you don't have the info, say so.
- Keep answers short and direct. These are busy people.
- When listing crew for a day, group by rig/category.
- If asked about a date with no schedule, say there's no schedule created yet for that date.
- You cannot make changes to the schedule. You can only provide information.
- Use plain language. No technical jargon.`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: "AI service not configured" });
  }

  const { message, history = [] } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const data = await fetchDataContext();
    const systemPrompt = buildSystemPrompt(data);

    // Build messages array - keep last 10 exchanges to stay within token limits
    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-20),
      { role: "user", content: message },
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages,
        temperature: 0.3,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Groq API error:", err);
      return res.status(502).json({ error: "AI service error" });
    }

    const result = await response.json();
    const reply = result.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("AI chat error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
}
