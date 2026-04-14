import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import { routeAdminAssistantRequest } from "@/lib/admin-assistant-direct-router";
import {
  buildAssistantSurface,
  buildSalesPipelineListSurface,
  buildHiringPipelineSurface,
  buildScheduleOverviewForDates,
} from "@/lib/admin-assistant-surfaces";
import { executeAdminAssistantMutation } from "@/lib/admin-assistant-mutations";
import {
  hasToolAccess,
  canWrite as roleCanWrite,
  getDataModules,
  isAdminRole,
  READ_ONLY_ASSISTANT_TOOLS,
  canAccessSalesPipeline,
  canAccessHiringPipeline,
} from "@/lib/roles";
import {
  canMutateSalesOpportunity,
  filterSalesOpportunitiesForUser,
  isSalesRole,
} from "@/lib/sales-pipeline-access";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_KEY = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

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

const serializeCookie = (name, value, options = {}) => {
  const enc = encodeURIComponent;
  const parts = [`${enc(name)}=${enc(value ?? "")}`];
  parts.push(`Path=${options.path || "/"}`);
  if (options.maxAge !== undefined) parts.push(`Max-Age=${Math.floor(options.maxAge)}`);
  if (options.domain) parts.push(`Domain=${options.domain}`);
  if (options.expires) parts.push(`Expires=${new Date(options.expires).toUTCString()}`);
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  if (options.sameSite) {
    const sameSite = String(options.sameSite).toLowerCase();
    if (sameSite === "lax") parts.push("SameSite=Lax");
    else if (sameSite === "strict") parts.push("SameSite=Strict");
    else if (sameSite === "none") parts.push("SameSite=None");
  }
  return parts.join("; ");
};

const appendResponseCookie = (res, name, value, options) => {
  const serialized = serializeCookie(name, value, options);
  const existing = res.getHeader("Set-Cookie");
  if (!existing) {
    res.setHeader("Set-Cookie", serialized);
    return;
  }
  const list = Array.isArray(existing) ? existing : [String(existing)];
  res.setHeader("Set-Cookie", [...list, serialized]);
};

const getAuthClient = (req, res) =>
  createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    cookies: {
      getAll() {
        return getRequestCookies(req);
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          appendResponseCookie(res, name, value, options);
        });
      },
    },
  });

