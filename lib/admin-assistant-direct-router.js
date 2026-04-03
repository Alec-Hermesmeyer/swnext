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

function classifyLead(message) {
  if (!message) return "unknown";
  const lower = message.toLowerCase();
  const jobKeywords = [
    "quote", "bid", "estimate", "project", "foundation", "pier", "drill",
    "construction", "build", "job", "site", "concrete", "helical", "pile",
    "crane", "contractor", "subcontract", "commercial", "residential",
    "scope", "plans", "engineer", "architect", "sqft", "sq ft", "acres",
    "budget", "proposal", "rfp", "rfi",
  ];
  const spamKeywords = [
    "seo", "marketing", "website", "rank", "google ads", "social media management",
    "outsource", "virtual assistant", "offshore", "lead generation service",
    "buy", "discount", "free", "unsubscribe", "click here",
  ];
  if (spamKeywords.some((k) => lower.includes(k))) return "spam";
  if (jobKeywords.some((k) => lower.includes(k))) return "potential_lead";
  return "general_inquiry";
}

function buildLeadSummary(data) {
  const leads = data?.contactSubmissions || [];
  const applications = data?.jobApplications || [];

  // Classify and sort leads — potential leads first
  const classified = leads.map((lead) => ({
    ...lead,
    classification: classifyLead(lead.message),
  }));
  const potentialLeads = classified.filter((l) => l.classification === "potential_lead");
  const generalInquiries = classified.filter((l) => l.classification === "general_inquiry" || l.classification === "unknown");
  const spam = classified.filter((l) => l.classification === "spam");

  const sections = [];
  sections.push(`**${leads.length} contact submissions** and **${applications.length} job applications** loaded.`);

  if (potentialLeads.length) {
    sections.push(`**${potentialLeads.length} potential job lead(s):**`);
    potentialLeads.slice(0, 5).forEach((lead) => {
      const msg = lead.message ? `"${lead.message.substring(0, 150)}${lead.message.length > 150 ? "..." : ""}"` : "No message";
      sections.push(`- **${lead.name || "Unknown"}** (${lead.date || "Recent"}) — ${msg}${lead.phone ? ` | ${lead.phone}` : ""}${lead.email ? ` | ${lead.email}` : ""}`);
    });
  } else {
    sections.push("No submissions look like job leads right now.");
  }

  if (generalInquiries.length) {
    sections.push(`\n**${generalInquiries.length} general inquiry/other:**`);
    generalInquiries.slice(0, 3).forEach((lead) => {
      const msg = lead.message ? `"${lead.message.substring(0, 100)}${lead.message.length > 100 ? "..." : ""}"` : "No message";
      sections.push(`- ${lead.name || "Unknown"} (${lead.date || "Recent"}) — ${msg}`);
    });
  }

  if (spam.length) {
    sections.push(`\n${spam.length} submission(s) flagged as likely spam/solicitation — skipped.`);
  }

  if (applications.length) {
    // Group applications by position
    const byPosition = {};
    applications.forEach((app) => {
      const pos = app.position || "Unspecified";
      if (!byPosition[pos]) byPosition[pos] = [];
      byPosition[pos].push(app);
    });
    const posLines = Object.entries(byPosition)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 5)
      .map(([pos, apps]) => `- **${pos}**: ${apps.length} applicant(s) — latest: ${apps[0].name || "Unknown"} (${apps[0].date || "Recent"})`);
    sections.push(`\n**Job applications by position:**\n${posLines.join("\n")}`);
  }

  return sections.join("\n");
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
    case "schedule_builder_context":
      return `Let's build the schedule for ${surface.targetDateFormatted}. Pick a rig to start setting up crew and jobs, or copy from a recent day to get a head start.`;
    case "crew_job_activity_list":
      return surface.canToggle
        ? "I opened the live crew job list below so the user can toggle jobs active or inactive directly in the thread."
        : "I opened the live crew job list below so the user can inspect active and inactive jobs in the thread.";
    case "job_intake_context":
      return "Let's get this job entered. The fields you'll need from the bid sheet are listed below. You can fill in the form, paste from Excel, or just tell me the details and I'll handle it.";
    case "social_post_create":
      return "I opened a social media post draft surface below so you can compose and submit the post for review.";
    case "gallery_workspace":
      return "Here's the gallery manager. You can see all images by category, hide any that don't meet requirements, or add new ones. Click 'Open Gallery Manager' below to work with it.";
    case "images_workspace":
      return "Here's the page image manager. You can browse Supabase storage and assign images to any page slot. Click 'Open Image Assignments' below to get started.";
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
