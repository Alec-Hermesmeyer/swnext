import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import { executeAdminAssistantMutation } from "@/lib/admin-assistant-mutations";
import {
  buildCrewJobActivitySurface,
  buildSalesOpportunityEditSurface,
  buildSalesPipelineListSurface,
  buildHiringPipelineSurface,
} from "@/lib/admin-assistant-surfaces";
import {
  canMutateSalesOpportunity,
  filterSalesOpportunitiesForUser,
  isSalesRole,
} from "@/lib/sales-pipeline-access";
import { canWrite as roleCanWrite, hasToolAccess } from "@/lib/roles";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_KEY = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

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
  // Read access token from simple cookie (synced by AuthContext) or Authorization header
  const accessToken = req.cookies?.['sb-access-token'] ||
    req.headers?.authorization?.replace('Bearer ', '');

  let user = null;

  if (accessToken) {
    const result = await supabase.auth.getUser(accessToken);
    user = result.data?.user || null;
  }

  // Fall back to cookie-based auth (legacy chunked cookies)
  if (!user) {
    const authClient = getAuthClient(req, res);
    const result = await authClient.auth.getUser();
    user = result.data?.user || null;
  }

  if (!user) {
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
    accessLevel: profile?.access_level ?? 3,
  };
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
    console.warn("Assistant action history write failed:", error.message);
  }
}

async function fetchSalesPipelineSurfaceData(userContext) {
  const { data: soRows, error } = await supabase
    .from("sales_opportunities")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    return { salesOpportunities: [] };
  }
  const level1SalesUserIds = await fetchLevel1SalesUserIds(userContext);
  const filtered = filterSalesOpportunitiesForUser(soRows || [], userContext, level1SalesUserIds);
  return {
    salesOpportunities: filtered.map((r) => ({
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
    })),
  };
}

async function fetchLevel1SalesUserIds(userContext) {
  if (!isSalesRole(userContext?.role)) return [];

  const { data: rows } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "sales")
    .eq("access_level", 1);

  return (rows || []).map((p) => p.id).filter(Boolean);
}

async function fetchSalesOpportunityForUser(opportunityId, userContext) {
  const id = String(opportunityId || "").trim();
  if (!id) {
    return { row: null, level1SalesUserIds: [] };
  }

  const { data: row, error } = await supabase
    .from("sales_opportunities")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !row) {
    return { row: null, level1SalesUserIds: [] };
  }

  const level1SalesUserIds = await fetchLevel1SalesUserIds(userContext);
  const filtered = filterSalesOpportunitiesForUser([row], userContext, level1SalesUserIds);

  return {
    row: filtered[0] || null,
    level1SalesUserIds,
  };
}

async function fetchCrewJobActivitySurfaceData() {
  const { data, error } = await supabase
    .from("crew_jobs")
    .select(
      "id, job_name, job_number, customer_name, address, city, pm_name, crane_required, is_active, default_rig, hiring_contractor"
    )
    .order("job_name");

  if (error) {
    return { crewJobsAll: [] };
  }

  return {
    crewJobsAll: (data || []).map((job) => ({
      id: job.id,
      name: job.job_name || "",
      number: job.job_number || "",
      customer: job.customer_name || "",
      address: [job.address, job.city].filter(Boolean).join(", "),
      pm: job.pm_name || "",
      crane: job.crane_required ? "Yes" : "No",
      hiringContractor: job.hiring_contractor || "",
      defaultRig: job.default_rig || "",
      isActive: job.is_active !== false,
    })),
  };
}

