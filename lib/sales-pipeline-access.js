import { isAdminRole, ROLES } from "@/lib/roles";

export function isSalesRole(role) {
  return String(role || "").trim().toLowerCase() === ROLES.sales;
}

/** Sales lead (level 3) or admin-side roles can set another user as owner */
export function canAssignSalesOpportunityOwner(userContext) {
  const role = String(userContext?.role || "").trim().toLowerCase();
  const level = Number(userContext?.accessLevel) || 3;
  if (isAdminRole(role) || role === ROLES.operations || role === ROLES.safety) return true;
  if (isSalesRole(role) && level >= 3) return true;
  return false;
}

/**
 * Filter sales_opportunities rows by sales access level.
 * Non-sales roles: no filtering (caller already restricted to pipeline roles).
 */
export function filterSalesOpportunitiesForUser(rows, userContext, level1SalesUserIds = []) {
  const role = String(userContext.role || "").trim().toLowerCase();
  const level = Number(userContext.accessLevel) || 3;
  const uid = userContext.id;

  if (!isSalesRole(role)) return rows;
  if (level >= 3) return rows;

  const level1Set = new Set(level1SalesUserIds);

  return rows.filter((row) => {
    const owner = row.owner_user_id;
    const created = row.created_by;

    if (level === 1) {
      if (owner) return owner === uid;
      return created === uid;
    }

    // Level 2: own + level-1 sales owners + legacy rows created by self
    if (owner === uid) return true;
    if (owner && level1Set.has(owner)) return true;
    if (!owner && created === uid) return true;
    return false;
  });
}

export function canMutateSalesOpportunity(row, userContext, level1SalesUserIds = []) {
  const role = String(userContext.role || "").trim().toLowerCase();
  const level = Number(userContext.accessLevel) || 3;
  const uid = userContext.id;

  if (isAdminRole(role) || role === ROLES.operations || role === ROLES.safety) return true;
  if (!isSalesRole(role)) return true;

  if (level >= 3) return true;

  const filtered = filterSalesOpportunitiesForUser([row], userContext, level1SalesUserIds);
  return filtered.length > 0;
}
