import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import { routeAdminAssistantRequest } from "@/lib/admin-assistant-direct-router";
import { buildAssistantSurface, buildScheduleOverviewForDates } from "@/lib/admin-assistant-surfaces";
import { executeAdminAssistantMutation } from "@/lib/admin-assistant-mutations";
import { hasToolAccess, canWrite as roleCanWrite, getDataModules } from "@/lib/roles";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_KEY = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
const COOKIE_NAME = "sw-admin-auth";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Legacy fallback for non-standard role values not yet migrated
const READ_ONLY_ROLES = new Set(["viewer", "readonly", "read_only"]);

const getRequestCookies = (req) => {
  if (req?.cookies && typeof req.cookies.getAll === "function") {
    return req.cookies.getAll();
  }

  if (req?.cookies && typeof req.cookies === "object") {
    return Object.entries(req.cookies).map(([name, value]) => ({ name, value }));
  }

  const rawCookie = req?.headers?.cookie || "";
  return rawCookie
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const separatorIndex = part.indexOf("=");
      if (separatorIndex === -1) {
        return { name: part, value: "" };
      }

      return {
        name: decodeURIComponent(part.slice(0, separatorIndex)),
        value: decodeURIComponent(part.slice(separatorIndex + 1)),
      };
    });
};

const getAuthClient = (req) =>
  createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    cookieOptions: { name: COOKIE_NAME },
    cookies: {
      getAll() {
        return getRequestCookies(req);
      },
    },
  });

