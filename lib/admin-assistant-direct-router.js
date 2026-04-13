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

const MESSAGE_PREVIEW_LEN = 220;
const GENERAL_PREVIEW_LEN = 160;

function truncatePreview(text, maxLen) {
  const t = String(text || "").trim();
  if (!t) return "";
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen).trim()}…`;
}

/** Hide obviously corrupted / placeholder names from bad form data */
function sanitizeApplicantName(name) {
  const n = String(name || "").trim();
  if (!n) return "Unknown";
  if (n.length >= 14 && /^[A-Za-z0-9+/=_-]+$/.test(n.replace(/\s/g, ""))) {
    return "Name not captured";
  }
  return n;
}

function formatLeadBlock(lead, index, previewLen) {
  const name = lead.name?.trim() || "Unknown";
  const date = lead.date || "Recent";
  const phone = (lead.phone || "").trim();
  const email = (lead.email || "").trim();
  const msg = truncatePreview(lead.message, previewLen);

  const contactParts = [];
  if (phone) contactParts.push(`**Phone:** ${phone}`);
  if (email) contactParts.push(`**Email:** ${email}`);
  const contactLine = contactParts.length ? `${contactParts.join(" · ")}` : "";

  const lines = [
    `**${index}. ${name}**`,
    `**Date:** ${date}${contactLine ? ` · ${contactLine}` : ""}`,
  ];
  if (msg) {
    lines.push("");
    lines.push(`**Message:** ${msg}`);
  } else {
    lines.push("");
    lines.push("**Message:** (no text provided)");
  }
  return lines.join("\n");
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

  const blocks = [];

  blocks.push(
    "Here’s a quick snapshot of what’s in the current intake batch (from your loaded data)."
  );
  blocks.push("");
  blocks.push(
    `**Contact form:** ${leads.length} submission(s) · **Job applications:** ${applications.length}`
  );
  blocks.push("");

  if (potentialLeads.length) {
    blocks.push(`**Potential job leads** (${potentialLeads.length})`);
    blocks.push("");
    blocks.push(
      "These look like quote, bid, or project inquiries (keyword match). Open **Submissions** in the sidebar to reply or manage."
    );
    blocks.push("");
    potentialLeads.slice(0, 8).forEach((lead, i) => {
      blocks.push(formatLeadBlock(lead, i + 1, MESSAGE_PREVIEW_LEN));
      blocks.push("");
    });
    if (potentialLeads.length > 8) {
      blocks.push(`**…and ${potentialLeads.length - 8} more** in this category (see Submissions for the full list).`);
      blocks.push("");
    }
  } else {
    blocks.push("**Potential job leads**");
    blocks.push("");
    blocks.push("No submissions in this batch matched the “job / quote” pattern. Check **Submissions** for full text.");
    blocks.push("");
  }

  if (generalInquiries.length) {
    blocks.push(`**General inquiries** (${generalInquiries.length})`);
    blocks.push("");
    blocks.push("Other messages (vendor, HOA, marketing, or unclear intent).");
    blocks.push("");
    generalInquiries.slice(0, 5).forEach((lead, i) => {
      blocks.push(formatLeadBlock(lead, i + 1, GENERAL_PREVIEW_LEN));
      blocks.push("");
    });
    if (generalInquiries.length > 5) {
      blocks.push(`**…and ${generalInquiries.length - 5} more** (see Submissions).`);
      blocks.push("");
    }
  }

  if (spam.length) {
    blocks.push(`**Filtered:** ${spam.length} submission(s) look like spam or cold solicitations (skipped in detail above).`);
    blocks.push("");
  }

  if (applications.length) {
    const byPosition = {};
    applications.forEach((app) => {
      const pos = app.position || "Unspecified";
      if (!byPosition[pos]) byPosition[pos] = [];
      byPosition[pos].push(app);
    });
    const sorted = Object.entries(byPosition).sort((a, b) => b[1].length - a[1].length);

    blocks.push("**Job applications by position**");
    blocks.push("");
    sorted.slice(0, 8).forEach(([pos, apps], idx) => {
      const latest = apps[0];
      const who = sanitizeApplicantName(latest.name);
      const when = latest.date || "Recent";
      blocks.push(
        `**${idx + 1}. ${pos}** — ${apps.length} applicant(s)`
      );
      blocks.push(`Most recent: **${who}** · ${when}`);
      blocks.push("");
    });
    if (sorted.length > 8) {
      blocks.push(`**…${sorted.length - 8} more position(s)** in the full application list.`);
    }
  }

  return blocks.join("\n").trim();
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
    case "spam_block_rule_create":
      return "I opened a spam block surface below so the user can block an email or domain directly in the thread.";
    case "schedule_overview":
      return summarizeScheduleSurface(surface);
    case "schedule_builder_context":
      return `Let's build the schedule for ${surface.targetDateFormatted}. Pick a rig to start setting up crew and jobs, or copy from a recent day to get a head start.`;
    case "crew_job_activity_list":
      return surface.canToggle
        ? "I opened the live crew job list below so the user can toggle jobs active or inactive directly in the thread."
        : "I opened the live crew job list below so the user can inspect active and inactive jobs in the thread.";
    case "user_access_overview":
      return "I opened the role and access guide below so the user can choose the right permission setup without leaving the thread.";
    case "admin_user_create":
      return "I opened a user-creation surface below so the user can add the login and assign role access directly in the thread.";
    case "job_intake_context":
      return "Let's get this job entered. The fields you'll need from the bid sheet are listed below. You can fill in the form, paste from Excel, or just tell me the details and I'll handle it.";
    case "social_post_create":
      return "I opened a social media post draft surface below so you can compose and submit the post for review.";
    case "gallery_workspace":
      return "Here's the gallery manager. You can see all images by category, hide any that don't meet requirements, or add new ones. Click 'Open Gallery Manager' below to work with it.";
    case "images_workspace":
      return "Here's the page image manager. You can browse Supabase storage and assign images to any page slot. Click 'Open Image Assignments' below to get started.";
    case "sales_pipeline_list": {
      const preview = surface.demoMode
        ? "There is no live data yet, so you are seeing a preview layout. "
        : "";
      return `${preview}I opened the sales pipeline below so you can review and manage pre-award opportunities directly in the thread.`;
    }
    case "sales_opportunity_create":
      return "I opened a form below so you can add a pre-award opportunity without leaving the assistant.";
    case "sales_opportunity_update":
      return "I opened the opportunity editor below so you can update the pipeline directly in chat.";
    default:
      return "I opened a working surface below so the user can complete that task in the thread.";
  }
}

export function routeAdminAssistantRequest({
  message,
  data,
  writeAccessEnabled,
  canManageUsers,
  assistantProfile,
  pipelineAccess = false,
}) {
  const text = String(message || "").trim().toLowerCase();
  if (!text) return null;

  const surface = buildAssistantSurface({
    message,
    data,
    writeAccessEnabled,
    canManageUsers,
    actionsPerformed: false,
    assistantProfile,
    pipelineAccess,
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
