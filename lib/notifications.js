/**
 * Notification helpers — insert/read/dismiss admin_notifications.
 *
 * Targeting:
 *  - target_email: notify one specific user
 *  - target_role: notify every user with this role
 *  - both: notify the user PLUS fall back to role if user doesn't exist
 *
 * Read tracking: `read_by` is a JSONB array of email strings. When a user
 * marks a notification as read we fetch the current array, append their
 * email, and write it back. Not strictly atomic, but fine for low-contention
 * in-app notifications.
 */

import supabase from "@/components/Supabase";

/**
 * Send a notification targeted at a role (everyone with that role sees it).
 * @param {string} role - e.g., "operations", "sales", "hr"
 * @param {{ title: string, body?: string, link?: string, kind?: string, metadata?: object }} payload
 */
export async function notifyRole(role, payload) {
  if (!role) return { error: new Error("role required") };
  return supabase.from("admin_notifications").insert({
    target_role: role,
    target_email: null,
    title: payload.title,
    body: payload.body || null,
    link: payload.link || null,
    kind: payload.kind || null,
    metadata: payload.metadata || {},
  });
}

/**
 * Send a notification to a specific user (by email).
 */
export async function notifyUser(email, payload) {
  if (!email) return { error: new Error("email required") };
  return supabase.from("admin_notifications").insert({
    target_email: email,
    target_role: null,
    title: payload.title,
    body: payload.body || null,
    link: payload.link || null,
    kind: payload.kind || null,
    metadata: payload.metadata || {},
  });
}

/**
 * Mark a single notification as read for the current user.
 * Appends the user's email to the read_by array if not already present.
 */
export async function markNotificationRead(notificationId, userEmail) {
  if (!notificationId || !userEmail) return { error: new Error("id + email required") };
  const { data, error } = await supabase
    .from("admin_notifications")
    .select("read_by")
    .eq("id", notificationId)
    .maybeSingle();
  if (error) return { error };
  const readBy = Array.isArray(data?.read_by) ? data.read_by : [];
  if (readBy.includes(userEmail)) return { data: null };
  return supabase
    .from("admin_notifications")
    .update({ read_by: [...readBy, userEmail] })
    .eq("id", notificationId);
}

/**
 * Mark all currently-visible notifications read.
 */
export async function markAllNotificationsRead(notifications, userEmail) {
  if (!userEmail || !Array.isArray(notifications)) return;
  const updates = notifications
    .filter((n) => !Array.isArray(n.read_by) || !n.read_by.includes(userEmail))
    .map((n) => markNotificationRead(n.id, userEmail));
  await Promise.all(updates);
}

/**
 * Filter a list of notifications to those visible to (email, role).
 */
export function filterVisibleNotifications(notifications, userEmail, userRole) {
  return (notifications || []).filter((n) => {
    if (n.target_email && userEmail && n.target_email === userEmail) return true;
    if (n.target_role && userRole && n.target_role === userRole) return true;
    return false;
  });
}

/**
 * Count unread notifications for (email).
 */
export function countUnread(notifications, userEmail) {
  if (!userEmail) return 0;
  return (notifications || []).filter((n) => !Array.isArray(n.read_by) || !n.read_by.includes(userEmail)).length;
}
