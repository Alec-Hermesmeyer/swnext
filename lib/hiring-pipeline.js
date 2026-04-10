export const HIRING_PIPELINE_STAGES = [
  { id: "new", label: "New", hint: "Just added from application or manual entry" },
  { id: "reviewing", label: "Reviewing", hint: "Screening resume / fit" },
  { id: "interview", label: "Interview", hint: "Scheduled or in progress" },
  { id: "offer", label: "Offer", hint: "Offer extended" },
  { id: "hired", label: "Hired", hint: "Accepted — next steps with HR" },
  { id: "declined", label: "Declined", hint: "Not moving forward" },
];

export const VALID_HIRING_STAGE_IDS = new Set(HIRING_PIPELINE_STAGES.map((s) => s.id));

export function hiringStageLabel(id) {
  return HIRING_PIPELINE_STAGES.find((s) => s.id === id)?.label || id;
}
