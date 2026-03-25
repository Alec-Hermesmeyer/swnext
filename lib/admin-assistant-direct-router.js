import { buildAssistantSurface } from "@/lib/admin-assistant-surfaces";

function includesAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function summarizeScheduleSurface(surface) {
  const summary = surface?.summary || [];
  const days = summary.find((item) => item.label === "Days")?.value || "0";
  const rigs = summary.find((item) => item.label === "Rigs")?.value || "0";
  const jobs = summary.find((item) => item.label === "Jobs")?.value || "0";
  const crew = summary.find((item) => item.label === "Crew")?.value || "0";

  if (!surface?.days?.length) {
    return `${surface.emptyMessage || "No live schedule rows matched that request."}\n\nI opened the live schedule surface below so the user can still inspect the current planner context.`;
  }

  const firstDay = surface.days[0];
  return `${surface.title}: ${days} day(s), ${rigs} rig view(s), ${jobs} scheduled job assignment(s), and ${crew} crew assignment(s) in the current window. First loaded day: ${firstDay.dateFormatted} (${firstDay.date}).\n\nI opened the live schedule surface below so the user can inspect the plan directly in the thread.`;
}

function buildLeadSummary(data) {
  const leads = data?.contactSubmissions || [];
  const applications = data?.jobApplications || [];
  const leadLines = leads
    .slice(0, 3)
    .map((lead) => {
      const parts = [lead.date || "Recent", lead.name || "Unknown lead"];
      if (lead.email) parts.push(lead.email);
      if (lead.phone) parts.push(lead.phone);
      return `- ${parts.join(" | ")}`;
    });
  const applicationLines = applications
    .slice(0, 3)
    .map((app) => {
      const parts = [app.date || "Recent", app.name || "Unknown applicant"];
      if (app.position) parts.push(app.position);
      if (app.email) parts.push(app.email);
      return `- ${parts.join(" | ")}`;
    });

  return [
    `Recent intake snapshot: ${leads.length} contact submission(s) and ${applications.length} job application(s) are currently loaded.`,
    leadLines.length
      ? `Latest contact submissions:\n${leadLines.join("\n")}`
      : "No recent contact submissions are loaded.",
    applicationLines.length
      ? `Latest job applications:\n${applicationLines.join("\n")}`
      : "No recent job applications are loaded.",
  ].join("\n\n");
}

function buildCareerSummary(data) {
  const openRoles = (data?.jobPositions || []).filter((job) => job.open);
  if (!openRoles.length) {
    return "There are no open public job listings loaded right now.";
  }

  const lines = openRoles.slice(0, 6).map((job) => `- ${job.title}`);
  return `There are ${openRoles.length} open public job listing(s).\n\n${lines.join("\n")}`;
}

function buildPromptForSurface(surface) {
  switch (surface?.type) {
    case "workflow_profile_intake":
      return "I opened your workflow profile surface below so you can show the assistant what to automate, what to suggest, and what should still wait for your approval.";
    case "crew_job_create":
      return "I opened a crew job intake surface below so the user can start the job without leaving the thread.";
    case "crew_job_update":
      return "I opened a crew job detail surface below so the user can add the next handoff information directly in chat.";
    case "career_position_create":
      return "I opened a careers listing surface below so the user can publish the job listing from the thread.";
    case "company_contact_create":
      return "I opened a company contact surface below so the user can add that contact directly in the thread.";
    case "schedule_overview":
      return summarizeScheduleSurface(surface);
    default:
      return "I opened a working surface below so the user can complete that task in the thread.";
  }
}

export function routeAdminAssistantRequest({
  message,
  data,
  writeAccessEnabled,
  assistantProfile,
}) {
  const text = String(message || "").trim().toLowerCase();
  if (!text) return null;

  const surface = buildAssistantSurface({
    message,
    data,
    writeAccessEnabled,
    actionsPerformed: false,
    assistantProfile,
  });

  if (surface) {
    return {
      handled: true,
      mode: "surface",
      reply: buildPromptForSurface(surface),
      surface,
      actionsPerformed: false,
    };
  }

  if (
    includesAny(text, [
      "new leads",
      "new lead",
      "job applications",
      "applications",
      "submissions",
      "intake",
    ]) &&
    !includesAny(text, ["create", "add", "new job"])
  ) {
    return {
      handled: true,
      mode: "direct",
      reply: buildLeadSummary(data),
      surface: null,
      actionsPerformed: false,
    };
  }

  if (
    includesAny(text, ["open positions", "job listings", "careers", "open roles"]) &&
    !includesAny(text, ["create", "add", "new"])
  ) {
    return {
      handled: true,
      mode: "direct",
      reply: buildCareerSummary(data),
      surface: null,
      actionsPerformed: false,
    };
  }

  return null;
}
