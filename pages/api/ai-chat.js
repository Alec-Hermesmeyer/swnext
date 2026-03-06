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
  return {
    today: fmt(today),
    historyStart: offset(-120),
    historyEnd: offset(30),
  };
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
  {
    type: "function",
    function: {
      name: "create_crew_job",
      description:
        "Create or update one crew scheduler job record. Use this when the user provides job data (often from spreadsheet rows).",
      parameters: {
        type: "object",
        properties: {
          job_name: { type: "string", description: "Job name/title" },
          job_number: { type: "string", description: "Job number identifier" },
          dig_tess_number: { type: "string", description: "Dig Tess number" },
          customer_name: { type: "string", description: "Customer name" },
          hiring_contractor: { type: "string", description: "Hiring contractor / GC name" },
          hiring_contact_name: { type: "string", description: "Hiring contact person name" },
          hiring_contact_phone: { type: "string", description: "Hiring contact phone number" },
          hiring_contact_email: { type: "string", description: "Hiring contact email" },
          address: { type: "string", description: "Street address" },
          city: { type: "string", description: "City" },
          zip: { type: "string", description: "ZIP / postal code" },
          pm_name: { type: "string", description: "S&W PM name" },
          pm_phone: { type: "string", description: "S&W PM phone" },
          default_rig: { type: "string", description: "Default rig/category label" },
          crane_required: { type: "boolean", description: "True if crane is required" },
        },
        required: ["job_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "bulk_create_crew_jobs",
      description:
        "Create or update many crew scheduler jobs in one call. Use when the user pastes multiple spreadsheet rows.",
      parameters: {
        type: "object",
        properties: {
          rows: {
            type: "array",
            items: {
              type: "object",
              properties: {
                job_name: { type: "string" },
                job_number: { type: "string" },
                dig_tess_number: { type: "string" },
                customer_name: { type: "string" },
                hiring_contractor: { type: "string" },
                hiring_contact_name: { type: "string" },
                hiring_contact_phone: { type: "string" },
                hiring_contact_email: { type: "string" },
                address: { type: "string" },
                city: { type: "string" },
                zip: { type: "string" },
                pm_name: { type: "string" },
                pm_phone: { type: "string" },
                default_rig: { type: "string" },
                crane_required: { type: "boolean" },
              },
              required: ["job_name"],
            },
            minItems: 1,
          },
        },
        required: ["rows"],
      },
    },
  },
];

// ── Tool execution ──

const cleanTextOrNull = (value) => {
  const cleaned = String(value || "").trim();
  return cleaned || null;
};

const normalizeCrewJobPayload = (input = {}) => ({
  job_name: String(input.job_name || "").trim(),
  job_number: cleanTextOrNull(input.job_number),
  dig_tess_number: cleanTextOrNull(input.dig_tess_number),
  customer_name: cleanTextOrNull(input.customer_name),
  hiring_contractor: cleanTextOrNull(input.hiring_contractor),
  hiring_contact_name: cleanTextOrNull(input.hiring_contact_name),
  hiring_contact_phone: cleanTextOrNull(input.hiring_contact_phone),
  hiring_contact_email: cleanTextOrNull(input.hiring_contact_email),
  address: cleanTextOrNull(input.address),
  city: cleanTextOrNull(input.city),
  zip: cleanTextOrNull(input.zip),
  pm_name: cleanTextOrNull(input.pm_name),
  pm_phone: cleanTextOrNull(input.pm_phone),
  default_rig: cleanTextOrNull(input.default_rig),
  crane_required: !!input.crane_required,
});

async function ensureCustomerExists(name) {
  const clean = String(name || "").trim();
  if (!clean) return;
  const { data: existing, error: findError } = await supabase
    .from("Customer")
    .select("id")
    .ilike("name", clean)
    .limit(1);
  if (findError || (existing && existing.length > 0)) return;
  await supabase.from("Customer").insert({ name: clean });
}

async function upsertCrewJob(rawInput) {
  const payload = normalizeCrewJobPayload(rawInput);
  if (!payload.job_name) {
    return { success: false, error: "job_name is required for crew jobs" };
  }

  let match = null;
  if (payload.job_number) {
    const { data: numberMatch, error: numberError } = await supabase
      .from("crew_jobs")
      .select("id, job_name, job_number")
      .eq("job_number", payload.job_number)
      .limit(1);
    if (numberError) return { success: false, error: numberError.message };
    match = numberMatch?.[0] || null;
  }

  if (!match) {
    const { data: nameMatch, error: nameError } = await supabase
      .from("crew_jobs")
      .select("id, job_name, job_number")
      .ilike("job_name", payload.job_name)
      .limit(1);
    if (nameError) return { success: false, error: nameError.message };
    match = nameMatch?.[0] || null;
  }

  if (match) {
    const { error: updateError, data: updated } = await supabase
      .from("crew_jobs")
      .update({ ...payload, is_active: true })
      .eq("id", match.id)
      .select("id, job_name, job_number")
      .single();
    if (updateError) return { success: false, error: updateError.message };
    await ensureCustomerExists(payload.hiring_contractor);
    return {
      success: true,
      action: "updated",
      message: `Updated crew job "${updated.job_name}"${updated.job_number ? ` (#${updated.job_number})` : ""}`,
      job: updated,
    };
  }

  const { error: insertError, data: inserted } = await supabase
    .from("crew_jobs")
    .insert(payload)
    .select("id, job_name, job_number")
    .single();
  if (insertError) return { success: false, error: insertError.message };
  await ensureCustomerExists(payload.hiring_contractor);
  return {
    success: true,
    action: "created",
    message: `Created crew job "${inserted.job_name}"${inserted.job_number ? ` (#${inserted.job_number})` : ""}`,
    job: inserted,
  };
}

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

    case "create_crew_job": {
      return upsertCrewJob(args);
    }

    case "bulk_create_crew_jobs": {
      const rows = Array.isArray(args?.rows) ? args.rows : [];
      if (!rows.length) {
        return { success: false, error: "rows is required and must include at least one job" };
      }
      let created = 0;
      let updated = 0;
      let failed = 0;
      const failures = [];
      const maxRows = 40;
      for (const [index, row] of rows.slice(0, maxRows).entries()) {
        const result = await upsertCrewJob(row);
        if (!result.success) {
          failed += 1;
          failures.push(`Row ${index + 1}: ${result.error}`);
          continue;
        }
        if (result.action === "updated") updated += 1;
        else created += 1;
      }
      return {
        success: failed === 0,
        message: `Bulk crew job intake complete. Created: ${created}, Updated: ${updated}, Failed: ${failed}.`,
        created,
        updated,
        failed,
        failures: failures.slice(0, 5),
      };
    }

    default:
      return { success: false, error: `Unknown tool: ${name}` };
  }
}

// ── Data fetching ──

const capLines = (lines, max) => {
  if (!lines || lines.length <= max) return lines || [];
  const omitted = lines.length - max;
  return [...lines.slice(-max), `- ... ${omitted} older rows omitted from this context.`];
};

const linesOrFallback = (lines, fallback) =>
  lines && lines.length ? lines.join("\n") : fallback;

async function fetchDataContext() {
  const { today, historyStart, historyEnd } = getDateRange();

  const [
    { data: workers },
    { data: categories },
    { data: crewJobs },
    { data: superintendents },
    { data: trucks },
    { data: schedules },
    { data: assignments },
    { data: rigDetails },
    { data: jobProgress, error: jobProgressError },
    { data: jobProgressUpdates, error: jobProgressUpdatesError },
    { data: jobPositions },
    { data: companyContacts },
    { data: contactSubmissions },
    { data: jobSubmissions },
  ] = await Promise.all([
    supabase.from("crew_workers").select("id, name, phone, role, is_active"),
    supabase
      .from("crew_categories")
      .select("id, name, color, sort_order")
      .order("sort_order"),
    supabase
      .from("crew_jobs")
      .select(
        "id, job_name, job_number, customer_name, address, city, pm_name, crane_required, is_active, default_rig, hiring_contractor"
      ),
    supabase.from("crew_superintendents").select("id, name, phone, is_active"),
    supabase.from("crew_trucks").select("id, truck_number, description, is_active"),
    supabase
      .from("crew_schedules")
      .select("id, schedule_date, is_finalized, finalized_at")
      .gte("schedule_date", historyStart)
      .lte("schedule_date", historyEnd)
      .order("schedule_date"),
    supabase
      .from("crew_assignments")
      .select(
        "id, schedule_id, category_id, worker_id, job_id, job_name, notes, sort_order, crew_workers(name, role), crew_categories(name), crew_jobs(job_name, job_number), crew_schedules!inner(schedule_date, is_finalized)"
      )
      .gte("crew_schedules.schedule_date", historyStart)
      .lte("crew_schedules.schedule_date", historyEnd)
      .order("schedule_id", { ascending: true })
      .order("sort_order", { ascending: true }),
    supabase
      .from("schedule_rig_details")
      .select(
        "id, notes, crane_info, crew_categories(name), crew_superintendents(name), crew_trucks(truck_number), crew_schedules!inner(schedule_date)"
      )
      .gte("crew_schedules.schedule_date", historyStart)
      .lte("crew_schedules.schedule_date", historyEnd),
    supabase
      .from("crew_job_progress")
      .select(
        "job_id, status, holes_completed, holes_target, estimated_start_date, estimated_end_date, notes, updated_at"
      )
      .order("updated_at", { ascending: false }),
    supabase
      .from("crew_job_progress_updates")
      .select("job_id, update_date, status, holes_completed, holes_target, notes, created_at")
      .order("created_at", { ascending: false })
      .limit(60),
    supabase.from("jobs").select("*").order("id", { ascending: false }),
    supabase.from("company_contacts").select("*").order("id", { ascending: false }),
    supabase
      .from("contact_form")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("job_form")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const progressByJobId = {};
  (jobProgress || []).forEach((row) => {
    if (!row?.job_id) return;
    progressByJobId[row.job_id] = row;
  });

  const rigDetailLookup = {};
  (rigDetails || []).forEach((row) => {
    const date = row?.crew_schedules?.schedule_date;
    const rigName = row?.crew_categories?.name || "";
    if (!date || !rigName) return;
    rigDetailLookup[`${date}::${rigName}`] = {
      superintendent: row?.crew_superintendents?.name || "",
      truck: row?.crew_trucks?.truck_number || "",
      crane: row?.crane_info || "",
      notes: row?.notes || "",
    };
  });

  const normalizedAssignments = (assignments || [])
    .map((row) => {
      const date = row?.crew_schedules?.schedule_date || "";
      const rig = row?.crew_categories?.name || "";
      const rigDetail = rigDetailLookup[`${date}::${rig}`] || {};
      return {
        date,
        finalized: !!row?.crew_schedules?.is_finalized,
        worker: row?.crew_workers?.name || "Unassigned",
        workerRole: row?.crew_workers?.role || "",
        job: row?.crew_jobs?.job_name || row?.job_name || "",
        jobNumber: row?.crew_jobs?.job_number || "",
        rig,
        notes: row?.notes || "",
        rigNotes: rigDetail.notes || "",
        superintendent: rigDetail.superintendent || "",
        truck: rigDetail.truck || "",
        crane: rigDetail.crane || "",
      };
    })
    .filter((row) => row.date)
    .sort((a, b) => a.date.localeCompare(b.date));

  const dailyRigMap = new Map();
  normalizedAssignments.forEach((entry) => {
    if (!dailyRigMap.has(entry.date)) dailyRigMap.set(entry.date, new Map());
    const rigMap = dailyRigMap.get(entry.date);
    const rigKey = entry.rig || "Unassigned";
    if (!rigMap.has(rigKey)) {
      rigMap.set(rigKey, {
        rig: rigKey,
        finalized: false,
        workers: new Set(),
        jobs: new Set(),
        notes: new Set(),
        superintendent: "",
        truck: "",
      });
    }
    const aggregate = rigMap.get(rigKey);
    aggregate.finalized = aggregate.finalized || entry.finalized;
    if (entry.worker) {
      aggregate.workers.add(
        entry.workerRole ? `${entry.worker} (${entry.workerRole})` : entry.worker
      );
    }
    if (entry.job) {
      aggregate.jobs.add(
        entry.jobNumber ? `${entry.job} #${entry.jobNumber}` : entry.job
      );
    }
    if (entry.notes) aggregate.notes.add(entry.notes);
    if (entry.rigNotes) aggregate.notes.add(entry.rigNotes);
    if (!aggregate.superintendent && entry.superintendent) {
      aggregate.superintendent = entry.superintendent;
    }
    if (!aggregate.truck && entry.truck) {
      aggregate.truck = entry.truck;
    }
  });

  const historyCalendarLines = Array.from(dailyRigMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, rigMap]) => {
      const rigSegments = Array.from(rigMap.values())
        .sort((a, b) => a.rig.localeCompare(b.rig))
        .map((entry) => {
          const parts = [
            entry.rig,
            `Jobs: ${Array.from(entry.jobs).join(", ") || "None"}`,
            `Crew: ${Array.from(entry.workers).join(", ") || "None"}`,
          ];
          if (entry.superintendent) parts.push(`Supt: ${entry.superintendent}`);
          if (entry.truck) parts.push(`Truck: ${entry.truck}`);
          if (entry.notes.size) {
            parts.push(`Notes: ${Array.from(entry.notes).slice(0, 2).join(" / ")}`);
          }
          parts.push(entry.finalized ? "FINALIZED" : "draft");
          return parts.join(" | ");
        });
      return `- ${date}: ${rigSegments.join(" || ")}`;
    });

  const assignmentLookupLines = capLines(
    normalizedAssignments.map(
      (entry) =>
        `- ${entry.date}: ${entry.worker}${entry.workerRole ? ` (${entry.workerRole})` : ""} -> ${entry.rig || "No rig"} -> ${entry.job || "No job"}${entry.jobNumber ? ` #${entry.jobNumber}` : ""}${entry.finalized ? " [FINALIZED]" : ""}`
    ),
    650
  );

  const activeWorkers = (workers || []).filter((w) => w.is_active !== false);
  const inactiveWorkers = (workers || []).filter((w) => w.is_active === false);
  const activeCrewJobs = (crewJobs || []).filter((j) => j.is_active !== false);

  const jobProgressLines = activeCrewJobs.map((job) => {
    const progress = progressByJobId[job.id];
    if (!progress) {
      return `- ${job.job_name}${job.job_number ? ` #${job.job_number}` : ""}: no progress update yet`;
    }
    const done = progress.holes_completed;
    const total = progress.holes_target;
    const percent =
      Number.isFinite(done) && Number.isFinite(total) && total > 0
        ? ` (${Math.round((done / total) * 100)}%)`
        : "";
    const eta = progress.estimated_start_date || progress.estimated_end_date
      ? ` | ETA: ${progress.estimated_start_date || "TBD"} -> ${
          progress.estimated_end_date || "TBD"
        }`
      : "";
    const updatedAt = progress.updated_at
      ? ` | Updated: ${new Date(progress.updated_at).toLocaleDateString()}`
      : "";
    return `- ${job.job_name}${job.job_number ? ` #${job.job_number}` : ""}: ${progress.status || "planned"} | Holes: ${done ?? 0}${total !== null && total !== undefined ? ` / ${total}` : ""}${percent}${eta}${updatedAt}${progress.notes ? ` | Note: ${progress.notes}` : ""}`;
  });

  const jobProgressUpdateLines = capLines(
    (jobProgressUpdates || []).map((row) => {
      const relatedJob = activeCrewJobs.find((job) => job.id === row.job_id);
      const label = relatedJob
        ? `${relatedJob.job_name}${relatedJob.job_number ? ` #${relatedJob.job_number}` : ""}`
        : row.job_id;
      return `- ${row.update_date || "unknown date"}: ${label} | ${row.status || "planned"} | Holes: ${row.holes_completed ?? 0}${row.holes_target !== null && row.holes_target !== undefined ? ` / ${row.holes_target}` : ""}${row.notes ? ` | ${row.notes}` : ""}`;
    }),
    80
  );

  return {
    today,
    historyStart,
    historyEnd,
    progressTrackingEnabled: !jobProgressError,
    progressUpdateHistoryEnabled: !jobProgressUpdatesError,
    summary: {
      totalActiveWorkers: activeWorkers.length,
      totalInactiveWorkers: inactiveWorkers.length,
      totalActiveCrewJobs: activeCrewJobs.length,
      jobsWithProgress: Object.keys(progressByJobId).length,
      totalRigs: (categories || []).length,
      totalSuperintendents: (superintendents || []).filter((s) => s.is_active !== false).length,
      totalTrucks: (trucks || []).filter((t) => t.is_active !== false).length,
      totalJobPositions: (jobPositions || []).length,
      openJobPositions: (jobPositions || []).filter((j) => j.is_Open).length,
      totalCompanyContacts: (companyContacts || []).length,
      totalContactSubmissions: (contactSubmissions || []).length,
      totalJobApplications: (jobSubmissions || []).length,
      totalSchedulesInWindow: (schedules || []).length,
    },
    workers: activeWorkers.map((w) => ({
      name: w.name,
      role: w.role || "",
      phone: w.phone || "",
    })),
    crewJobs: activeCrewJobs.map((j) => ({
      name: j.job_name,
      number: j.job_number || "",
      customer: j.customer_name || "",
      address: [j.address, j.city].filter(Boolean).join(", "),
      pm: j.pm_name || "",
      crane: j.crane_required ? "Yes" : "No",
      hiringContractor: j.hiring_contractor || "",
    })),
    rigs: (categories || []).map((c) => c.name),
    superintendents: (superintendents || [])
      .filter((s) => s.is_active !== false)
      .map((s) => s.name),
    trucks: (trucks || [])
      .filter((t) => t.is_active !== false)
      .map((t) => t.truck_number),
    schedules: (schedules || []).map((s) => ({
      date: s.schedule_date,
      dateFormatted: fmtDate(s.schedule_date),
      finalized: s.is_finalized || false,
    })),
    historyCalendarLines,
    assignmentLookupLines,
    jobProgressLines,
    jobProgressUpdateLines,
    jobPositions: (jobPositions || []).map((j) => ({
      title: j.jobTitle,
      description: j.jobDesc || "",
      open: j.is_Open,
      created: j.created_at,
    })),
    companyContacts: (companyContacts || []).map((c) => ({
      name: c.name,
      title: c.job_title || "",
      email: c.email || "",
      phone: c.phone || "",
    })),
    contactSubmissions: (contactSubmissions || []).map((s) => ({
      name: s.name || "",
      email: s.email || "",
      phone: s.number || "",
      message: s.message || "",
      date: s.created_at ? new Date(s.created_at).toLocaleDateString() : "",
    })),
    jobApplications: (jobSubmissions || []).map((s) => ({
      name: s.firstName || s.name || "",
      email: s.email || "",
      phone: s.number || s.phone || "",
      position: s.position || "",
      date: s.created_at ? new Date(s.created_at).toLocaleDateString() : "",
    })),
  };
}

// ── System prompt ──

function buildSystemPrompt(data) {
  const positionCounts = {};
  for (const app of data.jobApplications) {
    if (app.position) {
      positionCounts[app.position] = (positionCounts[app.position] || 0) + 1;
    }
  }

  return `You are the S&W Foundation Contractors assistant. You help the admin team with questions about crew schedules, calendar history (rigs/crew/jobs), job progress, equipment, career postings, company contacts, and form submissions. You are concise and practical.

Today is ${fmtDate(data.today)} (${data.today}).
Schedule history window loaded: ${data.historyStart} through ${data.historyEnd}.

OVERVIEW:
- ${data.summary.totalActiveWorkers} active crew workers, ${data.summary.totalInactiveWorkers} inactive
- ${data.summary.totalActiveCrewJobs} active crew jobs
- ${data.summary.jobsWithProgress} jobs with saved progress updates
- ${data.summary.totalRigs} rigs/categories
- ${data.summary.totalSuperintendents} superintendents, ${data.summary.totalTrucks} trucks
- ${data.summary.totalSchedulesInWindow} schedules in the loaded history window
- ${data.summary.totalJobPositions} career positions (${data.summary.openJobPositions} open)
- ${data.summary.totalCompanyContacts} company contacts
- ${data.summary.totalContactSubmissions} recent contact form submissions
- ${data.summary.totalJobApplications} recent job applications

CREW WORKERS:
${linesOrFallback(
  data.workers.map(
    (w) => `- ${w.name}${w.role ? ` (${w.role})` : ""}${w.phone ? ` - ${w.phone}` : ""}`
  ),
  "None"
)}

ACTIVE CREW JOBS:
${linesOrFallback(
  data.crewJobs.map(
    (j) =>
      `- ${j.name}${j.number ? ` #${j.number}` : ""}${j.customer ? ` | Customer: ${j.customer}` : ""}${j.address ? ` | ${j.address}` : ""}${j.pm ? ` | PM: ${j.pm}` : ""}${j.hiringContractor ? ` | Hiring: ${j.hiringContractor}` : ""}${j.crane === "Yes" ? " | CRANE REQUIRED" : ""}`
  ),
  "None"
)}

RIGS: ${data.rigs.join(", ") || "None"}
SUPERINTENDENTS: ${data.superintendents.join(", ") || "None"}
TRUCKS: ${data.trucks.join(", ") || "None"}

SCHEDULES (history window):
${linesOrFallback(
  data.schedules.map(
    (s) =>
      `- ${s.dateFormatted} (${s.date})${s.finalized ? " - FINALIZED" : " - draft"}`
  ),
  "No schedules in range."
)}

CALENDAR HISTORY BY DATE (grouped by rig):
${linesOrFallback(data.historyCalendarLines, "No calendar history in range.")}

ASSIGNMENT LOOKUP (worker -> rig -> job):
${linesOrFallback(data.assignmentLookupLines, "No assignment rows in range.")}

JOB PROGRESS TRACKING:
${
  data.progressTrackingEnabled
    ? linesOrFallback(data.jobProgressLines, "No active jobs found.")
    : "Progress table is not available yet (migration not applied)."
}

RECENT JOB PROGRESS UPDATES:
${
  data.progressUpdateHistoryEnabled
    ? linesOrFallback(data.jobProgressUpdateLines, "No saved progress update entries.")
    : "Progress update history table is not available yet."
}

CAREER POSITIONS (job postings on the website):
${linesOrFallback(
  data.jobPositions.map(
    (j) =>
      `- "${j.title}" - ${j.open ? "OPEN (visible)" : "CLOSED (hidden)"}${j.description ? ` | ${j.description.substring(0, 80)}` : ""}`
  ),
  "No positions."
)}

COMPANY CONTACTS:
${linesOrFallback(
  data.companyContacts.map(
    (c) =>
      `- ${c.name}${c.title ? ` (${c.title})` : ""}${c.email ? ` | ${c.email}` : ""}${c.phone ? ` | ${c.phone}` : ""}`
  ),
  "None"
)}

RECENT CONTACT FORM SUBMISSIONS (latest 20):
${linesOrFallback(
  data.contactSubmissions.map(
    (s) =>
      `- ${s.date}: ${s.name}${s.email ? ` | ${s.email}` : ""}${s.phone ? ` | ${s.phone}` : ""}${s.message ? ` | "${s.message.substring(0, 60)}${s.message.length > 60 ? "..." : ""}"` : ""}`
  ),
  "None"
)}

RECENT JOB APPLICATIONS (latest 30):
${linesOrFallback(
  data.jobApplications.map(
    (s) =>
      `- ${s.date}: ${s.name} applied for ${s.position || "unknown"}${s.email ? ` | ${s.email}` : ""}${s.phone ? ` | ${s.phone}` : ""}`
  ),
  "None"
)}

APPLICATIONS BY POSITION: ${Object.entries(positionCounts)
    .map(([pos, count]) => `${pos}: ${count}`)
    .join(", ") || "None"}

RULES:
- Answer directly from the data above.
- If asked about a date outside ${data.historyStart} to ${data.historyEnd}, say that date is outside the loaded history window.
- If asked about a date inside the window but there is no matching schedule/assignment, say no schedule is recorded for that date.
- Use plain language and keep responses short.
- When listing a day, group by rig/category.
- ONLY use tools for WRITE actions: create/toggle career positions, add/delete company contacts, and create/update crew jobs.
- If the user pastes multiple spreadsheet rows for job intake, call bulk_create_crew_jobs.
- You cannot modify crew schedules or crew assignments.
- If progress tracking tables are unavailable, say they are not configured yet.
- After any write action, remind them to refresh if needed.`;
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