async function getAuthenticatedUserContext(req, res) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase auth is not configured");
  }

  // Read access token from simple cookie (synced by AuthContext) or Authorization header
  const accessToken = req.cookies?.['sb-access-token'] ||
    req.headers?.authorization?.replace('Bearer ', '');

  let user = null;
  let authError = null;

  if (accessToken) {
    const result = await supabase.auth.getUser(accessToken);
    user = result.data?.user || null;
    authError = result.error;
  }

  // Fall back to cookie-based auth (legacy chunked cookies)
  if (!user) {
    const authClient = getAuthClient(req, res);
    const result = await authClient.auth.getUser();
    user = result.data?.user || null;
    authError = result.error;
  }

  if (authError || !user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, department, full_name, username, access_level")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email || "",
    fullName: profile?.full_name || user.user_metadata?.full_name || "",
    username: profile?.username || "",
    role: profile?.role || "",
    department: profile?.department || "",
    accessLevel: profile?.access_level || 3,
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
      name: "add_spam_block_rule",
      description: "Block a contact-form sender by exact email or by email domain. Blocked senders are silently accepted and no notification email is sent.",
      parameters: {
        type: "object",
        properties: {
          rule_type: { type: "string", enum: ["email", "domain"], description: "Type of block rule" },
          rule_value: { type: "string", description: "Exact email (name@domain.com) or domain (domain.com)" },
          reason: { type: "string", description: "Optional note for why this was blocked" },
        },
        required: ["rule_type", "rule_value"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_spam_block_rules",
      description: "List current spam blocklist rules for contact-form submissions.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "toggle_spam_block_rule",
      description: "Enable or disable a spam blocklist rule by its ID.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "Rule ID" },
          is_active: { type: "boolean", description: "True to enable, false to disable" },
        },
        required: ["id", "is_active"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "remove_spam_block_rule",
      description: "Delete a spam blocklist rule by its ID.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "Rule ID" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_crew_job",
      description:
        "Create or update one crew scheduler job record. Use this when the user provides job data (often from spreadsheet rows). Capture as many fields as possible — days, mob days, bid amount, pier count, scope, and dates are all valuable for tracking and analytics.",
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
          estimated_days: { type: "integer", description: "Estimated working days for the job (excludes mob)" },
          mob_days: { type: "integer", description: "Estimated mobilization days" },
          actual_days: { type: "integer", description: "Actual working days (fill in when job completes)" },
          actual_mob_days: { type: "integer", description: "Actual mob days (fill in when job completes)" },
          bid_amount: { type: "number", description: "Original bid amount in dollars" },
          contract_amount: { type: "number", description: "Final contract/award amount in dollars" },
          pier_count: { type: "integer", description: "Number of piers in scope" },
          scope_description: { type: "string", description: "Brief scope summary (e.g. '24in piers to 30ft')" },
          job_status: { type: "string", enum: ["bid", "awarded", "scheduled", "in_progress", "completed", "on_hold", "active"], description: "Job lifecycle stage" },
          start_date: { type: "string", description: "Actual or planned start date (YYYY-MM-DD)" },
          end_date: { type: "string", description: "Actual or planned end date (YYYY-MM-DD)" },
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
        "Create or update many crew scheduler jobs in one call. Use when the user pastes multiple spreadsheet rows. Include days, mob days, amounts, and scope when available.",
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
                estimated_days: { type: "integer" },
                mob_days: { type: "integer" },
                bid_amount: { type: "number" },
                contract_amount: { type: "number" },
                pier_count: { type: "integer" },
                scope_description: { type: "string" },
                job_status: { type: "string" },
                start_date: { type: "string" },
                end_date: { type: "string" },
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
  // ── Update existing crew job ──
  {
    type: "function",
    function: {
      name: "update_crew_job_detail",
      description: "Update fields on an existing crew job by ID. Use when the user wants to edit a specific job's details — address, PM, customer, crane, days, mob days, bid amount, scope, status, dates, etc. Requires the job_id (UUID) — look it up from the ACTIVE CREW JOBS list in context.",
      parameters: {
        type: "object",
        properties: {
          job_id: { type: "string", description: "UUID of the crew job to update" },
          job_name: { type: "string", description: "Updated job name" },
          job_number: { type: "string", description: "Updated job number" },
          dig_tess_number: { type: "string", description: "Dig Tess number" },
          customer_name: { type: "string", description: "Customer name" },
          hiring_contractor: { type: "string", description: "Hiring contractor / GC" },
          hiring_contact_name: { type: "string", description: "Hiring contact person" },
          hiring_contact_phone: { type: "string", description: "Hiring contact phone" },
          hiring_contact_email: { type: "string", description: "Hiring contact email" },
          address: { type: "string", description: "Street address" },
          city: { type: "string", description: "City" },
          zip: { type: "string", description: "ZIP code" },
          pm_name: { type: "string", description: "S&W PM name" },
          pm_phone: { type: "string", description: "S&W PM phone" },
          default_rig: { type: "string", description: "Default rig label" },
          crane_required: { type: "boolean", description: "Crane required flag" },
          estimated_days: { type: "integer", description: "Estimated working days (excludes mob)" },
          mob_days: { type: "integer", description: "Estimated mobilization days" },
          actual_days: { type: "integer", description: "Actual working days (when job completes)" },
          actual_mob_days: { type: "integer", description: "Actual mob days (when job completes)" },
          bid_amount: { type: "number", description: "Original bid amount in dollars" },
          contract_amount: { type: "number", description: "Final contract/award amount in dollars" },
          pier_count: { type: "integer", description: "Number of piers in scope" },
          scope_description: { type: "string", description: "Brief scope summary" },
          job_status: { type: "string", enum: ["bid", "awarded", "scheduled", "in_progress", "completed", "on_hold", "active"], description: "Job lifecycle stage" },
          start_date: { type: "string", description: "Actual or planned start date (YYYY-MM-DD)" },
          end_date: { type: "string", description: "Actual or planned end date (YYYY-MM-DD)" },
        },
        required: ["job_id"],
      },
    },
  },
  // ── Down day / schedule notes ──
  {
    type: "function",
    function: {
      name: "mark_down_day",
      description: "Mark a schedule date as a down day (rain, holiday, no work). Creates the schedule if needed and adds a note. Also removes all crew assignments for that day if clear_assignments is true.",
      parameters: {
        type: "object",
        properties: {
          schedule_date: { type: "string", description: "ISO date (YYYY-MM-DD)" },
          reason: { type: "string", description: "Reason for the down day (e.g. 'Rain day', 'Holiday', 'No work scheduled')" },
          clear_assignments: { type: "boolean", description: "If true, remove all existing crew assignments for this day. Default false." },
        },
        required: ["schedule_date", "reason"],
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
  {
    type: "function",
    function: {
      name: "get_social_planning",
      description: "Get the social media planning summary — upcoming posts, content calendar, and strategy overview from the social media workspace.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_social_library",
      description: "Get stored social media post history from the library. Shows past posts, drafts, and their performance.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "social_strategy_chat",
      description: "Ask the social media AI assistant for content strategy, post ideas, or brand voice guidance. Use this when the user wants help brainstorming social content.",
      parameters: {
        type: "object",
        properties: {
          message: { type: "string", description: "The social media question or request to send to the strategy assistant" },
        },
        required: ["message"],
      },
    },
  },
  // ── Team insights tool (admin only) ──
  {
    type: "function",
    function: {
      name: "get_team_insights",
      description: "Get workflow profiles submitted by team members through the 'Teach how I work' interview. Shows each person's role, goals, repetitive tasks, blockers, and automation comfort. Use this when the admin asks about what the team needs, what blockers exist, or what to build next.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  // ── Image management tools ──
  {
    type: "function",
    function: {
      name: "get_page_images",
      description: "Get the current image assignments for site pages. Shows which image is assigned to each slot (homepage hero, service page backgrounds, etc). Use when the user asks about what images are on the site, which images are assigned, or wants to review page images.",
      parameters: {
        type: "object",
        properties: {
          page: { type: "string", description: "Filter to a specific page section: homepage, hero, or services. Omit to get all." },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_gallery_images",
      description: "Get gallery images and their status. Shows which images are visible or hidden on the public gallery page, organized by category. Use when the user asks about gallery photos, wants to check which images are showing, or review gallery content.",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string", description: "Filter to a specific category like 'Pier Drilling', 'Equipment & Operations', etc. Omit to get all." },
          include_hidden: { type: "boolean", description: "Include hidden images in results. Default false." },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "toggle_gallery_image",
      description: "Show or hide a gallery image on the public gallery page. Use when the user wants to hide an image (e.g. safety concern) or bring a hidden image back.",
      parameters: {
        type: "object",
        properties: {
          image_id: { type: "string", description: "The UUID of the gallery image to toggle" },
          visible: { type: "boolean", description: "true to show, false to hide" },
        },
        required: ["image_id", "visible"],
      },
    },
  },
  // ── Knowledge base RAG search ──
  {
    type: "function",
    function: {
      name: "search_knowledge_base",
      description: "Search the company knowledge base for relevant context. Contains project history, client inquiries, team workflow profiles, company info, processes, and hiring data. Use this when the user asks about something that might have historical context, company background, past projects, client details, or process documentation that isn't in the live admin data above.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The search query — describe what context you need" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "lookup_crew_job",
      description:
        "Search the crew scheduler job list by job name, job number, customer, GC, city, or address. Use when the user asks to tell them about a specific job or project and you need full fields from the database (not just the short excerpt in the system prompt). If no rows match, the job may not be entered yet.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search text: job name, number, customer, location keyword, etc.",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_sales_opportunity",
      description:
        "Add a pre-award sales opportunity to the internal pipeline (same data as /admin/sales). Use when the user wants to log a bid, quote, or deal before job setup. Title is required.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Short name for the opportunity" },
          company: { type: "string", description: "Client or GC name" },
          contact_name: { type: "string" },
          contact_email: { type: "string" },
          contact_phone: { type: "string" },
          stage: {
            type: "string",
            description: "Pipeline stage",
            enum: ["qualify", "pursuing", "quoted", "negotiation", "won", "lost"],
          },
          value_estimate: { type: "number", description: "Estimated contract value in USD" },
          bid_due: { type: "string", description: "Bid due date YYYY-MM-DD" },
          next_follow_up: { type: "string", description: "Next follow-up date YYYY-MM-DD" },
          notes: { type: "string" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_sales_opportunity",
      description:
        "Update an existing pre-award sales opportunity in the internal pipeline. Use when the user wants to change the stage, dates, owner, value, notes, or contact details for a deal already in the pipeline. Use the opportunity_id from the SALES OPPORTUNITIES list in the system prompt.",
      parameters: {
        type: "object",
        properties: {
          opportunity_id: {
            type: "string",
            description: "The UUID for the opportunity from the SALES OPPORTUNITIES list",
          },
          title: { type: "string", description: "Updated short name for the opportunity" },
          company: { type: "string", description: "Updated client or GC name" },
          contact_name: { type: "string" },
          contact_email: { type: "string" },
          contact_phone: { type: "string" },
          owner_name: { type: "string", description: "Estimator or owner name" },
          stage: {
            type: "string",
            description: "Updated pipeline stage",
            enum: ["qualify", "pursuing", "quoted", "negotiation", "won", "lost"],
          },
          value_estimate: { type: "number", description: "Estimated contract value in USD" },
          bid_due: { type: "string", description: "Bid due date YYYY-MM-DD" },
          next_follow_up: { type: "string", description: "Next follow-up date YYYY-MM-DD" },
          notes: { type: "string" },
          lost_reason: { type: "string" },
        },
        required: ["opportunity_id"],
      },
    },
  },
  // ── Hiring pipeline tools ──
  {
    type: "function",
    function: {
      name: "create_hiring_candidate",
      description:
        "Add a candidate to the hiring pipeline. Use when the user wants to track an applicant, promote a job application into the pipeline, or manually add someone they're considering.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Short label for this candidate entry (e.g. 'John Smith — Crane Operator')" },
          applicant_name: { type: "string", description: "Full name of the applicant" },
          contact_email: { type: "string", description: "Applicant email" },
          contact_phone: { type: "string", description: "Applicant phone" },
          position_applied: { type: "string", description: "Position they applied for" },
          stage: {
            type: "string",
            description: "Pipeline stage",
            enum: ["new", "reviewing", "interview", "offer", "hired", "declined"],
          },
          next_follow_up: { type: "string", description: "Next follow-up date YYYY-MM-DD" },
          notes: { type: "string", description: "Notes about the candidate" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_hiring_candidate",
      description:
        "Update an existing hiring pipeline candidate. Use when the user wants to advance a candidate to the next stage, add notes, set a follow-up, mark as hired, or decline. Use the candidate ID from the HIRING PIPELINE list in context.",
      parameters: {
        type: "object",
        properties: {
          candidate_id: { type: "string", description: "The UUID of the hiring_opportunities row to update" },
          title: { type: "string", description: "Updated label" },
          applicant_name: { type: "string", description: "Updated name" },
          contact_email: { type: "string", description: "Updated email" },
          contact_phone: { type: "string", description: "Updated phone" },
          position_applied: { type: "string", description: "Updated position" },
          stage: {
            type: "string",
            description: "Updated pipeline stage",
            enum: ["new", "reviewing", "interview", "offer", "hired", "declined"],
          },
          next_follow_up: { type: "string", description: "Updated follow-up date YYYY-MM-DD" },
          notes: { type: "string", description: "Updated notes" },
          decline_reason: { type: "string", description: "Reason for declining (when stage=declined)" },
        },
        required: ["candidate_id"],
      },
    },
  },
  // ── Bidding analysis tools ──
  {
    type: "function",
    function: {
      name: "analyze_bid",
      description:
        "Run the AI bid analysis engine on a sales opportunity. Returns a recommended bid amount, confidence score, margin percentage, risk assessment, and competitive positioning. Use when the user asks to analyze a bid, get a bid recommendation, or wants help pricing a job. The opportunity must already exist in the sales pipeline.",
      parameters: {
        type: "object",
        properties: {
          opportunity_id: { type: "string", description: "UUID of the sales opportunity to analyze" },
          include_competitors: { type: "boolean", description: "Include competitor data in analysis (default true)" },
          include_market_data: { type: "boolean", description: "Include market intelligence (default true)" },
          include_client_history: { type: "boolean", description: "Include client bid history (default true)" },
          target_margin: { type: "number", description: "Target margin percentage (0-100). If omitted, the engine calculates an optimal margin." },
        },
        required: ["opportunity_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_competitor_intel",
      description:
        "Log competitor intelligence for a sales opportunity. Use when the user mentions a competitor bidding on the same job, their estimated bid, strengths, or win rate.",
      parameters: {
        type: "object",
        properties: {
          opportunity_id: { type: "string", description: "UUID of the sales opportunity" },
          competitor_name: { type: "string", description: "Name of the competing company" },
          estimated_bid: { type: "number", description: "Estimated bid amount from competitor" },
          known_strengths: { type: "string", description: "What this competitor is strong at" },
          known_weaknesses: { type: "string", description: "Known weaknesses of this competitor" },
          historical_win_rate: { type: "number", description: "Competitor win rate percentage (0-100)" },
          notes: { type: "string", description: "Additional notes about the competitor" },
        },
        required: ["opportunity_id", "competitor_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_bid_performance",
      description:
        "Get bid win/loss performance metrics. Shows total bids, wins, losses, win rate, and revenue by estimator/owner. Use when the user asks about bidding performance, win rates, or how the team is doing on bids.",
      parameters: {
        type: "object",
        properties: {
          owner_name: { type: "string", description: "Filter to a specific estimator/owner name. Omit for all." },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_bid_details",
      description:
        "Add specification details to a bid/sales opportunity. Use when ANYONE (sales, operations, field, estimator) provides job details that inform the bid — pier counts, depths, diameters, soil conditions, equipment needs, material costs, labor estimates, mob/demob, or scope notes. Data accumulates — multiple people can add different details over time and the bid analysis gets smarter. Also use when someone pastes bid sheet data or describes job specs conversationally.",
      parameters: {
        type: "object",
        properties: {
          opportunity_id: { type: "string", description: "UUID of the sales opportunity this bid is for" },
          spec_type: {
            type: "string",
            description: "Type of specification being added",
            enum: ["pier_scope", "equipment", "materials", "labor", "mobilization", "subcontractor", "soil_conditions", "general"],
          },
          pier_count: { type: "integer", description: "Number of piers in scope" },
          pier_depth: { type: "string", description: "Pier depth (e.g. '30ft', '25-40ft')" },
          pier_diameter: { type: "string", description: "Pier diameter (e.g. '24in', '36in')" },
          estimated_days: { type: "integer", description: "Estimated working days on site" },
          mob_days: { type: "integer", description: "Mobilization days" },
          crane_required: { type: "boolean", description: "Whether crane is needed" },
          equipment_details: { type: "string", description: "Equipment needed (rigs, crane type, etc.)" },
          material_cost_estimate: { type: "number", description: "Estimated material cost in dollars" },
          labor_cost_estimate: { type: "number", description: "Estimated labor cost in dollars" },
          mob_demob_cost: { type: "number", description: "Mobilization/demobilization cost" },
          subcontractor_cost: { type: "number", description: "Subcontractor costs" },
          soil_conditions: { type: "string", description: "Soil type and conditions (clay, rock, sand, etc.)" },
          difficulty_factor: {
            type: "string",
            description: "Job difficulty level",
            enum: ["standard", "moderate", "difficult", "extreme"],
          },
          complexity_score: { type: "integer", description: "Overall complexity 1-10" },
          notes: { type: "string", description: "Additional notes, special requirements, or pasted bid sheet data" },
        },
        required: ["opportunity_id", "spec_type"],
      },
    },
  },
];

// ── Tool execution ──

// ── Data fetching ──

const DATA_CACHE = new Map();
const DATA_CACHE_TTL = 45_000; // 45 seconds

function getDataCacheKey(modules, userId) {
  const mod = (modules || []).slice().sort().join(",") || "__all__";
  return userId ? `${mod}::uid:${userId}` : mod;
}

function getCachedDataContext(modules, userId) {
  const key = getDataCacheKey(modules, userId);
  const entry = DATA_CACHE.get(key);
  if (entry && Date.now() - entry.ts < DATA_CACHE_TTL) return entry.data;
  return null;
}

function setCachedDataContext(modules, userId, data) {
  const key = getDataCacheKey(modules, userId);
  DATA_CACHE.set(key, { data, ts: Date.now() });
  // Evict stale entries if map grows (prevents memory leak across many module combos)
  if (DATA_CACHE.size > 20) {
    const now = Date.now();
    for (const [k, v] of DATA_CACHE) {
      if (now - v.ts > DATA_CACHE_TTL) DATA_CACHE.delete(k);
    }
  }
}

async function fetchLevel1SalesUserIdsForUser(userContext) {
  if (!isSalesRole(userContext?.role)) return [];

  const { data: rows } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "sales")
    .eq("access_level", 1);

  return (rows || []).map((p) => p.id).filter(Boolean);
}

const capLines = (lines, max) => {
  if (!lines || lines.length <= max) return lines || [];
  const omitted = lines.length - max;
  return [...lines.slice(-max), `- ... ${omitted} older rows omitted from this context.`];
};

const linesOrFallback = (lines, fallback) =>
  lines && lines.length ? lines.join("\n") : fallback;

async function fetchDataContext(modules = [], { skipCache = false, userContext = null } = {}) {
  const userId = userContext?.id || null;
  if (!skipCache) {
    const cached = getCachedDataContext(modules, userId);
    if (cached) return cached;
  }

  const hasModule = (mod) => !modules.length || modules.includes(mod);
  const { today, historyStart, historyEnd } = getDateRange();

  const empty = { data: null };
  const emptyWithError = { data: null, error: null };

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
    { data: solutionFeatures },
    { data: hiringCandidates },
  ] = await Promise.all([
    // ── Schedule module queries (workers, rigs, jobs, schedules, assignments) ──
    hasModule("schedule")
      ? supabase.from("crew_workers").select("id, name, phone, role, is_active")
      : empty,
    hasModule("schedule")
      ? supabase
          .from("crew_categories")
          .select("id, name, color, sort_order")
          .order("sort_order")
      : empty,
    supabase
      .from("crew_jobs")
      .select(
        "id, job_name, job_number, customer_name, address, city, pm_name, crane_required, is_active, default_rig, hiring_contractor, estimated_days, mob_days, actual_days, actual_mob_days, bid_amount, contract_amount, pier_count, scope_description, job_status, start_date, end_date"
      ),
    hasModule("schedule")
      ? supabase.from("crew_superintendents").select("id, name, phone, is_active")
      : empty,
    hasModule("schedule")
      ? supabase.from("crew_trucks").select("id, truck_number, description, is_active")
      : empty,
    hasModule("schedule")
      ? supabase
          .from("crew_schedules")
          .select("id, schedule_date, is_finalized, finalized_at")
          .gte("schedule_date", historyStart)
          .lte("schedule_date", historyEnd)
          .order("schedule_date")
      : empty,
    hasModule("schedule")
      ? supabase
          .from("crew_assignments")
          .select(
            "id, schedule_id, category_id, worker_id, job_id, job_name, notes, sort_order, crew_workers(name, role), crew_categories(name), crew_jobs(job_name, job_number), crew_schedules!inner(schedule_date, is_finalized)"
          )
          .gte("crew_schedules.schedule_date", historyStart)
          .lte("crew_schedules.schedule_date", historyEnd)
          .order("schedule_id", { ascending: true })
          .order("sort_order", { ascending: true })
      : empty,
    hasModule("schedule")
      ? supabase
          .from("schedule_rig_details")
          .select(
            "id, notes, crane_info, crew_categories(name), crew_superintendents(name), crew_trucks(truck_number), crew_schedules!inner(schedule_date)"
          )
          .gte("crew_schedules.schedule_date", historyStart)
          .lte("crew_schedules.schedule_date", historyEnd)
      : empty,
    hasModule("schedule")
      ? supabase
          .from("crew_job_progress")
          .select(
            "job_id, status, holes_completed, holes_target, estimated_start_date, estimated_end_date, notes, updated_at"
          )
          .order("updated_at", { ascending: false })
      : emptyWithError,
    hasModule("schedule")
      ? supabase
          .from("crew_job_progress_updates")
          .select("job_id, update_date, status, holes_completed, holes_target, notes, created_at")
          .order("created_at", { ascending: false })
          .limit(60)
      : emptyWithError,
    // ── Careers module ──
    hasModule("careers")
      ? supabase.from("jobs").select("*").order("id", { ascending: false })
      : empty,
    // ── Contacts module ──
    hasModule("contacts")
      ? supabase.from("company_contacts").select("*").order("id", { ascending: false })
      : empty,
    // ── Submissions module ──
    hasModule("submissions")
      ? supabase
          .from("contact_form")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20)
      : empty,
    hasModule("submissions")
      ? supabase
          .from("job_form")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(30)
      : empty,
    // ── Social module ──
    hasModule("social")
      ? supabase
          .from("social_posts")
          .select("id, platforms, content, post_type, status, scheduled_for, published_at, created_at")
          .order("created_at", { ascending: false })
          .limit(20)
      : empty,
    hasModule("social")
      ? supabase
          .from("brand_voice")
          .select("platform, voice_profile, tone_controls, analyzed_at")
      : empty,
    // ── Solutions catalog ──
    supabase
      .from("admin_features")
      .select("slug, title, description, priority, status, status_note, href")
      .order("sort_order", { ascending: true }),
    // ── Hiring pipeline ──
    hasModule("hiring")
      ? supabase
          .from("hiring_opportunities")
          .select("id, title, applicant_name, contact_email, contact_phone, position_applied, stage, next_follow_up, notes, decline_reason, created_at, updated_at")
          .order("created_at", { ascending: false })
          .limit(50)
      : empty,
  ]);

  const progressByJobId = {};
  (jobProgress || []).forEach((row) => {
    if (!row?.job_id) return;
    progressByJobId[row.job_id] = row;
  });

  const parseRigDayType = (notes) => {
    const raw = String(notes || "").trim();
    if (!raw.startsWith("__rig_day_type__:")) return "working";
    const value = raw.replace("__rig_day_type__:", "").trim().toLowerCase();
    return value || "working";
  };

  const defaultRigStatusLabel = (dayType) => {
    if (dayType === "mob") return "Mob Rig";
    if (dayType === "down_day") return "Down Day";
    if (dayType === "repairs") return "Repairs";
    if (dayType === "shop") return "Shop / Yard";
    if (dayType === "custom") return "Custom Status";
    return "";
  };

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

  const rigStatusLookup = {};
  (assignments || []).forEach((row) => {
    const date = row?.crew_schedules?.schedule_date || "";
    const rigName = row?.crew_categories?.name || "";
    const dayType = parseRigDayType(row?.notes);
    if (!date || !rigName || dayType === "working") return;
    rigStatusLookup[`${date}::${rigName}`] = {
      dayType,
      statusLabel:
        String(row?.job_name || "").trim() || defaultRigStatusLabel(dayType),
    };
  });

  const normalizedAssignments = (assignments || [])
    .map((row) => {
      const date = row?.crew_schedules?.schedule_date || "";
      const rig = row?.crew_categories?.name || "";
      const rigDetail = rigDetailLookup[`${date}::${rig}`] || {};
      const rigStatus = rigStatusLookup[`${date}::${rig}`] || {
        dayType: "working",
        statusLabel: "",
      };
      const isStatusPlaceholder =
        !row?.worker_id && parseRigDayType(row?.notes) !== "working";
      return {
        date,
        finalized: !!row?.crew_schedules?.is_finalized,
        worker: row?.crew_workers?.name || "Unassigned",
        workerRole: row?.crew_workers?.role || "",
        job:
          rigStatus.statusLabel && !row?.job_id
            ? ""
            : row?.crew_jobs?.job_name || row?.job_name || "",
        jobNumber: row?.crew_jobs?.job_number || "",
        rig,
        notes: row?.notes || "",
        rigNotes: rigDetail.notes || "",
        superintendent: rigDetail.superintendent || "",
        truck: rigDetail.truck || "",
        crane: rigDetail.crane || "",
        statusLabel: rigStatus.statusLabel || "",
        dayType: rigStatus.dayType || "working",
        isStatusPlaceholder,
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
        statusLabel: "",
        dayType: "working",
      });
    }
    const aggregate = rigMap.get(rigKey);
    aggregate.finalized = aggregate.finalized || entry.finalized;
    if (entry.statusLabel) {
      aggregate.statusLabel = entry.statusLabel;
      aggregate.dayType = entry.dayType;
    }
    if (entry.isStatusPlaceholder) return;
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
            entry.statusLabel ? `Status: ${entry.statusLabel}` : "",
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
        `- ${entry.date}: ${entry.worker}${entry.workerRole ? ` (${entry.workerRole})` : ""} -> ${entry.rig || "No rig"} -> ${
          entry.statusLabel || entry.job || "No job"
        }${entry.jobNumber ? ` #${entry.jobNumber}` : ""}${entry.finalized ? " [FINALIZED]" : ""}`
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
        statusLabel: entry.statusLabel || "",
        dayType: entry.dayType || "working",
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
  const inactiveCrewJobs = (crewJobs || []).filter((j) => j.is_active === false);

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

  // Pre-build lookup map to avoid O(n*m) .find() inside .map()
  const crewJobLabelById = {};
  for (const job of activeCrewJobs) {
    crewJobLabelById[job.id] = `${job.job_name}${job.job_number ? ` #${job.job_number}` : ""}`;
  }

  const jobProgressUpdateLines = capLines(
    (jobProgressUpdates || []).map((row) => {
      const label = crewJobLabelById[row.job_id] || row.job_id;
      return `- ${row.update_date || "unknown date"}: ${label} | ${row.status || "planned"} | Holes: ${row.holes_completed ?? 0}${row.holes_target !== null && row.holes_target !== undefined ? ` / ${row.holes_target}` : ""}${row.notes ? ` | ${row.notes}` : ""}`;
    }),
    80
  );

  let salesOpportunities = [];
  if (
    hasModule("sales") &&
    userContext?.id &&
    canAccessSalesPipeline(userContext.role)
  ) {
    let level1SalesUserIds = [];
    if (isSalesRole(userContext.role)) {
      const { data: l1 } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "sales")
        .eq("access_level", 1);
      level1SalesUserIds = (l1 || []).map((p) => p.id).filter(Boolean);
    }
    const { data: soRows, error: soErr } = await supabase
      .from("sales_opportunities")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (!soErr && soRows) {
      salesOpportunities = filterSalesOpportunitiesForUser(soRows, userContext, level1SalesUserIds);
    }
  }

  const salesOpportunitiesNormalized = salesOpportunities.map((r) => ({
    id: r.id,
    title: r.title || "",
    company: r.company || "",
    stage: r.stage || "qualify",
    value_estimate: r.value_estimate,
    bid_due: r.bid_due,
    next_follow_up: r.next_follow_up,
    contact_name: r.contact_name || "",
    contact_email: r.contact_email || "",
    contact_phone: r.contact_phone || "",
    owner_name: r.owner_name || "",
    notes: r.notes || "",
    lost_reason: r.lost_reason || "",
    updated_at: r.updated_at || null,
  }));

  const result = {
    today,
    historyStart,
    historyEnd,
    progressTrackingEnabled: !jobProgressError,
    progressUpdateHistoryEnabled: !jobProgressUpdatesError,
    summary: {
      totalActiveWorkers: activeWorkers.length,
      totalInactiveWorkers: inactiveWorkers.length,
      totalActiveCrewJobs: activeCrewJobs.length,
      totalInactiveCrewJobs: inactiveCrewJobs.length,
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
      totalSalesOpportunities: salesOpportunitiesNormalized.length,
      totalHiringCandidates: (hiringCandidates || []).length,
      activeHiringCandidates: (hiringCandidates || []).filter((h) => h.stage !== "hired" && h.stage !== "declined").length,
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
      estDays: j.estimated_days || "",
      mobDays: j.mob_days || "",
      bidAmount: j.bid_amount || "",
      contractAmount: j.contract_amount || "",
      pierCount: j.pier_count || "",
      scope: j.scope_description || "",
      status: j.job_status || "active",
      startDate: j.start_date || "",
      endDate: j.end_date || "",
    })),
    crewJobsAll: (crewJobs || []).map((j) => ({
      id: j.id,
      name: j.job_name,
      number: j.job_number || "",
      customer: j.customer_name || "",
      address: [j.address, j.city].filter(Boolean).join(", "),
      pm: j.pm_name || "",
      crane: j.crane_required ? "Yes" : "No",
      hiringContractor: j.hiring_contractor || "",
      defaultRig: j.default_rig || "",
      isActive: j.is_active !== false,
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
    solutionFeatures: (solutionFeatures || []).map((f) => ({
      slug: f.slug,
      title: f.title,
      description: f.description || "",
      priority: f.priority || "support",
      status: f.status || "active",
      statusNote: f.status_note || "",
      href: f.href || "",
    })),
    salesOpportunities: salesOpportunitiesNormalized,
    hiringCandidates: (hiringCandidates || []).map((h) => ({
      id: h.id,
      title: h.title || "",
      applicant_name: h.applicant_name || "",
      contact_email: h.contact_email || "",
      contact_phone: h.contact_phone || "",
      position_applied: h.position_applied || "",
      stage: h.stage || "new",
      next_follow_up: h.next_follow_up || "",
      notes: h.notes || "",
      decline_reason: h.decline_reason || "",
      updated_at: h.updated_at || null,
    })),
  };

  setCachedDataContext(modules, userId, result);
  return result;
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

async function fetchSessionList(userContext) {
  if (!userContext?.id) return [];

  const { data, error } = await supabase
    .from("chat_messages")
    .select("session_id, role, content, created_at")
    .filter("metadata->>user_id", "eq", userContext.id)
    .eq("role", "user")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.warn("Thread list fetch failed:", error.message);
    return [];
  }

  // Group by session_id — first user message becomes the title
  const sessions = new Map();
  for (const row of (data || []).reverse()) {
    if (!sessions.has(row.session_id)) {
      sessions.set(row.session_id, {
        sessionId: row.session_id,
        title: (row.content || "").slice(0, 80) || "Untitled",
        createdAt: row.created_at,
        lastActivity: row.created_at,
      });
    } else {
      sessions.get(row.session_id).lastActivity = row.created_at;
    }
  }

  return Array.from(sessions.values()).sort(
    (a, b) => new Date(b.lastActivity) - new Date(a.lastActivity)
  );
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
  const writeAllowed = roleCanWrite(String(role || "").trim().toLowerCase(), userContext?.accessLevel ?? 3);
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
- ${data.summary.totalSalesOpportunities ?? 0} sales opportunities (pre-award pipeline)
- ${data.summary.totalHiringCandidates ?? 0} hiring pipeline candidates (${data.summary.activeHiringCandidates ?? 0} active)
- ${data.summary.totalSocialPosts} social posts (${data.summary.pendingSocialPosts} pending review, ${data.summary.scheduledSocialPosts} scheduled)

CREW WORKERS:
${linesOrFallback(
  data.workers.map(
    (w) => `- ${w.name}${w.role ? ` (${w.role})` : ""}${w.phone ? ` - ${w.phone}` : ""}`
  ),
  "None"
)}

ACTIVE CREW JOBS (id | name | details):
${linesOrFallback(
  data.crewJobs.map(
    (j) =>
      `- [${j.id}] ${j.name}${j.number ? ` #${j.number}` : ""}${j.status && j.status !== "active" ? ` [${j.status}]` : ""}${j.customer ? ` | Customer: ${j.customer}` : ""}${j.address ? ` | ${j.address}` : ""}${j.pm ? ` | PM: ${j.pm}` : ""}${j.hiringContractor ? ` | Hiring: ${j.hiringContractor}` : ""}${j.crane === "Yes" ? " | CRANE" : ""}${j.estDays ? ` | ${j.estDays}d` : ""}${j.mobDays ? ` +${j.mobDays}d mob` : ""}${j.pierCount ? ` | ${j.pierCount} piers` : ""}${j.scope ? ` | ${j.scope}` : ""}${j.bidAmount ? ` | Bid: $${Number(j.bidAmount).toLocaleString()}` : ""}${j.contractAmount ? ` | Contract: $${Number(j.contractAmount).toLocaleString()}` : ""}${j.startDate ? ` | Start: ${j.startDate}` : ""}${j.endDate ? ` | End: ${j.endDate}` : ""}`
  ),
  "None"
)}

JOB LOOKUP: If the user asks about a specific job by name or number and you need more than this summary, call lookup_crew_job. If the tool returns no rows, the job is probably not in the system yet — say so clearly and suggest Crew Scheduler or job intake to add it.

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
      `- ${s.date}: ${s.name}${s.email ? ` | ${s.email}` : ""}${s.phone ? ` | ${s.phone}` : ""}${s.message ? ` | "${s.message.substring(0, 200)}${s.message.length > 200 ? "..." : ""}"` : ""}`
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

SALES OPPORTUNITIES (pre-award pipeline — visible to you):
${linesOrFallback(
  (data.salesOpportunities || []).map((o) => {
    const money =
      o.value_estimate != null && o.value_estimate !== ""
        ? ` | est ${Number(o.value_estimate).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}`
        : "";
    return `- [${o.id}] ${o.title}${o.company ? ` | ${o.company}` : ""} | stage: ${o.stage}${money}${o.owner_name ? ` | owner: ${o.owner_name}` : ""}${o.bid_due ? ` | bid due: ${o.bid_due}` : ""}${o.next_follow_up ? ` | follow-up: ${o.next_follow_up}` : ""}`;
  }),
  "None in your visible list."
)}

APPLICATIONS BY POSITION: ${Object.entries(positionCounts)
    .map(([pos, count]) => `${pos}: ${count}`)
    .join(", ") || "None"}

HIRING PIPELINE (${data.summary.totalHiringCandidates ?? 0} candidates, ${data.summary.activeHiringCandidates ?? 0} active):
${linesOrFallback(
  (data.hiringCandidates || []).map((h) => {
    return `- [${h.id}] ${h.title}${h.applicant_name ? ` | ${h.applicant_name}` : ""} | stage: ${h.stage}${h.position_applied ? ` | position: ${h.position_applied}` : ""}${h.contact_email ? ` | ${h.contact_email}` : ""}${h.next_follow_up ? ` | follow-up: ${h.next_follow_up}` : ""}`;
  }),
  "No candidates in the hiring pipeline yet."
)}

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

SOLUTIONS & TOOLS CATALOG:
These are the solutions and tools available or in development for the workspace. When users ask about solutions, tools, available features, or what is being built, reference this catalog.
${linesOrFallback(
  data.solutionFeatures.map(
    (f) => `- ${f.title} [${f.status}${f.priority === "primary" ? " | PRIMARY" : ""}]: ${f.description}${f.statusNote ? ` — Status update: ${f.statusNote}` : ""}${f.href && f.href !== "#" ? ` | Link: ${f.href}` : ""}`
  ),
  "No solutions configured yet."
)}

JOB INTAKE GUIDE:
When the user wants to enter a new job (from a bid sheet, email, or spreadsheet):
1. IMPORTANT: If the user says "I'm going to paste", "here is the data", "let me paste", or "pasting from a spreadsheet" but has NOT included actual tabular data in the same message, do NOT call any tools yet. Instead, reply "Go ahead and paste it — I'll process it when I see the data." and WAIT for the next message.
2. If the message actually contains tabular data or multiple rows of job info, call bulk_create_crew_jobs to batch-create them.
3. If they describe a single job conversationally, extract the fields and call create_crew_job.
4. Only job_name is required. Accept partial info and create the job — details can be added later.
5. If they mention the customer, contractor, address, PM, etc., include those fields.
6. After creating, confirm what was saved and ask if they want to add more detail or enter another job.
7. Common bid sheet fields: Job Name, Job Number, Customer, Hiring Contractor, Contact Name/Phone/Email, Address/City/ZIP, PM, Dig Tess Number, Default Rig, Crane Required.
8. ALWAYS capture duration and scope data when available: estimated_days (working days, not including mob), mob_days (mobilization days), pier_count, scope_description (e.g. "24in piers to 30ft"), bid_amount, contract_amount, start_date, end_date.
9. When updating existing jobs with update_crew_job_detail, proactively ask about missing tracking fields (days, mob days, scope, amounts) if they are not yet filled in — this data feeds analytics and ROI reporting.
10. Job status lifecycle: bid → awarded → scheduled → in_progress → completed. Set job_status appropriately. Jobs from bids start as "bid", won jobs move to "awarded", etc.

JOB ANALYTICS CONTEXT:
Days, mob days, bid amounts, contract amounts, pier counts, and scope data are tracked to enable:
- Revenue per day analysis (contract_amount / actual_days)
- Mobilization efficiency (actual_mob_days vs mob_days estimates)
- Bid accuracy (bid_amount vs contract_amount)
- Customer ROI ranking (total revenue by customer vs total days)
- Scope-based pricing patterns ($/pier, $/day by scope type)
When users ask about job performance, profitability, or which jobs/customers are most profitable, use these fields to calculate insights from the crew jobs data.

SCHEDULE BUILDER GUIDE:
The schedule flow is: RIG → CREW → JOB → next rig → finalize → send packets. Walk users through rig-by-rig:
1. When they start building, ask which rig to set up first or suggest copying from a recent day.
2. For each rig: ask who is on the crew, then what job they are working.
3. After a rig is set, ask about the next rig that needs crew.
4. Once all rigs have crew, prompt them to set superintendent/truck details.
5. When details are set, suggest finalizing. After finalize, suggest sending the schedule email and packets — that kicks off the packet automation.
6. Keep responses short. The user sees a visual schedule update after every change.
7. If the user gives you multiple workers and a rig in one message (e.g. "Put Mike, John, and Carlos on Rig 1 for Johnson"), make ALL the assign_worker_to_rig calls in ONE round — one call per worker. Do not split into separate rounds.
8. If a day already has a schedule from a copy or previous build, show what's already there before asking what to change.
9. After EVERY schedule change, briefly confirm what was done and ask what's next. Suggest the logical next step (next rig, set super/truck, finalize, etc.).
10. The user builds on paper today. Make this feel faster than paper — be proactive, don't wait for them to ask for the next step.

Tool patterns:
- "Put [worker] on [rig]" -> assign_worker_to_rig
- "Put [worker] on [rig] for [job]" -> assign_worker_to_rig with job_name
- "Remove [worker]" -> remove_worker_from_schedule
- "Move [worker] from [rig1] to [rig2]" -> remove then assign
- "Set [super] as super for [rig]" -> set_rig_details
- "Assign [truck] to [rig]" -> set_rig_details with truck_number
- "Copy today to tomorrow" -> copy_schedule
- "Update the address on [job]" -> update_crew_job_detail with job_id from the ACTIVE CREW JOBS list
- "Tomorrow is a rain day" -> mark_down_day with schedule_date and reason
- "No work Friday" -> mark_down_day

DOWN DAYS:
When the user says a day is a down day (rain, weather, holiday, no work), call mark_down_day. This creates the schedule, marks it finalized, and adds the reason. If they say to clear the crew, set clear_assignments to true.

KNOWLEDGE BASE (RAG):
You have access to a company knowledge base via the search_knowledge_base tool. It contains embedded documents about:
- Project history (past and current jobs)
- Client inquiries and contact form messages
- Team workflow profiles (what people need and their blockers)
- Company contacts, career positions, processes
- Any manually added business context

WHEN TO USE IT:
- The user asks about past projects, a specific client, company processes, or historical context not fully covered by the live admin data above.
- The user asks "do we have info on…", "what do we know about…", or references something you can't answer from the data above.
- You are uncertain whether the live data covers the question — search first, then answer.

HOW TO USE IT WELL:
- Write a descriptive search query — "past pier drilling projects in Austin" is better than "Austin".
- Results come back ranked by relevance percentage. Focus on results above 75% relevance; treat lower-scoring results as supplementary.
- Synthesize the results into a clear answer — do not dump raw chunks to the user. Cite the category (e.g. "from project history" or "from a contact form submission") when it adds clarity.
- If no results are found, say so and suggest the user add the information via the Knowledge Base page.

IMAGE MANAGEMENT GUIDE:
The S&W website has two types of managed images:
1. **Page images** — hero banners, service cards, CTA backgrounds. Managed via the image_assignments table. Use get_page_images to see current assignments.
2. **Gallery images** — the public project gallery at /gallery. 42 photos organized by category. Managed via the gallery_images table. Use get_gallery_images to see them.

When the user asks about "images", "page images", "gallery", "photos", "what images are on the site", "check the gallery", etc.:
- Call get_page_images or get_gallery_images (or both) FIRST, then summarize what you find.
- Do NOT say you are unaware of images. You have tools to query them.
- Use get_gallery_images with include_hidden=true when the user wants to see hidden images or is doing a safety review.
- Use toggle_gallery_image to hide or show a gallery image by its ID.
- If the safety manager asks to check images, proactively include hidden images.
- After hiding/showing an image, remind the user the change is live on the public site immediately.
- For page image changes, direct the user to /admin/image-assignments where they can visually browse and swap images.

RULES:
- Answer directly from the data above.
- Tailor suggestions to the current user's role, department, and saved workflow profile when it is useful.
- Use the saved workflow profile to reduce repeated follow-up questions when that context is already known.
- If asked about a date outside ${data.historyStart} to ${data.historyEnd}, say that date is outside the loaded history window.
- If asked about a date inside the window but there is no matching schedule/assignment, say no schedule is recorded for that date.
- Use plain language and keep responses short.
- When listing a day, group by rig/category.
- Use tools for WRITE actions: create/toggle career positions, add/delete company contacts, create/update crew jobs, finalize schedules, send schedule emails, send packets, update job progress, create/update social posts, create_sales_opportunity / update_sales_opportunity for the pre-award pipeline, and create_hiring_candidate / update_hiring_candidate for the hiring pipeline.
- HIRING PIPELINE: Stages are New → Reviewing → Interview → Offer → Hired / Declined. When the user asks about applicants, hiring, candidates, or the hiring pipeline, reference the HIRING PIPELINE data. Use create_hiring_candidate to add someone and update_hiring_candidate to advance stages, add notes, or decline. Job applications from the RECENT JOB APPLICATIONS section can be promoted into the hiring pipeline by creating a candidate with their details.
- BID ANALYSIS & ESTIMATING:
  The bidding engine builds better recommendations as more data flows in from anyone on the team.
  • add_bid_details — Use when ANYONE provides job specs: pier counts, depths, diameters, soil conditions, equipment needs, material/labor costs, mob/demob, scope notes, or difficulty. Data accumulates — multiple people can add different pieces and the analysis improves. Also use when someone pastes bid sheet data.
  • analyze_bid — Runs the recommendation engine. It pulls from: (1) specs attached via add_bid_details, (2) historical pricing from completed crew_jobs (cost-per-pier, cost-per-day), (3) competitor intel, (4) market data, (5) client history. Confidence goes up as more data is available.
  • add_competitor_intel — Log competitor data (name, estimated bid, strengths, win rate).
  • get_bid_performance — Win/loss metrics by estimator.
  Flow: Someone in sales creates the opportunity → anyone adds specs/costs with add_bid_details → analyze_bid generates a recommendation. The more details provided, the more accurate the bid. If only a value_estimate exists, the engine still works but flags low confidence.
- For contact-form spam control, use add_spam_block_rule, list_spam_block_rules, toggle_spam_block_rule, and remove_spam_block_rule.
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
    model: "llama-3.3-70b-versatile",
    messages,
    temperature: 0.2,
    max_tokens: 2048,
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

    const userContext = await getAuthenticatedUserContext(req, res);
    if (!userContext) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (req.method === "GET") {
      // List all conversation threads for this user
      if (req.query?.list === "threads") {
        const threads = await fetchSessionList(userContext);
        return res.status(200).json({ threads });
      }

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
    const userAccessLevel = userContext.accessLevel || 3;
    const writeAccessEnabled = roleCanWrite(userRole, userAccessLevel);
    const canManageUsers = isAdminRole(userRole);
    const allowedModules = getDataModules(userRole, userAccessLevel);
    const [data, assistantProfile] = await Promise.all([
      fetchDataContext(allowedModules, { userContext }),
      fetchLatestAssistantProfile(userContext),
    ]);
    const pipelineAccess = canAccessSalesPipeline(userRole);
    const hiringAccess = canAccessHiringPipeline(userRole);
    const directRoute = routeAdminAssistantRequest({
      message,
      data,
      writeAccessEnabled,
      canManageUsers,
      assistantProfile,
      pipelineAccess,
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

    // Filter tools to only those the user's role + level can access
    const roleFilteredTools = tools.filter((t) => {
      const name = t.function.name;
      if (!hasToolAccess(userRole, name, userAccessLevel)) return false;
      if (writeAccessEnabled) return true;
      return READ_ONLY_ASSISTANT_TOOLS.includes(name);
    });

    let result = await callGroq(messages, roleFilteredTools.length > 0, roleFilteredTools);
    let choice = result.choices?.[0];

    let rounds = 0;
    while (
      choice?.finish_reason === "tool_calls" &&
      choice?.message?.tool_calls &&
      rounds < 5
    ) {
      rounds += 1;
      messages.push(choice.message);

      for (const toolCall of choice.message.tool_calls) {
        // Double-check permission at execution time
        if (!hasToolAccess(userRole, toolCall.function.name, userAccessLevel)) {
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

        const mergedArgs =
          toolCall.function.name === "create_sales_opportunity"
            ? {
                ...toolArgs,
                created_by: userContext.id,
                owner_user_id: userContext.id,
              }
            : toolArgs;

        if (toolCall.function.name === "update_sales_opportunity") {
          const opportunityId = String(toolArgs.opportunity_id || toolArgs.id || "").trim();
          const { data: existingOpportunity, error: existingOpportunityError } = await supabase
            .from("sales_opportunities")
            .select("*")
            .eq("id", opportunityId)
            .single();

          if (existingOpportunityError || !existingOpportunity) {
            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify({ success: false, error: "Sales opportunity not found." }),
            });
            continue;
          }

          const level1SalesUserIds = await fetchLevel1SalesUserIdsForUser(userContext);
          if (!canMutateSalesOpportunity(existingOpportunity, userContext, level1SalesUserIds)) {
            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify({ success: false, error: "You do not have permission to update this opportunity." }),
            });
            continue;
          }
        }

        const toolResult = await executeAdminAssistantMutation(
          supabase,
          toolCall.function.name,
          mergedArgs,
          { cookieHeader: req.headers?.cookie || "", userId: userContext?.id || null }
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
        const freshData = await fetchDataContext(allowedModules, { skipCache: true, userContext });
        surface = buildScheduleOverviewForDates(affectedDates, freshData);
      }
    }

    const toolsCalled = actionsPerformed
      ? messages
          .filter((m) => m?.tool_calls)
          .flatMap((m) => m.tool_calls.map((tc) => tc.function?.name))
          .filter(Boolean)
      : [];

    if (
      !surface &&
      toolsCalled.some((toolName) =>
        toolName === "create_sales_opportunity" || toolName === "update_sales_opportunity"
      )
    ) {
      const freshData = await fetchDataContext(allowedModules, { skipCache: true, userContext });
      surface = buildSalesPipelineListSurface(freshData, { writeAccessEnabled });
    }

    if (
      !surface &&
      toolsCalled.some((toolName) =>
        toolName === "create_hiring_candidate" || toolName === "update_hiring_candidate"
      )
    ) {
      const freshData = await fetchDataContext(allowedModules, { skipCache: true, userContext });
      surface = buildHiringPipelineSurface(freshData, { writeAccessEnabled });
    }

    if (!surface) {
      surface = buildAssistantSurface({
        message,
        data,
        writeAccessEnabled,
        canManageUsers,
        actionsPerformed,
        assistantProfile,
        pipelineAccess,
        hiringAccess,
      });
    }

    const reply = surface
      ? `${rawReply}\n\nI opened a working surface below so you can see the current state.`
      : rawReply;

    // Enrich metadata for analytics
    const affectedDates = actionsPerformed ? collectAffectedDates(messages) : [];
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
