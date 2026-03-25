import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import { executeAdminAssistantMutation } from "@/lib/admin-assistant-mutations";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_KEY = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
const COOKIE_NAME = "sw-admin-auth";
const READ_ONLY_ROLES = new Set(["viewer", "readonly", "read_only"]);

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

function summarizeUserSubmission(surfaceType, values) {
  switch (surfaceType) {
    case "workflow_profile_intake":
      return `Saved workflow context for ${values.role_title || "this user profile"}.`;
    case "crew_job_create":
      return `Created a crew job draft for ${values.job_name || "a new job"}.`;
    case "crew_job_update":
      return `Updated crew job detail for job ${values.job_id || "selection"}.`;
    case "career_position_create":
      return `Created a careers listing for ${values.jobTitle || "a new role"}.`;
    case "company_contact_create":
      return `Added ${values.name || "a new contact"} to the company directory.`;
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

    const userContext = await getAuthenticatedUserContext(req);
    if (!userContext) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { sessionId = "", surfaceType = "", surfaceId = "", values = {} } = req.body || {};
    if (!sessionId || !surfaceType || !surfaceId || !values || typeof values !== "object") {
      return res.status(400).json({ error: "sessionId, surfaceType, surfaceId, and values are required" });
    }

    const isWorkflowProfileSurface = surfaceType === "workflow_profile_intake";
    if (
      !isWorkflowProfileSurface &&
      READ_ONLY_ROLES.has(String(userContext.role || "").trim().toLowerCase())
    ) {
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

    const config = getMutationConfig(surfaceType, values);
    if (!config) {
      return res.status(400).json({ error: "Unsupported assistant surface type" });
    }

    const result = await executeAdminAssistantMutation(supabase, config.mutation, config.args);
    if (!result.success) {
      return res.status(400).json({ error: result.error || "Could not complete assistant action" });
    }

    const userMessage = summarizeUserSubmission(surfaceType, values);
    const assistantMessage = `${result.message}. Refresh if the page view needs to catch up.`;

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
        },
      },
    ]);

    return res.status(200).json({
      userMessage,
      assistantMessage,
      actionsPerformed: true,
      completedSurfaceId: surfaceId,
    });
  } catch (error) {
    console.error("Admin assistant action error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
}
