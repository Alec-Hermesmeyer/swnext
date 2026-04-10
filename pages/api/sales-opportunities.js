import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { canAccessSalesPipeline } from "@/lib/roles";
import { VALID_STAGE_IDS } from "@/lib/sales-pipeline";
import {
  canAssignSalesOpportunityOwner,
  canMutateSalesOpportunity,
  filterSalesOpportunitiesForUser,
  isSalesRole,
} from "@/lib/sales-pipeline-access";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("sales-opportunities: Supabase URL/anon key missing");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY, {
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
      if (separatorIndex === -1) return { name: part, value: "" };
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
  const accessToken =
    req.cookies?.["sb-access-token"] || req.headers?.authorization?.replace("Bearer ", "");

  let user = null;
  if (accessToken) {
    const result = await supabase.auth.getUser(accessToken);
    user = result.data?.user || null;
  }
  if (!user) {
    const authClient = getAuthClient(req, res);
    const result = await authClient.auth.getUser();
    user = result.data?.user || null;
  }
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, access_level")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    role: profile?.role || "",
    accessLevel: profile?.access_level ?? 3,
  };
}

async function fetchLevel1SalesUserIds() {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "sales")
    .eq("access_level", 1);
  return (data || []).map((p) => p.id).filter(Boolean);
}

