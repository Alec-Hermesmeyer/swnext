// ── Role-based access control ──
// Single source of truth for all permission checks across the app.
//
// Roles map to real positions at S&W:
//   admin     → IT / Alec — full access
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
  operations: "operations",
  safety: "safety",
  social_media: "social_media",
  hr: "hr",
  sales: "sales",
  viewer: "viewer",
};

const ALL_NAV = [
  { href: "/admin", label: "Assistant" },
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/crew-scheduler", label: "Crew Scheduler" },
  { href: "/admin/social-media", label: "Social Media" },
  { href: "/admin/image-assignments", label: "Page Images" },
  { href: "/admin/company-contacts", label: "Contacts" },
  { href: "/admin/careers", label: "Careers" },
  { href: "/admin/sales", label: "Sales" },
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

const IMAGE_TOOLS = ["get_page_images", "get_gallery_images", "toggle_gallery_image"];

const RAG_TOOLS = ["search_knowledge_base"];

const ADMIN_TOOLS = ["get_team_insights"];

const OPERATIONS_PERMISSIONS = {
  pages: [
    "/admin",
    "/admin/dashboard",
    "/admin/crew-scheduler",
    "/admin/image-assignments",
    "/admin/company-contacts",
    "/admin/careers",
    "/admin/contact",
    "/admin/gallery",
  ],
  chatTools: [...SCHEDULE_TOOLS, ...CAREER_TOOLS, ...CONTACT_TOOLS, ...IMAGE_TOOLS, ...RAG_TOOLS],
  canWrite: true,
  dataModules: ["schedule", "careers", "contacts", "submissions"],
};

export const ROLE_PERMISSIONS = {
  admin: {
    pages: ALL_NAV.map((n) => n.href),
    chatTools: [...SCHEDULE_TOOLS, ...SOCIAL_TOOLS, ...CAREER_TOOLS, ...CONTACT_TOOLS, ...IMAGE_TOOLS, ...RAG_TOOLS, ...ADMIN_TOOLS],
    canWrite: true,
    dataModules: ["schedule", "social", "careers", "contacts", "sales", "submissions"],
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
    pages: ["/admin", "/admin/crew-scheduler"],
    chatTools: [...JOB_ENTRY_TOOLS, ...RAG_TOOLS],
    canWrite: true,
    dataModules: ["schedule"],
  },
  sales: {
    pages: ["/admin", "/admin/contact"],
    chatTools: [...RAG_TOOLS],
    canWrite: false,
    dataModules: ["submissions"],
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

export function getPermissions(role, accessLevel) {
  const base = ROLE_PERMISSIONS[role] || DEFAULT_PERMISSIONS;
  const level = Number(accessLevel) || 3; // default to full access

  // Admin always gets everything regardless of level
  if (role === "admin") return base;

  if (level >= 3) return base;

  if (level === 2) {
    return {
      ...base,
      chatTools: base.chatTools.filter((t) => !LEVEL_3_ONLY_TOOLS.has(t)),
    };
  }

  // Level 1 — view only
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
