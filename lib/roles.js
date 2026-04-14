// ── Role-based access control ──
// Single source of truth for all permission checks across the app.
//
// Roles map to real positions at S&W:
//   admin     → IT / Alec — full access
//   owner     → company owner / leadership — same full access as admin
//   operations→ ops team + safety — scheduling, images, contacts, careers, submissions
//   safety    → alias for operations (same permissions)
//   social_media → social content team
//   hr        → Tatum — job entry & editing in crew scheduler
//   sales     → estimators — view contact form leads
//   viewer    → mechanics, financial, any other staff — assistant chat only
//
// Every role gets the assistant (/admin) so everyone can talk with the
// chatbot about their job and build a workflow profile.
//
// ACCESS LEVELS (hierarchy within each role):
//   3 = Lead   — full role permissions, all tools, can finalize/send/delete
//   2 = Standard — can write, core tools only (no finalize, send, delete)
//   1 = View   — read-only within the role's pages, no write tools, can still chat
//   Default is 3 if not set (backwards compatible).
//
// The role defines the CEILING. The access_level restricts within that ceiling.

export const ROLES = {
  admin: "admin",
  owner: "owner",
  operations: "operations",
  safety: "safety",
  social_media: "social_media",
  hr: "hr",
  sales: "sales",
  viewer: "viewer",
};

export const ROLE_OPTIONS = [
  {
    value: "",
    label: "No role",
    description: "No app permissions assigned yet.",
  },
  {
    value: "admin",
    label: "Admin (IT)",
    description: "Full access to every admin page and tool for internal IT/admin staff.",
  },
  {
    value: "owner",
    label: "Owner",
    description: "Same full access as Admin (IT) for company owners and leadership.",
  },
  {
    value: "operations",
    label: "Operations",
    description: "Scheduling, images, contacts, careers, and submissions.",
  },
  {
    value: "safety",
    label: "Safety",
    description: "Same permissions as operations with safety-focused use.",
  },
  {
    value: "social_media",
    label: "Social Media",
    description: "Social content plus page-image workflows.",
  },
  {
    value: "hr",
    label: "HR",
    description: "Crew scheduler, hiring pipeline for applicants, and job entry.",
  },
  {
    value: "sales",
    label: "Sales",
    description: "Pipeline and submissions; form submissions remain read-only in Submissions.",
  },
  {
    value: "viewer",
    label: "Staff / Viewer",
    description: "AI assistant chat only with no admin writes.",
  },
];

const ALL_NAV = [
  { href: "/admin", label: "AI Assistant" },
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/crew-scheduler", label: "Crew Scheduler" },
  { href: "/admin/social-media", label: "Social Media" },
  { href: "/admin/image-assignments", label: "Page Images" },
  { href: "/admin/company-contacts", label: "Contacts" },
  { href: "/admin/careers", label: "Careers" },
  { href: "/admin/sales", label: "Sales" },
  { href: "/admin/hiring", label: "Hiring" },
  { href: "/admin/contact", label: "Submissions" },
  { href: "/admin/gallery", label: "Gallery" },
  { href: "/admin/team-insights", label: "Team Insights" },
  { href: "/admin/knowledge-base", label: "Knowledge Base" },
  { href: "/admin/users", label: "Users" },
];

const SCHEDULE_TOOLS = [
  "create_crew_job",
  "bulk_create_crew_jobs",
  "update_crew_job_detail",
  "toggle_crew_job_active",
  "finalize_schedule",
  "send_schedule_email",
  "send_packets",
  "update_job_progress",
  "assign_worker_to_rig",
  "remove_worker_from_schedule",
  "set_rig_details",
  "copy_schedule",
  "mark_down_day",
];

const JOB_ENTRY_TOOLS = [
  "create_crew_job",
  "bulk_create_crew_jobs",
  "update_crew_job_detail",
  "toggle_crew_job_active",
];

const SOCIAL_TOOLS = [
  "create_social_post",
  "update_social_post",
  "get_social_planning",
  "get_social_library",
  "social_strategy_chat",
];