async function getAuthenticatedUserContext(req) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase auth is not configured");
  }

  const authClient = getAuthClient(req);
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, department, full_name, username")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email || "",
    fullName: profile?.full_name || user.user_metadata?.full_name || "",
    username: profile?.username || "",
    role: profile?.role || "",
    department: profile?.department || "",
  };
}

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
  // ── Schedule automation tools ──
  {
    type: "function",
    function: {
      name: "finalize_schedule",
      description: "Finalize a day's crew schedule, locking it in. Always confirm with the user before calling this.",
      parameters: {
        type: "object",
        properties: {
          schedule_date: { type: "string", description: "ISO date string (YYYY-MM-DD) of the schedule to finalize" },
        },
        required: ["schedule_date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_schedule_email",
      description: "Send the crew schedule email for a specific date to the operations team. The schedule should be finalized first.",
      parameters: {
        type: "object",
        properties: {
          schedule_date: { type: "string", description: "ISO date string (YYYY-MM-DD) of the schedule to email" },
        },
        required: ["schedule_date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_packets",
      description: "Generate and email DOCX cover sheet packets for a specific schedule date. The schedule should be finalized first.",
      parameters: {
        type: "object",
        properties: {
          schedule_date: { type: "string", description: "ISO date string (YYYY-MM-DD) of the schedule to generate packets for" },
        },
        required: ["schedule_date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_job_progress",
      description: "Update progress tracking for a crew job. Use when the user reports holes completed, status changes, or notes.",
      parameters: {
        type: "object",
        properties: {
          job_name: { type: "string", description: "Job name or job number to match" },
          holes_completed: { type: "number", description: "Current number of holes completed" },
          holes_target: { type: "number", description: "Total holes targeted for the job" },
          status: { type: "string", description: "Job status: planned, active, on_hold, or complete" },
          notes: { type: "string", description: "Progress notes or update comments" },
        },
        required: ["job_name"],
      },
    },
  },
  // ── Schedule builder tools ──
  {
    type: "function",
    function: {
      name: "assign_worker_to_rig",
      description: "Assign a worker to a rig on a specific date. Creates the schedule for that date if needed. Use worker and rig names exactly as listed in context.",
      parameters: {
        type: "object",
        properties: {
          schedule_date: { type: "string", description: "ISO date (YYYY-MM-DD)" },
          worker_name: { type: "string", description: "Worker name from the crew list" },
          rig_name: { type: "string", description: "Rig/category name (e.g. 'Rig 1', 'Crane')" },
          job_name: { type: "string", description: "Optional job name to set for this rig" },
        },
        required: ["schedule_date", "worker_name", "rig_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "remove_worker_from_schedule",
      description: "Remove a worker from a date's schedule. Optionally remove only from a specific rig.",
      parameters: {
        type: "object",
        properties: {
          schedule_date: { type: "string", description: "ISO date (YYYY-MM-DD)" },
          worker_name: { type: "string", description: "Worker name to remove" },
          rig_name: { type: "string", description: "Optional: only remove from this rig" },
        },
        required: ["schedule_date", "worker_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_rig_details",
      description: "Set superintendent, truck, crane info, or notes for a rig on a specific date.",
      parameters: {
        type: "object",
        properties: {
          schedule_date: { type: "string", description: "ISO date (YYYY-MM-DD)" },
          rig_name: { type: "string", description: "Rig/category name" },
          superintendent_name: { type: "string", description: "Superintendent name" },
          truck_number: { type: "string", description: "Truck number" },
          crane_info: { type: "string", description: "Crane details" },
          notes: { type: "string", description: "Rig notes" },
        },
        required: ["schedule_date", "rig_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "copy_schedule",
      description: "Copy an entire day's schedule (workers, jobs, rig details) to one or more target dates. Skips dates that already have assignments.",
      parameters: {
        type: "object",
        properties: {
          source_date: { type: "string", description: "ISO date (YYYY-MM-DD) to copy from" },
          target_dates: {
            type: "array",
            items: { type: "string" },
            description: "Array of ISO dates to copy to (max 7)",
          },
        },
        required: ["source_date", "target_dates"],
      },
    },
  },
  // ── Social media tools ──
  {
    type: "function",
    function: {
      name: "create_social_post",
      description: "Create a social media post draft for review. Use the brand voice profile for the target platform when drafting content.",
      parameters: {
        type: "object",
        properties: {
          content: { type: "string", description: "The post content/copy" },
          platforms: {
            type: "array",
            items: { type: "string", enum: ["facebook", "linkedin"] },
            description: "Target platforms (defaults to facebook)",
          },
          post_type: {
            type: "string",
            enum: ["project_showcase", "hiring", "industry_tip", "company_update", "community", "general"],
            description: "Type of social post",
          },
          scheduled_for: { type: "string", description: "ISO datetime to schedule the post for (optional)" },
        },
        required: ["content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_social_post",
      description: "Update an existing social post's content, status, or schedule.",
      parameters: {
        type: "object",
        properties: {
          post_id: { type: "string", description: "The UUID of the social post to update" },
          content: { type: "string", description: "Updated post content" },
          status: { type: "string", enum: ["pending", "approved", "rejected"], description: "New status for the post" },
          scheduled_for: { type: "string", description: "Updated scheduled datetime (ISO format)" },
        },
        required: ["post_id"],
      },
    },
  },
];

// ── Tool execution ──

// ── Data fetching ──

const capLines = (lines, max) => {
  if (!lines || lines.length <= max) return lines || [];
  const omitted = lines.length - max;
  return [...lines.slice(-max), `- ... ${omitted} older rows omitted from this context.`];
};

const linesOrFallback = (lines, fallback) =>
  lines && lines.length ? lines.join("\n") : fallback;

async function fetchDataContext(modules = []) {
  const hasModule = (mod) => !modules.length || modules.includes(mod);
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
    { data: socialPosts },
    { data: brandVoice },
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
    supabase
      .from("social_posts")
      .select("id, platforms, content, post_type, status, scheduled_for, published_at, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("brand_voice")
      .select("platform, voice_profile, tone_controls, analyzed_at"),
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

  const dailyScheduleBoards = (schedules || []).map((schedule) => {
    const rigMap = dailyRigMap.get(schedule.schedule_date) || new Map();
    const rigs = Array.from(rigMap.values())
      .sort((a, b) => a.rig.localeCompare(b.rig))
      .map((entry) => ({
        rig: entry.rig,
        finalized: entry.finalized,
        workers: Array.from(entry.workers),
        jobs: Array.from(entry.jobs),
        notes: Array.from(entry.notes).slice(0, 3),
        superintendent: entry.superintendent || "",
        truck: entry.truck || "",
      }));

    return {
      date: schedule.schedule_date,
      dateFormatted: fmtDate(schedule.schedule_date),
      finalized: !!schedule.is_finalized,
      rigs,
    };
  });

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
      totalSocialPosts: (socialPosts || []).length,
      pendingSocialPosts: (socialPosts || []).filter((p) => p.status === "pending").length,
      scheduledSocialPosts: (socialPosts || []).filter((p) => p.status === "scheduled").length,
      totalSchedulesInWindow: (schedules || []).length,
    },
    workers: activeWorkers.map((w) => ({
      name: w.name,
      role: w.role || "",
      phone: w.phone || "",
    })),
    crewJobs: activeCrewJobs.map((j) => ({
      id: j.id,
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
    dailyScheduleBoards,
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
    socialPosts: (socialPosts || []).map((p) => ({
      id: p.id,
      platforms: p.platforms || [],
      content: (p.content || "").substring(0, 120),
      type: p.post_type || "general",
      status: p.status || "pending",
      scheduledFor: p.scheduled_for || null,
      publishedAt: p.published_at || null,
      date: p.created_at ? new Date(p.created_at).toLocaleDateString() : "",
    })),
    brandVoice: (brandVoice || []).reduce((acc, bv) => {
      acc[bv.platform] = {
        toneControls: bv.tone_controls || {},
        analyzedAt: bv.analyzed_at || null,
      };
      return acc;
    }, {}),
  };
}

async function fetchStoredMessages(sessionId, userContext) {
  if (!sessionId) return [];

  const { data, error } = await supabase
    .from("chat_messages")
    .select("role, content, metadata")
    .eq("session_id", sessionId)
    .filter("metadata->>user_id", "eq", userContext.id)
    .order("created_at", { ascending: true })
    .limit(80);

  if (error) {
    console.warn("Assistant history read failed:", error.message);
    return [];
  }

  const completedSurfaceIds = new Set(
    (data || [])
      .map((message) => message?.metadata?.completedSurfaceId)
      .filter(Boolean)
      .map(String)
  );

  return (data || []).map((message) => ({
    role: message.role,
    content: message.content,
    actionsPerformed: !!message?.metadata?.actionsPerformed,
    surface: message?.metadata?.surface
      ? {
          ...message.metadata.surface,
          completed: completedSurfaceIds.has(String(message.metadata.surface.id)),
        }
      : null,
  }));
}

async function fetchLatestAssistantProfile(userContext) {
  if (!userContext?.id) return null;

  const { data, error } = await supabase
    .from("chat_messages")
    .select("metadata")
    .filter("metadata->>user_id", "eq", userContext.id)
    .order("created_at", { ascending: false })
    .limit(120);

  if (error) {
    console.warn("Assistant profile read failed:", error.message);
    return null;
  }

  const match = (data || []).find((row) => row?.metadata?.assistantProfile);
  return match?.metadata?.assistantProfile || null;
}

async function storeMessages(sessionId, userContext, entries) {
  if (!sessionId || !Array.isArray(entries) || !entries.length) return;

  const rows = entries
    .filter((entry) => entry?.role && entry?.content)
    .map((entry) => ({
      session_id: sessionId,
      role: entry.role,
      content: entry.content,
      metadata: {
        user_id: userContext.id,
        role: userContext.role || null,
        department: userContext.department || null,
        ...(entry.metadata || {}),
      },
    }));

  if (!rows.length) return;

  const { error } = await supabase.from("chat_messages").insert(rows);
  if (error) {
    console.warn("Assistant history write failed:", error.message);
  }
}

async function clearStoredMessages(sessionId, userContext) {
  if (!sessionId) return;

  const { error } = await supabase
    .from("chat_messages")
    .delete()
    .eq("session_id", sessionId)
    .filter("metadata->>user_id", "eq", userContext.id);

  if (error) {
    console.warn("Assistant history delete failed:", error.message);
  }
}

// ── System prompt ──

function buildSystemPrompt(data, userContext, assistantProfile) {
  const positionCounts = {};
  for (const app of data.jobApplications) {
    if (app.position) {
      positionCounts[app.position] = (positionCounts[app.position] || 0) + 1;
    }
  }

  const role = userContext?.role || "unknown";
  const department = userContext?.department || "unknown";
  const fullName =
    userContext?.fullName || userContext?.username || userContext?.email || "Current user";
  const writeAllowed = roleCanWrite(String(role || "").trim().toLowerCase());
  const workflowProfileSection = assistantProfile
    ? `USER WORKFLOW PROFILE:
- Self-described role: ${assistantProfile.role_title || "Not provided"}
- Team focus: ${assistantProfile.department_name || "Not provided"}
- Primary goals: ${assistantProfile.primary_goals || "Not provided"}
- Repetitive tasks: ${assistantProfile.repetitive_tasks || "Not provided"}
- Current tools: ${assistantProfile.current_tools || "Not provided"}
- Biggest blockers: ${assistantProfile.biggest_blockers || "Not provided"}
- Automation comfort: ${assistantProfile.automation_comfort || "Not provided"}`
    : `USER WORKFLOW PROFILE:
- No saved workflow interview yet. If the user wants more personalized automation or asks how you can help them specifically, suggest the workflow profile intake surface.`;

  return `You are the S&W Foundation Contractors assistant. You help the admin team with questions about crew schedules, calendar history (rigs/crew/jobs), job progress, equipment, career postings, company contacts, and form submissions. You are concise and practical.

Today is ${fmtDate(data.today)} (${data.today}).
Schedule history window loaded: ${data.historyStart} through ${data.historyEnd}.

CURRENT USER:
- Name: ${fullName}
- Role: ${role}
- Department: ${department}
- Write access in chat: ${writeAllowed ? "enabled" : "disabled"}

${workflowProfileSection}

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
- ${data.summary.totalSocialPosts} social posts (${data.summary.pendingSocialPosts} pending review, ${data.summary.scheduledSocialPosts} scheduled)

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

SOCIAL MEDIA:
- ${data.summary.totalSocialPosts} total posts (${data.summary.pendingSocialPosts} pending, ${data.summary.scheduledSocialPosts} scheduled)
${linesOrFallback(
  data.socialPosts.map(
    (p) =>
      `- [${p.status}] ${p.platforms.join("/")} ${p.type}: "${p.content}${p.content.length >= 120 ? "..." : ""}"${p.scheduledFor ? ` | Scheduled: ${p.scheduledFor}` : ""}${p.date ? ` | Created: ${p.date}` : ""}`
  ),
  "No social posts."
)}

BRAND VOICE PROFILES:
${Object.keys(data.brandVoice).length
  ? Object.entries(data.brandVoice)
      .map(([platform, bv]) => {
        const tc = bv.toneControls || {};
        return `- ${platform}: professional_casual=${tc.professional_casual || 5}, technical_accessible=${tc.technical_accessible || 5}, brevity_detail=${tc.brevity_detail || 5}, salesy_informative=${tc.salesy_informative || 5}`;
      })
      .join("\n")
  : "No brand voice profiles configured yet."
}

SCHEDULE BUILDER GUIDE:
When the user is building a schedule, walk them through it step by step. Be proactive:
1. After they assign workers to a rig, ask about the next rig or suggest setting superintendent/truck.
2. After all rigs have crew, suggest finalizing.
3. After finalizing, suggest sending the email and packets.
4. Use recent history to suggest crew — if the same weekday last week had workers on a rig, mention it.
5. Keep responses short and action-oriented. The user will see a visual schedule after each change.

Tool patterns:
- "Put [worker] on [rig]" -> assign_worker_to_rig
- "Put [worker] on [rig] for [job]" -> assign_worker_to_rig with job_name
- "Remove [worker]" -> remove_worker_from_schedule
- "Move [worker] from [rig1] to [rig2]" -> remove then assign
- "Set [super] as super for [rig]" -> set_rig_details
- "Assign [truck] to [rig]" -> set_rig_details with truck_number
- "Copy today to tomorrow" -> copy_schedule

RULES:
- Answer directly from the data above.
- Tailor suggestions to the current user's role, department, and saved workflow profile when it is useful.
- Use the saved workflow profile to reduce repeated follow-up questions when that context is already known.
- If asked about a date outside ${data.historyStart} to ${data.historyEnd}, say that date is outside the loaded history window.
- If asked about a date inside the window but there is no matching schedule/assignment, say no schedule is recorded for that date.
- Use plain language and keep responses short.
- When listing a day, group by rig/category.
- Use tools for WRITE actions: create/toggle career positions, add/delete company contacts, create/update crew jobs, finalize schedules, send schedule emails, send packets, update job progress, and create/update social posts.
- If the user pastes multiple spreadsheet rows for job intake, call bulk_create_crew_jobs.
- You can finalize schedules, send schedule emails, send packets, and update job progress. Always confirm with the user before finalizing or sending emails/packets.
- You CAN build crew schedules through conversation. Use assign_worker_to_rig to place workers on rigs, remove_worker_from_schedule to take them off, set_rig_details for superintendents/trucks/crane, and copy_schedule to duplicate a day.
- When the user says "tomorrow", use the date ${new Date(new Date(data.today + "T12:00:00").getTime() + 86400000).toISOString().split("T")[0]}. When they say "today", use ${data.today}.
- For schedule building, make multiple tool calls in one round when needed. "Put John and Mike on Rig 1" = two assign_worker_to_rig calls.
- Use worker, rig, job, superintendent, and truck names exactly as listed in the context. The tools resolve names to IDs.
- After schedule changes, briefly confirm what was done. The user will see an updated visual automatically.
- When drafting social posts, use the brand voice profile for the target platform. Default posts to 'pending' status so the user can review before publishing.
- If progress tracking tables are unavailable, say they are not configured yet.
- If write access in chat is disabled, do not offer or imply that you can make live data changes.
- After any write action, remind them to refresh if needed.
- The user's role is "${role}" which determines what actions are available. Only suggest actions the user can perform.`;
}

// ── Call Groq with tool support ──

async function callGroq(messages, useTools = true, filteredTools = tools) {
  const body = {
    model: "llama-3.1-8b-instant",
    messages,
    temperature: 0.3,
    max_tokens: 1024,
  };
  if (useTools && filteredTools.length > 0) {
    body.tools = filteredTools;
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

const SCHEDULE_BUILDER_TOOLS = new Set([
  "assign_worker_to_rig",
  "remove_worker_from_schedule",
  "set_rig_details",
  "copy_schedule",
  "finalize_schedule",
]);

function collectAffectedDates(messageHistory) {
  const dates = new Set();
  for (const msg of messageHistory) {
    if (!msg?.tool_calls) continue;
    for (const tc of msg.tool_calls) {
      if (!SCHEDULE_BUILDER_TOOLS.has(tc.function?.name)) continue;
      let args;
      try {
        args = typeof tc.function.arguments === "string"
          ? JSON.parse(tc.function.arguments)
          : tc.function.arguments;
      } catch { continue; }
      if (args?.schedule_date) dates.add(args.schedule_date);
      if (args?.source_date) dates.add(args.source_date);
      if (Array.isArray(args?.target_dates)) {
        args.target_dates.forEach((d) => dates.add(d));
      }
    }
  }
  return Array.from(dates).sort();
}

// ── Main handler ──

export default async function handler(req, res) {
  try {
    if (!SUPABASE_URL || !SUPABASE_KEY || !SUPABASE_ANON_KEY) {
      return res.status(500).json({ error: "Supabase is not configured" });
    }

    const userContext = await getAuthenticatedUserContext(req);
    if (!userContext) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (req.method === "GET") {
      const sessionId = String(req.query?.session_id || "").trim();
      if (!sessionId) {
        return res.status(400).json({ error: "session_id is required" });
      }

      const messages = await fetchStoredMessages(sessionId, userContext);
      return res.status(200).json({ messages });
    }

    if (req.method === "DELETE") {
      const sessionId = String(req.query?.session_id || "").trim();
      if (!sessionId) {
        return res.status(400).json({ error: "session_id is required" });
      }

      await clearStoredMessages(sessionId, userContext);
      return res.status(200).json({ success: true });
    }

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { message, history = [], sessionId = "" } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    const userRole = String(userContext.role || "").trim().toLowerCase();
    const writeAccessEnabled = roleCanWrite(userRole);
    const allowedModules = getDataModules(userRole);
    const [data, assistantProfile] = await Promise.all([
      fetchDataContext(allowedModules),
      fetchLatestAssistantProfile(userContext),
    ]);
    const directRoute = routeAdminAssistantRequest({
      message,
      data,
      writeAccessEnabled,
      assistantProfile,
    });

    if (directRoute?.handled) {
      if (sessionId) {
        await storeMessages(sessionId, userContext, [
          { role: "user", content: message },
          {
            role: "assistant",
            content: directRoute.reply,
            metadata: {
              actionsPerformed: !!directRoute.actionsPerformed,
              surface: directRoute.surface || null,
              responseMode: directRoute.mode || "direct",
            },
          },
        ]);
      }

      return res.status(200).json({
        reply: directRoute.reply,
        actionsPerformed: !!directRoute.actionsPerformed,
        surface: directRoute.surface || null,
        responseMode: directRoute.mode || "direct",
        userContext: {
          role: userContext.role || "",
          department: userContext.department || "",
        },
      });
    }

    if (!GROQ_API_KEY) {
      return res.status(500).json({ error: "AI service not configured" });
    }

    const systemPrompt = buildSystemPrompt(data, userContext, assistantProfile);

    const messages = [
      { role: "system", content: systemPrompt },
      ...history
        .filter((entry) => entry?.role && entry?.content)
        .slice(-20)
        .map((entry) => ({
          role: entry.role,
          content: entry.content,
        })),
      { role: "user", content: message },
    ];

    // Filter tools to only those the user's role can access
    const roleFilteredTools = writeAccessEnabled
      ? tools.filter((t) => hasToolAccess(userRole, t.function.name))
      : [];

    let result = await callGroq(messages, roleFilteredTools.length > 0, roleFilteredTools);
    let choice = result.choices?.[0];

    let rounds = 0;
    while (
      writeAccessEnabled &&
      choice?.finish_reason === "tool_calls" &&
      choice?.message?.tool_calls &&
      rounds < 3
    ) {
      rounds += 1;
      messages.push(choice.message);

      for (const toolCall of choice.message.tool_calls) {
        // Double-check permission at execution time
        if (!hasToolAccess(userRole, toolCall.function.name)) {
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify({ success: false, error: "Your role does not have permission for this action." }),
          });
          continue;
        }

        let toolArgs;
        try {
          toolArgs =
            typeof toolCall.function.arguments === "string"
              ? JSON.parse(toolCall.function.arguments)
              : toolCall.function.arguments;
        } catch {
          toolArgs = {};
        }

        const toolResult = await executeAdminAssistantMutation(
          supabase,
          toolCall.function.name,
          toolArgs
        );
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult),
        });
      }

      result = await callGroq(messages, false, []);
      choice = result.choices?.[0];
    }

    const rawReply = choice?.message?.content || "Sorry, I couldn't generate a response.";
    const actionsPerformed = rounds > 0;

    // Auto-attach schedule visual after schedule mutations
    let surface = null;
    if (actionsPerformed) {
      const affectedDates = collectAffectedDates(messages);
      if (affectedDates.length > 0) {
        const freshData = await fetchDataContext(allowedModules);
        surface = buildScheduleOverviewForDates(affectedDates, freshData);
      }
    }

    if (!surface) {
      surface = buildAssistantSurface({
        message,
        data,
        writeAccessEnabled,
        actionsPerformed,
        assistantProfile,
      });
    }

    const reply = surface
      ? `${rawReply}\n\nI opened a working surface below so you can see the current state.`
      : rawReply;

    // Enrich metadata for analytics
    const affectedDates = actionsPerformed ? collectAffectedDates(messages) : [];
    const toolsCalled = actionsPerformed
      ? messages
          .filter((m) => m?.tool_calls)
          .flatMap((m) => m.tool_calls.map((tc) => tc.function?.name))
          .filter(Boolean)
      : [];
    const isScheduleIntent = toolsCalled.some((t) => SCHEDULE_BUILDER_TOOLS.has(t));

    if (sessionId) {
      await storeMessages(sessionId, userContext, [
        {
          role: "user",
          content: message,
          metadata: isScheduleIntent ? { intent: "schedule_build" } : {},
        },
        {
          role: "assistant",
          content: reply,
          metadata: {
            actionsPerformed,
            surface,
            responseMode: "llm",
            ...(isScheduleIntent && {
              intent: "schedule_build",
              affectedDates,
              toolsCalled,
            }),
          },
        },
      ]);
    }

    return res.status(200).json({
      reply,
      actionsPerformed,
      surface,
      responseMode: "llm",
      userContext: {
        role: userContext.role || "",
        department: userContext.department || "",
      },
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
}
