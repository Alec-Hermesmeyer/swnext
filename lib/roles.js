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
  { href: "/admin/users", label: "Users" },
];

const SCHEDULE_TOOLS = [
  "create_crew_job",
  "bulk_create_crew_jobs",
  "finalize_schedule",
  "send_schedule_email",
  "send_packets",
  "update_job_progress",
  "assign_worker_to_rig",
  "remove_worker_from_schedule",
  "set_rig_details",
  "copy_schedule",
];

const JOB_ENTRY_TOOLS = [
  "create_crew_job",
  "bulk_create_crew_jobs",
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
  chatTools: [...SCHEDULE_TOOLS, ...CAREER_TOOLS, ...CONTACT_TOOLS],
  canWrite: true,
  dataModules: ["schedule", "careers", "contacts", "submissions"],
};

export const ROLE_PERMISSIONS = {
  admin: {
    pages: ALL_NAV.map((n) => n.href),
    chatTools: [...SCHEDULE_TOOLS, ...SOCIAL_TOOLS, ...CAREER_TOOLS, ...CONTACT_TOOLS],
    canWrite: true,
    dataModules: ["schedule", "social", "careers", "contacts", "sales", "submissions"],
  },
  operations: OPERATIONS_PERMISSIONS,
  safety: OPERATIONS_PERMISSIONS,
  social_media: {
    pages: ["/admin", "/admin/dashboard", "/admin/social-media", "/admin/image-assignments"],
    chatTools: [...SOCIAL_TOOLS],
    canWrite: true,
    dataModules: ["social"],
  },
  hr: {
    pages: ["/admin", "/admin/crew-scheduler"],
    chatTools: [...JOB_ENTRY_TOOLS],
    canWrite: true,
    dataModules: ["schedule"],
  },
  sales: {
    pages: ["/admin", "/admin/contact"],
    chatTools: [],
    canWrite: false,
    dataModules: ["submissions"],
  },
  viewer: {
    pages: ["/admin"],
    chatTools: [],
    canWrite: false,
    dataModules: [],
  },
};

const DEFAULT_PERMISSIONS = ROLE_PERMISSIONS.viewer;

export function getPermissions(role) {
  return ROLE_PERMISSIONS[role] || DEFAULT_PERMISSIONS;
}

export function hasPageAccess(role, pathname) {
  const perms = getPermissions(role);
  return perms.pages.includes(pathname);
}

export function hasToolAccess(role, toolName) {
  const perms = getPermissions(role);
  return perms.chatTools.includes(toolName);
}

export function canWrite(role) {
  return getPermissions(role).canWrite;
}

export function getVisibleNavLinks(role) {
  const perms = getPermissions(role);
  return ALL_NAV.filter((link) => perms.pages.includes(link.href));
}

export function getDataModules(role) {
  return getPermissions(role).dataModules;
}