function parseDateInput(v) {
  if (v === undefined || v === null || v === "") return null;
  const s = String(v).trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function normalizeStage(v) {
  const s = String(v || "").trim().toLowerCase();
  return VALID_STAGE_IDS.has(s) ? s : null;
}

function resolveOwnerUserIdForInsert(body, userContext) {
  const fromBody = body.owner_user_id ? String(body.owner_user_id).trim() : "";
  if (canAssignSalesOpportunityOwner(userContext) && fromBody) {
    return fromBody;
  }
  return userContext.id;
}

export default async function handler(req, res) {
  if (!SUPABASE_URL || (!SUPABASE_SERVICE_ROLE_KEY && !SUPABASE_ANON_KEY)) {
    return res.status(500).json({ error: "Supabase is not configured" });
  }

  const userContext = await getAuthenticatedUserContext(req, res);
  if (!userContext) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (!canAccessSalesPipeline(userContext.role)) {
    return res.status(403).json({ error: "You do not have access to the sales pipeline" });
  }

  const level1SalesUserIds = isSalesRole(userContext.role) ? await fetchLevel1SalesUserIds() : [];

  try {
    if (req.method === "GET") {
      const stageFilter = normalizeStage(req.query?.stage);
      let q = supabase.from("sales_opportunities").select("*").order("created_at", { ascending: false });
      if (stageFilter) q = q.eq("stage", stageFilter);
      const { data, error } = await q;
      if (error) {
        console.error("sales_opportunities GET:", error);
        return res.status(500).json({ error: error.message || "Could not load opportunities" });
      }
      let rows = data || [];
      rows = filterSalesOpportunitiesForUser(rows, userContext, level1SalesUserIds);
      return res.status(200).json({ opportunities: rows });
    }

    if (req.method === "POST") {
      const body = req.body || {};
      const title = String(body.title || "").trim();
      if (!title) {
        return res.status(400).json({ error: "title is required" });
      }
      const stage = normalizeStage(body.stage) || "qualify";
      const owner_user_id = resolveOwnerUserIdForInsert(body, userContext);

      const row = {
        title,
        company: String(body.company || "").trim() || null,
        contact_name: String(body.contact_name || "").trim() || null,
        contact_email: String(body.contact_email || "").trim() || null,
        contact_phone: String(body.contact_phone || "").trim() || null,
        stage,
        value_estimate:
          body.value_estimate === "" || body.value_estimate === undefined || body.value_estimate === null
            ? null
            : Number(body.value_estimate),
        bid_due: parseDateInput(body.bid_due),
        next_follow_up: parseDateInput(body.next_follow_up),
        owner_name: String(body.owner_name || "").trim() || null,
        notes: String(body.notes || "").trim() || null,
        lost_reason: String(body.lost_reason || "").trim() || null,
        created_by: userContext.id,
        owner_user_id,
      };
      if (row.value_estimate !== null && Number.isNaN(row.value_estimate)) {
        return res.status(400).json({ error: "value_estimate must be a number" });
      }
      const { data, error } = await supabase.from("sales_opportunities").insert(row).select("*").single();
      if (error) {
        console.error("sales_opportunities POST:", error);
        return res.status(500).json({ error: error.message || "Could not create opportunity" });
      }
      return res.status(201).json({ opportunity: data });
    }

    if (req.method === "PATCH") {
      const body = req.body || {};
      const id = String(body.id || "").trim();
      if (!id) {
        return res.status(400).json({ error: "id is required" });
      }

      const { data: existing, error: fetchErr } = await supabase
        .from("sales_opportunities")
        .select("*")
        .eq("id", id)
        .single();
      if (fetchErr || !existing) {
        return res.status(404).json({ error: "Opportunity not found" });
      }
      if (!canMutateSalesOpportunity(existing, userContext, level1SalesUserIds)) {
        return res.status(403).json({ error: "You cannot edit this opportunity" });
      }

      const updates = {};
      if (body.company !== undefined) updates.company = String(body.company || "").trim() || null;
      if (body.contact_name !== undefined) updates.contact_name = String(body.contact_name || "").trim() || null;
      if (body.contact_email !== undefined) updates.contact_email = String(body.contact_email || "").trim() || null;
      if (body.contact_phone !== undefined) updates.contact_phone = String(body.contact_phone || "").trim() || null;
      if (body.stage !== undefined) {
        const st = normalizeStage(body.stage);
        if (!st) return res.status(400).json({ error: "Invalid stage" });
        updates.stage = st;
      }
      if (body.value_estimate !== undefined) {
        updates.value_estimate =
          body.value_estimate === "" || body.value_estimate === null
            ? null
            : Number(body.value_estimate);
        if (updates.value_estimate !== null && Number.isNaN(updates.value_estimate)) {
          return res.status(400).json({ error: "value_estimate must be a number" });
        }
      }
      if (body.bid_due !== undefined) updates.bid_due = parseDateInput(body.bid_due);
      if (body.next_follow_up !== undefined) updates.next_follow_up = parseDateInput(body.next_follow_up);
      if (body.owner_name !== undefined) updates.owner_name = String(body.owner_name || "").trim() || null;
      if (body.notes !== undefined) updates.notes = String(body.notes || "").trim() || null;
      if (body.lost_reason !== undefined) updates.lost_reason = String(body.lost_reason || "").trim() || null;
      if (body.title !== undefined) {
        const t = String(body.title || "").trim();
        if (!t) return res.status(400).json({ error: "title cannot be empty" });
        updates.title = t;
      }
      if (body.owner_user_id !== undefined && canAssignSalesOpportunityOwner(userContext)) {
        const ou = String(body.owner_user_id || "").trim();
        updates.owner_user_id = ou || null;
      }

      const { data, error } = await supabase
        .from("sales_opportunities")
        .update(updates)
        .eq("id", id)
        .select("*")
        .single();
      if (error) {
        console.error("sales_opportunities PATCH:", error);
        return res.status(500).json({ error: error.message || "Could not update opportunity" });
      }
      return res.status(200).json({ opportunity: data });
    }

    if (req.method === "DELETE") {
      const id = String(req.query?.id || "").trim();
      if (!id) {
        return res.status(400).json({ error: "id query parameter is required" });
      }

      const { data: existing, error: fetchErr } = await supabase
        .from("sales_opportunities")
        .select("*")
        .eq("id", id)
        .single();
      if (fetchErr || !existing) {
        return res.status(404).json({ error: "Opportunity not found" });
      }
      if (!canMutateSalesOpportunity(existing, userContext, level1SalesUserIds)) {
        return res.status(403).json({ error: "You cannot delete this opportunity" });
      }

      const { error } = await supabase.from("sales_opportunities").delete().eq("id", id);
      if (error) {
        console.error("sales_opportunities DELETE:", error);
        return res.status(500).json({ error: error.message || "Could not delete opportunity" });
      }
      return res.status(204).end();
    }

    res.setHeader("Allow", "GET, POST, PATCH, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("sales-opportunities handler:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
