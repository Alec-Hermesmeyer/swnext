import { STALE_DAYS } from "./constants";

export const generateToken = () => {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(36).padStart(2, "0"))
      .join("")
      .slice(0, 32);
  }
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
};

export const formatDateTime = (value) => {
  if (!value) return "Never";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export const getPortalUrl = (portal) => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/project/${portal.access_token}`;
};

/**
 * Derive a visibility-into-activity badge from last_accessed_at.
 * Returns null for recently-accessed or paused portals (no badge needed).
 */
export const getPortalHealth = (portal) => {
  if (!portal.is_active) return null;
  if (!portal.last_accessed_at) {
    return { label: "Never accessed", cls: "bg-rose-100 text-rose-700" };
  }
  const ageMs = Date.now() - new Date(portal.last_accessed_at).getTime();
  const days = ageMs / 86400000;
  if (days > STALE_DAYS) {
    return { label: `Stale ${Math.floor(days)}d`, cls: "bg-amber-100 text-amber-800" };
  }
  return null;
};

export const buildPortalMailto = (portal, url) => {
  if (!portal.contact_email) return null;
  const subject = `S&W Project Portal — ${portal.label}`;
  const greeting = portal.contact_name ? `Hi ${portal.contact_name},` : "Hello,";
  const body = [
    greeting,
    "",
    "Here's the live link to your project portal. It updates automatically as we report from the field:",
    "",
    url,
    "",
    "No login required — just bookmark the URL. Reach out if anything looks off.",
    "",
    "Thanks,",
    "S&W Foundation Contractors",
  ].join("\n");
  return `mailto:${encodeURIComponent(portal.contact_email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};