const CAREER_TOOLS = ["create_job_position", "toggle_job_position"];

const CONTACT_TOOLS = ["add_company_contact", "delete_company_contact"];
const SPAM_TOOLS = [
  "add_spam_block_rule",
  "list_spam_block_rules",
  "toggle_spam_block_rule",
  "remove_spam_block_rule",
];

const IMAGE_TOOLS = ["get_page_images", "get_gallery_images", "toggle_gallery_image"];

/** Pre-award sales pipeline tools available in assistant chat */
const SALES_TOOLS = ["create_sales_opportunity", "update_sales_opportunity"];

/** Hiring pipeline tools */
const HIRING_TOOLS = ["create_hiring_candidate", "update_hiring_candidate"];

/** Bidding analysis tools */
const BIDDING_TOOLS = ["analyze_bid", "add_competitor_intel", "get_bid_performance"];

const RAG_TOOLS = ["search_knowledge_base", "lookup_crew_job"];

/** Same as RAG_TOOLS — exposed for ai-chat when canWrite is false */
export const READ_ONLY_ASSISTANT_TOOLS = RAG_TOOLS;

const ADMIN_TOOLS = ["get_team_insights", "create_admin_user"];

const OPERATIONS_PERMISSIONS = {
  pages: [
    "/admin",
    "/admin/dashboard",
    "/admin/crew-scheduler",
    "/admin/image-assignments",
    "/admin/company-contacts",
    "/admin/careers",
    "/admin/sales",
    "/admin/hiring",
    "/admin/contact",
    "/admin/gallery",
  ],
  chatTools: [...SCHEDULE_TOOLS, ...CAREER_TOOLS, ...CONTACT_TOOLS, ...SPAM_TOOLS, ...IMAGE_TOOLS, ...SALES_TOOLS, ...HIRING_TOOLS, ...BIDDING_TOOLS, ...RAG_TOOLS],
  canWrite: true,
  dataModules: ["schedule", "careers", "contacts", "submissions", "sales", "hiring"],
};

export const ROLE_PERMISSIONS = {
  admin: {
    pages: ALL_NAV.map((n) => n.href),
    chatTools: [...SCHEDULE_TOOLS, ...SOCIAL_TOOLS, ...CAREER_TOOLS, ...CONTACT_TOOLS, ...SPAM_TOOLS, ...IMAGE_TOOLS, ...SALES_TOOLS, ...HIRING_TOOLS, ...BIDDING_TOOLS, ...RAG_TOOLS, ...ADMIN_TOOLS],
    canWrite: true,
    dataModules: ["schedule", "social", "careers", "contacts", "sales", "hiring", "submissions"],
  },
  owner: {
    pages: ALL_NAV.map((n) => n.href),
    chatTools: [...SCHEDULE_TOOLS, ...SOCIAL_TOOLS, ...CAREER_TOOLS, ...CONTACT_TOOLS, ...SPAM_TOOLS, ...IMAGE_TOOLS, ...SALES_TOOLS, ...HIRING_TOOLS, ...BIDDING_TOOLS, ...RAG_TOOLS, ...ADMIN_TOOLS],
    canWrite: true,
    dataModules: ["schedule", "social", "careers", "contacts", "sales", "hiring", "submissions"],
  },
  operations: OPERATIONS_PERMISSIONS,
  safety: OPERATIONS_PERMISSIONS,
  social_media: {
    pages: ["/admin", "/admin/dashboard", "/admin/social-media", "/admin/image-assignments"],
    chatTools: [...SOCIAL_TOOLS, ...IMAGE_TOOLS, ...RAG_TOOLS],
    canWrite: true,
    dataModules: ["social"],
  },
  hr: {
    pages: ["/admin", "/admin/crew-scheduler", "/admin/hiring"],
    chatTools: [...JOB_ENTRY_TOOLS, ...HIRING_TOOLS, ...RAG_TOOLS],
    canWrite: true,
    dataModules: ["schedule", "hiring"],
  },
  sales: {
    pages: ["/admin", "/admin/contact", "/admin/sales"],
    chatTools: [...SALES_TOOLS, ...BIDDING_TOOLS, ...READ_ONLY_ASSISTANT_TOOLS],
    canWrite: true,
    dataModules: ["submissions", "sales"],
  },
  viewer: {
    pages: ["/admin"],
    chatTools: [...RAG_TOOLS],
    canWrite: false,
    dataModules: [],
  },
};

