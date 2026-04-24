export const EMPTY_FORM = {
  label: "",
  match_name: "",
  contact_name: "",
  contact_email: "",
  notes: "",
  is_active: true,
};

export const EMPTY_DOC_FORM = {
  title: "",
  description: "",
  file_url: "",
  file_type: "other",
  document_source: "upload",
  job_id: "",
};

export const JOB_STATUS_LABEL = {
  bid: "Bidding",
  awarded: "Awarded",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  on_hold: "On Hold",
  active: "Active",
};

export const JOB_STATUS_COLOR = {
  bid: "bg-neutral-100 text-neutral-700",
  awarded: "bg-blue-100 text-blue-700",
  scheduled: "bg-sky-100 text-sky-700",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  on_hold: "bg-neutral-200 text-neutral-700",
  active: "bg-blue-100 text-blue-700",
};

export const SOURCE_BADGE = {
  matched: { label: "Auto-matched", cls: "bg-neutral-100 text-neutral-600" },
  linked: { label: "Linked", cls: "bg-violet-100 text-violet-700" },
  both: { label: "Matched + Linked", cls: "bg-blue-100 text-blue-700" },
};

export const STALE_DAYS = 30;
