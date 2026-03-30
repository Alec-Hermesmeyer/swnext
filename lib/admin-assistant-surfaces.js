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
    quickActions: [
      ...(boards.length && !packetMode
        ? [{ label: "Build this schedule", message: `I need to create a schedule for ${targetDates[0] || boards[0]?.date || "this date"}` }]
        : []),
      {
        label: "Open Full Scheduler",
        action: "workspace",
        workspace: "scheduler",
        context: { date: targetDates[0] || boards[0]?.date || "" },
      },
    ],
  };
}

export function buildScheduleOverviewForDates(targetDates, data) {
  const dateSet = new Set(targetDates);
  const boards = (data?.dailyScheduleBoards || []).filter((board) => dateSet.has(board.date));

  const totalJobs = boards.reduce((sum, board) => {
    return sum + board.rigs.reduce((rigSum, r) => rigSum + (r.jobs || []).length, 0);
  }, 0);

  const totalWorkers = boards.reduce((sum, board) => {
    return sum + board.rigs.reduce((rigSum, r) => rigSum + (r.workers || []).length, 0);
  }, 0);

  return {
    id: createSurfaceId("schedule_overview"),
    type: "schedule_overview",
    module: "Crew Scheduler",
    stage: "Builder",
    title: "Schedule updated",
    description: "This is the current state of the schedule after the changes you just made.",
    readOnly: true,
    emptyMessage: "No assignments on the schedule yet. Keep building by telling me who goes where.",
    summary: [
      { label: "Days", value: String(boards.length) },
      { label: "Rigs", value: String(boards.reduce((sum, board) => sum + board.rigs.length, 0)) },
      { label: "Jobs", value: String(totalJobs) },
      { label: "Crew", value: String(totalWorkers) },
    ],
    days: boards,
    tips: [
      "Keep building — tell me which workers to add, remove, or move between rigs.",
      "Say 'finalize' when the schedule is ready, then 'send the email' to notify the team.",
    ],
    quickActions: (() => {
      const actions = [];
      const date = targetDates[0] || "";

      if (targetDates.length === 1 && boards.length) {
        // Find rigs with and without crew
        const allRigs = data?.rigs || [];
        const rigsWithCrew = new Set();
        for (const board of boards) {
          for (const rig of board.rigs || []) {
            if (rig.workers?.length) rigsWithCrew.add(rig.rig);
          }
        }

        // Show next empty rig as primary action
        const nextEmptyRig = allRigs.find((r) => !rigsWithCrew.has(r));
        if (nextEmptyRig) {
          actions.push({
            label: `Set up ${nextEmptyRig}`,
            message: `Let's set up ${nextEmptyRig} for ${date}. Who should be on it and what job?`,
          });
        }

        actions.push({
          label: "Set rig details",
          message: `Set the superintendents and trucks for ${date}`,
        });

        // Only show finalize if all rigs have crew
        if (!nextEmptyRig || rigsWithCrew.size >= allRigs.length) {
          actions.push({
            label: "Finalize",
            message: `Finalize the schedule for ${date}`,
          });
        }

        actions.push({
          label: "Send email",
          message: `Send the schedule email for ${date}`,
        });
      } else if (targetDates.length) {
        actions.push({ label: "Finalize", message: `Finalize the schedule for ${date}` });
      }

      return actions;
    })(),
  };
}

