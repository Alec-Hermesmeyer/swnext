import { createClient } from "@supabase/supabase-js";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const fmtDate = (d) =>
  new Date(`${d}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

const getDateRange = () => {
  const today = new Date();
  const fmt = (d) => d.toISOString().split("T")[0];
  const offset = (days) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return fmt(d);
  };
  return { today: fmt(today), weekAgo: offset(-7), weekAhead: offset(7) };
};

// ── Tool definitions for Groq function calling ──

const tools = [
  {
    type: "function",
    function: {
      name: "create_job_position",
      description: "Create a new job position / career posting. Use when the user wants to add a new open position.",
      parameters: {
        type: "object",
        properties: {
          jobTitle: { type: "string", description: "The title of the job position (e.g. 'Crane Operator', 'Laborer')" },
          jobDesc: { type: "string", description: "A brief description of the job position" },
          is_Open: { type: "boolean", description: "Whether the position is open (visible on the website). Defaults to true." },
        },
        required: ["jobTitle", "jobDesc"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "toggle_job_position",
      description: "Open or close an existing job position by toggling its visibility on the public website.",
      parameters: {
        type: "object",
        properties: {
          jobTitle: { type: "string", description: "The exact title of the job position to toggle" },
          setOpen: { type: "boolean", description: "True to open/show the position, false to close/hide it" },
        },
        required: ["jobTitle", "setOpen"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_company_contact",
      description: "Add a new person to the company contacts directory.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Full name of the contact" },
          job_title: { type: "string", description: "Their job title or role at the company" },
          email: { type: "string", description: "Email address" },
          phone: { type: "string", description: "Phone number" },
        },
        required: ["name", "job_title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_company_contact",
      description: "Remove a person from the company contacts directory.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "The exact name of the contact to delete" },
        },
        required: ["name"],
      },
    },
  },
];

// ── Tool execution ──

async function executeTool(name, args) {
  switch (name) {
    case "create_job_position": {
      const { jobTitle, jobDesc, is_Open = true } = args;
      const { data, error } = await supabase
        .from("jobs")
        .insert([{ jobTitle, jobDesc, is_Open }])
        .select("*");
      if (error) return { success: false, error: error.message };
      return { success: true, message: `Created job position "${jobTitle}" (${is_Open ? "Open" : "Closed"})`, job: data[0] };
    }

    case "toggle_job_position": {
      const { jobTitle, setOpen } = args;
      // Find the job by title (case-insensitive match)
      const { data: matches } = await supabase.from("jobs").select("id, jobTitle, is_Open").ilike("jobTitle", jobTitle);
      if (!matches || matches.length === 0) {
        return { success: false, error: `No job position found matching "${jobTitle}"` };
      }
      const job = matches[0];
      const { error } = await supabase.from("jobs").update({ is_Open: setOpen }).eq("id", job.id);
      if (error) return { success: false, error: error.message };
      return { success: true, message: `"${job.jobTitle}" is now ${setOpen ? "Open (visible on website)" : "Closed (hidden from website)"}` };
    }

    case "add_company_contact": {
      const { name, job_title, email = "", phone = "" } = args;
      const { data, error } = await supabase
        .from("company_contacts")
        .insert([{ name, job_title, email, phone }])
        .select("*");
      if (error) return { success: false, error: error.message };
      return { success: true, message: `Added ${name} (${job_title}) to company contacts`, contact: data[0] };
    }

    case "delete_company_contact": {
      const { name } = args;
      const { data: matches } = await supabase.from("company_contacts").select("id, name").ilike("name", name);
      if (!matches || matches.length === 0) {
        return { success: false, error: `No contact found matching "${name}"` };
      }
      const contact = matches[0];
      const { error } = await supabase.from("company_contacts").delete().eq("id", contact.id);
      if (error) return { success: false, error: error.message };
      return { success: true, message: `Removed ${contact.name} from company contacts` };
    }

    default:
      return { success: false, error: `Unknown tool: ${name}` };
  }
}

// ── Data fetching ──

async function fetchDataContext() {
  const { today, weekAgo, weekAhead } = getDateRange();

  const [
    { data: workers },
    { data: categories },
    { data: crewJobs },
    { data: superintendents },
    { data: trucks },
    { data: schedules },
    { data: assignments },
    { data: rigDetails },
    { data: jobPositions },
    { data: companyContacts },
    { data: contactSubmissions },
    { data: jobSubmissions },
  ] = await Promise.all([
    supabase.from("crew_workers").select("id, name, phone, role, is_active"),
    supabase.from("crew_categories").select("id, name, color, sort_order").order("sort_order"),
    supabase.from("crew_jobs").select("id, job_name, job_number, customer_name, address, city, pm_name, crane_required, is_active, default_rig"),
    supabase.from("crew_superintendents").select("id, name, phone, is_active"),
    supabase.from("crew_trucks").select("id, truck_number, description, is_active"),
    supabase.from("crew_schedules").select("id, schedule_date, is_finalized, finalized_at").gte("schedule_date", weekAgo).lte("schedule_date", weekAhead).order("schedule_date"),
    supabase.from("crew_assignments").select("id, schedule_id, category_id, worker_id, job_id, job_name, notes, sort_order, crew_workers(name, role), crew_categories(name)").order("sort_order"),
    supabase.from("schedule_rig_details").select("id, schedule_id, category_id, superintendent_id, truck_id, crane_info, notes, crew_superintendents(name), crew_trucks(truck_number)"),
    supabase.from("jobs").select("*").order("id", { ascending: false }),
    supabase.from("company_contacts").select("*").order("id", { ascending: false }),
    supabase.from("contact_form").select("*").order("created_at", { ascending: false }).limit(20),
    supabase.from("job_form").select("*").order("created_at", { ascending: false }).limit(30),
  ]);

  const scheduleMap = {};
  for (const s of schedules || []) scheduleMap[s.id] = s;

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

  const activeWorkers = (workers || []).filter((w) => w.is_active !== false);
  const inactiveWorkers = (workers || []).filter((w) => w.is_active === false);
  const activeCrewJobs = (crewJobs || []).filter((j) => j.is_active !== false);

  return {
    today,
    summary: {
      totalActiveWorkers: activeWorkers.length,
      totalInactiveWorkers: inactiveWorkers.length,
      totalActiveCrewJobs: activeCrewJobs.length,
      totalRigs: (categories || []).length,
      totalSuperintendents: (superintendents || []).filter((s) => s.is_active !== false).length,
      totalTrucks: (trucks || []).filter((t) => t.is_active !== false).length,
      totalJobPositions: (jobPositions || []).length,
      openJobPositions: (jobPositions || []).filter((j) => j.is_Open).length,
      totalCompanyContacts: (companyContacts || []).length,
      totalContactSubmissions: (contactSubmissions || []).length,
      totalJobApplications: (jobSubmissions || []).length,
    },
    workers: activeWorkers.map((w) => ({ name: w.name, role: w.role || "", phone: w.phone || "" })),
    crewJobs: activeCrewJobs.map((j) => ({
      name: j.job_name, number: j.job_number || "", customer: j.customer_name || "",
      address: [j.address, j.city].filter(Boolean).join(", "), pm: j.pm_name || "",
      crane: j.crane_required ? "Yes" : "No",
    })),
    rigs: (categories || []).map((c) => c.name),
    superintendents: (superintendents || []).filter((s) => s.is_active !== false).map((s) => s.name),
    trucks: (trucks || []).filter((t) => t.is_active !== false).map((t) => t.truck_number),
    schedules: (schedules || []).map((s) => ({
      date: s.schedule_date, dateFormatted: fmtDate(s.schedule_date), finalized: s.is_finalized || false,
    })),
    assignments: enrichedAssignments,
    jobPositions: (jobPositions || []).map((j) => ({
      title: j.jobTitle, description: j.jobDesc || "", open: j.is_Open, created: j.created_at,
    })),
    companyContacts: (companyContacts || []).map((c) => ({
      name: c.name, title: c.job_title || "", email: c.email || "", phone: c.phone || "",
    })),
    contactSubmissions: (contactSubmissions || []).map((s) => ({
      name: s.name || "", email: s.email || "", phone: s.number || "", message: s.message || "",
      date: s.created_at ? new Date(s.created_at).toLocaleDateString() : "",
    })),
    jobApplications: (jobSubmissions || []).map((s) => ({
      name: s.firstName || s.name || "", email: s.email || "", phone: s.number || s.phone || "",
      position: s.position || "", date: s.created_at ? new Date(s.created_at).toLocaleDateString() : "",
    })),
  };
}

// ── System prompt ──

function buildSystemPrompt(data) {
  const positionCounts = {};
  for (const app of data.jobApplications) {
    if (app.position) positionCounts[app.position] = (positionCounts[app.position] || 0) + 1;
  }

  return `You are the S&W Foundation Contractors assistant. You help the admin team with questions about crew schedules, jobs, workers, equipment, job postings, contacts, and form submissions. You are friendly, concise, and practical.

Today is ${fmtDate(data.today)} (${data.today}).

OVERVIEW:
- ${data.summary.totalActiveWorkers} active crew workers, ${data.summary.totalInactiveWorkers} inactive
- ${data.summary.totalActiveCrewJobs} active crew jobs
- ${data.summary.totalRigs} rigs/categories
- ${data.summary.totalSuperintendents} superintendents, ${data.summary.totalTrucks} trucks
- ${data.summary.totalJobPositions} career positions (${data.summary.openJobPositions} open)
- ${data.summary.totalCompanyContacts} company contacts
- ${data.summary.totalContactSubmissions} recent contact form submissions
- ${data.summary.totalJobApplications} recent job applications

CREW WORKERS:
${data.workers.map((w) => `- ${w.name}${w.role ? ` (${w.role})` : ""}${w.phone ? ` - ${w.phone}` : ""}`).join("\n") || "None"}

ACTIVE CREW JOBS:
${data.crewJobs.map((j) => `- ${j.name}${j.number ? ` #${j.number}` : ""}${j.customer ? ` | Customer: ${j.customer}` : ""}${j.address ? ` | ${j.address}` : ""}${j.pm ? ` | PM: ${j.pm}` : ""}${j.crane === "Yes" ? " | CRANE REQUIRED" : ""}`).join("\n") || "None"}

RIGS: ${data.rigs.join(", ") || "None"}
SUPERINTENDENTS: ${data.superintendents.join(", ") || "None"}
TRUCKS: ${data.trucks.join(", ") || "None"}

SCHEDULES (recent & upcoming):
${data.schedules.map((s) => `- ${s.dateFormatted} (${s.date})${s.finalized ? " - FINALIZED" : " - draft"}`).join("\n") || "No schedules in range."}

CREW ASSIGNMENTS (recent & upcoming):
${data.assignments.length > 0 ? data.assignments.map((a) => `- ${a.date}: ${a.worker}${a.workerRole ? ` (${a.workerRole})` : ""} → ${a.job || "No job"} [${a.rig}]${a.notes ? ` (${a.notes})` : ""}`).join("\n") : "No assignments in range."}

CAREER POSITIONS (job postings on the website):
${data.jobPositions.map((j) => `- "${j.title}" - ${j.open ? "OPEN (visible)" : "CLOSED (hidden)"}${j.description ? ` | ${j.description.substring(0, 80)}` : ""}`).join("\n") || "No positions."}

COMPANY CONTACTS:
${data.companyContacts.map((c) => `- ${c.name}${c.title ? ` (${c.title})` : ""}${c.email ? ` | ${c.email}` : ""}${c.phone ? ` | ${c.phone}` : ""}`).join("\n") || "None"}

RECENT CONTACT FORM SUBMISSIONS (latest 20):
${data.contactSubmissions.map((s) => `- ${s.date}: ${s.name}${s.email ? ` | ${s.email}` : ""}${s.phone ? ` | ${s.phone}` : ""}${s.message ? ` | "${s.message.substring(0, 60)}${s.message.length > 60 ? "..." : ""}"` : ""}`).join("\n") || "None"}

RECENT JOB APPLICATIONS (latest 30):
${data.jobApplications.map((s) => `- ${s.date}: ${s.name} applied for ${s.position || "unknown"}${s.email ? ` | ${s.email}` : ""}${s.phone ? ` | ${s.phone}` : ""}`).join("\n") || "None"}

APPLICATIONS BY POSITION: ${Object.entries(positionCounts).map(([pos, count]) => `${pos}: ${count}`).join(", ") || "None"}

RULES:
- For questions, ALWAYS answer directly from the data above. All the data you need is already here. Do NOT try to call a tool to look up or fetch data.
- ONLY use tools for WRITE actions: creating a job position, toggling a position open/closed, adding a contact, or deleting a contact. That's it.
- Keep answers short and direct. These are busy people.
- When listing crew for a day, group by rig/category.
- If asked about a date with no schedule, say there's no schedule created yet.
- Use plain language. No jargon.
- You CANNOT modify crew schedules or assignments - only provide info about them.
- When you perform an action, confirm what you did clearly.
- After any create/delete/update action, remind them to refresh the page if they have it open.`;
}

// ── Call Groq with tool support ──

async function callGroq(messages, useTools = true) {
  const body = {
    model: "llama-3.1-8b-instant",
    messages,
    temperature: 0.3,
    max_tokens: 1024,
  };
  if (useTools) {
    body.tools = tools;
    body.tool_choice = "auto";
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    // If the model tried to call a tool that doesn't exist, retry without tools
    if (errText.includes("tool_use_failed") || errText.includes("not in request.tools")) {
      console.warn("Model tried invalid tool call, retrying without tools");
      return callGroq(messages, false);
    }
    console.error("Groq API error:", errText);
    throw new Error("AI service error");
  }

  return response.json();
}

// ── Main handler ──

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

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-20),
      { role: "user", content: message },
    ];

    // First call - may include tool calls
    let result = await callGroq(messages);
    let choice = result.choices?.[0];

    // Handle tool calls (up to 3 rounds to prevent loops)
    let rounds = 0;
    while (choice?.finish_reason === "tool_calls" && choice?.message?.tool_calls && rounds < 3) {
      rounds++;
      // Add the assistant's tool call message
      messages.push(choice.message);

      // Execute each tool call and add results
      for (const tc of choice.message.tool_calls) {
        let toolArgs;
        try {
          toolArgs = typeof tc.function.arguments === "string" ? JSON.parse(tc.function.arguments) : tc.function.arguments;
        } catch {
          toolArgs = {};
        }

        const toolResult = await executeTool(tc.function.name, toolArgs);
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(toolResult),
        });
      }

      // Call Groq again with tool results (no tools this round to get final response)
      result = await callGroq(messages, false);
      choice = result.choices?.[0];
    }

    const reply = choice?.message?.content || "Sorry, I couldn't generate a response.";

    // Track if any actions were performed so the frontend knows
    const actionsPerformed = rounds > 0;

    return res.status(200).json({ reply, actionsPerformed });
  } catch (error) {
    console.error("AI chat error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
}
