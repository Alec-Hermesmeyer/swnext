/**
 * Build a POST body for /api/sales-opportunities from a contact_form row.
 */

function deriveTitle(message, name) {
  const raw = String(message || "").trim();
  if (raw) {
    const firstLine = raw.split(/\r?\n/)[0].trim();
    if (firstLine.length <= 100) return firstLine;
    return `${firstLine.slice(0, 97)}…`;
  }
  const n = String(name || "").trim() || "Contact";
  return `${n} — inquiry`;
}

export function buildOpportunityPayloadFromContactSubmission(submission) {
  const name = submission?.name?.trim() || "";
  const email = submission?.email?.trim() || "";
  const phone = String(submission?.number || "").trim();
  const message = String(submission?.message || "").trim();
  const created = submission?.created_at
    ? new Date(submission.created_at).toLocaleString()
    : "";

  const notesLines = [
    message ? `Message:\n${message}` : null,
    `Source: contact form submission${submission?.id ? ` (id: ${submission.id})` : ""}${created ? ` · ${created}` : ""}`,
  ].filter(Boolean);

  return {
    title: deriveTitle(message, name),
    company: "",
    contact_name: name || null,
    contact_email: email || null,
    contact_phone: phone || null,
    stage: "qualify",
    value_estimate: null,
    bid_due: null,
    next_follow_up: null,
    owner_name: null,
    notes: notesLines.join("\n\n"),
    lost_reason: null,
  };
}
