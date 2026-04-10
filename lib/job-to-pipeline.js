/**
 * Build POST body for /api/hiring-opportunities from a job_form row.
 */

function deriveTitle(position, name) {
  const pos = String(position || "").trim();
  const n = String(name || "").trim() || "Applicant";
  if (pos) return `${pos} — ${n}`;
  return `Application — ${n}`;
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
    source_job_submission_id: submission?.id || null,
  };
}