const DEFAULT_PERMISSIONS = ROLE_PERMISSIONS.viewer;

// Tools that require level 3 (lead) — destructive or high-impact actions
const LEVEL_3_ONLY_TOOLS = new Set([
  "finalize_schedule",
  "send_schedule_email",
  "send_packets",
  "delete_company_contact",
  "toggle_job_position",
  "update_social_post",
  "get_team_insights",
]);

export const ACCESS_LEVELS = {
  1: { label: "View", description: "Read-only within role pages, can chat" },
  2: { label: "Standard", description: "Can write, core tools" },
  3: { label: "Lead", description: "Full role access, all tools" },
};

export const ACCESS_LEVEL_OPTIONS = Object.entries(ACCESS_LEVELS).map(([value, details]) => ({
  value: Number(value),
  label: `${value} — ${details.label}`,
  hint: details.description,
}));

/** Roles that can view and manage the pre-award sales pipeline on /admin/sales */
const SALES_PIPELINE_ROLES = new Set([
  ROLES.admin,
  ROLES.owner,
  ROLES.operations,
  ROLES.safety,
  ROLES.sales,
]);

export function canAccessSalesPipeline(role) {
  return SALES_PIPELINE_ROLES.has(String(role || "").trim().toLowerCase());
}

export const HIRING_PIPELINE_ROLES = new Set([
  ROLES.admin,
  ROLES.owner,
  ROLES.operations,
  ROLES.safety,
  ROLES.hr,
]);

export function canAccessHiringPipeline(role) {
  return HIRING_PIPELINE_ROLES.has(String(role || "").trim().toLowerCase());
}

export function isAdminRole(role) {
  const normalizedRole = String(role || "").trim().toLowerCase();
  return normalizedRole === ROLES.admin || normalizedRole === ROLES.owner;
}

export function getPermissions(role, accessLevel) {
  const base = ROLE_PERMISSIONS[role] || DEFAULT_PERMISSIONS;
  const level = Number(accessLevel) || 3; // default to full access

  // Admin/Owner always get everything regardless of level
  if (isAdminRole(role)) return base;

  if (level >= 3) return base;

  if (level === 2) {
    return {
      ...base,
      chatTools: base.chatTools.filter((t) => !LEVEL_3_ONLY_TOOLS.has(t)),
    };
  }

  // Level 1 — view only (except sales: keep read-only assistant tools for job lookup + RAG)
  const normalizedRole = String(role || "").trim().toLowerCase();
  if (normalizedRole === ROLES.sales) {
    return {
      ...base,
      chatTools: [...READ_ONLY_ASSISTANT_TOOLS],
      canWrite: false,
    };
  }

  return {
    ...base,
    chatTools: [],
    canWrite: false,
  };
}

export function hasPageAccess(role, pathname, accessLevel) {
  const perms = getPermissions(role, accessLevel);
  return perms.pages.includes(pathname);
}

export function hasToolAccess(role, toolName, accessLevel) {
  const perms = getPermissions(role, accessLevel);
  return perms.chatTools.includes(toolName);
}

export function canWrite(role, accessLevel) {
  return getPermissions(role, accessLevel).canWrite;
}

export function getVisibleNavLinks(role, accessLevel) {
  const perms = getPermissions(role, accessLevel);
  return ALL_NAV.filter((link) => perms.pages.includes(link.href));
}

export function getDataModules(role, accessLevel) {
  return getPermissions(role, accessLevel).dataModules;
}