export function buildScheduleBuilderContextSurface(message, data) {
  const targetDates = resolveScheduleDates(message, data);
  const targetDate = targetDates.length
    ? targetDates[0]
    : offsetIsoDate(data.today, 1);
  const targetFormatted = new Date(`${targetDate}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const rigs = data?.rigs || [];
  const scheduledWorkerNames = new Set();
  const existingBoard = (data?.dailyScheduleBoards || []).find((b) => b.date === targetDate);
  const existingRigs = [];
  const rigsWithCrew = new Set();

  if (existingBoard) {
    for (const rig of existingBoard.rigs || []) {
      existingRigs.push({
        rig: rig.rig,
        workers: rig.workers || [],
        jobs: rig.jobs || [],
        superintendent: rig.superintendent || "",
        truck: rig.truck || "",
      });
      if (rig.workers?.length) rigsWithCrew.add(rig.rig);
      for (const w of rig.workers || []) {
        scheduledWorkerNames.add(w.replace(/\s*\(.*?\)\s*/g, "").trim());
      }
    }
  }

  const crewList = (data?.workers || []).map((w) => ({
    name: w.name,
    role: w.role || "",
    scheduled: scheduledWorkerNames.has(w.name),
  }));

  const jobList = (data?.crewJobs || []).map((j) => ({
    name: j.name,
    number: j.number || "",
  }));

  const todayBoard = (data?.dailyScheduleBoards || []).find((b) => b.date === data.today);
  const yesterdayDate = offsetIsoDate(data.today, -1);
  const yesterdayBoard = (data?.dailyScheduleBoards || []).find((b) => b.date === yesterdayDate);

  // Quick actions: rig-first flow
  const quickActions = [];

  // Copy options first (fastest path)
  if (todayBoard?.rigs?.length) {
    quickActions.push({
      label: "Copy from today",
      message: `Copy today's schedule to ${targetDate}`,
    });
  }
  if (yesterdayBoard?.rigs?.length && !todayBoard?.rigs?.length) {
    quickActions.push({
      label: "Copy from yesterday",
      message: `Copy yesterday's schedule to ${targetDate}`,
    });
  }

  // Rig-by-rig setup chips — show rigs that DON'T have crew yet
  const emptyRigs = rigs.filter((r) => !rigsWithCrew.has(r));
  const rigChips = emptyRigs.length ? emptyRigs : rigs;
  for (const rig of rigChips.slice(0, 5)) {
    quickActions.push({
      label: rigsWithCrew.has(rig) ? `Edit ${rig}` : `Set up ${rig}`,
      message: rigsWithCrew.has(rig)
        ? `Show me who is on ${rig} for ${targetDate} and what needs to change`
        : `Let's set up ${rig} for ${targetDate}. Who should be on it and what job?`,
    });
  }

  // Open full scheduler workspace
  quickActions.push({
    label: "Open Full Scheduler",
    action: "workspace",
    workspace: "scheduler",
    context: { date: targetDate },
  });

  return {
    id: createSurfaceId("schedule_builder_context"),
    type: "schedule_builder_context",
    module: "Crew Scheduler",
    stage: "Builder",
    title: `Building schedule for ${targetFormatted}`,
    description: "Pick a rig to start assigning crew and jobs, or copy from a recent day.",
    readOnly: true,
    targetDate,
    targetDateFormatted: targetFormatted,
    summary: [
      { label: "Date", value: targetFormatted },
      { label: "Crew", value: String(crewList.length) },
      { label: "Jobs", value: String(jobList.length) },
      { label: "Rigs", value: String(rigs.length) },
    ],
    crewList,
    jobList,
    existingRigs,
    quickActions,
    tips: [
      "Tap a rig to start assigning crew and a job to it.",
      "Or say something like 'Put John and Mike on Rig 1 for the Smith job'.",
      "Once all rigs are set, finalize to kick off the packet automation.",
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

export function buildJobIntakeContextSurface(data) {
  const jobs = data?.crewJobs || [];
  const recentJobs = jobs.slice(0, 8);

  return {
    id: createSurfaceId("job_intake_context"),
    type: "job_intake_context",
    module: "Crew Scheduler",
    stage: "Job Intake",
    title: "New job intake",
    description: "Enter the job info from the bid sheet. You can type it out, fill in the form below, or paste directly from Excel.",
    readOnly: true,
    summary: [
      { label: "Active Jobs", value: String(jobs.length) },
      { label: "Rigs", value: String((data?.rigs || []).length) },
    ],
    bidSheetFields: [
      { label: "Job Name", hint: "Project name from the bid", required: true },
      { label: "Job Number", hint: "SW-XXXXX", required: false },
      { label: "Customer", hint: "Owner or end client", required: false },
      { label: "Hiring Contractor", hint: "GC who hired S&W", required: false },
      { label: "Contact Name / Phone / Email", hint: "GC contact info", required: false },
      { label: "Address / City / ZIP", hint: "Job site location", required: false },
      { label: "Project Manager", hint: "S&W PM assigned", required: false },
      { label: "Dig Tess Number", hint: "If applicable", required: false },
      { label: "Default Rig", hint: "Which rig this job runs on", required: false },
      { label: "Crane Required", hint: "Yes or No", required: false },
    ],
    recentJobs: recentJobs.map((j) => ({
      name: j.name,
      number: j.number || "",
      customer: j.customer || "",
    })),
    quickActions: [
      {
        label: "Fill in the form",
        message: "I want to create a new crew job using the form.",
      },
      {
        label: "Update existing job",
        message: "I need to update job details on an existing job.",
      },
      {
        label: "Paste from Excel",
        message: "I'm going to paste job data from a spreadsheet. Here it is:",
      },
      {
        label: "Open Full Scheduler",
        action: "workspace",
        workspace: "scheduler",
        context: {},
      },
    ],
    tips: [
      "Just paste the bid sheet info and the assistant will figure out the fields.",
      "You can enter one job at a time or paste multiple rows from Excel.",
      "Say 'update' to add more details to an existing job later.",
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
    quickActions: [
      {
        label: "Open Social Media Manager",
        action: "workspace",
        workspace: "social",
        context: {},
      },
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

  // "Fill in the form" or "use the form" → show the actual form, not the context
  const wantsCrewForm =
    mentionsCrewJob &&
    includesAny(text, ["form", "fill in", "fill out"]);

  if (wantsCrewForm) {
    return buildCrewJobCreateSurface(data);
  }

  const wantsJobIntake = includesAny(text, [
    "new job",
    "enter a job",
    "job intake",
    "bid sheet",
    "sold a job",
    "add a job",
    "create a job",
    "log a job",
    "won a job",
    "new project",
    "enter job data",
    "input a job",
  ]) && !includesAny(text, ["job listing", "career", "position"]);

  if (wantsJobIntake) {
    return buildJobIntakeContextSurface(data);
  }

  const wantsCrewCreate =
    mentionsCrewJob &&
    includesAny(text, ["start job", "input job"]);

  const wantsCrewUpdate =
    includesAny(text, [
      "update job",
      "update the job",
      "update a job",
      "update an existing",
      "update existing",
      "add detail",
      "add details",
      "more detail",
      "more information",
      "job information",
      "edit job",
      "edit the job",
      "edit a job",
      "edit an existing",
      "edit existing",
      "job detail",
      "fill in detail",
      "add info to",
      "update info",
      "modify job",
      "change job",
    ]) && !includesAny(text, ["job listing", "career", "position"]);

  const wantsScheduleBuild = includesAny(text, [
    "put ",
    "assign ",
    "move ",
    "remove ",
    "take off",
    "copy ",
    "build ",
    "add to rig",
    "set super",
    "set truck",
    "assign truck",
    "finalize",
    "send the schedule",
    "send packets",
    "send the email",
  ]);

  const wantsScheduleBuilderStart = includesAny(text, [
    "create a schedule",
    "build a schedule",
    "build the schedule",
    "set up the schedule",
    "make the schedule",
    "make a schedule",
    "start the schedule",
    "need to schedule",
    "help me schedule",
    "schedule the crew",
  ]);

  if (wantsScheduleBuilderStart) {
    return buildScheduleBuilderContextSurface(message, data);
  }

  const mentionsSubmissions = includesAny(text, [
    "lead",
    "leads",
    "submission",
    "submissions",
    "application",
    "applications",
    "intake",
    "contact form",
    "job form",
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
    ]) && !wantsCrewCreate && !wantsCrewUpdate && !wantsScheduleBuild && !mentionsSubmissions;

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

  // Image-related queries — open the right workspace
  const wantsGallery = includesAny(text, [
    "gallery image", "gallery images", "gallery photo", "gallery photos",
    "check the gallery", "review the gallery", "hide image", "hide photo",
    "show image", "show photo", "safety image", "remove image",
  ]);
  const wantsPageImages = includesAny(text, [
    "page image", "page images", "site image", "site images",
    "hero image", "change image", "update image", "swap image",
    "what image", "which image", "image on the", "check the image",
    "review images",
  ]);

  if (wantsGallery) {
    return {
      id: createSurfaceId("gallery_workspace"),
      type: "gallery_workspace",
      module: "Gallery",
      readOnly: true,
      title: "Gallery Images",
      description: "View, hide, or add images on the public project gallery.",
      quickActions: [
        { label: "Open Gallery Manager", action: "workspace", workspace: "gallery" },
      ],
    };
  }

  if (wantsPageImages) {
    return {
      id: createSurfaceId("images_workspace"),
      type: "images_workspace",
      module: "Page Images",
      readOnly: true,
      title: "Page Image Assignments",
      description: "Browse Supabase storage and assign images to site pages.",
      quickActions: [
        { label: "Open Image Assignments", action: "workspace", workspace: "images" },
      ],
    };
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
