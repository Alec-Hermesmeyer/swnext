/** Pre-award opportunity stages (matches DB check constraint on sales_opportunities.stage) */
export const SALES_PIPELINE_STAGES = [
  { id: "qualify", label: "Qualify", hint: "New — decide if it is real" },
  { id: "pursuing", label: "Pursuing", hint: "Takeoff, site visit, waiting on info" },
  { id: "quoted", label: "Quoted", hint: "Bid or number submitted" },
  { id: "negotiation", label: "Negotiation", hint: "VE, rebid, scope change" },
  { id: "won", label: "Won", hint: "Awarded — hand off to job setup" },
  { id: "lost", label: "Lost", hint: "Record reason for learning" },
];

export const VALID_STAGE_IDS = new Set(SALES_PIPELINE_STAGES.map((s) => s.id));

export function stageLabel(id) {
  return SALES_PIPELINE_STAGES.find((s) => s.id === id)?.label || id;
}
