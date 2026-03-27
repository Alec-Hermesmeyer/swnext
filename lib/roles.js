// ── Role-based access control ──
// Single source of truth for all permission checks across the app.

export const ROLES = {
  admin: "admin",
  operations: "operations",
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

const SOCIAL_TOOLS = [
  "create_social_post",
  "update_social_post",
  "get_social_planning",
  "get_social_library",
  "social_strategy_chat",
];

const CAREER_TOOLS = ["create_job_position", "toggle_job_position"];

const CONTACT_TOOLS = ["add_company_contact", "delete_company_contact"];

export const ROLE_PERMISSIONS = {
  admin: {
    pages: ALL_NAV.map((n) => n.href),
    chatTools: [...SCHEDULE_TOOLS, ...SOCIAL_TOOLS, ...CAREER_TOOLS, ...CONTACT_TOOLS],
    canWrite: true,
    dataModules: ["schedule", "social", "careers", "contacts", "sales", "submissions"],
  },
  operations: {
    pages: ["/admin", "/admin/dashboard", "/admin/crew-scheduler", "/admin/company-contacts", "/admin/contact"],
    chatTools: [...SCHEDULE_TOOLS, ...CONTACT_TOOLS],
    canWrite: true,
    dataModules: ["schedule", "contacts", "submissions"],
  },
  social_media: {
    pages: ["/admin", "/admin/dashboard", "/admin/social-media", "/admin/image-assignments"],
    chatTools: [...SOCIAL_TOOLS],
    canWrite: true,
    dataModules: ["social"],
  },
  hr: {
    pages: ["/admin", "/admin/dashboard", "/admin/careers", "/admin/contact"],
    chatTools: [...CAREER_TOOLS],
    canWrite: true,
    dataModules: ["careers", "submissions"],
  },
  sales: {
    pages: ["/admin", "/admin/dashboard", "/admin/sales", "/admin/company-contacts"],
    chatTools: [...CONTACT_TOOLS],
    canWrite: true,
    dataModules: ["sales", "contacts"],
  },
  viewer: {
    pages: ["/admin", "/admin/dashboard"],
    chatTools: [],
    canWrite: false,
    dataModules: ["schedule", "social", "careers", "contacts", "sales", "submissions"],
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
