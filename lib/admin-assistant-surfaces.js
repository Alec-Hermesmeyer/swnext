function createSurfaceId(type) {
  return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function includesAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function buildCrewJobOptions(data) {
  return (data?.crewJobs || [])
    .slice(0, 80)
    .map((job) => ({
      label: `${job.name}${job.number ? ` (#${job.number})` : ""}`,
      value: String(job.id),
      hint: [job.customer, job.pm].filter(Boolean).join(" | "),
    }));
}

function matchCrewJobFromMessage(message, data) {
  const text = String(message || "").toLowerCase();
  return (data?.crewJobs || []).find((job) => {
    const name = String(job.name || "").toLowerCase();
    const number = String(job.number || "").toLowerCase();
    return (number && text.includes(number)) || (name && text.includes(name));
  });
}

function offsetIsoDate(dateString, offset) {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + offset);
  return date.toISOString().split("T")[0];
}

function matchesWeekday(dateString, weekdayIndex) {
  return new Date(`${dateString}T12:00:00`).getDay() === weekdayIndex;
}

function findFocusRig(message, data) {
  const text = String(message || "").toLowerCase();
  return (data?.rigs || []).find((rig) => text.includes(String(rig).toLowerCase())) || "";
}

function resolveScheduleDates(message, data) {
  const text = String(message || "").toLowerCase();
  const weekdays = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  if (text.includes("tomorrow")) {
    return [offsetIsoDate(data.today, 1)];
  }

  if (text.includes("today")) {
    return [data.today];
  }

  if (text.includes("next week")) {
    const start = offsetIsoDate(data.today, 7);
    const end = offsetIsoDate(data.today, 13);
    return (data?.dailyScheduleBoards || [])
      .filter((board) => board.date >= start && board.date <= end)
      .map((board) => board.date);
  }

  if (text.includes("this week")) {
    const end = offsetIsoDate(data.today, 6);
    return (data?.dailyScheduleBoards || [])
      .filter((board) => board.date >= data.today && board.date <= end)
      .map((board) => board.date);
  }

  const matchedWeekday = Object.entries(weekdays).find(([label]) => text.includes(label));
  if (matchedWeekday) {
    const weekdayIndex = matchedWeekday[1];
    return (data?.dailyScheduleBoards || [])
      .filter((board) => board.date >= data.today)
      .filter((board) => matchesWeekday(board.date, weekdayIndex))
      .slice(0, 1)
      .map((board) => board.date);
  }

  return [];
}

function buildScheduleOverviewSurface(message, data) {
  const text = String(message || "").toLowerCase();
  const focusRig = findFocusRig(message, data);
  const targetDates = resolveScheduleDates(message, data);
  const packetMode = includesAny(text, ["packet", "packets"]);

  let boards = (data?.dailyScheduleBoards || []).filter((board) => board.date >= data.today);
  if (targetDates.length) {
    const targetSet = new Set(targetDates);
    boards = boards.filter((board) => targetSet.has(board.date));
  } else {
    boards = boards.slice(0, packetMode ? 1 : 3);
  }

  if (focusRig) {
    boards = boards
      .map((board) => ({
        ...board,
        rigs: (board.rigs || []).filter(
          (rigEntry) => String(rigEntry.rig || "").toLowerCase() === focusRig.toLowerCase()
        ),
      }))
      .filter((board) => board.rigs.length);
  }

  const totalJobs = boards.reduce((sum, board) => {
    return sum + board.rigs.reduce((rigSum, rigEntry) => rigSum + (rigEntry.jobs || []).length, 0);
  }, 0);

  const totalWorkers = boards.reduce((sum, board) => {
    return (
      sum +
      board.rigs.reduce((rigSum, rigEntry) => rigSum + (rigEntry.workers || []).length, 0)
    );
  }, 0);

  return {
    id: createSurfaceId("schedule_overview"),
    type: "schedule_overview",
    module: "Crew Scheduler",
    stage: packetMode ? "Packets" : "Planner",
    title: packetMode
      ? "Packet readiness snapshot"
      : focusRig
        ? `Schedule snapshot: ${focusRig}`
        : "Crew schedule snapshot",
    description: packetMode
      ? "This is the live schedule context behind packet work for the selected day range."
      : "This is a structured schedule view so the user can inspect the plan without leaving the thread.",
    readOnly: true,
    emptyMessage: focusRig
      ? `No scheduled rows were found for ${focusRig} in the selected window.`
      : "No scheduled rows were found in the selected window.",
    summary: [
      { label: "Days", value: String(boards.length) },
      { label: "Rigs", value: String(boards.reduce((sum, board) => sum + board.rigs.length, 0)) },
      { label: "Jobs", value: String(totalJobs) },
      { label: "Crew", value: String(totalWorkers) },
    ],
    days: boards,
    tips: packetMode
      ? [
          "Use this to inspect what is actually scheduled before pushing packet work.",
          "If something is missing here, the schedule likely needs attention before packets.",
        ]
      : [
          "This surface is read-only and built from the live schedule context.",
          "Use it to answer schedule questions without sending the user into the full scheduler page.",
        ],
  };
}

function buildCrewJobCreateSurface(data) {
  return {
    id: createSurfaceId("crew_job_create"),
    type: "crew_job_create",
    module: "Crew Scheduler",
    stage: "Stage 01",
    title: "Start a crew job",
    description:
      "Capture the initial job record here. This writes directly into the live Crew Scheduler job table.",
    submitLabel: "Create crew job",
    successLabel: "Crew job saved",
    fields: [
      {
        name: "job_name",
        label: "Job name",
        type: "text",
        required: true,
        span: 2,
        placeholder: "North shore pier drilling",
      },
      {
        name: "job_number",
        label: "Job number",
        type: "text",
        placeholder: "SW-24018",
      },
      {
        name: "default_rig",
        label: "Default rig",
        type: "select",
        options: (data?.rigs || []).map((rig) => ({ label: rig, value: rig })),
        placeholder: "Select rig",
      },
      {
        name: "customer_name",
        label: "Customer",
        type: "text",
        placeholder: "Owner or customer",
      },
      {
        name: "hiring_contractor",
        label: "Hiring contractor",
        type: "text",
        placeholder: "General contractor",
      },
      {
        name: "pm_name",
        label: "Project manager",
        type: "text",
        placeholder: "Internal PM",
      },
      {
        name: "address",
        label: "Address",
        type: "text",
        span: 2,
        placeholder: "Street address",
      },
      {
        name: "city",
        label: "City",
        type: "text",
        placeholder: "City",
      },
      {
        name: "zip",
        label: "ZIP",
        type: "text",
        placeholder: "ZIP code",
      },
      {
        name: "dig_tess_number",
        label: "Dig Tess number",
        type: "text",
        placeholder: "Optional",
      },
      {
        name: "crane_required",
        label: "Crane required",
        type: "checkbox",
      },
    ],
    tips: [
      "This is the first handoff in the crew workflow.",
      "Add only the core job data now. More detail can be layered in later.",
    ],
  };
}

function buildCrewJobUpdateSurface(message, data) {
  const matchedJob = matchCrewJobFromMessage(message, data);
  const jobOptions = buildCrewJobOptions(data);

  return {
    id: createSurfaceId("crew_job_update"),
    type: "crew_job_update",
    module: "Crew Scheduler",
    stage: "Stage 02",
    title: "Add job detail",
    description:
      "Use this surface to add the next layer of information to an existing crew job without leaving the thread.",
    submitLabel: "Save job detail",
    successLabel: "Job detail updated",
    prefill: matchedJob ? { job_id: String(matchedJob.id) } : {},
    fields: [
      {
        name: "job_id",
        label: "Existing job",
        type: "select",
        required: true,
        span: 2,
        options: jobOptions,
        placeholder: "Choose a crew job",
      },
      {
        name: "customer_name",
        label: "Customer",
        type: "text",
        placeholder: "Leave blank to keep current",
      },
      {
        name: "hiring_contractor",
        label: "Hiring contractor",
        type: "text",
        placeholder: "Leave blank to keep current",
      },
      {
        name: "hiring_contact_name",
        label: "Hiring contact",
        type: "text",
        placeholder: "Leave blank to keep current",
      },
      {
        name: "hiring_contact_phone",
        label: "Contact phone",
        type: "text",
        placeholder: "Leave blank to keep current",
      },
      {
        name: "hiring_contact_email",
        label: "Contact email",
        type: "email",
        placeholder: "Leave blank to keep current",
      },
      {
        name: "pm_name",
        label: "Project manager",
        type: "text",
        placeholder: "Leave blank to keep current",
      },
      {
        name: "pm_phone",
        label: "PM phone",
        type: "text",
        placeholder: "Leave blank to keep current",
      },
      {
        name: "address",
        label: "Address",
        type: "text",
        span: 2,
        placeholder: "Leave blank to keep current",
      },
      {
        name: "city",
        label: "City",
        type: "text",
        placeholder: "Leave blank to keep current",
      },
      {
        name: "zip",
        label: "ZIP",
        type: "text",
        placeholder: "Leave blank to keep current",
      },
      {
        name: "default_rig",
        label: "Default rig",
        type: "select",
        options: [{ label: "No change", value: "" }].concat(
          (data?.rigs || []).map((rig) => ({ label: rig, value: rig }))
        ),
      },
      {
        name: "dig_tess_number",
        label: "Dig Tess number",
        type: "text",
        placeholder: "Leave blank to keep current",
      },
      {
        name: "crane_required",
        label: "Crane requirement",
        type: "select",
        options: [
          { label: "No change", value: "" },
          { label: "Crane required", value: "true" },
          { label: "Crane not required", value: "false" },
        ],
      },
    ],
    tips: [
      "This is the second handoff in the crew workflow.",
      "Leave any field blank if you do not want to change it.",
    ],
  };
}

function buildCareerCreateSurface() {
  return {
    id: createSurfaceId("career_position_create"),
    type: "career_position_create",
    module: "Careers",
    stage: "Support",
    title: "Create a public job listing",
    description: "Create a new careers listing without leaving the chat.",
    submitLabel: "Create listing",
    successLabel: "Listing created",
    fields: [
      {
        name: "jobTitle",
        label: "Job title",
        type: "text",
        required: true,
        span: 2,
        placeholder: "Rig operator",
      },
      {
        name: "jobDesc",
        label: "Job description",
        type: "textarea",
        required: true,
        span: 2,
        placeholder: "Describe the role, requirements, and expectations.",
      },
      {
        name: "is_Open",
        label: "Publish as open",
        type: "checkbox",
      },
    ],
    prefill: { is_Open: true },
    tips: ["This writes directly to the careers table used by the website."],
  };
}

function buildCompanyContactSurface() {
  return {
    id: createSurfaceId("company_contact_create"),
    type: "company_contact_create",
    module: "Contacts",
    stage: "Support",
    title: "Add a company contact",
    description: "Capture a new internal contact and save it directly into the directory.",
    submitLabel: "Add contact",
    successLabel: "Contact saved",
    fields: [
      {
        name: "name",
        label: "Full name",
        type: "text",
        required: true,
        placeholder: "Taylor Smith",
      },
      {
        name: "job_title",
        label: "Job title",
        type: "text",
        required: true,
        placeholder: "Operations coordinator",
      },
      {
        name: "email",
        label: "Email",
        type: "email",
        placeholder: "name@company.com",
      },
      {
        name: "phone",
        label: "Phone",
        type: "text",
        placeholder: "(555) 555-5555",
      },
    ],
    tips: ["Use this when the user needs a quick add form instead of the full contacts page."],
  };
}

function buildWorkflowProfileSurface(assistantProfile = null) {
  const prefill = {
    role_title: assistantProfile?.role_title || "",
    department_name: assistantProfile?.department_name || "",
    primary_goals: assistantProfile?.primary_goals || "",
    repetitive_tasks: assistantProfile?.repetitive_tasks || "",
    current_tools: assistantProfile?.current_tools || "",
    biggest_blockers: assistantProfile?.biggest_blockers || "",
    automation_comfort: assistantProfile?.automation_comfort || "",
  };
  const hasSavedProfile = Object.values(prefill).some(Boolean);

  return {
    id: createSurfaceId("workflow_profile_intake"),
    type: "workflow_profile_intake",
    module: "Assistant Profile",
    stage: "Interview",
    title: "Teach the assistant how you work",
    description:
      hasSavedProfile
        ? "Your saved workflow context is prefilled here so you can refine how the assistant should support and automate your work."
        : "Use this intake to explain your role, repetitive tasks, blockers, and where automation would actually help.",
    submitLabel: "Save workflow profile",
    successLabel: "Workflow profile saved",
    prefill,
    fields: [
      {
        name: "role_title",
        label: "How do you describe your role?",
        type: "text",
        required: true,
        span: 2,
        placeholder: "Crew scheduler coordinator",
      },
      {
        name: "department_name",
        label: "Department or team",
        type: "text",
        placeholder: "Operations",
      },
      {
        name: "primary_goals",
        label: "Primary goals",
        type: "textarea",
        required: true,
        span: 2,
        placeholder: "What are you responsible for each day or week?",
      },
      {
        name: "repetitive_tasks",
        label: "Repetitive tasks",
        type: "textarea",
        required: true,
        span: 2,
        placeholder: "What do you repeat over and over that should be faster?",
      },
      {
        name: "current_tools",
        label: "Tools and pages you use most",
        type: "textarea",
        span: 2,
        placeholder: "Crew Scheduler, Social Media, Careers, Contacts, spreadsheets, docs...",
      },
      {
        name: "biggest_blockers",
        label: "Biggest blockers",
        type: "textarea",
        span: 2,
        placeholder: "What slows you down or makes work easy to miss?",
      },
      {
        name: "automation_comfort",
        label: "What can be automated without asking first?",
        type: "textarea",
        span: 2,
        placeholder: "What should the assistant just do, and what should still need your approval?",
      },
    ],
    tips: [
      "This does not change app permissions or admin access.",
      "It gives the assistant better context for suggestions, routing, and future automation.",
      hasSavedProfile
        ? "Update this any time your role or workflow changes."
        : "The more specific you are, the more confidently the assistant can automate routine work.",
    ],
  };
}

function buildSocialPostCreateSurface() {
  return {
    id: createSurfaceId("social_post_create"),
    type: "social_post_create",
    module: "Social Media",
    stage: "Draft",
    title: "Draft a social media post",
    description:
      "Create a post draft for review. Posts default to pending status so you can review before publishing.",
    submitLabel: "Create draft",
    successLabel: "Post draft saved",
    prefill: { platforms: "facebook", post_type: "general" },
    fields: [
      {
        name: "content",
        label: "Post content",
        type: "textarea",
        required: true,
        span: 2,
        placeholder: "Write your post copy here...",
      },
      {
        name: "platforms",
        label: "Platform",
        type: "select",
        required: true,
        options: [
          { label: "Facebook", value: "facebook" },
          { label: "LinkedIn", value: "linkedin" },
          { label: "Both", value: "facebook,linkedin" },
        ],
      },
      {
        name: "post_type",
        label: "Post type",
        type: "select",
        options: [
          { label: "General", value: "general" },
          { label: "Project Showcase", value: "project_showcase" },
          { label: "Hiring / Careers", value: "hiring" },
          { label: "Industry Tip", value: "industry_tip" },
          { label: "Company Update", value: "company_update" },
          { label: "Community", value: "community" },
        ],
      },
    ],
    tips: [
      "Posts are saved as 'pending' and must be approved before publishing.",
      "Use the brand voice tone when drafting content for a specific platform.",
    ],
  };
}

export function buildAssistantSurface({
  message,
  data,
  writeAccessEnabled,
  actionsPerformed,
  assistantProfile,
}) {
  if (actionsPerformed) return null;

  const text = String(message || "").trim().toLowerCase();
  if (!text) return null;

  const mentionsCrewJob =
    includesAny(text, [
      "crew scheduler",
      "crew job",
      "job data",
      "packet",
      "rig",
      "schedule",
    ]) || (includesAny(text, ["new job", "create job", "start job", "update job"]) &&
      !includesAny(text, ["job listing", "career", "position"]));

  const wantsCrewCreate =
    mentionsCrewJob &&
    includesAny(text, ["new job", "create job", "start job", "input job", "add job"]);

  const wantsCrewUpdate =
    mentionsCrewJob &&
    includesAny(text, [
      "update job",
      "add detail",
      "more detail",
      "more information",
      "job information",
      "update existing",
      "edit job",
    ]);

  const wantsScheduleOverview =
    includesAny(text, [
      "schedule",
      "scheduled",
      "crew plan",
      "planner",
      "today",
      "tomorrow",
      "this week",
      "next week",
      "packet",
      "packets",
    ]) && !wantsCrewCreate && !wantsCrewUpdate;

  if (wantsScheduleOverview) {
    return buildScheduleOverviewSurface(message, data);
  }

  if (
    includesAny(text, [
      "interview me",
      "learn my role",
      "rubber duck",
      "what should you know about me",
      "assistant profile",
      "how can you help me",
      "understand my role",
    ])
  ) {
    return buildWorkflowProfileSurface(assistantProfile);
  }

  if (!writeAccessEnabled) return null;

  if (
    includesAny(text, [
      "draft post",
      "create post",
      "social post",
      "facebook post",
      "linkedin post",
      "draft a post",
      "write a post",
      "social media post",
    ])
  ) {
    return buildSocialPostCreateSurface();
  }

  if (
    includesAny(text, ["job listing", "career", "position"]) &&
    includesAny(text, ["new", "create", "add", "post"])
  ) {
    return buildCareerCreateSurface();
  }

  if (
    includesAny(text, ["contact", "company contact"]) &&
    includesAny(text, ["new", "add", "create"])
  ) {
    return buildCompanyContactSurface();
  }

  if (wantsCrewUpdate) {
    return buildCrewJobUpdateSurface(message, data);
  }

  if (wantsCrewCreate) {
    return buildCrewJobCreateSurface(data);
  }

  return null;
}
