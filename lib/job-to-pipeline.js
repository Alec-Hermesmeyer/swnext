/**
 * Build POST body for /api/hiring-opportunities from a job_form row.
 */

function deriveTitle(position, name) {
  const pos = String(position || "").trim();
  const n = String(name || "").trim() || "Applicant";
  if (pos) return `${pos} — ${n}`;
  return `Application — ${n}`;
}

function normalizeUuidOrNull(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(raw) ? raw : null;
}

export function buildHiringPayloadFromJobSubmission(submission) {
  const name = submission?.name?.trim() || submission?.firstName?.trim() || "";
  const email = submission?.email?.trim() || "";
  const phone = String(submission?.number || submission?.phone || "").trim();
  const position = String(submission?.position || "").trim();
  const message = String(submission?.message || "").trim();
  const created = submission?.created_at
    ? new Date(submission.created_at).toLocaleString()
    : "";

  const notesLines = [
    message ? `Application notes / cover text:\n${message}` : null,
    `Source: job application${submission?.id ? ` (id: ${submission.id})` : ""}${created ? ` · ${created}` : ""}`,
  ].filter(Boolean);

  return {
    title: deriveTitle(position, name),
    applicant_name: name || null,
    contact_email: email || null,
    contact_phone: phone || null,
    position_applied: position || null,
    stage: "new",
    next_follow_up: null,
    notes: notesLines.join("\n\n"),
    decline_reason: null,
    // Only send if the source id is actually a UUID.
    // Many job_form tables use numeric IDs, which will fail UUID columns.
    source_job_submission_id: normalizeUuidOrNull(submission?.id),
  };
}