function summarizeUserSubmission(surfaceType, values) {
  switch (surfaceType) {
    case "workflow_profile_intake":
      return `Saved workflow context for ${values.role_title || "this user profile"}.`;
    case "crew_job_create":
      return `Created a crew job draft for ${values.job_name || "a new job"}.`;
    case "crew_job_update":
      return `Updated crew job detail for job ${values.job_id || "selection"}.`;
    case "crew_job_activity_list":
      return `Set ${values.job_label || "selected crew job"} ${values.set_active ? "active" : "inactive"}.`;
    case "career_position_create":
      return `Created a careers listing for ${values.jobTitle || "a new role"}.`;
    case "company_contact_create":
      return `Added ${values.name || "a new contact"} to the company directory.`;
    case "social_post_create":
      return `Created a social media post draft for ${values.platforms || "facebook"}.`;
    case "spam_block_rule_create":
      return `Blocked ${values.rule_type === "domain" ? `domain ${values.rule_value || ""}` : values.rule_value || "sender"} for contact submissions.`;
    case "sales_opportunity_create":
      return `Added sales opportunity "${values.title || "new"}" to the pipeline.`;
    case "sales_opportunity_update":
      return `Updated sales opportunity "${values.title || "selection"}" in chat.`;
    case "sales_pipeline_list":
      if (values.action === "edit") {
        return `Opened sales opportunity "${values.title || "selection"}" for editing in chat.`;
      }
      if (values.action === "set_stage") {
        return `Changed "${values.title || "selection"}" to ${values.stage || "the new stage"}.`;
      }
      return "Refreshed the sales pipeline in chat.";
    case "hiring_pipeline":
      if (values.action === "edit") {
        return `Opened hiring candidate "${values.title || "selection"}" for editing in chat.`;
      }
      if (values.action === "set_stage") {
        return `Changed hiring candidate "${values.title || "selection"}" to ${values.stage || "the new stage"}.`;
      }
      return "Refreshed the hiring pipeline in chat.";
    default:
      return "Submitted an assistant work surface.";
  }
}

function buildWorkflowProfileSnapshot(values, userContext) {
  const normalize = (value) => String(value || "").trim();

  return {
    role_title: normalize(values.role_title),
    department_name: normalize(values.department_name) || userContext.department || "",
    primary_goals: normalize(values.primary_goals),
    repetitive_tasks: normalize(values.repetitive_tasks),
    current_tools: normalize(values.current_tools),
    biggest_blockers: normalize(values.biggest_blockers),
    automation_comfort: normalize(values.automation_comfort),
    savedAt: new Date().toISOString(),
    roleSnapshot: userContext.role || "",
    departmentSnapshot: userContext.department || "",
    userNameSnapshot:
      userContext.fullName || userContext.username || userContext.email || "Current user",
  };
}

function getMutationConfig(surfaceType, values = {}) {
  switch (surfaceType) {
    case "crew_job_create":
      return {
        mutation: "create_crew_job",
        args: values,
      };
    case "crew_job_update":
      return {
        mutation: "update_crew_job_detail",
        args: values,
      };
    case "crew_job_activity_list":
      return {
        mutation: "toggle_crew_job_active",
        args: {
          job_id: values.job_id,
          set_active: values.set_active === true,
        },
      };
    case "career_position_create":
      return {
        mutation: "create_job_position",
        args: {
          jobTitle: values.jobTitle,
          jobDesc: values.jobDesc,
          is_Open: values.is_Open !== false,
        },
      };
    case "company_contact_create":
      return {
        mutation: "add_company_contact",
        args: values,
      };
    case "social_post_create": {
      const platforms = String(values.platforms || "facebook")
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      return {
        mutation: "create_social_post",
        args: {
          content: values.content,
          platforms,
          post_type: values.post_type || "general",
        },
      };
    }
    case "spam_block_rule_create":
      return {
        mutation: "add_spam_block_rule",
        args: {
          rule_type: values.rule_type,
          rule_value: values.rule_value,
          reason: values.reason,
        },
      };
    case "sales_opportunity_create":
      return {
        mutation: "create_sales_opportunity",
        args: {
          title: values.title,
          company: values.company,
          contact_name: values.contact_name,
          contact_email: values.contact_email,
          contact_phone: values.contact_phone,
          stage: values.stage,
          value_estimate: values.value_estimate,
          bid_due: values.bid_due,
          next_follow_up: values.next_follow_up,
          owner_name: values.owner_name,
          notes: values.notes,
        },
      };
    case "sales_opportunity_update":
      return {
        mutation: "update_sales_opportunity",
        args: {
          id: values.id,
          title: values.title,
          company: values.company,
          contact_name: values.contact_name,
          contact_email: values.contact_email,
          contact_phone: values.contact_phone,
          stage: values.stage,
          value_estimate: values.value_estimate,
          bid_due: values.bid_due,
          next_follow_up: values.next_follow_up,
          owner_name: values.owner_name,
          notes: values.notes,
          lost_reason: values.lost_reason,
        },
      };
    default:
      return null;
  }
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    if (!SUPABASE_URL || !SUPABASE_KEY || !SUPABASE_ANON_KEY) {
      return res.status(500).json({ error: "Supabase is not configured" });
    }

    const userContext = await getAuthenticatedUserContext(req, res);
    if (!userContext) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { sessionId = "", surfaceType = "", surfaceId = "", values = {} } = req.body || {};
    if (!sessionId || !surfaceType || !surfaceId || !values || typeof values !== "object") {
      return res.status(400).json({ error: "sessionId, surfaceType, surfaceId, and values are required" });
    }

    const userRole = String(userContext.role || "").trim().toLowerCase();
    const userAccessLevel = userContext.accessLevel ?? 3;
    const isWorkflowProfileSurface = surfaceType === "workflow_profile_intake";
    if (!isWorkflowProfileSurface && !roleCanWrite(userRole, userAccessLevel)) {
      return res.status(403).json({ error: "Write access is disabled for this role" });
    }

    if (isWorkflowProfileSurface) {
      const assistantProfile = buildWorkflowProfileSnapshot(values, userContext);
      const userMessage = summarizeUserSubmission(surfaceType, values);
      const assistantMessage =
        "I saved that workflow context and will use it to tailor automation, suggestions, and the work surfaces I open for you.";

      await storeMessages(sessionId, userContext, [
        {
          role: "user",
          content: userMessage,
          metadata: {
            submittedSurfaceType: surfaceType,
            submittedSurfaceId: surfaceId,
          },
        },
        {
          role: "assistant",
          content: assistantMessage,
          metadata: {
            completedSurfaceId: surfaceId,
            submittedSurfaceType: surfaceType,
            assistantProfileType: "workflow",
            assistantProfile,
          },
        },
      ]);

      return res.status(200).json({
        userMessage,
        assistantMessage,
        actionsPerformed: false,
        completedSurfaceId: surfaceId,
        assistantProfile,
      });
    }

    if (surfaceType === "sales_pipeline_list") {
      const action = String(values.action || "").trim().toLowerCase();

      if (action === "edit") {
        const { row } = await fetchSalesOpportunityForUser(values.opportunity_id, userContext);
        if (!row) {
          return res.status(404).json({ error: "Sales opportunity not found" });
        }

        const nextSurface = buildSalesOpportunityEditSurface(row);
        const userMessage = summarizeUserSubmission(surfaceType, values);
        const assistantMessage =
          "I opened the opportunity editor below so you can update the pipeline without leaving the assistant.";

        await storeMessages(sessionId, userContext, [
          {
            role: "user",
            content: userMessage,
            metadata: {
              submittedSurfaceType: surfaceType,
              submittedSurfaceId: surfaceId,
            },
          },
          {
            role: "assistant",
            content: assistantMessage,
            metadata: {
              actionsPerformed: false,
              completedSurfaceId: surfaceId,
              submittedSurfaceType: surfaceType,
              surface: nextSurface,
            },
          },
        ]);

        return res.status(200).json({
          userMessage,
          assistantMessage,
          actionsPerformed: false,
          completedSurfaceId: surfaceId,
          surface: nextSurface,
        });
      }

      if (action === "set_stage") {
        const { row, level1SalesUserIds } = await fetchSalesOpportunityForUser(
          values.opportunity_id,
          userContext
        );
        if (!row) {
          return res.status(404).json({ error: "Sales opportunity not found" });
        }
        if (!canMutateSalesOpportunity(row, userContext, level1SalesUserIds)) {
          return res.status(403).json({ error: "You do not have permission to update this opportunity" });
        }

        const result = await executeAdminAssistantMutation(supabase, "update_sales_opportunity", {
          id: row.id,
          stage: values.stage,
        });
        if (!result.success) {
          return res.status(400).json({ error: result.error || "Could not update sales opportunity" });
        }

        const surfaceData = await fetchSalesPipelineSurfaceData(userContext);
        const nextSurface = buildSalesPipelineListSurface(surfaceData, {
          writeAccessEnabled: roleCanWrite(userRole, userAccessLevel),
        });
        const userMessage = summarizeUserSubmission(surfaceType, values);
        const assistantMessage = `${result.message}. I refreshed the sales pipeline below.`;

        await storeMessages(sessionId, userContext, [
          {
            role: "user",
            content: userMessage,
            metadata: {
              submittedSurfaceType: surfaceType,
              submittedSurfaceId: surfaceId,
            },
          },
          {
            role: "assistant",
            content: assistantMessage,
            metadata: {
              actionsPerformed: true,
              completedSurfaceId: surfaceId,
              submittedSurfaceType: surfaceType,
              surface: nextSurface,
            },
          },
        ]);

        return res.status(200).json({
          userMessage,
          assistantMessage,
          actionsPerformed: true,
          completedSurfaceId: surfaceId,
          surface: nextSurface,
        });
      }
    }

    if (surfaceType === "sales_opportunity_update") {
      const { row, level1SalesUserIds } = await fetchSalesOpportunityForUser(values.id, userContext);
      if (!row) {
        return res.status(404).json({ error: "Sales opportunity not found" });
      }
      if (!canMutateSalesOpportunity(row, userContext, level1SalesUserIds)) {
        return res.status(403).json({ error: "You do not have permission to update this opportunity" });
      }
    }

    const config = getMutationConfig(surfaceType, values);
    if (!config) {
      return res.status(400).json({ error: "Unsupported assistant surface type" });
    }

    if (!hasToolAccess(userRole, config.mutation, userAccessLevel)) {
      return res.status(403).json({ error: "Your role does not have permission for this action" });
    }

    const mutationArgs =
      surfaceType === "sales_opportunity_create"
        ? {
            ...config.args,
            created_by: userContext.id,
            owner_user_id: userContext.id,
          }
        : config.args;

    const result = await executeAdminAssistantMutation(supabase, config.mutation, mutationArgs);
    if (!result.success) {
      return res.status(400).json({ error: result.error || "Could not complete assistant action" });
    }

    const userMessage = summarizeUserSubmission(surfaceType, values);
    let nextSurface = null;
    if (surfaceType === "crew_job_activity_list") {
      const surfaceData = await fetchCrewJobActivitySurfaceData();
      nextSurface = buildCrewJobActivitySurface(surfaceData, {
        view: values.view,
        canToggle: true,
      });
    } else if (
      surfaceType === "sales_opportunity_create" ||
      surfaceType === "sales_opportunity_update"
    ) {
      const surfaceData = await fetchSalesPipelineSurfaceData(userContext);
      nextSurface = buildSalesPipelineListSurface(surfaceData, {
        writeAccessEnabled: roleCanWrite(userRole, userAccessLevel),
      });
    }

    const assistantMessage = nextSurface
      ? surfaceType === "crew_job_activity_list"
        ? `${result.message}. I refreshed the live job list below.`
        : `${result.message}. I refreshed the sales pipeline below.`
      : `${result.message}. Refresh if the page view needs to catch up.`;

    await storeMessages(sessionId, userContext, [
      {
        role: "user",
        content: userMessage,
        metadata: {
          submittedSurfaceType: surfaceType,
          submittedSurfaceId: surfaceId,
        },
      },
      {
        role: "assistant",
        content: assistantMessage,
        metadata: {
          actionsPerformed: true,
          completedSurfaceId: surfaceId,
          submittedSurfaceType: surfaceType,
          ...(nextSurface ? { surface: nextSurface } : {}),
        },
      },
    ]);

    return res.status(200).json({
      userMessage,
      assistantMessage,
      actionsPerformed: true,
      completedSurfaceId: surfaceId,
      surface: nextSurface,
    });
  } catch (error) {
    console.error("Admin assistant action error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
}
