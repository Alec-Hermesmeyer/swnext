"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import Head from "next/head";
import withAuthTw from "@/components/withAuthTw";
import TWAdminLayout from "@/components/TWAdminLayout";
import supabase from "@/components/Supabase";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

// Format date for display
const toLocalDate = (value) => {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  const str = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return new Date(`${str}T12:00:00`);
  }
  return new Date(value);
};

const formatDate = (date) => {
  return toLocalDate(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatShortDate = (date) =>
  toLocalDate(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

const formatDateTime = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatDateInputValue = (date) => {
  const d = toLocalDate(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Format date for input
const toDateString = (date) => formatDateInputValue(date);

const shiftDateString = (value, days) => {
  const base = toLocalDate(value);
  base.setHours(12, 0, 0, 0);
  base.setDate(base.getDate() + days);
  return formatDateInputValue(base);
};

const getTodayScheduleDate = () => shiftDateString(new Date(), 0);
const getTomorrowScheduleDate = () => shiftDateString(new Date(), 1);

const formatWorkerLabel = (worker) => {
  if (!worker?.name) return "";
  return worker.role ? `${worker.name} (${worker.role})` : worker.name;
};

const formatWorkerOption = (worker) => {
  if (!worker?.name) return "";
  return worker.role ? `${worker.name} — ${worker.role}` : worker.name;
};

const createEmptyJobDraft = () => ({
  job_name: "",
  job_number: "",
  dig_tess_number: "",
  customer_name: "",
  hiring_contractor: "",
  hiring_contact_name: "",
  hiring_contact_phone: "",
  hiring_contact_email: "",
  address: "",
  city: "",
  zip: "",
  pm_name: "",
  pm_phone: "",
  default_rig: "",
  crane_required: false,
  is_active: true,
  estimated_days: "",
  mob_days: "",
  actual_days: "",
  actual_mob_days: "",
  bid_amount: "",
  contract_amount: "",
  pier_count: "",
  scope_description: "",
  job_status: "active",
  start_date: "",
  end_date: "",
});

const isCrewJobActive = (job) => job?.is_active !== false;

const normalizeJobText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const sortCrewJobsForManagePanel = (rows = []) =>
  [...rows].sort((a, b) => {
    const activeDiff = Number(isCrewJobActive(b)) - Number(isCrewJobActive(a));
    if (activeDiff) return activeDiff;

    const nameDiff = String(a?.job_name || "").localeCompare(String(b?.job_name || ""), undefined, {
      sensitivity: "base",
    });
    if (nameDiff) return nameDiff;

    const numberDiff = String(a?.job_number || "").localeCompare(
      String(b?.job_number || ""),
      undefined,
      {
        numeric: true,
        sensitivity: "base",
      }
    );
    if (numberDiff) return numberDiff;

    return Number(a?.id || 0) - Number(b?.id || 0);
  });

const buildDateRange = (start, end) => {
  if (!start || !end) return [];
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return [];
  }
  if (startDate > endDate) return [];

  const dates = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    dates.push(toDateString(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

const toMonthString = (value) => {
  const d = toLocalDate(value);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const formatMonthLabel = (monthValue) => {
  if (!monthValue) return "";
  const [year, month] = String(monthValue).split("-").map(Number);
  if (!year || !month) return monthValue;
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
};

const getMonthBounds = (monthValue) => {
  if (!monthValue) return null;
  const [year, month] = String(monthValue).split("-").map(Number);
  if (!year || !month) return null;
  const monthText = String(month).padStart(2, "0");
  const lastDay = new Date(year, month, 0).getDate();
  return {
    start: `${year}-${monthText}-01`,
    end: `${year}-${monthText}-${String(lastDay).padStart(2, "0")}`,
    lastDay,
    firstWeekday: new Date(year, month - 1, 1).getDay(),
  };
};

const shiftMonthString = (monthValue, delta) => {
  const [year, month] = String(monthValue || "").split("-").map(Number);
  if (!year || !month) return toMonthString(new Date());
  const d = new Date(year, month - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const toNonNegativeInteger = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) return null;
  return Math.max(parsed, 0);
};

const JOB_PROGRESS_STATUS_OPTIONS = [
  { value: "planned", label: "Planned" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On Hold" },
  { value: "complete", label: "Complete" },
];

const JOB_PROGRESS_STATUS_LABELS = JOB_PROGRESS_STATUS_OPTIONS.reduce(
  (acc, option) => ({ ...acc, [option.value]: option.label }),
  {}
);

const JOB_INTAKE_FIELD_ORDER = [
  "job_name",
  "job_number",
  "dig_tess_number",
  "customer_name",
  "hiring_contractor",
  "hiring_contact_name",
  "hiring_contact_phone",
  "hiring_contact_email",
  "address",
  "city",
  "zip",
  "pm_name",
  "pm_phone",
  "default_rig",
  "crane_required",
];

const JOB_INTAKE_HEADER_ALIASES = {
  job_name: ["job name", "job", "project name", "project", "site name"],
  job_number: ["job number", "job #", "job no", "project number", "project #", "number"],
  dig_tess_number: ["dig tess", "dig tess #", "dig-tess", "dig_tess_number", "dig ticket"],
  customer_name: ["customer", "customer name", "owner"],
  hiring_contractor: ["hiring contractor", "contractor", "gc", "general contractor"],
  hiring_contact_name: ["contact", "contact name", "hiring contact", "hiring contact name"],
  hiring_contact_phone: ["contact phone", "phone", "hiring contact phone", "contact number"],
  hiring_contact_email: ["contact email", "email", "hiring contact email"],
  address: ["address", "job address", "site address", "street"],
  city: ["city", "town"],
  zip: ["zip", "zipcode", "postal", "postal code"],
  pm_name: ["pm", "pm name", "project manager", "project manager name"],
  pm_phone: ["pm phone", "project manager phone"],
  default_rig: ["default rig", "rig", "rig preference"],
  crane_required: ["crane", "crane required", "needs crane", "crane?"],
};

const RIG_DAY_TYPE_OPTIONS = [
  { value: "working", label: "Working Day", defaultLabel: "" },
  { value: "mob", label: "Mob / Move", defaultLabel: "Mob Rig" },
  { value: "down_day", label: "Down Day", defaultLabel: "Down Day" },
  { value: "repairs", label: "Repairs", defaultLabel: "Repairs" },
  { value: "shop", label: "Shop / Yard", defaultLabel: "Shop / Yard" },
  { value: "custom", label: "Custom", defaultLabel: "Custom Status" },
];

const RIG_DAY_TYPE_LABELS = RIG_DAY_TYPE_OPTIONS.reduce(
  (acc, option) => ({ ...acc, [option.value]: option.label }),
  {}
);

const NON_WORKING_RIG_DAY_TYPES = new Set(
  RIG_DAY_TYPE_OPTIONS.filter((option) => option.value !== "working").map(
    (option) => option.value
  )
);

const RIG_STATUS_NOTE_PREFIX = "__rig_day_type__:";

const trimText = (value) => String(value || "").trim();

const parseRigDayType = (notes) => {
  const raw = trimText(notes);
  if (!raw.startsWith(RIG_STATUS_NOTE_PREFIX)) return null;
  const value = raw.slice(RIG_STATUS_NOTE_PREFIX.length).trim().toLowerCase();
  return RIG_DAY_TYPE_LABELS[value] ? value : "custom";
};

const isRigStatusAssignment = (assignment) =>
  !assignment?.worker_id && !!parseRigDayType(assignment?.notes);

const isNonWorkingRigDayType = (dayType) =>
  NON_WORKING_RIG_DAY_TYPES.has(dayType);

const getDefaultRigDayLabel = (dayType) =>
  RIG_DAY_TYPE_OPTIONS.find((option) => option.value === dayType)?.defaultLabel || "";

const resolveRigDayStatusLabel = (dayType, label) => {
  const clean = trimText(label);
  if (clean) return clean;
  return getDefaultRigDayLabel(dayType);
};

const buildRigDayTypeNote = (dayType) => `${RIG_STATUS_NOTE_PREFIX}${dayType}`;

const getRigDayStatusFromAssignments = (assignmentRows = []) => {
  const statusAssignment = assignmentRows.find(isRigStatusAssignment) || null;
  const dayType = parseRigDayType(statusAssignment?.notes) || "working";
  const statusLabel = resolveRigDayStatusLabel(dayType, statusAssignment?.job_name);

  return {
    dayType,
    dayTypeLabel: RIG_DAY_TYPE_LABELS[dayType] || "Working Day",
    isNonWorking: isNonWorkingRigDayType(dayType),
    statusLabel,
    statusAssignment,
  };
};

function CrewScheduler() {
  const [activeTab, setActiveTab] = useState("schedule");
  const [selectedDate, setSelectedDate] = useState(getTomorrowScheduleDate());
  const [workers, setWorkers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [jobAdminRows, setJobAdminRows] = useState([]);
  const [customerNames, setCustomerNames] = useState([]);
  const [recentSchedules, setRecentSchedules] = useState([]);
  const [currentSchedule, setCurrentSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const printRef = useRef(null);

  // New worker form
  const [newWorkerName, setNewWorkerName] = useState("");
  const [newWorkerPhone, setNewWorkerPhone] = useState("");
  const [newWorkerRole, setNewWorkerRole] = useState("");
  const [bulkCrewText, setBulkCrewText] = useState("");
  const [bulkCrewRows, setBulkCrewRows] = useState([]);
  const [bulkCrewError, setBulkCrewError] = useState(null);
  const [bulkCrewImporting, setBulkCrewImporting] = useState(false);
  const [bulkCrewFilename, setBulkCrewFilename] = useState("");

  // New category form
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#6b7280");

  // New job form
  const [newJob, setNewJob] = useState(createEmptyJobDraft);
  const [editingJob, setEditingJob] = useState(null);
  const [jobIntakeText, setJobIntakeText] = useState("");
  const [jobIntakeStatus, setJobIntakeStatus] = useState(null);
  const [jobIntakePreviewRows, setJobIntakePreviewRows] = useState([]);
  const [jobIntakeImporting, setJobIntakeImporting] = useState(false);
  const [jobListFilter, setJobListFilter] = useState("active");
  const [jobListSearch, setJobListSearch] = useState("");

  // --- Phase 2: Superintendent & Truck state ---
  const [superintendents, setSuperintendents] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [newSuperintendentName, setNewSuperintendentName] = useState("");
  const [newSuperintendentPhone, setNewSuperintendentPhone] = useState("");
  const [newTruckNumber, setNewTruckNumber] = useState("");
  const [newTruckDescription, setNewTruckDescription] = useState("");

  // --- Phase 3: Per-rig details ---
  const [rigDetails, setRigDetails] = useState({});

  // --- Phase 5: Save & Email state ---
  const [emailSending, setEmailSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);

  // --- Phase 6: Daily Packets state ---
  const [packetsSending, setPacketsSending] = useState(false);
  const [packetsStatus, setPacketsStatus] = useState(null);

  // --- Schedule copy / prepopulate state ---
  const [copyStartDate, setCopyStartDate] = useState(getTomorrowScheduleDate());
  const [copyEndDate, setCopyEndDate] = useState(getTomorrowScheduleDate());
  const [copyOverwrite, setCopyOverwrite] = useState(false);
  const [copyingCategoryId, setCopyingCategoryId] = useState(null);
  const [copyingDaySchedule, setCopyingDaySchedule] = useState(false);
  const [copyStatus, setCopyStatus] = useState(null);
  const [scheduleRigSearch, setScheduleRigSearch] = useState("");
  const [scheduleNeedsAttentionOnly, setScheduleNeedsAttentionOnly] = useState(false);

  // --- Visual Board State ---
  const [showManagePanel, setShowManagePanel] = useState(false);
  const [managePanelTab, setManagePanelTab] = useState("workers");
  const [rigWorkerDrafts, setRigWorkerDrafts] = useState({});

  // --- Job Progress State ---
  const [jobProgressByJobId, setJobProgressByJobId] = useState({});
  const [jobProgressAvailable, setJobProgressAvailable] = useState(true);
  const [jobProgressStatus, setJobProgressStatus] = useState(null);
  const [editingProgressJobId, setEditingProgressJobId] = useState(null);
  const [editingProgress, setEditingProgress] = useState(null);
  const [savingProgress, setSavingProgress] = useState(false);

  // --- History Calendar State ---
  const [historyView, setHistoryView] = useState("rig");
  const [historyMonth, setHistoryMonth] = useState(toMonthString(new Date()));
  const [historyEntityId, setHistoryEntityId] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [historyFinalizedOnly, setHistoryFinalizedOnly] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [historyAssignments, setHistoryAssignments] = useState([]);
  const [historySelectedDate, setHistorySelectedDate] = useState("");

  // --- Planner Calendar State (live + future schedules) ---
  const [plannerMonth, setPlannerMonth] = useState(toMonthString(new Date()));
  const [plannerLoading, setPlannerLoading] = useState(false);
  const [plannerError, setPlannerError] = useState(null);
  const [plannerSchedules, setPlannerSchedules] = useState([]);
  const [plannerAssignments, setPlannerAssignments] = useState([]);
  const [plannerRigDetails, setPlannerRigDetails] = useState([]);
  const [plannerSearch, setPlannerSearch] = useState("");
  const [plannerFinalizedOnly, setPlannerFinalizedOnly] = useState(false);
  const [plannerSelectedDate, setPlannerSelectedDate] = useState("");

  const activeJobCount = useMemo(
    () => jobAdminRows.filter((job) => isCrewJobActive(job)).length,
    [jobAdminRows]
  );

  const filteredJobAdminRows = useMemo(() => {
    const query = normalizeJobText(jobListSearch);

    return sortCrewJobsForManagePanel(jobAdminRows).filter((job) => {
      const isActive = isCrewJobActive(job);

      if (jobListFilter === "active" && !isActive) return false;
      if (jobListFilter === "inactive" && isActive) return false;

      if (!query) return true;

      return [
        job.job_name,
        job.job_number,
        job.customer_name,
        job.hiring_contractor,
        job.pm_name,
        job.city,
        job.address,
      ].some((value) => normalizeJobText(value).includes(query));
    });
  }, [jobAdminRows, jobListFilter, jobListSearch]);

  // Fetch workers, categories, jobs, superintendents, trucks on mount
  useEffect(() => {
    fetchWorkers();
    fetchCategories();
    fetchJobs();
    fetchSuperintendents();
    fetchTrucks();
    fetchCustomers();
    fetchRecentSchedules();
    fetchJobProgress();
  }, []);

  // Fetch schedule when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchSchedule(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchRecentSchedules();
  }, [currentSchedule?.id]);

  const fetchWorkers = async () => {
    const { data, error } = await supabase
      .from("crew_workers")
      .select("*")
      .eq("is_active", true)
      .order("name");
    if (!error) setWorkers(data || []);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("crew_categories")
      .select("*")
      .order("sort_order");
    if (!error) setCategories(data || []);
    setLoading(false);
  };

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from("crew_jobs")
      .select("*")
      .order("job_name");
    if (!error) {
      const rows = sortCrewJobsForManagePanel(data || []);
      setJobAdminRows(rows);
      setJobs(rows.filter((job) => isCrewJobActive(job)));
    }
  };

  const fetchJobProgress = async () => {
    const { data, error } = await supabase
      .from("crew_job_progress")
      .select("*");
    if (error) {
      setJobProgressAvailable(false);
      return;
    }
    const byJobId = {};
    (data || []).forEach((row) => {
      if (!row?.job_id) return;
      byJobId[row.job_id] = row;
    });
    setJobProgressByJobId(byJobId);
    setJobProgressAvailable(true);
  };

  const fetchSuperintendents = async () => {
    const { data, error } = await supabase
      .from("crew_superintendents")
      .select("*")
      .eq("is_active", true)
      .order("name");
    if (!error) setSuperintendents(data || []);
  };

  const fetchTrucks = async () => {
    const { data, error } = await supabase
      .from("crew_trucks")
      .select("*")
      .eq("is_active", true)
      .order("truck_number");
    if (!error) setTrucks(data || []);
  };

  const normalizeCustomerName = (name) =>
    String(name || "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();

  const normalizeCrewKey = (row) =>
    `${String(row.name || "").trim().toLowerCase()}::${String(row.phone || "")
      .trim()
      .toLowerCase()}`;

  const splitCsvLine = (line) => {
    if (!line) return [];
    if (line.includes("\t") && !line.includes(",")) {
      return line.split("\t").map((s) => s.trim());
    }
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const parseCrewInput = (raw) => {
    const text = String(raw || "")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n");
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (!lines.length) {
      return { rows: [], error: "No crew names found. Add at least one name." };
    }

    const firstColumns = splitCsvLine(lines[0]).map((c) => c.toLowerCase());
    const headerMap = {};
    firstColumns.forEach((col, idx) => {
      if (col.includes("name")) headerMap.name = idx;
      if (col.includes("phone")) headerMap.phone = idx;
      if (col.includes("role") || col.includes("title")) headerMap.role = idx;
    });
    const hasHeader = Object.keys(headerMap).length > 0;

    const rows = [];
    const startIndex = hasHeader ? 1 : 0;
    for (let i = startIndex; i < lines.length; i += 1) {
      const cols = splitCsvLine(lines[i]);
      if (!cols.length) continue;
      if (hasHeader) {
        const name = cols[headerMap.name] || "";
        if (!name.trim()) continue;
        rows.push({
          name: name.trim(),
          phone: (cols[headerMap.phone] || "").trim(),
          role: (cols[headerMap.role] || "").trim(),
        });
      } else if (cols.length === 1) {
        rows.push({ name: cols[0].trim(), phone: "", role: "" });
      } else {
        rows.push({
          name: (cols[0] || "").trim(),
          phone: (cols[1] || "").trim(),
          role: (cols[2] || "").trim(),
        });
      }
    }

    const deduped = new Map();
    rows.forEach((row) => {
      if (!row.name) return;
      deduped.set(normalizeCrewKey(row), row);
    });

    return { rows: Array.from(deduped.values()), error: null };
  };

  const normalizeHeaderLabel = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/[_-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const getJobIntakeHeaderMap = (columns) => {
    const map = {};
    columns.forEach((column, idx) => {
      const normalized = normalizeHeaderLabel(column);
      if (!normalized) return;
      Object.entries(JOB_INTAKE_HEADER_ALIASES).forEach(([field, aliases]) => {
        if (map[field] !== undefined) return;
        if (aliases.includes(normalized)) {
          map[field] = idx;
        }
      });
    });
    return map;
  };

  const parseBooleanLike = (value) => {
    const normalized = String(value || "").trim().toLowerCase();
    if (!normalized) return false;
    return ["true", "yes", "y", "1", "required", "crane"].includes(normalized);
  };

  const parseJobIntakeInput = (raw) => {
    const text = String(raw || "")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n");
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (!lines.length) {
      return {
        rows: [],
        error: "No jobs found. Paste at least one row from the spreadsheet.",
      };
    }

    const firstColumns = splitCsvLine(lines[0]);
    const headerMap = getJobIntakeHeaderMap(firstColumns);
    const hasHeader =
      headerMap.job_name !== undefined || headerMap.job_number !== undefined;
    const rows = [];
    const startIndex = hasHeader ? 1 : 0;

    for (let i = startIndex; i < lines.length; i += 1) {
      const cols = splitCsvLine(lines[i]);
      if (!cols.length) continue;

      const draft = {};
      JOB_INTAKE_FIELD_ORDER.forEach((field, idx) => {
        if (hasHeader) {
          const headerIdx = headerMap[field];
          draft[field] = headerIdx === undefined ? "" : cols[headerIdx] || "";
        } else {
          draft[field] = cols[idx] || "";
        }
      });

      const jobNumber = String(draft.job_number || "").trim();
      const jobName =
        String(draft.job_name || "").trim() || (jobNumber ? `Job ${jobNumber}` : "");

      if (!jobName) continue;
      rows.push({
        ...draft,
        job_name: jobName,
        job_number: jobNumber,
        dig_tess_number: String(draft.dig_tess_number || "").trim(),
        customer_name: String(draft.customer_name || "").trim(),
        hiring_contractor: String(draft.hiring_contractor || "").trim(),
        hiring_contact_name: String(draft.hiring_contact_name || "").trim(),
        hiring_contact_phone: String(draft.hiring_contact_phone || "").trim(),
        hiring_contact_email: String(draft.hiring_contact_email || "").trim(),
        address: String(draft.address || "").trim(),
        city: String(draft.city || "").trim(),
        zip: String(draft.zip || "").trim(),
        pm_name: String(draft.pm_name || "").trim(),
        pm_phone: String(draft.pm_phone || "").trim(),
        default_rig: String(draft.default_rig || "").trim(),
        crane_required: parseBooleanLike(draft.crane_required),
      });
    }

    if (!rows.length) {
      return {
        rows: [],
        error: "Could not parse any job rows. Include at least a job name column.",
      };
    }

    const deduped = new Map();
    rows.forEach((row) => {
      const key = row.job_number
        ? `num::${row.job_number.toLowerCase()}`
        : `name::${row.job_name.toLowerCase()}`;
      deduped.set(key, row);
    });

    return { rows: Array.from(deduped.values()), error: null };
  };

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from("Customer")
      .select("id, name");
    if (!error) {
      const uniqueMap = new Map();
      (data || []).forEach((c) => {
        const clean = String(c?.name || "").trim();
        if (!clean) return;
        const key = normalizeCustomerName(clean);
        if (!uniqueMap.has(key)) uniqueMap.set(key, clean);
      });
      setCustomerNames(
        Array.from(uniqueMap.values()).sort((a, b) => a.localeCompare(b))
      );
    }
  };

  const ensureCustomerExists = async (name) => {
    const clean = String(name || "").trim();
    if (!clean) return;
    const key = normalizeCustomerName(clean);
    const existingSet = new Set(customerNames.map(normalizeCustomerName));
    if (existingSet.has(key)) return;
    const { data, error } = await supabase
      .from("Customer")
      .insert({ name: clean })
      .select("name")
      .single();
    if (!error && data?.name) {
      setCustomerNames((prev) => {
        const map = new Map(prev.map((n) => [normalizeCustomerName(n), n]));
        map.set(key, clean);
        return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
      });
    }
  };

  const fetchRecentSchedules = async () => {
    const { data, error } = await supabase
      .from("crew_schedules")
      .select("id, schedule_date, is_finalized, finalized_at")
      .order("schedule_date", { ascending: false })
      .limit(10);
    if (!error) setRecentSchedules(data || []);
  };

  const getOrCreateSchedule = async (date) => {
    let { data: schedule, error } = await supabase
      .from("crew_schedules")
      .select("*")
      .eq("schedule_date", date)
      .single();

    if (error && error.code === "PGRST116") {
      const { data: created, error: createError } = await supabase
        .from("crew_schedules")
        .insert({ schedule_date: date })
        .select()
        .single();
      if (createError) return null;
      schedule = created;
    }

    return schedule || null;
  };

  const normalizeJobInput = (job) => {
    const intOrNull = (v) => { const n = parseInt(v, 10); return Number.isFinite(n) && n >= 0 ? n : null; };
    const numOrNull = (v) => { const s = String(v || "").replace(/[$,\s]/g, ""); const n = parseFloat(s); return Number.isFinite(n) ? n : null; };
    const dateOrNull = (v) => { const s = String(v || "").trim(); return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null; };
    return {
      job_name: String(job.job_name || "").trim(),
      job_number: String(job.job_number || "").trim() || null,
      dig_tess_number: String(job.dig_tess_number || "").trim() || null,
      customer_name: String(job.customer_name || "").trim() || null,
      hiring_contractor: String(job.hiring_contractor || "").trim() || null,
      hiring_contact_name: String(job.hiring_contact_name || "").trim() || null,
      hiring_contact_phone: String(job.hiring_contact_phone || "").trim() || null,
      hiring_contact_email: String(job.hiring_contact_email || "").trim() || null,
      address: String(job.address || "").trim() || null,
      city: String(job.city || "").trim() || null,
      zip: String(job.zip || "").trim() || null,
      pm_name: String(job.pm_name || "").trim() || null,
      pm_phone: String(job.pm_phone || "").trim() || null,
      default_rig: String(job.default_rig || "").trim() || null,
      crane_required: !!job.crane_required,
      is_active: job.is_active !== false,
      estimated_days: intOrNull(job.estimated_days),
      mob_days: intOrNull(job.mob_days),
      actual_days: intOrNull(job.actual_days),
      actual_mob_days: intOrNull(job.actual_mob_days),
      bid_amount: numOrNull(job.bid_amount),
      contract_amount: numOrNull(job.contract_amount),
      pier_count: intOrNull(job.pier_count),
      scope_description: String(job.scope_description || "").trim() || null,
      job_status: String(job.job_status || "active").trim(),
      start_date: dateOrNull(job.start_date),
      end_date: dateOrNull(job.end_date),
    };
  };

  const normalizeJobMatchValue = (value) => normalizeJobText(value);

  const clearJobIntake = () => {
    setJobIntakeText("");
    setJobIntakePreviewRows([]);
    setJobIntakeStatus(null);
  };

  const previewJobIntake = () => {
    const { rows, error } = parseJobIntakeInput(jobIntakeText);
    setJobIntakePreviewRows(rows);
    if (error) {
      setJobIntakeStatus({ type: "error", message: error });
      return;
    }
    setJobIntakeStatus({
      type: "success",
      message: `Ready to import ${rows.length} job${rows.length === 1 ? "" : "s"}.`,
    });
  };

  const importJobIntake = async () => {
    const { rows, error } = parseJobIntakeInput(jobIntakeText);
    setJobIntakePreviewRows(rows);
    if (error || rows.length === 0) {
      setJobIntakeStatus({
        type: "error",
        message: error || "No jobs available to import.",
      });
      return;
    }

    setJobIntakeImporting(true);
    setJobIntakeStatus(null);
    try {
      const { data: existingJobs, error: existingError } = await supabase
        .from("crew_jobs")
        .select("id, job_name, job_number");
      if (existingError) throw existingError;

      const byNumber = new Map();
      const byName = new Map();
      (existingJobs || []).forEach((job) => {
        const numberKey = normalizeJobMatchValue(job.job_number);
        const nameKey = normalizeJobMatchValue(job.job_name);
        if (numberKey) byNumber.set(numberKey, job);
        if (nameKey) byName.set(nameKey, job);
      });

      let created = 0;
      let updated = 0;
      let skipped = 0;

      for (const row of rows) {
        const payload = normalizeJobInput(row);
        if (!payload.job_name) {
          skipped += 1;
          continue;
        }

        const numberKey = normalizeJobMatchValue(payload.job_number);
        const nameKey = normalizeJobMatchValue(payload.job_name);
        const existing = (numberKey && byNumber.get(numberKey)) || byName.get(nameKey);

        if (existing) {
          const { error: updateError } = await supabase
            .from("crew_jobs")
            .update({ ...payload, is_active: true })
            .eq("id", existing.id);
          if (updateError) {
            skipped += 1;
            continue;
          }
          updated += 1;
        } else {
          const { data: inserted, error: insertError } = await supabase
            .from("crew_jobs")
            .insert(payload)
            .select("id, job_name, job_number")
            .single();
          if (insertError) {
            skipped += 1;
            continue;
          }
          created += 1;
          const insertedNumber = normalizeJobMatchValue(inserted?.job_number);
          const insertedName = normalizeJobMatchValue(inserted?.job_name);
          if (insertedNumber) byNumber.set(insertedNumber, inserted);
          if (insertedName) byName.set(insertedName, inserted);
        }

        await ensureCustomerExists(payload.hiring_contractor);
      }

      await fetchJobs();
      setJobIntakeStatus({
        type: skipped > 0 ? "warning" : "success",
        message: `Job intake complete. Created: ${created}, Updated: ${updated}, Skipped: ${skipped}.`,
      });
    } catch (err) {
      setJobIntakeStatus({
        type: "error",
        message: "Job intake failed. Please try again.",
      });
    }
    setJobIntakeImporting(false);
  };

  const addJob = async () => {
    const payload = normalizeJobInput(newJob);
    if (!payload.job_name) return;
    setSaving(true);
    const { error } = await supabase.from("crew_jobs").insert(payload);
    if (!error) {
      await ensureCustomerExists(payload.hiring_contractor);
      setNewJob(createEmptyJobDraft());
      await fetchJobs();
    }
    setSaving(false);
  };

  const updateJob = async (id, updates) => {
    await supabase.from("crew_jobs").update(updates).eq("id", id);
    await fetchJobs();
    setEditingJob(null);
    await ensureCustomerExists(updates.hiring_contractor);
  };

  const startEditingJob = (job) => {
    setEditingJob({
      id: job.id,
      job_name: job.job_name || "",
      job_number: job.job_number || "",
      dig_tess_number: job.dig_tess_number || "",
      customer_name: job.customer_name || "",
      hiring_contractor: job.hiring_contractor || "",
      hiring_contact_name: job.hiring_contact_name || "",
      hiring_contact_phone: job.hiring_contact_phone || "",
      hiring_contact_email: job.hiring_contact_email || "",
      address: job.address || "",
      city: job.city || "",
      zip: job.zip || "",
      pm_name: job.pm_name || "",
      pm_phone: job.pm_phone || "",
      default_rig: job.default_rig || "",
      crane_required: !!job.crane_required,
      is_active: isCrewJobActive(job),
    });
  };

  const toggleJobActive = async (job) => {
    const nextIsActive = !isCrewJobActive(job);
    const actionLabel = nextIsActive ? "activate" : "deactivate";
    const impactLabel = nextIsActive
      ? "It will appear in the scheduler again."
      : "It will no longer appear in the scheduler.";

    if (!confirm(`${actionLabel[0].toUpperCase()}${actionLabel.slice(1)} this job? ${impactLabel}`)) {
      return;
    }

    await supabase.from("crew_jobs").update({ is_active: nextIsActive }).eq("id", job.id);

    if (editingJob?.id === job.id) {
      setEditingJob((current) =>
        current
          ? {
              ...current,
              is_active: nextIsActive,
            }
          : current
      );
    }

    await fetchJobs();
  };

  const fetchSchedule = async (date) => {
    const schedule = await getOrCreateSchedule(date);

    setCurrentSchedule(schedule);

    if (schedule) {
      // Fetch assignments for this schedule including job details
      const { data: assignmentData } = await supabase
        .from("crew_assignments")
        .select("*, crew_workers(*), crew_categories(*), crew_jobs(*)")
        .eq("schedule_id", schedule.id)
        .order("sort_order");
      setAssignments(assignmentData || []);

      // Fetch rig details for this schedule
      const { data: rigData } = await supabase
        .from("schedule_rig_details")
        .select("*, crew_superintendents(*), crew_trucks(*)")
        .eq("schedule_id", schedule.id);

      const detailsMap = {};
      (rigData || []).forEach((rd) => {
        detailsMap[rd.category_id] = {
          id: rd.id,
          superintendent_id: rd.superintendent_id || "",
          truck_id: rd.truck_id || "",
          crane_info: rd.crane_info || "",
          notes: rd.notes || "",
          superintendent_name: rd.crew_superintendents?.name || "",
          superintendent_phone: rd.crew_superintendents?.phone || "",
          truck_number: rd.crew_trucks?.truck_number || "",
        };
      });
      setRigDetails(detailsMap);
    } else {
      setAssignments([]);
      setRigDetails({});
    }
  };

  const addWorker = async () => {
    if (!newWorkerName.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from("crew_workers")
      .insert({
        name: newWorkerName.trim(),
        phone: newWorkerPhone.trim() || null,
        role: newWorkerRole.trim() || null,
      });
    if (!error) {
      setNewWorkerName("");
      setNewWorkerPhone("");
      setNewWorkerRole("");
      fetchWorkers();
    }
    setSaving(false);
  };

  const deleteWorker = async (id) => {
    if (!confirm("Remove this worker?")) return;
    await supabase.from("crew_workers").update({ is_active: false }).eq("id", id);
    fetchWorkers();
  };

  const updateWorker = async (id, updates) => {
    await supabase.from("crew_workers").update(updates).eq("id", id);
    fetchWorkers();
  };

  const handleBulkCrewParse = (text) => {
    const { rows, error } = parseCrewInput(text);
    setBulkCrewRows(rows);
    setBulkCrewError(error);
  };

  const handleBulkCrewFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBulkCrewFilename(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result || "";
      setBulkCrewText(String(content));
      handleBulkCrewParse(String(content));
    };
    reader.readAsText(file);
  };

  const clearBulkCrew = () => {
    setBulkCrewText("");
    setBulkCrewRows([]);
    setBulkCrewError(null);
    setBulkCrewFilename("");
  };

  const importBulkCrew = async () => {
    if (!bulkCrewRows.length) return;
    setBulkCrewImporting(true);
    setBulkCrewError(null);
    try {
      const chunkSize = 200;
      for (let i = 0; i < bulkCrewRows.length; i += chunkSize) {
        const chunk = bulkCrewRows.slice(i, i + chunkSize);
        const payload = chunk.map((row) => ({
          name: row.name,
          phone: row.phone || null,
          role: row.role || null,
        }));
        const { error } = await supabase.from("crew_workers").insert(payload);
        if (error) throw error;
      }
      clearBulkCrew();
      fetchWorkers();
    } catch (err) {
      setBulkCrewError("Import failed. Please check the file and try again.");
    }
    setBulkCrewImporting(false);
  };

  const addCategory = async () => {
    if (!newCategoryName.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from("crew_categories")
      .insert({ name: newCategoryName.trim(), color: newCategoryColor });
    if (!error) {
      setNewCategoryName("");
      setNewCategoryColor("#6b7280");
      fetchCategories();
    }
    setSaving(false);
  };

  const deleteCategory = async (id) => {
    if (!confirm("Delete this category?")) return;
    await supabase.from("crew_categories").delete().eq("id", id);
    fetchCategories();
  };

  const addAssignment = async (categoryId) => {
    if (!currentSchedule) return;
    setSaving(true);
    const { error } = await supabase.from("crew_assignments").insert({
      schedule_id: currentSchedule.id,
      category_id: categoryId,
      worker_id: null,
      job_name: "",
    });
    if (!error) {
      fetchSchedule(selectedDate);
    }
    setSaving(false);
  };

  const updateAssignment = async (assignmentId, updates) => {
    await supabase.from("crew_assignments").update(updates).eq("id", assignmentId);
    fetchSchedule(selectedDate);
  };

  const deleteAssignment = async (assignmentId) => {
    await supabase.from("crew_assignments").delete().eq("id", assignmentId);
    fetchSchedule(selectedDate);
  };

  const clearCategorySchedule = async (categoryId) => {
    if (!currentSchedule) return;
    const category = categories.find((c) => c.id === categoryId);
    if (
      !confirm(
        `Clear all crew assignments and rig details for ${category?.name || "this category"}?`
      )
    ) {
      return;
    }
    setSaving(true);
    await supabase
      .from("crew_assignments")
      .delete()
      .eq("schedule_id", currentSchedule.id)
      .eq("category_id", categoryId);
    await supabase
      .from("schedule_rig_details")
      .delete()
      .eq("schedule_id", currentSchedule.id)
      .eq("category_id", categoryId);
    setSaving(false);
    fetchSchedule(selectedDate);
  };

  const splitAssignment = async (assignment) => {
    if (!currentSchedule) return;
    setSaving(true);
    const { error } = await supabase.from("crew_assignments").insert({
      schedule_id: currentSchedule.id,
      category_id: assignment.category_id,
      worker_id: assignment.worker_id || null,
      job_id: null,
      job_name: "",
      sort_order: (assignment.sort_order || 0) + 1,
    });
    if (!error) {
      fetchSchedule(selectedDate);
    }
    setSaving(false);
  };

  // --- Phase 2: Superintendent CRUD ---
  const addSuperintendent = async () => {
    if (!newSuperintendentName.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("crew_superintendents").insert({
      name: newSuperintendentName.trim(),
      phone: newSuperintendentPhone.trim() || null,
    });
    if (!error) {
      setNewSuperintendentName("");
      setNewSuperintendentPhone("");
      fetchSuperintendents();
    }
    setSaving(false);
  };

  const deleteSuperintendent = async (id) => {
    if (!confirm("Remove this superintendent?")) return;
    await supabase.from("crew_superintendents").update({ is_active: false }).eq("id", id);
    fetchSuperintendents();
  };

  // --- Phase 2: Truck CRUD ---
  const addTruck = async () => {
    if (!newTruckNumber.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("crew_trucks").insert({
      truck_number: newTruckNumber.trim(),
      description: newTruckDescription.trim() || null,
    });
    if (!error) {
      setNewTruckNumber("");
      setNewTruckDescription("");
      fetchTrucks();
    }
    setSaving(false);
  };

  const deleteTruck = async (id) => {
    if (!confirm("Remove this truck?")) return;
    await supabase.from("crew_trucks").update({ is_active: false }).eq("id", id);
    fetchTrucks();
  };

  // --- Phase 3: Update rig detail (upsert) ---
  const updateRigDetail = async (categoryId, field, value) => {
    if (!currentSchedule) return;

    // Update local state immediately
    setRigDetails((prev) => ({
      ...prev,
      [categoryId]: {
        ...(prev[categoryId] || {}),
        [field]: value,
      },
    }));

    const updateData = {
      schedule_id: currentSchedule.id,
      category_id: categoryId,
      [field]: value || null,
    };

    await supabase
      .from("schedule_rig_details")
      .upsert(updateData, { onConflict: "schedule_id,category_id" });

    // Refresh to get joined data (superintendent/truck names)
    if (field === "superintendent_id" || field === "truck_id") {
      const { data: rigData } = await supabase
        .from("schedule_rig_details")
        .select("*, crew_superintendents(*), crew_trucks(*)")
        .eq("schedule_id", currentSchedule.id)
        .eq("category_id", categoryId)
        .single();

      if (rigData) {
        setRigDetails((prev) => ({
          ...prev,
          [categoryId]: {
            ...(prev[categoryId] || {}),
            id: rigData.id,
            superintendent_id: rigData.superintendent_id || "",
            truck_id: rigData.truck_id || "",
            crane_info: rigData.crane_info || "",
            notes: rigData.notes || "",
            superintendent_name: rigData.crew_superintendents?.name || "",
            superintendent_phone: rigData.crew_superintendents?.phone || "",
            truck_number: rigData.crew_trucks?.truck_number || "",
          },
        }));
      }
    }
  };

  const handleCopyCategoryRange = async (categoryId) => {
    if (!currentSchedule) return;

    const category = categories.find((c) => c.id === categoryId);
    const categoryAssignments = assignments.filter(
      (a) => a.category_id === categoryId
    );
    const detail = rigDetails[categoryId] || {};
    const hasRigDetail =
      detail.superintendent_id || detail.truck_id || detail.crane_info || detail.notes;

    if (categoryAssignments.length === 0 && !hasRigDetail) {
      setCopyStatus({
        type: "error",
        message: "This rig has no crew or rig details to copy.",
      });
      return;
    }

    const rangeDates = buildDateRange(copyStartDate, copyEndDate).filter(
      (date) => date !== selectedDate
    );
    if (rangeDates.length === 0) {
      setCopyStatus({
        type: "error",
        message: "Select a valid date range (excluding the current day).",
      });
      return;
    }

    if (
      !confirm(
        `Copy ${category?.name || "this rig"} to ${rangeDates.length} day(s)? ${
          copyOverwrite
            ? "Existing entries for this rig in the range will be replaced."
            : "Existing entries for this rig will be skipped."
        }`
      )
    ) {
      return;
    }

    setCopyingCategoryId(categoryId);
    setCopyStatus(null);

    try {
      const { data: existingSchedules } = await supabase
        .from("crew_schedules")
        .select("id, schedule_date")
        .gte("schedule_date", rangeDates[0])
        .lte("schedule_date", rangeDates[rangeDates.length - 1]);

      const scheduleMap = new Map(
        (existingSchedules || []).map((s) => [s.schedule_date, s])
      );

      let copiedCount = 0;
      let skippedCount = 0;

      for (const date of rangeDates) {
        let schedule = scheduleMap.get(date);
        if (!schedule) {
          const { data: created, error: createError } = await supabase
            .from("crew_schedules")
            .insert({ schedule_date: date })
            .select()
            .single();
          if (createError) {
            skippedCount += 1;
            continue;
          }
          schedule = created;
          scheduleMap.set(date, schedule);
        }

        if (!copyOverwrite) {
          const { count: assignmentCount } = await supabase
            .from("crew_assignments")
            .select("id", { count: "exact", head: true })
            .eq("schedule_id", schedule.id)
            .eq("category_id", categoryId);
          const { count: detailCount } = await supabase
            .from("schedule_rig_details")
            .select("id", { count: "exact", head: true })
            .eq("schedule_id", schedule.id)
            .eq("category_id", categoryId);

          if ((assignmentCount && assignmentCount > 0) || (detailCount && detailCount > 0)) {
            skippedCount += 1;
            continue;
          }
        } else {
          await supabase
            .from("crew_assignments")
            .delete()
            .eq("schedule_id", schedule.id)
            .eq("category_id", categoryId);
          await supabase
            .from("schedule_rig_details")
            .delete()
            .eq("schedule_id", schedule.id)
            .eq("category_id", categoryId);
        }

        if (categoryAssignments.length > 0) {
          const assignmentRows = categoryAssignments.map((a) => ({
            schedule_id: schedule.id,
            category_id: categoryId,
            worker_id: a.worker_id || null,
            job_id: a.job_id || null,
            job_name: a.job_name || null,
            notes: a.notes || null,
            sort_order: a.sort_order || 0,
          }));
          await supabase.from("crew_assignments").insert(assignmentRows);
        }

        if (hasRigDetail) {
          await supabase.from("schedule_rig_details").insert({
            schedule_id: schedule.id,
            category_id: categoryId,
            superintendent_id: detail.superintendent_id || null,
            truck_id: detail.truck_id || null,
            crane_info: detail.crane_info || null,
            notes: detail.notes || null,
          });
        }

        copiedCount += 1;
      }

      setCopyStatus({
        type: "success",
        message: `Copied ${category?.name || "rig"} to ${copiedCount} day(s)${
          skippedCount ? `, skipped ${skippedCount} existing day(s)` : ""
        }.`,
      });
    } catch (err) {
      setCopyStatus({
        type: "error",
        message: "Failed to copy the rig schedule. Please try again.",
      });
    }

    setCopyingCategoryId(null);
  };

  const handleCopyPreviousDayToSelectedDay = async () => {
    const targetDate = selectedDate;
    const sourceDate = shiftDateString(targetDate, -1);

    if (sourceDate === targetDate) return;

    setCopyingDaySchedule(true);
    setCopyStatus(null);

    try {
      const { data: sourceSchedule } = await supabase
        .from("crew_schedules")
        .select("id")
        .eq("schedule_date", sourceDate)
        .limit(1)
        .single();

      if (!sourceSchedule) {
        setCopyStatus({
          type: "error",
          message: `No schedule exists on ${formatShortDate(sourceDate)} to copy forward.`,
        });
        setCopyingDaySchedule(false);
        return;
      }

      const [{ data: sourceAssignments }, { data: sourceDetails }] = await Promise.all([
        supabase
          .from("crew_assignments")
          .select("category_id, worker_id, job_id, job_name, notes, sort_order")
          .eq("schedule_id", sourceSchedule.id),
        supabase
          .from("schedule_rig_details")
          .select("category_id, superintendent_id, truck_id, crane_info, notes")
          .eq("schedule_id", sourceSchedule.id),
      ]);

      if (!sourceAssignments?.length && !sourceDetails?.length) {
        setCopyStatus({
          type: "error",
          message: `The ${formatShortDate(sourceDate)} schedule has no rig data to copy.`,
        });
        setCopyingDaySchedule(false);
        return;
      }

      const targetSchedule = await getOrCreateSchedule(targetDate);
      if (!targetSchedule) {
        setCopyStatus({
          type: "error",
          message: `Could not load the ${formatShortDate(targetDate)} schedule.`,
        });
        setCopyingDaySchedule(false);
        return;
      }

      if (targetSchedule.is_finalized) {
        setCopyStatus({
          type: "error",
          message: `${formatShortDate(targetDate)} is finalized. Unfinalize it before replacing the day.`,
        });
        setCopyingDaySchedule(false);
        return;
      }

      const [{ count: existingAssignmentCount }, { count: existingDetailCount }] =
        await Promise.all([
          supabase
            .from("crew_assignments")
            .select("id", { count: "exact", head: true })
            .eq("schedule_id", targetSchedule.id),
          supabase
            .from("schedule_rig_details")
            .select("id", { count: "exact", head: true })
            .eq("schedule_id", targetSchedule.id),
        ]);

      const targetHasData =
        (existingAssignmentCount && existingAssignmentCount > 0) ||
        (existingDetailCount && existingDetailCount > 0);

      const confirmMessage = targetHasData
        ? `${formatShortDate(targetDate)} already has schedule data. Replace it with ${formatShortDate(sourceDate)}?`
        : `Copy ${formatShortDate(sourceDate)} into ${formatShortDate(targetDate)}?`;
      if (!confirm(confirmMessage)) {
        setCopyingDaySchedule(false);
        return;
      }

      await Promise.all([
        supabase.from("crew_assignments").delete().eq("schedule_id", targetSchedule.id),
        supabase.from("schedule_rig_details").delete().eq("schedule_id", targetSchedule.id),
      ]);

      if (sourceAssignments?.length) {
        await supabase.from("crew_assignments").insert(
          sourceAssignments.map((assignment) => ({
            schedule_id: targetSchedule.id,
            category_id: assignment.category_id,
            worker_id: assignment.worker_id || null,
            job_id: assignment.job_id || null,
            job_name: assignment.job_name || null,
            notes: assignment.notes || null,
            sort_order: assignment.sort_order || 0,
          }))
        );
      }

      if (sourceDetails?.length) {
        await supabase.from("schedule_rig_details").insert(
          sourceDetails.map((detail) => ({
            schedule_id: targetSchedule.id,
            category_id: detail.category_id,
            superintendent_id: detail.superintendent_id || null,
            truck_id: detail.truck_id || null,
            crane_info: detail.crane_info || null,
            notes: detail.notes || null,
          }))
        );
      }

      await fetchSchedule(targetDate);
      setCopyStatus({
        type: "success",
        message: `Copied ${formatShortDate(sourceDate)} into ${formatShortDate(targetDate)}.`,
      });
    } catch (err) {
      setCopyStatus({
        type: "error",
        message: "Could not copy the previous day into this schedule.",
      });
    }

    setCopyingDaySchedule(false);
  };

  // --- Phase 5: Save & Email Schedule ---
  const handleSaveAndEmail = async () => {
    if (!currentSchedule) return;
    const confirmMessage = currentSchedule?.is_finalized
      ? "Resend this schedule email? Updates will be sent to Cesar and Phil."
      : "Finalize and email this schedule? Cesar will receive the schedule and Phil will be notified.";
    if (!confirm(confirmMessage)) return;

    setEmailSending(true);
    setEmailStatus(null);

    try {
      // Mark schedule as finalized
      await supabase
        .from("crew_schedules")
        .update({
          is_finalized: true,
          finalized_at: new Date().toISOString(),
          finalized_by: "admin",
        })
        .eq("id", currentSchedule.id);

      // Build data for the email API
      const emailCategories = categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        color: cat.color,
      }));

      const emailAssignments = assignments
        .filter((assignment) => assignment.worker_id)
        .map((a) => ({
          category_id: a.category_id,
          worker_name: formatWorkerLabel(a.crew_workers) || "Unassigned",
          job_name: a.crew_jobs?.job_name || a.job_name || "",
        }));

      const emailRigDetails = categories.map((cat) => {
        const detail = rigDetails[cat.id] || {};
        const status = scheduleRigStatusByCategoryId[cat.id] || {};
        return {
          category_id: cat.id,
          superintendent_name: detail.superintendent_name || "",
          truck_number: detail.truck_number || "",
          crane_info: detail.crane_info || "",
          day_type: status.dayType || "working",
          status_label: status.isNonWorking ? status.statusLabel || "" : "",
        };
      });

      const response = await fetch("/api/send-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduleDate: selectedDate,
          categories: emailCategories,
          assignments: emailAssignments,
          rigDetails: emailRigDetails,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        setEmailStatus({ type: "success", message: "Schedule emailed successfully!" });
        // Refresh to show finalized badge
        fetchSchedule(selectedDate);
      } else {
        setEmailStatus({ type: "error", message: result.message || "Failed to send email" });
      }
    } catch (err) {
      setEmailStatus({ type: "error", message: "Network error sending email" });
    }

    setEmailSending(false);
  };

  // --- Phase 6: Derive scheduled jobs for the daily packets tab ---
  const scheduledPacketsForDate = useMemo(() => {
    const packets = [];
    assignments.forEach((a) => {
      if (!a.job_id || !a.crew_jobs || !a.worker_id) return;
      const job = a.crew_jobs;
      const cat = a.crew_categories || {};
      const detail = rigDetails[a.category_id] || {};
      const crewForJob = assignments
        .filter((x) => x.job_id === a.job_id)
        .map((x) => formatWorkerLabel(x.crew_workers))
        .filter(Boolean);

      packets.push({
        packet_id: a.id,
        assignment: a,
        worker_name: formatWorkerLabel(a.crew_workers),
        worker_phone: a.crew_workers?.phone || "",
        job_id: a.job_id,
        job_name: job.job_name,
        job_number: job.job_number,
        customer_name: job.customer_name,
        hiring_contractor: job.hiring_contractor,
        hiring_contact_name: job.hiring_contact_name,
        hiring_contact_phone: job.hiring_contact_phone,
        hiring_contact_email: job.hiring_contact_email,
        address: job.address,
        city: job.city,
        zip: job.zip,
        pm_name: job.pm_name,
        pm_phone: job.pm_phone,
        crane_required: job.crane_required,
        dig_tess_number: job.dig_tess_number || "",
        rig_name: cat.name || "",
        category_id: a.category_id,
        superintendent_name: detail.superintendent_name || "",
        superintendent_phone: detail.superintendent_phone || "",
        truck_number: detail.truck_number || "",
        crane_info: detail.crane_info || "",
        crew_names: crewForJob.join(", "),
      });
    });
    return packets;
  }, [assignments, rigDetails]);

  // --- Phase 6: Update dig tess number on blur ---
  const updateDigTessNumber = async (jobId, value) => {
    await supabase.from("crew_jobs").update({ dig_tess_number: value || null }).eq("id", jobId);
  };

  // --- Phase 6: Email all packets ---
  const handleEmailPackets = async () => {
    if (scheduledPacketsForDate.length === 0) {
      alert("No crew packets scheduled for this date.");
      return;
    }
    if (!confirm(`Email ${scheduledPacketsForDate.length} worker packet(s) to Phil?`))
      return;

    setPacketsSending(true);
    setPacketsStatus(null);

    try {
      const packets = scheduledPacketsForDate.map((j) => ({
        worker_name: j.worker_name,
        worker_phone: j.worker_phone,
        job_name: j.job_name,
        job_number: j.job_number,
        customer_name: j.customer_name,
        hiring_contractor: j.hiring_contractor,
        hiring_contact_name: j.hiring_contact_name,
        hiring_contact_phone: j.hiring_contact_phone,
        hiring_contact_email: j.hiring_contact_email,
        address: j.address,
        city: j.city,
        zip: j.zip,
        pm_name: j.pm_name,
        pm_phone: j.pm_phone,
        dig_tess_number: j.dig_tess_number,
        rig_name: j.rig_name,
        superintendent_name: j.superintendent_name,
        superintendent_phone: j.superintendent_phone,
        truck_number: j.truck_number,
        crane_info: j.crane_info,
        crane_required: j.crane_required,
        crew_names: j.crew_names,
      }));

      const response = await fetch("/api/send-packets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduleDate: selectedDate,
          packets,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        setPacketsStatus({ type: "success", message: "Packets emailed to Phil!" });
      } else {
        setPacketsStatus({ type: "error", message: result.message || "Failed to send packets" });
      }
    } catch (err) {
      setPacketsStatus({ type: "error", message: "Network error sending packets" });
    }

    setPacketsSending(false);
  };

  // --- Phase 7: Updated Print Cover Sheet ---
  const handlePrintCoverSheet = (assignment, overrideDetail) => {
    const job = assignment.crew_jobs || {};
    const category = assignment.crew_categories || {};
    const detail = overrideDetail || rigDetails[assignment.category_id] || {};
    const crewForJob = assignments.filter((a) => a.job_id === assignment.job_id);
    const crewNames = crewForJob
      .map((a) => formatWorkerLabel(a.crew_workers))
      .filter(Boolean)
      .join(", ");
    const operatorLabel = formatWorkerLabel(assignment.crew_workers);

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cover Sheet - ${job.job_name || "Job"}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          :root {
            --sw-blue: #0b2a5a;
            --sw-red: #dc2626;
            --sw-gray: #f8fafc;
          }
          body { font-family: Arial, sans-serif; padding: 18px; font-size: 12px; color: #0f172a; }
          .brand-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid var(--sw-blue);
            padding-bottom: 10px;
            margin-bottom: 14px;
          }
          .brand-left { display: flex; align-items: center; gap: 10px; }
          .brand-logo { width: 70px; height: 70px; object-fit: contain; }
          .brand-title { font-size: 16px; font-weight: 800; color: var(--sw-blue); letter-spacing: 0.4px; }
          .brand-sub { font-size: 10px; text-transform: uppercase; color: var(--sw-red); letter-spacing: 1px; margin-top: 2px; }
          .brand-right { text-align: right; }
          .doc-title { font-size: 14px; font-weight: 800; color: var(--sw-red); text-transform: uppercase; }
          .doc-date { font-size: 12px; color: #475569; margin-top: 2px; }
          .pm-stamp { border: 2px solid var(--sw-blue); color: var(--sw-blue); padding: 8px; width: 90px; height: 55px; text-align: center; font-size: 10px; font-weight: 700; margin-top: 8px; }
          .field-row { display: flex; gap: 16px; margin-bottom: 10px; flex-wrap: wrap; }
          .field { display: flex; align-items: baseline; gap: 4px; }
          .field label { font-weight: 700; white-space: nowrap; color: #1f2937; }
          .field-value { border-bottom: 1px solid #111827; min-width: 120px; padding: 2px 4px; }
          .field-value.wide { min-width: 220px; }
          .section-title { font-weight: 800; margin: 14px 0 6px; border-bottom: 1px solid var(--sw-blue); padding-bottom: 4px; color: var(--sw-blue); }
          .text-area { border: 1px solid #111827; min-height: 70px; padding: 8px; margin-bottom: 10px; }
          .text-area.large { min-height: 160px; }
          .equipment-lines { border: 1px solid #111827; padding: 8px; }
          .equipment-lines .line { border-bottom: 1px dashed #cbd5e1; height: 22px; margin-bottom: 4px; }
          .equipment-lines .line:last-child { border-bottom: none; margin-bottom: 0; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        <div class="brand-header">
          <div class="brand-left">
            <img class="brand-logo" src="/att.png" alt="S&W Foundation logo" />
            <div>
              <div class="brand-title">S&amp;W Foundation</div>
              <div class="brand-sub">Foundation Since 1986</div>
            </div>
          </div>
          <div class="brand-right">
            <div class="doc-title">Cover Sheet</div>
            <div class="doc-date">${formatDate(selectedDate)}</div>
            <div class="pm-stamp">PM Stamp</div>
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label>OP:</label>
            <span class="field-value">${operatorLabel || ""}</span>
          </div>
          <div class="field">
            <label>Date:</label>
            <span class="field-value">${formatDate(selectedDate)}</span>
          </div>
          <div class="field">
            <label>Job Name:</label>
            <span class="field-value wide">${job.job_name || ""}</span>
          </div>
          <div class="field">
            <label>Job #:</label>
            <span class="field-value">${job.job_number || ""}</span>
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label>Address:</label>
            <span class="field-value wide">${
              [job.address, job.city, job.zip].filter(Boolean).join(", ")
            }</span>
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label>Customer:</label>
            <span class="field-value wide">${job.customer_name || ""}</span>
          </div>
          <div class="field">
            <label>Dig Tess #:</label>
            <span class="field-value">${job.dig_tess_number || ""}</span>
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label>Hiring Contractor:</label>
            <span class="field-value wide">${job.hiring_contractor || ""}</span>
          </div>
          <div class="field">
            <label>Contact:</label>
            <span class="field-value wide">${
              [
                job.hiring_contact_name,
                job.hiring_contact_phone,
                job.hiring_contact_email,
              ]
                .filter(Boolean)
                .join(" • ")
            }</span>
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label>Rig:</label>
            <span class="field-value">${category.name || job.default_rig || ""}</span>
          </div>
          <div class="field">
            <label>Superintendent:</label>
            <span class="field-value">${detail.superintendent_name || ""}</span>
          </div>
          <div class="field">
            <label>Crane:</label>
            <span class="field-value">${detail.crane_info || (job.crane_required ? "Yes" : "")}</span>
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label>Truck Number:</label>
            <span class="field-value">${detail.truck_number || ""}</span>
          </div>
          <div class="field">
            <label>S&W PM:</label>
            <span class="field-value wide">${job.pm_name || ""}${job.pm_phone ? " - " + job.pm_phone : ""}</span>
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label>Crew onsite:</label>
            <span class="field-value wide">${crewNames}</span>
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label>Work Start:</label>
            <span class="field-value"></span>
          </div>
          <div class="field">
            <label>Lunch Start:</label>
            <span class="field-value"></span>
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label>Lunch End:</label>
            <span class="field-value"></span>
          </div>
          <div class="field">
            <label>Work End:</label>
            <span class="field-value"></span>
          </div>
        </div>

        <div class="section-title">Safety:</div>
        <div class="field-row">
          <div class="field">
            <label>Injuries:</label>
            <span class="field-value wide"></span>
          </div>
        </div>
        <div class="field-row">
          <div class="field" style="width: 100%;">
            <label>Description:</label>
            <span class="field-value" style="flex: 1;"></span>
          </div>
        </div>
        <div class="text-area"></div>

        <div class="section-title">Equipment onsite:</div>
        <div class="equipment-lines">
          <div class="line"></div>
          <div class="line"></div>
          <div class="line"></div>
          <div class="line"></div>
          <div class="line"></div>
        </div>

        <div class="section-title">Daily Summary:</div>
        <div class="text-area large"></div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // --- Phase 7: Updated Print Daily Log ---
  const handlePrintDailyLog = (assignment, overrideDetail) => {
    const job = assignment.crew_jobs || {};
    const category = assignment.crew_categories || {};
    const detail = overrideDetail || rigDetails[assignment.category_id] || {};
    const crewForJob = assignments.filter((a) => a.job_id === assignment.job_id);
    const crewNames = crewForJob
      .map((a) => formatWorkerLabel(a.crew_workers))
      .filter(Boolean)
      .join(", ");
    const operatorLabel = formatWorkerLabel(assignment.crew_workers);

    // Generate pier rows (40 rows)
    const pierRows = Array.from(
      { length: 40 },
      (_, i) => `
      <tr>
        <td></td>
        <td>${i + 1}</td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
    `
    ).join("");

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Daily Log - ${job.job_name || "Job"}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          :root {
            --sw-blue: #0b2a5a;
            --sw-red: #dc2626;
            --sw-gray: #f8fafc;
          }
          body { font-family: Arial, sans-serif; padding: 15px; font-size: 11px; color: #0f172a; }
          .brand-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid var(--sw-blue);
            padding-bottom: 8px;
            margin-bottom: 12px;
          }
          .brand-left { display: flex; align-items: center; gap: 10px; }
          .brand-logo { width: 60px; height: 60px; object-fit: contain; }
          .brand-title { font-size: 14px; font-weight: 800; color: var(--sw-blue); letter-spacing: 0.4px; }
          .brand-sub { font-size: 9px; text-transform: uppercase; color: var(--sw-red); letter-spacing: 1px; margin-top: 2px; }
          .brand-right { text-align: right; }
          .doc-title { font-size: 12px; font-weight: 800; color: var(--sw-red); text-transform: uppercase; }
          .doc-date { font-size: 11px; color: #475569; margin-top: 2px; }
          .pm-stamp { border: 2px solid var(--sw-blue); color: var(--sw-blue); padding: 6px; width: 80px; height: 48px; text-align: center; font-size: 9px; font-weight: 700; margin-top: 6px; }
          .field-row { display: flex; gap: 12px; margin-bottom: 6px; flex-wrap: wrap; }
          .field { display: flex; align-items: baseline; gap: 3px; }
          .field label { font-weight: 700; white-space: nowrap; font-size: 10px; color: #1f2937; }
          .field-value { border-bottom: 1px solid #111827; min-width: 80px; padding: 1px 3px; font-size: 10px; }
          .field-value.wide { min-width: 160px; }
          .section-title { font-weight: 800; margin: 10px 0 5px; border-bottom: 1px solid var(--sw-blue); padding-bottom: 3px; font-size: 11px; color: var(--sw-blue); }
          .text-area { border: 1px solid #111827; min-height: 55px; padding: 6px; margin-bottom: 8px; }
          .pier-table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 9px; }
          .pier-table th, .pier-table td { border: 1px solid #111827; padding: 2px 3px; text-align: center; }
          .pier-table th { background: #f8fafc; font-size: 8px; }
          .pier-table td { height: 15px; }
          .signature-line { margin-top: 16px; }
          .signature-line label { font-weight: 700; }
          .signature-value { border-bottom: 1px solid #111827; display: inline-block; width: 300px; }
          @media print {
            body { padding: 5px; }
            .pier-table { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="brand-header">
          <div class="brand-left">
            <img class="brand-logo" src="/att.png" alt="S&W Foundation logo" />
            <div>
              <div class="brand-title">S&amp;W Foundation</div>
              <div class="brand-sub">Foundation Since 1986</div>
            </div>
          </div>
          <div class="brand-right">
            <div class="doc-title">Daily Log &amp; Inspection</div>
            <div class="doc-date">${formatDate(selectedDate)}</div>
            <div class="pm-stamp">PM Stamp</div>
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label>OP:</label>
            <span class="field-value">${operatorLabel || ""}</span>
          </div>
          <div class="field">
            <label>Date:</label>
            <span class="field-value">${formatDate(selectedDate)}</span>
          </div>
          <div class="field">
            <label>Job Name:</label>
            <span class="field-value wide">${job.job_name || ""}</span>
          </div>
          <div class="field">
            <label>Job #:</label>
            <span class="field-value">${job.job_number || ""}</span>
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label>Address:</label>
            <span class="field-value wide">${
              [job.address, job.city, job.zip].filter(Boolean).join(", ")
            }</span>
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label>Customer:</label>
            <span class="field-value">${job.customer_name || ""}</span>
          </div>
          <div class="field">
            <label>Dig Tess #:</label>
            <span class="field-value">${job.dig_tess_number || ""}</span>
          </div>
          <div class="field">
            <label>Rig:</label>
            <span class="field-value">${category.name || job.default_rig || ""}</span>
          </div>
          <div class="field">
            <label>Superintendent:</label>
            <span class="field-value">${detail.superintendent_name || ""}</span>
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label>Hiring Contractor:</label>
            <span class="field-value wide">${job.hiring_contractor || ""}</span>
          </div>
          <div class="field">
            <label>Contact:</label>
            <span class="field-value wide">${
              [
                job.hiring_contact_name,
                job.hiring_contact_phone,
                job.hiring_contact_email,
              ]
                .filter(Boolean)
                .join(" • ")
            }</span>
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label>Crane:</label>
            <span class="field-value">${detail.crane_info || (job.crane_required ? "Yes" : "")}</span>
          </div>
          <div class="field">
            <label>Truck Number:</label>
            <span class="field-value">${detail.truck_number || ""}</span>
          </div>
          <div class="field">
            <label>S&W PM:</label>
            <span class="field-value">${job.pm_name || ""}${job.pm_phone ? " - " + job.pm_phone : ""}</span>
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label>Crew onsite:</label>
            <span class="field-value wide">${crewNames}</span>
          </div>
          <div class="field">
            <label>Work Start:</label>
            <span class="field-value"></span>
          </div>
          <div class="field">
            <label>Lunch Start:</label>
            <span class="field-value"></span>
          </div>
          <div class="field">
            <label>Lunch End:</label>
            <span class="field-value"></span>
          </div>
          <div class="field">
            <label>Work End:</label>
            <span class="field-value"></span>
          </div>
        </div>

        <div class="section-title">Safety:</div>
        <div class="field-row">
          <div class="field"><label>Injuries:</label><span class="field-value wide"></span></div>
          <div class="field" style="flex:1;"><label>Description:</label><span class="field-value" style="flex:1;"></span></div>
        </div>

        <div class="section-title">Equipment onsite:</div>
        <div class="text-area" style="min-height:40px;"></div>

        <div class="section-title">Daily Summary:</div>
        <div class="text-area"></div>

        <div class="section-title">Pier Log:</div>
        <table class="pier-table">
          <thead>
            <tr>
              <th>Pier ID</th>
              <th>Pier #</th>
              <th>Diameter</th>
              <th>Req. Pen</th>
              <th>Depth to<br/>Bearing</th>
              <th>Total<br/>Depth</th>
              <th>Ft. of<br/>Casing</th>
              <th>Perm or<br/>Temp?</th>
              <th>Bell Size<br/>Inches</th>
              <th>Cap<br/>Size</th>
              <th>Completed</th>
              <th>Backfilled</th>
            </tr>
          </thead>
          <tbody>
            ${pierRows}
          </tbody>
        </table>

        <div class="signature-line">
          <label>Customer Signature:</label>
          <span class="signature-value"></span>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Crew Schedule - ${formatDate(selectedDate)}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            color: #1f2937;
          }
          .brand-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
            padding-bottom: 14px;
            border-bottom: 3px solid #0b2a5a;
          }
          .brand-left { display: flex; align-items: center; gap: 10px; }
          .brand-logo { width: 60px; height: 60px; object-fit: contain; }
          .brand-name { font-size: 18px; font-weight: 800; color: #0b2a5a; letter-spacing: 0.4px; }
          .brand-sub { font-size: 11px; text-transform: uppercase; color: #dc2626; letter-spacing: 1px; margin-top: 2px; }
          .brand-right { text-align: right; }
          .doc-title { font-size: 16px; font-weight: 800; color: #dc2626; text-transform: uppercase; }
          .doc-date { font-size: 16px; color: #4b5563; margin-top: 4px; }
          .category {
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          .category-header {
            font-size: 16px;
            font-weight: 700;
            padding: 8px 12px;
            color: white;
            border-radius: 6px 6px 0 0;
          }
          .category-detail {
            padding: 6px 12px;
            background: #f9fafb;
            font-size: 13px;
            color: #4b5563;
            border-left: 1px solid #e5e7eb;
            border-right: 1px solid #e5e7eb;
          }
          .category-content {
            border: 1px solid #e5e7eb;
            border-top: none;
            border-radius: 0 0 6px 6px;
          }
          .assignment {
            padding: 10px 12px;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
          }
          .assignment:last-child { border-bottom: none; }
          .worker-name { font-weight: 600; }
          .job-name { color: #6b7280; font-size: 14px; }
          .empty {
            color: #9ca3af;
            font-style: italic;
            padding: 10px 12px;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #9ca3af;
          }
          @media print {
            body { padding: 0; }
            .brand-header { border-bottom-width: 1px; }
          }
        </style>
      </head>
      <body>
        <div class="brand-header">
          <div class="brand-left">
            <img class="brand-logo" src="/att.png" alt="S&W Foundation logo" />
            <div>
              <div class="brand-name">S&amp;W Foundation</div>
              <div class="brand-sub">Foundation Since 1986</div>
            </div>
          </div>
          <div class="brand-right">
            <div class="doc-title">Daily Crew Schedule</div>
            <div class="doc-date">${formatDate(selectedDate)}</div>
          </div>
        </div>
        ${categories
          .map((cat) => {
            const catAssignments = assignments.filter(
              (a) => a.category_id === cat.id
            );
            const crewAssignments = catAssignments.filter((assignment) => assignment.worker_id);
            const detail = rigDetails[cat.id] || {};
            const status = scheduleRigStatusByCategoryId[cat.id] || {};
            const detailLine = [
              status.isNonWorking && status.statusLabel
                ? `Status: ${status.statusLabel}`
                : "",
              detail.superintendent_name ? `Supt: ${detail.superintendent_name}` : "",
              detail.truck_number ? `Truck: ${detail.truck_number}` : "",
              detail.crane_info ? `Crane: ${detail.crane_info}` : "",
            ]
              .filter(Boolean)
              .join(" | ");

            return `
              <div class="category">
                <div class="category-header" style="background-color: ${cat.color}">
                  ${cat.name}
                </div>
                ${detailLine ? `<div class="category-detail">${detailLine}</div>` : ""}
                <div class="category-content">
                  ${
                    crewAssignments.length > 0
                          ? crewAssignments
                          .map(
                            (a) => `
                        <div class="assignment">
                          <span class="worker-name">${
                            formatWorkerLabel(a.crew_workers) || "Unassigned"
                          }</span>
                          <span class="job-name">${
                            status.isNonWorking
                              ? status.statusLabel || ""
                              : a.crew_jobs?.job_name || a.job_name || ""
                          }</span>
                        </div>
                      `
                          )
                          .join("")
                      : status.isNonWorking && status.statusLabel
                      ? `<div class="empty">${status.statusLabel}</div>`
                      : '<div class="empty">No crew assigned</div>'
                  }
                </div>
              </div>
            `;
          })
          .join("")}
        <div class="footer">
          Generated ${new Date().toLocaleString()}
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const shiftSelectedDate = (days) => {
    const base = new Date(`${selectedDate}T00:00:00`);
    if (Number.isNaN(base.getTime())) return;
    base.setDate(base.getDate() + days);
    setSelectedDate(toDateString(base));
  };

  const openScheduleForDate = (date) => {
    if (!date) return;
    setSelectedDate(date);
    setActiveTab("schedule");
  };

  // Print all forms for a category/rig
  const handlePrintAllForCategory = (categoryId) => {
    const catAssignments = assignments.filter(
      (a) => a.category_id === categoryId && a.job_id
    );
    // Get unique jobs for this category
    const uniqueJobs = [
      ...new Map(catAssignments.map((a) => [a.job_id, a])).values(),
    ];

    if (uniqueJobs.length === 0) {
      alert("No jobs assigned to this category. Assign jobs first.");
      return;
    }

    uniqueJobs.forEach((assignment) => {
      handlePrintCoverSheet(assignment);
      setTimeout(() => handlePrintDailyLog(assignment), 500);
    });
  };

  // --- Visual Board: computed assignment maps ---
  const workerAssignmentMap = useMemo(() => {
    const map = {};
    assignments.forEach((a) => {
      if (a.worker_id) {
        if (!map[a.worker_id]) map[a.worker_id] = [];
        map[a.worker_id].push(a.category_id);
      }
    });
    return map;
  }, [assignments]);

  const scheduleRigStatusByCategoryId = useMemo(() => {
    const statusMap = {};
    categories.forEach((category) => {
      const catAssignments = assignments.filter(
        (assignment) => String(assignment.category_id) === String(category.id)
      );
      const rigDayStatus = getRigDayStatusFromAssignments(catAssignments);
      const detail = rigDetails[category.id] || {};
      const rigJobAssignment = catAssignments.find((assignment) => assignment.job_id);
      const rigJob = rigJobAssignment?.crew_jobs
        || (rigJobAssignment?.job_id
          ? jobs.find((job) => String(job.id) === String(rigJobAssignment.job_id))
          : null);
      const crewAssignments = catAssignments.filter((assignment) => assignment.worker_id);
      const superName = superintendents.find(
        (superintendent) =>
          String(superintendent.id) === String(detail.superintendent_id)
      )?.name || "";
      const truckLabel = trucks.find(
        (truck) => String(truck.id) === String(detail.truck_id)
      )?.truck_number || "";

      const hasJob = !!rigJobAssignment?.job_id;
      const hasSuper = !!detail.superintendent_id;
      const hasTruck = !!detail.truck_id;
      const hasCrew = crewAssignments.length > 0;
      const missing = [];
      let completion = 0;

      if (rigDayStatus.isNonWorking) {
        const hasStatusLabel = !!rigDayStatus.statusLabel;
        if (!hasStatusLabel) missing.push("Status");
        completion = hasStatusLabel ? 100 : 0;
      } else {
        completion = Math.round(
          ((Number(hasJob) + Number(hasSuper) + Number(hasTruck) + Number(hasCrew)) / 4) *
            100
        );
        if (!hasJob) missing.push("Job");
        if (!hasSuper) missing.push("Super");
        if (!hasTruck) missing.push("Truck");
        if (!hasCrew) missing.push("Crew");
      }

      statusMap[category.id] = {
        dayType: rigDayStatus.dayType,
        dayTypeLabel: rigDayStatus.dayTypeLabel,
        isNonWorking: rigDayStatus.isNonWorking,
        statusLabel: rigDayStatus.statusLabel,
        hasJob,
        hasSuper,
        hasTruck,
        hasCrew,
        completion,
        ready: missing.length === 0,
        missing,
        jobName: rigJob?.job_name || "",
        jobNumber: rigJob?.job_number || "",
        location: [rigJob?.address, rigJob?.city, rigJob?.zip].filter(Boolean).join(", "),
        superName,
        truckLabel: truckLabel ? `#${truckLabel}` : "",
        crewNames: crewAssignments.map((assignment) => assignment?.crew_workers?.name || ""),
      };
    });
    return statusMap;
  }, [assignments, categories, jobs, rigDetails, superintendents, trucks]);

  const visibleScheduleCategories = useMemo(() => {
    const query = scheduleRigSearch.trim().toLowerCase();
    return categories.filter((category) => {
      const status = scheduleRigStatusByCategoryId[category.id];
      if (!status) return true;
      if (scheduleNeedsAttentionOnly && status.ready) return false;
      if (!query) return true;
      return [
        category.name,
        status.dayTypeLabel,
        status.statusLabel,
        status.jobName,
        status.jobNumber,
        status.location,
        status.superName,
        status.truckLabel,
        ...status.crewNames,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [
    categories,
    scheduleNeedsAttentionOnly,
    scheduleRigSearch,
    scheduleRigStatusByCategoryId,
  ]);

  const scheduleOverview = useMemo(() => {
    const statuses = Object.values(scheduleRigStatusByCategoryId);
    const totalRigs = categories.length;
    const readyRigs = statuses.filter((status) => status.ready).length;
    const workingRigs = statuses.filter((status) => !status.isNonWorking && status.hasJob).length;
    const specialStatusRigs = statuses.filter((status) => status.isNonWorking).length;
    const rigsMissingCrew = statuses.filter(
      (status) => !status.isNonWorking && !status.hasCrew
    ).length;
    const assignedWorkerIds = new Set(
      assignments.filter((assignment) => assignment.worker_id).map((assignment) => assignment.worker_id)
    );
    const unassignedWorkers = workers.filter(
      (worker) => !assignedWorkerIds.has(worker.id)
    ).length;
    return {
      totalRigs,
      readyRigs,
      workingRigs,
      specialStatusRigs,
      rigsMissingCrew,
      unassignedWorkers,
    };
  }, [assignments, categories.length, scheduleRigStatusByCategoryId, workers]);

  const getRigJobId = (categoryId) => {
    const catAssignments = assignments.filter(
      (a) => a.category_id === categoryId && a.job_id
    );
    if (catAssignments.length === 0) return null;
    return catAssignments[0].job_id;
  };

  const assignWorkerToRig = async (categoryId, workerId) => {
    if (!currentSchedule || !workerId) return;
    const alreadyOnRig = assignments.some(
      (a) =>
        String(a.category_id) === String(categoryId) &&
        String(a.worker_id) === String(workerId)
    );
    if (alreadyOnRig) return;

    const assignedElsewhere = assignments.some(
      (a) =>
        String(a.worker_id) === String(workerId) &&
        String(a.category_id) !== String(categoryId)
    );
    if (assignedElsewhere) return;

    setSaving(true);
    const catAssignments = assignments.filter(
      (assignment) => String(assignment.category_id) === String(categoryId)
    );
    const rigDayStatus = getRigDayStatusFromAssignments(catAssignments);
    const rigJob = getRigJobId(categoryId);
    const job = rigJob
      ? jobs.find((j) => String(j.id) === String(rigJob))
      : null;
    const { error } = await supabase.from("crew_assignments").insert({
      schedule_id: currentSchedule.id,
      category_id: categoryId,
      worker_id: workerId,
      job_id: rigDayStatus.isNonWorking ? null : rigJob || null,
      job_name: rigDayStatus.isNonWorking
        ? rigDayStatus.statusLabel
        : job?.job_name || "",
    });
    if (!error) fetchSchedule(selectedDate);
    setSaving(false);
  };

  const setRigWorkerDraft = (categoryId, workerId) => {
    setRigWorkerDrafts((prev) => ({
      ...prev,
      [categoryId]: workerId,
    }));
  };

  const addDraftWorkerToRig = async (categoryId) => {
    const workerId = rigWorkerDrafts[categoryId];
    if (!workerId) return;
    await assignWorkerToRig(categoryId, workerId);
    setRigWorkerDraft(categoryId, "");
  };

  const applyRigDayStatus = async (categoryId, dayType, labelOverride) => {
    if (!currentSchedule) return;

    const nextDayType = dayType || "working";
    const nextLabel = resolveRigDayStatusLabel(nextDayType, labelOverride);
    const catAssignments = assignments.filter(
      (assignment) => String(assignment.category_id) === String(categoryId)
    );
    const statusAssignments = catAssignments.filter(isRigStatusAssignment);
    const workingAssignments = catAssignments.filter(
      (assignment) => !isRigStatusAssignment(assignment)
    );

    setSaving(true);

    if (nextDayType === "working") {
      await Promise.all(
        workingAssignments.map((assignment) =>
          supabase
            .from("crew_assignments")
            .update({ job_id: null, job_name: "" })
            .eq("id", assignment.id)
        )
      );

      if (statusAssignments.length > 0) {
        await Promise.all(
          statusAssignments.map((assignment) =>
            supabase.from("crew_assignments").delete().eq("id", assignment.id)
          )
        );
      }

      await fetchSchedule(selectedDate);
      setSaving(false);
      return;
    }

    await Promise.all(
      workingAssignments.map((assignment) =>
        supabase
          .from("crew_assignments")
          .update({ job_id: null, job_name: nextLabel })
          .eq("id", assignment.id)
      )
    );

    if (statusAssignments.length === 0) {
      await supabase.from("crew_assignments").insert({
        schedule_id: currentSchedule.id,
        category_id: categoryId,
        worker_id: null,
        job_id: null,
        job_name: nextLabel,
        notes: buildRigDayTypeNote(nextDayType),
      });
    } else {
      const [firstStatusAssignment, ...extraStatusAssignments] = statusAssignments;
      await supabase
        .from("crew_assignments")
        .update({
          job_id: null,
          job_name: nextLabel,
          notes: buildRigDayTypeNote(nextDayType),
        })
        .eq("id", firstStatusAssignment.id);

      if (extraStatusAssignments.length > 0) {
        await Promise.all(
          extraStatusAssignments.map((assignment) =>
            supabase.from("crew_assignments").delete().eq("id", assignment.id)
          )
        );
      }
    }

    await fetchSchedule(selectedDate);
    setSaving(false);
  };

  const assignJobToRig = async (categoryId, jobId) => {
    if (!currentSchedule) return;
    setSaving(true);
    const job = jobs.find((j) => String(j.id) === String(jobId));
    const catAssignments = assignments.filter(
      (a) => a.category_id === categoryId
    );
    const workingAssignments = catAssignments.filter(
      (assignment) => !isRigStatusAssignment(assignment)
    );
    const statusAssignments = catAssignments.filter(isRigStatusAssignment);

    if (statusAssignments.length > 0) {
      await Promise.all(
        statusAssignments.map((assignment) =>
          supabase.from("crew_assignments").delete().eq("id", assignment.id)
        )
      );
    }

    if (workingAssignments.length === 0) {
      await supabase.from("crew_assignments").insert({
        schedule_id: currentSchedule.id,
        category_id: categoryId,
        worker_id: null,
        job_id: jobId,
        job_name: job?.job_name || "",
      });
    } else {
      for (const a of workingAssignments) {
        await supabase
          .from("crew_assignments")
          .update({ job_id: jobId, job_name: job?.job_name || "" })
          .eq("id", a.id);
      }
    }
    fetchSchedule(selectedDate);
    setSaving(false);
  };

  const removeJobFromRig = async (categoryId) => {
    if (!currentSchedule) return;
    const catAssignments = assignments.filter(
      (a) => a.category_id === categoryId
    );
    for (const a of catAssignments.filter((assignment) => !isRigStatusAssignment(assignment))) {
      await supabase
        .from("crew_assignments")
        .update({ job_id: null, job_name: "" })
        .eq("id", a.id);
    }
    fetchSchedule(selectedDate);
  };

  const getJobProgress = (jobId) => jobProgressByJobId[jobId] || null;

  const getProgressPercent = (progress) => {
    const done = Number(progress?.holes_completed);
    const total = Number(progress?.holes_target);
    if (!Number.isFinite(done) || !Number.isFinite(total) || total <= 0) return null;
    return Math.max(0, Math.min(100, Math.round((done / total) * 100)));
  };

  const getProgressStatusLabel = (status) =>
    JOB_PROGRESS_STATUS_LABELS[status] || "Planned";

  const formatProgressDateRange = (progress) => {
    if (!progress?.estimated_start_date && !progress?.estimated_end_date) return "";
    const start = progress.estimated_start_date
      ? formatShortDate(progress.estimated_start_date)
      : "TBD";
    const end = progress.estimated_end_date
      ? formatShortDate(progress.estimated_end_date)
      : "TBD";
    return `${start} - ${end}`;
  };

  const buildProgressDraft = (jobId) => {
    const existing = getJobProgress(jobId) || {};
    return {
      status: existing.status || "planned",
      holes_completed:
        existing.holes_completed === null || existing.holes_completed === undefined
          ? ""
          : String(existing.holes_completed),
      holes_target:
        existing.holes_target === null || existing.holes_target === undefined
          ? ""
          : String(existing.holes_target),
      estimated_start_date: existing.estimated_start_date || "",
      estimated_end_date: existing.estimated_end_date || "",
      notes: existing.notes || "",
    };
  };

  const startEditingProgress = (jobId) => {
    if (!jobProgressAvailable) return;
    setEditingProgressJobId(jobId);
    setEditingProgress(buildProgressDraft(jobId));
    setJobProgressStatus(null);
  };

  const cancelEditingProgress = () => {
    setEditingProgressJobId(null);
    setEditingProgress(null);
  };

  const saveJobProgress = async (jobId) => {
    if (!jobProgressAvailable || !editingProgress || !jobId) return;

    const holesCompleted = toNonNegativeInteger(editingProgress.holes_completed);
    const holesTarget = toNonNegativeInteger(editingProgress.holes_target);
    const cleanStatus = JOB_PROGRESS_STATUS_LABELS[editingProgress.status]
      ? editingProgress.status
      : "planned";
    const payload = {
      job_id: jobId,
      status: cleanStatus,
      holes_completed: holesCompleted,
      holes_target: holesTarget,
      estimated_start_date: editingProgress.estimated_start_date || null,
      estimated_end_date: editingProgress.estimated_end_date || null,
      notes: editingProgress.notes?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    setSavingProgress(true);
    setJobProgressStatus(null);
    const { error } = await supabase
      .from("crew_job_progress")
      .upsert(payload, { onConflict: "job_id" });

    if (error) {
      setSavingProgress(false);
      setJobProgressStatus({
        type: "error",
        message: "Unable to save job progress right now.",
      });
      return;
    }

    await supabase.from("crew_job_progress_updates").insert({
      ...payload,
      update_date: toDateString(new Date()),
    });

    await fetchJobProgress();
    setSavingProgress(false);
    cancelEditingProgress();
    setJobProgressStatus({
      type: "success",
      message: "Job progress saved.",
    });
  };

  const historyEntityOptions = useMemo(() => {
    if (historyView === "rig") {
      return [
        { id: "all", label: "All Rigs" },
        ...categories.map((category) => ({
          id: category.id,
          label: category.name,
        })),
      ];
    }
    if (historyView === "crew") {
      return workers.map((worker) => ({
        id: worker.id,
        label: formatWorkerOption(worker),
      }));
    }
    return jobs.map((job) => ({
      id: job.id,
      label: job.job_number ? `${job.job_name} (#${job.job_number})` : job.job_name,
    }));
  }, [historyView, categories, workers, jobs]);

  useEffect(() => {
    if (historyEntityOptions.length === 0) {
      setHistoryEntityId("");
      return;
    }
    const exists = historyEntityOptions.some(
      (option) => String(option.id) === String(historyEntityId)
    );
    if (!exists) setHistoryEntityId(historyEntityOptions[0].id);
  }, [historyEntityOptions, historyEntityId]);

  useEffect(() => {
    if (activeTab !== "history") return undefined;
    const monthBounds = getMonthBounds(historyMonth);
    if (!monthBounds || !historyEntityId) {
      setHistoryAssignments([]);
      return undefined;
    }

    let isActive = true;
    const fetchHistoryAssignments = async () => {
      setHistoryLoading(true);
      setHistoryError(null);

      let query = supabase
        .from("crew_assignments")
        .select(
          "id, category_id, worker_id, job_id, job_name, notes, crew_schedules!inner(schedule_date, is_finalized), crew_workers(name, role), crew_categories(name, color), crew_jobs(job_name, job_number)"
        )
        .gte("crew_schedules.schedule_date", monthBounds.start)
        .lte("crew_schedules.schedule_date", monthBounds.end)
        .order("schedule_id", { ascending: true })
        .order("sort_order", { ascending: true });

      if (historyView === "rig" && historyEntityId !== "all") {
        query = query.eq("category_id", historyEntityId);
      } else if (historyView === "crew") {
        query = query.eq("worker_id", historyEntityId);
      } else if (historyView === "job") {
        query = query.eq("job_id", historyEntityId);
      }

      const { data, error } = await query;
      if (!isActive) return;

      if (error) {
        setHistoryAssignments([]);
        setHistoryError("Could not load history for that view.");
        setHistoryLoading(false);
        return;
      }

      const statusByDateRig = {};
      (data || []).forEach((row) => {
        const date = row.crew_schedules?.schedule_date || "";
        const rig = row.crew_categories?.name || "";
        if (!date || !rig) return;
        const key = `${date}::${rig}`;
        if (!statusByDateRig[key]) statusByDateRig[key] = [];
        statusByDateRig[key].push(row);
      });

      const normalized = (data || []).map((row) => {
        const date = row.crew_schedules?.schedule_date || "";
        const rig = row.crew_categories?.name || "";
        const rigDayStatus = getRigDayStatusFromAssignments(
          statusByDateRig[`${date}::${rig}`] || []
        );
        const isStatusPlaceholder = isRigStatusAssignment(row);

        return {
          id: row.id,
          date,
          finalized: !!row.crew_schedules?.is_finalized,
          worker: formatWorkerLabel(row.crew_workers),
          rig,
          rigColor: row.crew_categories?.color || "#6b7280",
          job:
            !rigDayStatus.isNonWorking && !isStatusPlaceholder
              ? row.crew_jobs?.job_name || row.job_name || ""
              : "",
          jobNumber: row.crew_jobs?.job_number || "",
          notes: row.notes || "",
          statusLabel: rigDayStatus.isNonWorking ? rigDayStatus.statusLabel : "",
          dayType: rigDayStatus.dayType,
          isNonWorking: rigDayStatus.isNonWorking,
          isStatusPlaceholder,
        };
      });
      setHistoryAssignments(normalized);
      setHistoryLoading(false);
    };

    fetchHistoryAssignments();
    return () => {
      isActive = false;
    };
  }, [activeTab, historyView, historyEntityId, historyMonth]);

  const historyFilteredAssignments = useMemo(() => {
    const query = historySearch.trim().toLowerCase();
    return historyAssignments.filter((entry) => {
      if (historyFinalizedOnly && !entry.finalized) return false;
      if (!query) return true;
      return [
        entry.date,
        entry.worker,
        entry.rig,
        entry.job,
        entry.statusLabel,
        entry.dayType,
        entry.jobNumber,
        entry.notes,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [historyAssignments, historyFinalizedOnly, historySearch]);

  const historyAssignmentsByDate = useMemo(() => {
    const map = {};
    historyFilteredAssignments.forEach((entry) => {
      if (!entry.date) return;
      if (!map[entry.date]) map[entry.date] = [];
      map[entry.date].push(entry);
    });
    return map;
  }, [historyFilteredAssignments]);

  const showAllRigsHistory = historyView === "rig" && historyEntityId === "all";

  const historyRigBoardsByDate = useMemo(() => {
    if (!showAllRigsHistory) return {};

    const boardsByDate = {};
    Object.entries(historyAssignmentsByDate).forEach(([date, entries]) => {
      const rigMap = new Map();

      entries.forEach((entry) => {
        const rigName = entry.rig || "No rig";
        if (!rigMap.has(rigName)) {
          rigMap.set(rigName, {
            id: `${date}-${rigName}`,
            rig: rigName,
            rigColor: entry.rigColor || "#6b7280",
            workers: new Set(),
            jobs: new Set(),
            notes: new Set(),
            statusLabel: "",
            finalized: false,
          });
        }

        const rig = rigMap.get(rigName);
        rig.finalized = rig.finalized || entry.finalized;
        if (!rig.statusLabel && entry.statusLabel) {
          rig.statusLabel = entry.statusLabel;
        }
        if (entry.worker) rig.workers.add(entry.worker);
        if (entry.job) {
          rig.jobs.add(entry.jobNumber ? `${entry.job} #${entry.jobNumber}` : entry.job);
        }
        if (entry.notes && !String(entry.notes).startsWith(RIG_STATUS_NOTE_PREFIX)) {
          rig.notes.add(entry.notes);
        }
      });

      boardsByDate[date] = Array.from(rigMap.values())
        .map((rig) => ({
          ...rig,
          workers: Array.from(rig.workers),
          jobs: Array.from(rig.jobs),
          notes: Array.from(rig.notes),
        }))
        .sort((a, b) => a.rig.localeCompare(b.rig));
    });

    return boardsByDate;
  }, [historyAssignmentsByDate, showAllRigsHistory]);

  const historyCalendarCells = useMemo(() => {
    const monthBounds = getMonthBounds(historyMonth);
    if (!monthBounds) return [];
    const cells = [];
    for (let i = 0; i < monthBounds.firstWeekday; i += 1) {
      cells.push(null);
    }
    for (let day = 1; day <= monthBounds.lastDay; day += 1) {
      const date = `${historyMonth}-${String(day).padStart(2, "0")}`;
      cells.push({
        date,
        day,
        entries: showAllRigsHistory
          ? historyRigBoardsByDate[date] || []
          : historyAssignmentsByDate[date] || [],
      });
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [historyMonth, historyAssignmentsByDate, historyRigBoardsByDate, showAllRigsHistory]);

  useEffect(() => {
    const dayKeys = Object.keys(
      showAllRigsHistory ? historyRigBoardsByDate : historyAssignmentsByDate
    ).sort();
    const fallbackDate = `${historyMonth}-01`;
    if (dayKeys.length === 0) {
      if (historySelectedDate !== fallbackDate) setHistorySelectedDate(fallbackDate);
      return;
    }
    const hasSelectedDate =
      !!historySelectedDate &&
      historySelectedDate.startsWith(historyMonth) &&
      !!(showAllRigsHistory
        ? historyRigBoardsByDate[historySelectedDate]
        : historyAssignmentsByDate[historySelectedDate]);
    if (!hasSelectedDate) setHistorySelectedDate(dayKeys[0]);
  }, [
    historyAssignmentsByDate,
    historyMonth,
    historyRigBoardsByDate,
    historySelectedDate,
    showAllRigsHistory,
  ]);

  const selectedHistoryAssignments = useMemo(
    () => historyAssignmentsByDate[historySelectedDate] || [],
    [historyAssignmentsByDate, historySelectedDate]
  );

  const selectedHistoryRigBoards = useMemo(
    () => historyRigBoardsByDate[historySelectedDate] || [],
    [historyRigBoardsByDate, historySelectedDate]
  );

  const historySummary = useMemo(() => {
    const uniqueJobs = new Set();
    const uniqueWorkers = new Set();
    const uniqueRigs = new Set();
    historyFilteredAssignments.forEach((entry) => {
      if (entry.job) uniqueJobs.add(entry.job);
      if (entry.statusLabel) uniqueJobs.add(entry.statusLabel);
      if (entry.worker) uniqueWorkers.add(entry.worker);
      if (entry.rig) uniqueRigs.add(entry.rig);
    });
    return {
      days: Object.keys(historyAssignmentsByDate).length,
      assignments: showAllRigsHistory
        ? Object.values(historyRigBoardsByDate).reduce(
            (total, dayBoards) => total + dayBoards.length,
            0
          )
        : historyFilteredAssignments.length,
      uniqueJobs: uniqueJobs.size,
      uniqueWorkers: uniqueWorkers.size,
      uniqueRigs: uniqueRigs.size,
    };
  }, [
    historyAssignmentsByDate,
    historyFilteredAssignments,
    historyRigBoardsByDate,
    showAllRigsHistory,
  ]);

  const getHistoryEntryHeadline = (entry) => {
    if (showAllRigsHistory) {
      return entry.statusLabel ? `${entry.rig} -> ${entry.statusLabel}` : entry.rig;
    }
    const targetLabel = entry.statusLabel || entry.job || "No job";
    if (entry.isStatusPlaceholder && entry.statusLabel) {
      return `Status: ${entry.statusLabel}`;
    }
    if (historyView === "rig") {
      return `${entry.worker || "Unassigned"} -> ${targetLabel}`;
    }
    if (historyView === "crew") {
      return `${entry.rig || "No rig"} -> ${targetLabel}`;
    }
    return `${entry.rig || "No rig"} -> ${entry.worker || "Unassigned"}`;
  };

  const getHistoryEntrySubline = (entry) => {
    if (showAllRigsHistory) {
      const parts = [];
      if (entry.jobs?.length) parts.push(`Jobs: ${entry.jobs.join(", ")}`);
      if (entry.workers?.length) parts.push(`Crew: ${entry.workers.join(", ")}`);
      if (entry.notes?.length) parts.push(`Notes: ${entry.notes.slice(0, 2).join(" / ")}`);
      if (entry.finalized) parts.push("Finalized");
      return parts.join(" • ");
    }

    const parts = [];
    if (entry.jobNumber) parts.push(`#${entry.jobNumber}`);
    if (entry.isNonWorking && entry.dayType !== "custom") {
      parts.push(RIG_DAY_TYPE_LABELS[entry.dayType] || "Special Status");
    }
    if (entry.notes && !String(entry.notes).startsWith(RIG_STATUS_NOTE_PREFIX)) {
      parts.push(entry.notes);
    }
    if (entry.finalized) parts.push("Finalized");
    return parts.join(" • ");
  };

  const selectedHistoryEntityLabel =
    historyEntityOptions.find((option) => String(option.id) === String(historyEntityId))
      ?.label || "";

  useEffect(() => {
    if (activeTab !== "planner") return undefined;
    const monthBounds = getMonthBounds(plannerMonth);
    if (!monthBounds) {
      setPlannerSchedules([]);
      setPlannerAssignments([]);
      setPlannerRigDetails([]);
      return undefined;
    }

    let isActive = true;
    const fetchPlannerMonth = async () => {
      setPlannerLoading(true);
      setPlannerError(null);

      const { data: schedulesData, error: schedulesError } = await supabase
        .from("crew_schedules")
        .select("id, schedule_date, is_finalized, finalized_at")
        .gte("schedule_date", monthBounds.start)
        .lte("schedule_date", monthBounds.end)
        .order("schedule_date", { ascending: true });

      if (!isActive) return;
      if (schedulesError) {
        setPlannerSchedules([]);
        setPlannerAssignments([]);
        setPlannerRigDetails([]);
        setPlannerError("Could not load planner data for this month.");
        setPlannerLoading(false);
        return;
      }

      const schedulesList = schedulesData || [];
      setPlannerSchedules(schedulesList);
      if (schedulesList.length === 0) {
        setPlannerAssignments([]);
        setPlannerRigDetails([]);
        setPlannerLoading(false);
        return;
      }

      const scheduleIds = schedulesList.map((schedule) => schedule.id);
      const [{ data: assignmentData, error: assignmentError }, { data: detailData, error: detailError }] =
        await Promise.all([
          supabase
            .from("crew_assignments")
            .select(
              "id, schedule_id, category_id, worker_id, job_id, job_name, notes, sort_order, crew_workers(name, role), crew_categories(name, color), crew_jobs(job_name, job_number)"
            )
            .in("schedule_id", scheduleIds)
            .order("sort_order", { ascending: true }),
          supabase
            .from("schedule_rig_details")
            .select(
              "id, schedule_id, category_id, notes, crane_info, crew_categories(name, color), crew_superintendents(name), crew_trucks(truck_number)"
            )
            .in("schedule_id", scheduleIds),
        ]);

      if (!isActive) return;
      if (assignmentError || detailError) {
        setPlannerAssignments([]);
        setPlannerRigDetails([]);
        setPlannerError("Could not load planner assignments.");
        setPlannerLoading(false);
        return;
      }

      setPlannerAssignments(assignmentData || []);
      setPlannerRigDetails(detailData || []);
      setPlannerLoading(false);
    };

    fetchPlannerMonth();
    return () => {
      isActive = false;
    };
  }, [activeTab, plannerMonth]);

  const plannerScheduleById = useMemo(() => {
    const map = {};
    plannerSchedules.forEach((schedule) => {
      map[schedule.id] = schedule;
    });
    return map;
  }, [plannerSchedules]);

  const plannerRigStatusByDateRig = useMemo(() => {
    const grouped = {};
    plannerAssignments.forEach((row) => {
      const schedule = plannerScheduleById[row.schedule_id];
      const date = schedule?.schedule_date || "";
      const rig = row.crew_categories?.name || "";
      if (!date || !rig) return;
      const key = `${date}::${rig}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(row);
    });

    const statusMap = {};
    Object.entries(grouped).forEach(([key, rows]) => {
      statusMap[key] = getRigDayStatusFromAssignments(rows);
    });
    return statusMap;
  }, [plannerAssignments, plannerScheduleById]);

  const plannerAssignmentRows = useMemo(
    () =>
      plannerAssignments
        .map((row) => {
          const schedule = plannerScheduleById[row.schedule_id];
          if (!schedule?.schedule_date) return null;
          const rig = row.crew_categories?.name || "";
          const rigDayStatus =
            plannerRigStatusByDateRig[`${schedule.schedule_date}::${rig}`] ||
            getRigDayStatusFromAssignments([row]);
          const isStatusPlaceholder = isRigStatusAssignment(row);
          return {
            id: row.id,
            date: schedule.schedule_date,
            finalized: !!schedule.is_finalized,
            workerId: row.worker_id,
            worker: formatWorkerLabel(row.crew_workers) || "",
            rig,
            rigColor: row.crew_categories?.color || "#6b7280",
            job:
              !rigDayStatus.isNonWorking && !isStatusPlaceholder
                ? row.crew_jobs?.job_name || row.job_name || ""
                : "",
            jobNumber: row.crew_jobs?.job_number || "",
            notes: row.notes || "",
            statusLabel: rigDayStatus.isNonWorking ? rigDayStatus.statusLabel : "",
            dayType: rigDayStatus.dayType,
            isStatusPlaceholder,
          };
        })
        .filter(Boolean),
    [plannerAssignments, plannerRigStatusByDateRig, plannerScheduleById]
  );

  const plannerRigDetailRows = useMemo(
    () =>
      plannerRigDetails
        .map((row) => {
          const schedule = plannerScheduleById[row.schedule_id];
          if (!schedule?.schedule_date) return null;
          return {
            id: row.id,
            date: schedule.schedule_date,
            finalized: !!schedule.is_finalized,
            rig: row.crew_categories?.name || "",
            rigColor: row.crew_categories?.color || "#6b7280",
            superintendent: row.crew_superintendents?.name || "",
            truck: row.crew_trucks?.truck_number || "",
            crane: row.crane_info || "",
            notes: row.notes || "",
          };
        })
        .filter(Boolean),
    [plannerRigDetails, plannerScheduleById]
  );

  const plannerDayMap = useMemo(() => {
    const query = plannerSearch.trim().toLowerCase();
    const map = {};

    plannerSchedules.forEach((schedule) => {
      if (plannerFinalizedOnly && !schedule.is_finalized) return;
      map[schedule.schedule_date] = {
        date: schedule.schedule_date,
        finalized: !!schedule.is_finalized,
        rigs: new Map(),
      };
    });

    plannerAssignmentRows.forEach((entry) => {
      if (!entry.date) return;
      if (plannerFinalizedOnly && !entry.finalized) return;

      const haystack = [
        entry.worker,
        entry.rig,
        entry.job,
        entry.statusLabel,
        entry.dayType,
        entry.jobNumber,
        entry.notes,
      ]
        .join(" ")
        .toLowerCase();
      if (query && !haystack.includes(query)) return;

      if (!map[entry.date]) {
        map[entry.date] = {
          date: entry.date,
          finalized: !!entry.finalized,
          rigs: new Map(),
        };
      }
      const day = map[entry.date];
      const rigName = entry.rig || "Unassigned Rig";
      if (!day.rigs.has(rigName)) {
        day.rigs.set(rigName, {
          name: rigName,
          color: entry.rigColor || "#6b7280",
          workers: new Set(),
          jobs: new Set(),
          notes: new Set(),
          superintendent: "",
          truck: "",
          crane: "",
          statusLabel: "",
          dayType: "working",
        });
      }
      const rig = day.rigs.get(rigName);
      if (entry.statusLabel) {
        rig.statusLabel = entry.statusLabel;
        rig.dayType = entry.dayType;
      }
      if (entry.isStatusPlaceholder) {
        return;
      }
      if (entry.worker) rig.workers.add(entry.worker);
      if (entry.job) {
        rig.jobs.add(entry.jobNumber ? `${entry.job} #${entry.jobNumber}` : entry.job);
      }
      if (entry.notes) rig.notes.add(entry.notes);
    });

    plannerRigDetailRows.forEach((detail) => {
      if (!detail.date) return;
      if (plannerFinalizedOnly && !detail.finalized) return;

      const haystack = [
        detail.rig,
        detail.superintendent,
        detail.truck,
        detail.crane,
        detail.notes,
      ]
        .join(" ")
        .toLowerCase();
      if (query && !haystack.includes(query)) return;

      if (!map[detail.date]) {
        map[detail.date] = {
          date: detail.date,
          finalized: !!detail.finalized,
          rigs: new Map(),
        };
      }

      const day = map[detail.date];
      const rigName = detail.rig || "Unassigned Rig";
      if (!day.rigs.has(rigName)) {
        day.rigs.set(rigName, {
          name: rigName,
          color: detail.rigColor || "#6b7280",
          workers: new Set(),
          jobs: new Set(),
          notes: new Set(),
          superintendent: "",
          truck: "",
          crane: "",
          statusLabel:
            plannerRigStatusByDateRig[`${detail.date}::${rigName}`]?.statusLabel || "",
          dayType:
            plannerRigStatusByDateRig[`${detail.date}::${rigName}`]?.dayType || "working",
        });
      }
      const rig = day.rigs.get(rigName);
      if (detail.superintendent) rig.superintendent = detail.superintendent;
      if (detail.truck) rig.truck = detail.truck;
      if (detail.crane) rig.crane = detail.crane;
      if (detail.notes) rig.notes.add(detail.notes);
    });

    return map;
  }, [
    plannerAssignmentRows,
    plannerFinalizedOnly,
    plannerRigDetailRows,
    plannerRigStatusByDateRig,
    plannerSchedules,
    plannerSearch,
  ]);

  const plannerCalendarCells = useMemo(() => {
    const monthBounds = getMonthBounds(plannerMonth);
    if (!monthBounds) return [];
    const cells = [];
    for (let i = 0; i < monthBounds.firstWeekday; i += 1) {
      cells.push(null);
    }
    for (let day = 1; day <= monthBounds.lastDay; day += 1) {
      const date = `${plannerMonth}-${String(day).padStart(2, "0")}`;
      cells.push({
        date,
        day,
        dayData: plannerDayMap[date] || null,
      });
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [plannerDayMap, plannerMonth]);

  useEffect(() => {
    const dates = Object.keys(plannerDayMap).sort();
    const fallbackDate = `${plannerMonth}-01`;
    if (dates.length === 0) {
      if (plannerSelectedDate !== fallbackDate) setPlannerSelectedDate(fallbackDate);
      return;
    }
    const selectedIsValid =
      !!plannerSelectedDate &&
      plannerSelectedDate.startsWith(plannerMonth) &&
      !!plannerDayMap[plannerSelectedDate];
    if (!selectedIsValid) setPlannerSelectedDate(dates[0]);
  }, [plannerDayMap, plannerMonth, plannerSelectedDate]);

  const selectedPlannerDay = plannerDayMap[plannerSelectedDate] || null;

  const selectedPlannerRigs = useMemo(() => {
    if (!selectedPlannerDay) return [];
    return Array.from(selectedPlannerDay.rigs.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [selectedPlannerDay]);

  const plannerSummary = useMemo(() => {
    const days = Object.keys(plannerDayMap).length;
    const rigs = new Set();
    let workers = 0;
    let jobsCount = 0;
    Object.values(plannerDayMap).forEach((day) => {
      day.rigs.forEach((rig) => {
        rigs.add(rig.name);
        workers += rig.workers.size;
        jobsCount += rig.jobs.size;
      });
    });
    return {
      days,
      rigs: rigs.size,
      workers,
      jobs: jobsCount,
    };
  }, [plannerDayMap]);

  const plannerPatternSummary = useMemo(() => {
    const crewByDayRig = new Map();
    const workerRigCounts = new Map();

    plannerAssignmentRows.forEach((entry) => {
      if (!entry.worker) return;
      if (plannerFinalizedOnly && !entry.finalized) return;

      const rigName = entry.rig || "Unassigned Rig";
      const dayRigKey = `${entry.date}::${rigName}`;
      if (!crewByDayRig.has(dayRigKey)) crewByDayRig.set(dayRigKey, new Set());
      crewByDayRig.get(dayRigKey).add(entry.worker);

      const workerRigKey = `${entry.worker}::${rigName}`;
      workerRigCounts.set(workerRigKey, (workerRigCounts.get(workerRigKey) || 0) + 1);
    });

    const pairCounts = new Map();
    crewByDayRig.forEach((workersSet) => {
      const workersForRig = Array.from(workersSet).sort();
      for (let i = 0; i < workersForRig.length; i += 1) {
        for (let j = i + 1; j < workersForRig.length; j += 1) {
          const pairKey = `${workersForRig[i]} + ${workersForRig[j]}`;
          pairCounts.set(pairKey, (pairCounts.get(pairKey) || 0) + 1);
        }
      }
    });

    const topPairs = Array.from(pairCounts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topWorkerRigs = Array.from(workerRigCounts.entries())
      .map(([label, count]) => {
        const [worker, rig] = label.split("::");
        return { worker, rig, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { topPairs, topWorkerRigs };
  }, [plannerAssignmentRows, plannerFinalizedOnly]);

  const todayScheduleDate = getTodayScheduleDate();
  const tomorrowScheduleDate = getTomorrowScheduleDate();
  const previousScheduleDate = shiftDateString(selectedDate, -1);
  const isPlanningTomorrow = selectedDate === tomorrowScheduleDate;
  const copyForwardLabel = isPlanningTomorrow
    ? "Start Tomorrow From Today"
    : `Copy ${formatShortDate(previousScheduleDate)} -> ${formatShortDate(selectedDate)}`;

  // --- View definitions ---
  const tabs = [
    { id: "schedule", label: "Schedule" },
    { id: "planner", label: "Live Planner" },
    { id: "packets", label: "Daily Packets" },
    { id: "history", label: "Calendar History" },
  ];

  if (loading) {
    return (
      <>
        <Head>
          <title>Crew Scheduler | Admin</title>
          <meta name="robots" content="noindex" />
        </Head>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-red-600"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Crew Scheduler | Admin</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div style={{ height: "calc(100vh - 64px)" }} className="flex flex-col overflow-hidden">
        {/* ===== TOP BAR ===== */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-2">
          <div className="flex items-center gap-3">
            <img src="/att.png" alt="S&W Foundation logo" className="h-10 w-10 object-contain" />
            <h1 className={`${lato.className} text-xl font-extrabold text-[#0b2a5a]`}>
              Crew Scheduler
            </h1>
            {currentSchedule?.is_finalized && (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                Finalized
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-9 items-center rounded-lg border border-neutral-300 bg-white shadow-sm">
              <button
                onClick={() => shiftSelectedDate(-1)}
                className="flex h-9 items-center rounded-l-lg px-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50"
                title="Previous day"
              >
                ◀
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-9 w-[150px] bg-transparent px-2 text-sm focus:outline-none"
              />
              <button
                onClick={() => shiftSelectedDate(1)}
                className="flex h-9 items-center rounded-r-lg px-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50"
                title="Next day"
              >
                ▶
              </button>
            </div>
            <button
              onClick={() => setSelectedDate(todayScheduleDate)}
              className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              Today
            </button>
            <button
              onClick={() => setSelectedDate(tomorrowScheduleDate)}
              className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              Tomorrow
            </button>
            <button
              onClick={handleCopyPreviousDayToSelectedDay}
              disabled={copyingDaySchedule}
              className="h-9 rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
            >
              {copyingDaySchedule ? "Copying..." : copyForwardLabel}
            </button>
            <button
              onClick={handlePrint}
              className="h-9 rounded-lg bg-neutral-600 px-4 text-sm font-semibold text-white hover:bg-neutral-700 transition-colors"
            >
              Schedule PDF
            </button>
            <button
              onClick={() => {
                const jobAssignments = assignments.filter((a) => a.job_id);
                const uniqueJobs = [
                  ...new Map(jobAssignments.map((a) => [a.job_id, a])).values(),
                ];
                if (uniqueJobs.length === 0) {
                  alert("No jobs assigned. Select jobs in the schedule first.");
                  return;
                }
                if (
                  confirm(
                    `Print Cover Sheets and Daily Logs for ${uniqueJobs.length} job(s)?`
                  )
                ) {
                  uniqueJobs.forEach((assignment, i) => {
                    setTimeout(() => handlePrintCoverSheet(assignment), i * 600);
                    setTimeout(() => handlePrintDailyLog(assignment), i * 600 + 300);
                  });
                }
              }}
              className="h-9 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
            >
              Print Forms
            </button>
            <button
              onClick={handleSaveAndEmail}
              disabled={emailSending}
              className="h-9 rounded-lg bg-[#0b2a5a] px-4 text-sm font-semibold text-white hover:bg-[#0a2350] disabled:opacity-50 transition-colors"
            >
              {emailSending
                ? "Sending..."
                : currentSchedule?.is_finalized
                ? "Resend Schedule"
                : "Save & Email"}
            </button>
            <button
              onClick={() => {
                setShowManagePanel(true);
                setManagePanelTab("jobs");
              }}
              className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              Job Intake
            </button>
            <button
              onClick={() => setShowManagePanel(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
              title="Manage Resources"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Status messages */}
        {emailStatus && (
          <div
            className={`mx-4 mt-2 rounded-lg px-4 py-2 text-sm font-medium ${
              emailStatus.type === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {emailStatus.message}
            <button onClick={() => setEmailStatus(null)} className="ml-2 font-bold">x</button>
          </div>
        )}
        {currentSchedule?.is_finalized && activeTab === "schedule" && (
          <div className="mx-4 mt-2 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-700">
            Finalized{currentSchedule?.finalized_at ? ` on ${formatDateTime(currentSchedule.finalized_at)}` : ""}. You can still edit and resend.
          </div>
        )}

        {/* Tab bar */}
        <div className="flex gap-1 border-b border-neutral-200 bg-neutral-50 px-4 pt-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-t-lg px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? "bg-white text-neutral-900 border border-neutral-200 border-b-white -mb-px"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ===== SCHEDULE VIEW ===== */}
        {activeTab === "schedule" && (
          <div ref={printRef} className="flex-1 overflow-y-auto p-4">
            <div className="mb-4 rounded-lg bg-[#0b2a5a] px-4 py-2.5">
              <h2 className={`${lato.className} text-base font-bold text-white`}>
                {formatDate(selectedDate)}
              </h2>
            </div>

            <div className="print:hidden mb-3 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
              The scheduler opens on <span className="font-semibold">tomorrow</span> by default.
              Use <span className="font-semibold">{copyForwardLabel}</span> to pull the whole previous day forward before you edit.
            </div>

            <div className="print:hidden mb-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
              Quick flow: 1) set each rig to <span className="font-semibold">Working</span>,
              <span className="font-semibold"> Down Day</span>, <span className="font-semibold">Mob</span>,
              or another status, 2) add job/truck/super when it is a working day, 3) add crew, 4)
              save with <span className="font-semibold">Save &amp; Email</span>.
            </div>

            <div className="print:hidden mb-3 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
                <div className="rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
                  Rigs Planned:{" "}
                  <span className="font-semibold text-neutral-900">
                    {scheduleOverview.readyRigs}/{scheduleOverview.totalRigs}
                  </span>
                </div>
                <div className="rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
                  Working Rigs:{" "}
                  <span className="font-semibold text-neutral-900">
                    {scheduleOverview.workingRigs}
                  </span>
                </div>
                <div className="rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
                  Special Status:{" "}
                  <span className="font-semibold text-neutral-900">
                    {scheduleOverview.specialStatusRigs}
                  </span>
                </div>
                <div className="rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
                  Rigs Missing Crew:{" "}
                  <span className="font-semibold text-neutral-900">
                    {scheduleOverview.rigsMissingCrew}
                  </span>
                </div>
                <div className="rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
                  Available Crew:{" "}
                  <span className="font-semibold text-neutral-900">
                    {scheduleOverview.unassignedWorkers}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setShowManagePanel(true);
                    setManagePanelTab("jobs");
                  }}
                  className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  Add / Edit Jobs
                </button>
              </div>

              <div className="mt-3 grid gap-2 md:grid-cols-[1fr,auto,auto]">
                <input
                  type="text"
                  value={scheduleRigSearch}
                  onChange={(e) => setScheduleRigSearch(e.target.value)}
                  placeholder="Search rigs by name, job, status, location, superintendent..."
                  className="h-9 rounded-lg border border-neutral-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <label className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
                  <input
                    type="checkbox"
                    checked={scheduleNeedsAttentionOnly}
                    onChange={(e) => setScheduleNeedsAttentionOnly(e.target.checked)}
                    className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                  />
                  Needs Attention Only
                </label>
                <button
                  onClick={() => {
                    setScheduleRigSearch("");
                    setScheduleNeedsAttentionOnly(false);
                  }}
                  className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  Reset Filters
                </button>
              </div>
            </div>

            <div className="print:hidden mb-3 rounded-lg border border-neutral-200 bg-white p-3 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold text-neutral-700">Copy rig to range:</span>
                <input
                  type="date"
                  value={copyStartDate}
                  onChange={(e) => setCopyStartDate(e.target.value)}
                  className="h-7 rounded border border-neutral-300 px-2 text-xs focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <span className="text-xs text-neutral-400">to</span>
                <input
                  type="date"
                  value={copyEndDate}
                  onChange={(e) => setCopyEndDate(e.target.value)}
                  className="h-7 rounded border border-neutral-300 px-2 text-xs focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <label className="flex items-center gap-1.5 text-xs text-neutral-600">
                  <input
                    type="checkbox"
                    checked={copyOverwrite}
                    onChange={(e) => setCopyOverwrite(e.target.checked)}
                    className="rounded border-neutral-300 text-red-600 focus:ring-red-500"
                  />
                  Overwrite
                </label>
                <span className="text-[10px] text-neutral-400">Use each rig&apos;s Copy button</span>
              </div>
              {copyStatus && (
                <div
                  className={`mt-2 rounded px-3 py-1.5 text-xs font-semibold ${
                    copyStatus.type === "success"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {copyStatus.message}
                  <button onClick={() => setCopyStatus(null)} className="ml-2 font-bold">
                    x
                  </button>
                </div>
              )}
            </div>

            {recentSchedules.length > 0 && (
              <div className="print:hidden mb-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-neutral-500">Recent:</span>
                {recentSchedules.map((sched) => {
                  const isSelected = sched.schedule_date === selectedDate;
                  return (
                    <button
                      key={sched.id}
                      onClick={() => setSelectedDate(sched.schedule_date)}
                      className={`rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors ${
                        isSelected
                          ? "border-[#0b2a5a] bg-[#0b2a5a] text-white"
                          : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                      }`}
                    >
                      {formatShortDate(sched.schedule_date)}
                      {sched.is_finalized && (
                        <span
                          className={`ml-1 text-[9px] uppercase ${
                            isSelected ? "text-emerald-200" : "text-emerald-500"
                          }`}
                        >
                          Sent
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="grid gap-4 xl:grid-cols-2">
              {visibleScheduleCategories.map((category) => {
                const catAssignments = assignments.filter(
                  (a) => a.category_id === category.id
                );
                const detail = rigDetails[category.id] || {};
                const rigJob = catAssignments.find((a) => a.job_id);
                const rigJobData = rigJob?.crew_jobs
                  || (rigJob?.job_id
                    ? jobs.find((job) => String(job.id) === String(rigJob.job_id))
                    : null);
                const crewAssignments = catAssignments.filter((a) => a.worker_id);
                const status = scheduleRigStatusByCategoryId[category.id] || {
                  completion: 0,
                  ready: false,
                  missing: ["Job", "Super", "Truck", "Crew"],
                };
                const availableWorkers = workers.filter((worker) => {
                  const assignedCats = workerAssignmentMap[worker.id] || [];
                  const alreadyOnThisRig = assignedCats.some(
                    (catId) => String(catId) === String(category.id)
                  );
                  if (alreadyOnThisRig) return false;
                  return assignedCats.length === 0;
                });
                const selectedWorkerForRig = rigWorkerDrafts[category.id] || "";
                const statusBadge = status.isNonWorking
                  ? status.statusLabel || status.dayTypeLabel
                  : status.ready
                  ? "Ready to send"
                  : `Missing: ${status.missing.join(", ")}`;

                return (
                  <div
                    key={category.id}
                    className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden"
                  >
                    <div
                      className="px-4 py-2.5"
                      style={{ backgroundColor: category.color }}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className={`${lato.className} font-bold text-white text-sm`}>
                            {category.name}
                          </h3>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-white/95">
                            <span className="rounded-full bg-white/20 px-2 py-0.5">
                              {statusBadge}
                            </span>
                            <span className="rounded-full bg-white/20 px-2 py-0.5">
                              Crew: {crewAssignments.length}
                            </span>
                            {!status.isNonWorking && status.jobName && (
                              <span className="rounded-full bg-white/20 px-2 py-0.5">
                                {status.jobName}
                                {status.jobNumber ? ` #${status.jobNumber}` : ""}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handlePrintAllForCategory(category.id)}
                            className="rounded-md bg-white/20 px-2 py-1 text-[11px] font-semibold text-white hover:bg-white/30 transition-colors"
                            title="Print all forms for this rig"
                          >
                            Print
                          </button>
                          <button
                            onClick={() => handleCopyCategoryRange(category.id)}
                            disabled={copyingCategoryId !== null}
                            className="rounded-md bg-white/20 px-2 py-1 text-[11px] font-semibold text-white hover:bg-white/30 transition-colors disabled:opacity-60"
                            title="Copy this rig to date range"
                          >
                            {copyingCategoryId === category.id ? "..." : "Copy"}
                          </button>
                          <button
                            onClick={() => clearCategorySchedule(category.id)}
                            className="rounded-md bg-white/20 px-2 py-1 text-[11px] font-semibold text-white hover:bg-white/30 transition-colors"
                            title="Clear rig"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-white/20">
                        <div
                          className={`h-1.5 rounded-full ${
                            status.ready ? "bg-emerald-300" : "bg-amber-300"
                          }`}
                          style={{ width: `${status.completion}%` }}
                        />
                      </div>
                    </div>

                    <div className="px-4 py-3">
                      <div className="grid gap-3 md:grid-cols-[180px,1fr]">
                        <label className="text-xs font-semibold text-neutral-500">
                          Day Type
                          <select
                            value={status.dayType || "working"}
                            onChange={(e) =>
                              applyRigDayStatus(category.id, e.target.value)
                            }
                            className="mt-1 h-9 w-full rounded border border-neutral-300 px-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            {RIG_DAY_TYPE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        {status.isNonWorking ? (
                          <label className="text-xs font-semibold text-neutral-500">
                            Status Label
                            <input
                              key={`${category.id}-${status.dayType}-${status.statusLabel}`}
                              type="text"
                              placeholder="Down Day, Mob Rig, Repairs..."
                              defaultValue={status.statusLabel || ""}
                              onBlur={(e) =>
                                applyRigDayStatus(
                                  category.id,
                                  status.dayType,
                                  e.target.value
                                )
                              }
                              className="mt-1 h-9 w-full rounded border border-neutral-300 px-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </label>
                        ) : (
                          <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                            Working days require a job, superintendent, truck, and crew before the rig reads as ready.
                          </div>
                        )}
                      </div>

                      {status.isNonWorking && (
                        <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                          This rig is marked as <span className="font-semibold">{status.statusLabel || status.dayTypeLabel}</span>.
                          Job, superintendent, truck, and crew are optional for the day.
                        </div>
                      )}

                      <div className="grid gap-3 md:grid-cols-3">
                        {status.isNonWorking ? (
                          <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
                            Working job fields are hidden while this rig is in a special-status day.
                          </div>
                        ) : (
                          <label className="text-xs font-semibold text-neutral-500">
                            Job
                            <select
                              value={rigJob?.job_id || ""}
                              onChange={(e) => {
                                if (e.target.value) {
                                  assignJobToRig(category.id, e.target.value);
                                } else {
                                  removeJobFromRig(category.id);
                                }
                              }}
                              className="mt-1 h-9 w-full rounded border border-neutral-300 px-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="">No job assigned</option>
                              {jobs.map((job) => (
                                <option key={job.id} value={job.id}>
                                  {job.job_name}
                                  {job.job_number ? ` (#${job.job_number})` : ""}{" "}
                                  {[job.city, job.zip].filter(Boolean).join(" ")}
                                </option>
                              ))}
                            </select>
                          </label>
                        )}
                        <label className="text-xs font-semibold text-neutral-500">
                          Superintendent
                          <select
                            value={detail.superintendent_id || ""}
                            onChange={(e) =>
                              updateRigDetail(
                                category.id,
                                "superintendent_id",
                                e.target.value || null
                              )
                            }
                            className="mt-1 h-9 w-full rounded border border-neutral-300 px-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">No superintendent</option>
                            {superintendents.map((superintendent) => (
                              <option key={superintendent.id} value={superintendent.id}>
                                {superintendent.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="text-xs font-semibold text-neutral-500">
                          Truck
                          <select
                            value={detail.truck_id || ""}
                            onChange={(e) =>
                              updateRigDetail(
                                category.id,
                                "truck_id",
                                e.target.value || null
                              )
                            }
                            className="mt-1 h-9 w-full rounded border border-neutral-300 px-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">No truck</option>
                            {trucks.map((truck) => (
                              <option key={truck.id} value={truck.id}>
                                #{truck.truck_number}
                                {truck.description ? ` - ${truck.description}` : ""}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      {!status.isNonWorking && rigJobData && (
                        <div className="mt-3 rounded-lg border border-purple-100 bg-purple-50 px-3 py-2 text-xs text-purple-900">
                          <div className="font-semibold">
                            Where is this rig going?{" "}
                            {[rigJobData.address, rigJobData.city, rigJobData.zip]
                              .filter(Boolean)
                              .join(", ") || "Address not entered yet."}
                          </div>
                          <div className="mt-1 text-purple-700">
                            {[rigJobData.hiring_contractor ? `Hiring: ${rigJobData.hiring_contractor}` : "", rigJobData.pm_name ? `PM: ${rigJobData.pm_name}` : ""]
                              .filter(Boolean)
                              .join(" • ")}
                          </div>
                        </div>
                      )}

                      <div className="mt-3 grid gap-2 md:grid-cols-[1fr,auto]">
                        <label className="text-xs font-semibold text-neutral-500">
                          Add Crew Member
                          <select
                            value={selectedWorkerForRig}
                            onChange={(e) => {
                              setRigWorkerDraft(category.id, e.target.value);
                            }}
                            className="mt-1 h-9 w-full rounded border border-neutral-300 px-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">
                              {availableWorkers.length > 0
                                ? "Select available worker..."
                                : "All workers are already assigned"}
                            </option>
                            {availableWorkers.map((worker) => (
                              <option key={worker.id} value={worker.id}>
                                {formatWorkerOption(worker)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <div className="flex items-end">
                          <button
                            onClick={() => addDraftWorkerToRig(category.id)}
                            disabled={!selectedWorkerForRig || saving}
                            className="h-9 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            Add Crew
                          </button>
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {crewAssignments.length === 0 ? (
                          <span className="text-xs text-neutral-400 italic">
                            No crew assigned yet.
                          </span>
                        ) : (
                          crewAssignments.map((assignment) => (
                            <span
                              key={assignment.id}
                              className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 text-xs font-medium"
                            >
                              {formatWorkerLabel(assignment.crew_workers) || "Worker"}
                              <button
                                onClick={() => deleteAssignment(assignment.id)}
                                className="ml-0.5 text-blue-400 hover:text-blue-700"
                                title="Remove from rig"
                              >
                                <svg
                                  className="h-3 w-3"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            </span>
                          ))
                        )}
                      </div>

                      <div className="mt-3 grid gap-3 md:grid-cols-[220px,1fr]">
                        <label className="text-xs font-semibold text-neutral-500">
                          Crane Info
                          <input
                            type="text"
                            placeholder="Crane info..."
                            defaultValue={detail.crane_info || ""}
                            onBlur={(e) =>
                              updateRigDetail(category.id, "crane_info", e.target.value)
                            }
                            className="mt-1 h-9 w-full rounded border border-neutral-300 px-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </label>
                        <label className="text-xs font-semibold text-neutral-500">
                          Notes
                          <input
                            type="text"
                            placeholder="Location / notes..."
                            defaultValue={detail.notes || ""}
                            onBlur={(e) =>
                              updateRigDetail(category.id, "notes", e.target.value)
                            }
                            className="mt-1 h-9 w-full rounded border border-neutral-300 px-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {visibleScheduleCategories.length === 0 && categories.length > 0 && (
              <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-12 text-center">
                <p className="text-neutral-600">
                  No rigs match your current filters.
                </p>
                <button
                  onClick={() => {
                    setScheduleRigSearch("");
                    setScheduleNeedsAttentionOnly(false);
                  }}
                  className="mt-2 text-sm font-semibold text-red-600 hover:text-red-700"
                >
                  Clear filters
                </button>
              </div>
            )}

            {categories.length === 0 && (
              <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-12 text-center">
                <p className="text-neutral-600">No categories created yet.</p>
                <button
                  onClick={() => {
                    setShowManagePanel(true);
                    setManagePanelTab("rigs");
                  }}
                  className="mt-2 text-sm font-semibold text-red-600 hover:text-red-700"
                >
                  Create your first category
                </button>
              </div>
            )}
          </div>
        )}

        {/* ===== PLANNER VIEW ===== */}
        {activeTab === "planner" && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        setPlannerMonth((prev) => shiftMonthString(prev, -1))
                      }
                      className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                    >
                      ◀
                    </button>
                    <input
                      type="month"
                      value={plannerMonth}
                      onChange={(e) => setPlannerMonth(e.target.value)}
                      className="h-9 rounded-lg border border-neutral-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      onClick={() =>
                        setPlannerMonth((prev) => shiftMonthString(prev, 1))
                      }
                      className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                    >
                      ▶
                    </button>
                  </div>

                  <input
                    type="text"
                    value={plannerSearch}
                    onChange={(e) => setPlannerSearch(e.target.value)}
                    placeholder="Filter by worker, rig, job, status, notes..."
                    className="h-9 min-w-[240px] flex-1 rounded-lg border border-neutral-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <label className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
                    <input
                      type="checkbox"
                      checked={plannerFinalizedOnly}
                      onChange={(e) => setPlannerFinalizedOnly(e.target.checked)}
                      className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                    />
                    Finalized only
                  </label>
                  <button
                    onClick={() => {
                      setPlannerSearch("");
                      setPlannerFinalizedOnly(false);
                    }}
                    className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm font-semibold text-neutral-600 hover:bg-neutral-50"
                  >
                    Reset
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs text-neutral-600">
                  <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700">
                    {formatMonthLabel(plannerMonth)}
                  </span>
                  <span className="rounded-full bg-neutral-100 px-3 py-1 font-semibold text-neutral-700">
                    Days with activity: {plannerSummary.days}
                  </span>
                  <span className="rounded-full bg-neutral-100 px-3 py-1 font-semibold text-neutral-700">
                    Rigs shown: {plannerSummary.rigs}
                  </span>
                  <span className="rounded-full bg-neutral-100 px-3 py-1 font-semibold text-neutral-700">
                    Crew slots: {plannerSummary.workers}
                  </span>
                  <span className="rounded-full bg-neutral-100 px-3 py-1 font-semibold text-neutral-700">
                    Jobs assigned: {plannerSummary.jobs}
                  </span>
                </div>
              </div>

              {plannerError && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {plannerError}
                </div>
              )}

              <div className="grid gap-4 xl:grid-cols-[2fr,1fr]">
                <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
                  <div className="grid grid-cols-7 border-b border-neutral-200 bg-neutral-50 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((weekday) => (
                      <div key={weekday} className="px-3 py-2 text-center">
                        {weekday}
                      </div>
                    ))}
                  </div>
                  {plannerLoading ? (
                    <div className="flex items-center justify-center px-4 py-16">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-blue-600"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-7 gap-px bg-neutral-200">
                      {plannerCalendarCells.map((cell, idx) => {
                        if (!cell) {
                          return (
                            <div
                              key={`planner-empty-${idx}`}
                              className="min-h-[118px] bg-neutral-50"
                            />
                          );
                        }

                        const isSelected = cell.date === plannerSelectedDate;
                        const dayData = cell.dayData;
                        const rigs = dayData ? Array.from(dayData.rigs.values()) : [];
                        return (
                          <button
                            key={cell.date}
                            onClick={() => setPlannerSelectedDate(cell.date)}
                            className={`min-h-[118px] bg-white p-2 text-left align-top transition-colors ${
                              isSelected ? "ring-2 ring-blue-500" : "hover:bg-blue-50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-xs font-bold ${
                                  isSelected ? "text-blue-700" : "text-neutral-700"
                                }`}
                              >
                                {cell.day}
                              </span>
                              {dayData && (
                                <span
                                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                                    dayData.finalized
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-blue-100 text-blue-700"
                                  }`}
                                >
                                  {dayData.rigs.size} rig{dayData.rigs.size === 1 ? "" : "s"}
                                </span>
                              )}
                            </div>
                            <div className="mt-1 space-y-1">
                              {rigs.slice(0, 2).map((rig) => (
                                <div
                                  key={`${cell.date}-${rig.name}`}
                                  className="truncate rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-700"
                                  title={
                                    rig.statusLabel
                                      ? `${rig.name} - ${rig.statusLabel}`
                                      : rig.name
                                  }
                                >
                                  {rig.name}
                                  {rig.statusLabel ? ` - ${rig.statusLabel}` : ""}
                                </div>
                              ))}
                              {rigs.length > 2 && (
                                <div className="text-[10px] font-semibold text-neutral-500">
                                  +{rigs.length - 2} more
                                </div>
                              )}
                              {dayData?.finalized && (
                                <div className="text-[10px] font-semibold text-emerald-600">
                                  Finalized
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
                    <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3">
                      <h3 className={`${lato.className} text-sm font-bold text-neutral-900`}>
                        {plannerSelectedDate
                          ? formatDate(plannerSelectedDate)
                          : "Select a day"}
                      </h3>
                    </div>
                    <div className="p-3">
                      <button
                        onClick={() =>
                          openScheduleForDate(
                            plannerSelectedDate || `${plannerMonth}-01`
                          )
                        }
                        className="mb-3 w-full rounded-lg bg-[#0b2a5a] px-3 py-2 text-sm font-semibold text-white hover:bg-[#0a2350]"
                      >
                        Open Day in Scheduler
                      </button>
                      {!selectedPlannerDay ? (
                        <p className="text-sm text-neutral-500">
                          No entries match your filter for this day.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          <div className="rounded-lg bg-neutral-50 px-3 py-2 text-xs font-semibold text-neutral-700">
                            {selectedPlannerDay.finalized
                              ? "This schedule is finalized."
                              : "Draft schedule."}
                          </div>
                          {selectedPlannerRigs.length === 0 ? (
                            <p className="text-xs text-neutral-500">
                              Schedule exists for this day, but no rig rows match the current filter.
                            </p>
                          ) : (
                            selectedPlannerRigs.map((rig) => (
                              <div
                                key={rig.name}
                                className="rounded-lg border border-neutral-200 bg-white px-3 py-2"
                              >
                                <div className="text-sm font-semibold text-neutral-900">
                                  {rig.name}
                                </div>
                                {rig.statusLabel && (
                                  <div className="mt-1 text-xs font-semibold text-amber-700">
                                    Status: {rig.statusLabel}
                                  </div>
                                )}
                                <div className="mt-1 text-xs text-neutral-600">
                                  Jobs: {Array.from(rig.jobs).join(", ") || "None"}
                                </div>
                                <div className="mt-1 text-xs text-neutral-600">
                                  Crew: {Array.from(rig.workers).join(", ") || "None"}
                                </div>
                                {(rig.superintendent || rig.truck || rig.crane) && (
                                  <div className="mt-1 text-xs text-neutral-600">
                                    {[rig.superintendent ? `Supt: ${rig.superintendent}` : "", rig.truck ? `Truck: ${rig.truck}` : "", rig.crane ? `Crane: ${rig.crane}` : ""]
                                      .filter(Boolean)
                                      .join(" • ")}
                                  </div>
                                )}
                                {rig.notes.size > 0 && (
                                  <div className="mt-1 text-xs text-neutral-500">
                                    Notes: {Array.from(rig.notes).slice(0, 2).join(" / ")}
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                    <h3 className={`${lato.className} text-sm font-bold text-neutral-900`}>
                      Crew Pattern Snapshot
                    </h3>
                    <p className="mt-1 text-xs text-neutral-500">
                      Uses the currently loaded month to surface repeat crew pairings and
                      worker-to-rig habits.
                    </p>

                    <div className="mt-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Top Pairings
                      </div>
                      {plannerPatternSummary.topPairs.length === 0 ? (
                        <p className="mt-1 text-xs text-neutral-500">Not enough crew data yet.</p>
                      ) : (
                        <div className="mt-1 space-y-1">
                          {plannerPatternSummary.topPairs.map((pair) => (
                            <div
                              key={pair.label}
                              className="flex items-center justify-between rounded bg-neutral-50 px-2 py-1 text-xs"
                            >
                              <span className="text-neutral-700">{pair.label}</span>
                              <span className="font-semibold text-neutral-900">{pair.count}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Worker - Rig Frequency
                      </div>
                      {plannerPatternSummary.topWorkerRigs.length === 0 ? (
                        <p className="mt-1 text-xs text-neutral-500">No worker assignments yet.</p>
                      ) : (
                        <div className="mt-1 space-y-1">
                          {plannerPatternSummary.topWorkerRigs.map((item) => (
                            <div
                              key={`${item.worker}-${item.rig}`}
                              className="flex items-center justify-between rounded bg-neutral-50 px-2 py-1 text-xs"
                            >
                              <span className="text-neutral-700">
                                {item.worker} {"->"} {item.rig}
                              </span>
                              <span className="font-semibold text-neutral-900">{item.count}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== PACKETS VIEW ===== */}
        {activeTab === "packets" && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className={`${lato.className} text-lg font-bold text-neutral-900`}>
                    Daily Packets - {formatDate(selectedDate)}
                  </h3>
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                    Per crew member
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() =>
                      window.open(
                        "/NEW%20LOG%20%26%20INSPECTION.pdf",
                        "_blank",
                        "noopener,noreferrer"
                      )
                    }
                    className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-neutral-700 border border-neutral-200 hover:bg-neutral-50 transition-colors"
                  >
                    Open Log &amp; Inspection PDF
                  </button>
                  <button
                    onClick={handleEmailPackets}
                    disabled={packetsSending || scheduledPacketsForDate.length === 0}
                    className="rounded-lg bg-[#0b2a5a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a2350] disabled:opacity-50 transition-colors"
                  >
                    {packetsSending
                      ? "Sending..."
                      : `Email All Packets (${scheduledPacketsForDate.length})`}
                  </button>
                </div>
              </div>

              {packetsStatus && (
                <div
                  className={`rounded-lg px-4 py-3 text-sm font-medium ${
                    packetsStatus.type === "success"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {packetsStatus.message}
                  <button onClick={() => setPacketsStatus(null)} className="ml-2 font-bold">
                    x
                  </button>
                </div>
              )}

              {scheduledPacketsForDate.length === 0 ? (
                <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-12 text-center">
                  <p className="text-neutral-600">
                    No crew packets scheduled for this date. Build the schedule first.
                  </p>
                  <button
                    onClick={() => setActiveTab("schedule")}
                    className="mt-2 text-sm font-semibold text-red-600 hover:text-red-700"
                  >
                    Go to Build Schedule
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {scheduledPacketsForDate.map((packet) => {
                    const contactDetails = [
                      packet.hiring_contact_name,
                      packet.hiring_contact_phone,
                      packet.hiring_contact_email,
                    ]
                      .filter(Boolean)
                      .join(" • ");

                    return (
                      <div
                        key={packet.packet_id}
                        className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden"
                      >
                        <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-semibold text-neutral-900">
                                {packet.worker_name || "Crew Packet"}
                              </span>
                              {packet.job_number && (
                                <span className="ml-2 rounded bg-neutral-200 px-2 py-0.5 text-xs text-neutral-600">
                                  #{packet.job_number}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handlePrintCoverSheet(packet.assignment)}
                                className="rounded-md bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                              >
                                Cover Sheet
                              </button>
                              <button
                                onClick={() =>
                                  window.open(
                                    "/NEW%20LOG%20%26%20INSPECTION.pdf",
                                    "_blank",
                                    "noopener,noreferrer"
                                  )
                                }
                                className="rounded-md bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 hover:bg-green-100 transition-colors"
                              >
                                Log &amp; Inspection PDF
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="px-4 py-3 space-y-2 text-sm">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            {packet.job_name && (
                              <div>
                                <span className="text-neutral-500">Job:</span>{" "}
                                <span className="font-medium">{packet.job_name}</span>
                              </div>
                            )}
                            <div>
                              <span className="text-neutral-500">Rig:</span>{" "}
                              <span className="font-medium">{packet.rig_name}</span>
                            </div>
                            {packet.hiring_contractor && (
                              <div>
                                <span className="text-neutral-500">Hiring:</span>{" "}
                                <span className="font-medium">{packet.hiring_contractor}</span>
                              </div>
                            )}
                            {contactDetails && (
                              <div>
                                <span className="text-neutral-500">Contact:</span>{" "}
                                <span className="font-medium">{contactDetails}</span>
                              </div>
                            )}
                            {packet.superintendent_name && (
                              <div>
                                <span className="text-neutral-500">Supt:</span>{" "}
                                <span className="font-medium">{packet.superintendent_name}</span>
                              </div>
                            )}
                            {packet.truck_number && (
                              <div>
                                <span className="text-neutral-500">Truck:</span>{" "}
                                <span className="font-medium">{packet.truck_number}</span>
                              </div>
                            )}
                          </div>
                          {packet.crew_names && (
                            <div>
                              <span className="text-neutral-500">Crew:</span>{" "}
                              <span className="font-medium">{packet.crew_names}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 pt-1">
                            <label className="text-xs font-semibold text-neutral-500 whitespace-nowrap">
                              Dig Tess #:
                            </label>
                            <input
                              type="text"
                              defaultValue={packet.dig_tess_number}
                              onBlur={(e) => {
                                updateDigTessNumber(packet.job_id, e.target.value);
                                setJobs((prev) =>
                                  prev.map((j) =>
                                    j.id === packet.job_id
                                      ? { ...j, dig_tess_number: e.target.value }
                                      : j
                                  )
                                );
                              }}
                              placeholder="Enter Dig Tess #"
                              className="flex-1 rounded border border-neutral-300 px-2 py-1 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== HISTORY VIEW ===== */}
        {activeTab === "history" && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={historyView}
                    onChange={(e) => {
                      setHistoryView(e.target.value);
                      setHistorySearch("");
                      setHistorySelectedDate("");
                    }}
                    className="h-9 rounded-lg border border-neutral-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="rig">Rigs</option>
                    <option value="crew">Crew Members</option>
                    <option value="job">Jobs</option>
                  </select>
                  <select
                    value={historyEntityId}
                    onChange={(e) => setHistoryEntityId(e.target.value)}
                    className="h-9 min-w-[220px] rounded-lg border border-neutral-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {historyEntityOptions.length === 0 ? (
                      <option value="">No options</option>
                    ) : (
                      historyEntityOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))
                    )}
                  </select>
                  <div className="ml-auto flex items-center gap-1">
                    <button
                      onClick={() =>
                        setHistoryMonth((prev) => shiftMonthString(prev, -1))
                      }
                      className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                    >
                      ◀
                    </button>
                    <input
                      type="month"
                      value={historyMonth}
                      onChange={(e) => setHistoryMonth(e.target.value)}
                      className="h-9 rounded-lg border border-neutral-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      onClick={() =>
                        setHistoryMonth((prev) => shiftMonthString(prev, 1))
                      }
                      className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                    >
                      ▶
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Filter rigs, crew, jobs, notes..."
                    className="h-9 min-w-[260px] flex-1 rounded-lg border border-neutral-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <label className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
                    <input
                      type="checkbox"
                      checked={historyFinalizedOnly}
                      onChange={(e) => setHistoryFinalizedOnly(e.target.checked)}
                      className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                    />
                    Finalized only
                  </label>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {formatMonthLabel(historyMonth)}
                  </span>
                  {selectedHistoryEntityLabel && (
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
                      {selectedHistoryEntityLabel}
                    </span>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-neutral-600 sm:grid-cols-4">
                  <div className="rounded-lg bg-neutral-50 px-3 py-2">
                    Days with entries:{" "}
                    <span className="font-semibold text-neutral-900">{historySummary.days}</span>
                  </div>
                  <div className="rounded-lg bg-neutral-50 px-3 py-2">
                    {showAllRigsHistory ? "Rigs:" : "Assignments:"}{" "}
                    <span className="font-semibold text-neutral-900">
                      {historySummary.assignments}
                    </span>
                  </div>
                  <div className="rounded-lg bg-neutral-50 px-3 py-2">
                    Unique jobs:{" "}
                    <span className="font-semibold text-neutral-900">{historySummary.uniqueJobs}</span>
                  </div>
                  <div className="rounded-lg bg-neutral-50 px-3 py-2">
                    Unique crew:{" "}
                    <span className="font-semibold text-neutral-900">
                      {historySummary.uniqueWorkers}
                    </span>
                  </div>
                </div>
              </div>

              {historyError && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {historyError}
                </div>
              )}

              <div className="grid gap-4 xl:grid-cols-[2fr,1fr]">
                <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
                  <div className="grid grid-cols-7 border-b border-neutral-200 bg-neutral-50 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((weekday) => (
                      <div key={weekday} className="px-3 py-2 text-center">
                        {weekday}
                      </div>
                    ))}
                  </div>
                  {historyLoading ? (
                    <div className="flex items-center justify-center px-4 py-16">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-blue-600"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-7 gap-px bg-neutral-200">
                      {historyCalendarCells.map((cell, idx) => {
                        if (!cell) {
                          return (
                            <div
                              key={`empty-${idx}`}
                              className="min-h-[112px] bg-neutral-50"
                            />
                          );
                        }

                        const isSelected = cell.date === historySelectedDate;
                        return (
                          <button
                            key={cell.date}
                            onClick={() => setHistorySelectedDate(cell.date)}
                            className={`min-h-[112px] bg-white p-2 text-left align-top transition-colors ${
                              isSelected ? "ring-2 ring-blue-500" : "hover:bg-blue-50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-xs font-bold ${
                                  isSelected ? "text-blue-700" : "text-neutral-700"
                                }`}
                              >
                                {cell.day}
                              </span>
                              {cell.entries.length > 0 && (
                                <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                                  {cell.entries.length}
                                </span>
                              )}
                            </div>
                            <div className="mt-1 space-y-1">
                              {cell.entries.slice(0, 2).map((entry) => (
                                <div
                                  key={entry.id}
                                  className="truncate rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-700"
                                  title={getHistoryEntryHeadline(entry)}
                                >
                                  {getHistoryEntryHeadline(entry)}
                                </div>
                              ))}
                              {cell.entries.length > 2 && (
                                <div className="text-[10px] font-semibold text-neutral-500">
                                  +{cell.entries.length - 2} more
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
                  <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3">
                    <h3 className={`${lato.className} text-sm font-bold text-neutral-900`}>
                      {historySelectedDate
                        ? formatDate(historySelectedDate)
                        : "Select a day"}
                    </h3>
                  </div>
                  <div className="max-h-[560px] overflow-y-auto p-3">
                    {historyLoading ? (
                      <p className="text-sm text-neutral-500">Loading entries...</p>
                    ) : showAllRigsHistory ? (
                      selectedHistoryRigBoards.length === 0 ? (
                        <p className="text-sm text-neutral-500">
                          No rig schedules match this day.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {selectedHistoryRigBoards.map((rig) => (
                            <div
                              key={rig.id}
                              className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2"
                            >
                              <div className="text-sm font-semibold text-neutral-900">
                                {rig.rig}
                              </div>
                              {rig.statusLabel && (
                                <div className="mt-1 text-xs font-semibold text-amber-700">
                                  Status: {rig.statusLabel}
                                </div>
                              )}
                              <div className="mt-1 text-xs text-neutral-500">
                                Jobs: {rig.jobs.join(", ") || "None"}
                              </div>
                              <div className="mt-1 text-xs text-neutral-500">
                                Crew: {rig.workers.join(", ") || "None"}
                              </div>
                              {rig.notes.length > 0 && (
                                <div className="mt-1 text-xs text-neutral-500">
                                  Notes: {rig.notes.slice(0, 2).join(" / ")}
                                </div>
                              )}
                              {rig.finalized && (
                                <div className="mt-1 text-xs font-semibold text-emerald-700">
                                  Finalized
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )
                    ) : selectedHistoryAssignments.length === 0 ? (
                      <p className="text-sm text-neutral-500">
                        No matching assignments for this day.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {selectedHistoryAssignments.map((entry) => (
                          <div
                            key={entry.id}
                            className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2"
                          >
                            <div className="text-sm font-semibold text-neutral-900">
                              {getHistoryEntryHeadline(entry)}
                            </div>
                            {getHistoryEntrySubline(entry) && (
                              <div className="mt-1 text-xs text-neutral-500">
                                {getHistoryEntrySubline(entry)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== MANAGEMENT SLIDE-OUT PANEL ===== */}
        {showManagePanel && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setShowManagePanel(false)}
            />
            {/* Panel */}
            <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col">
              {/* Panel Header */}
              <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
                <h2 className={`${lato.className} text-lg font-bold text-neutral-900`}>
                  Manage Resources
                </h2>
                <button
                  onClick={() => setShowManagePanel(false)}
                  className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Panel Tab bar */}
              <div className="flex border-b border-neutral-200 bg-neutral-50 px-2">
                {[
                  { id: "workers", label: "Workers" },
                  { id: "supers", label: "Supers" },
                  { id: "trucks", label: "Trucks" },
                  { id: "jobs", label: "Jobs" },
                  { id: "rigs", label: "Rigs" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setManagePanelTab(t.id)}
                    className={`px-3 py-2 text-xs font-semibold transition-colors ${
                      managePanelTab === t.id
                        ? "border-b-2 border-red-600 text-red-600"
                        : "text-neutral-500 hover:text-neutral-800"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Panel Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {/* ---- WORKERS TAB ---- */}
                {managePanelTab === "workers" && (
                  <div className="space-y-4">
                    {/* Add Worker Form */}
                    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                      <h3 className={`${lato.className} mb-3 font-bold text-neutral-900`}>
                        Add Crew Member
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        <input
                          type="text"
                          placeholder="Worker name"
                          value={newWorkerName}
                          onChange={(e) => setNewWorkerName(e.target.value)}
                          className="flex-1 min-w-[200px] rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                        <input
                          type="text"
                          placeholder="Phone (optional)"
                          value={newWorkerPhone}
                          onChange={(e) => setNewWorkerPhone(e.target.value)}
                          className="w-40 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                        <input
                          type="text"
                          placeholder="Role / Title (optional)"
                          value={newWorkerRole}
                          onChange={(e) => setNewWorkerRole(e.target.value)}
                          className="w-48 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                        <button
                          onClick={addWorker}
                          disabled={saving || !newWorkerName.trim()}
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          Add Worker
                        </button>
                      </div>
                    </div>

                    {/* Bulk Add Crew */}
                    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className={`${lato.className} mb-1 font-bold text-neutral-900`}>
                            Bulk Add Crew
                          </h3>
                          <p className="text-sm text-neutral-600">
                            Upload a CSV or paste a list. Columns: name, phone, role (optional).
                          </p>
                        </div>
                        {bulkCrewRows.length > 0 && (
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                            {bulkCrewRows.length} ready
                          </span>
                        )}
                      </div>
                      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr,1fr]">
                        <label className="text-xs font-semibold text-neutral-500">
                          Upload file
                          <input
                            type="file"
                            accept=".csv,.txt"
                            onChange={handleBulkCrewFile}
                            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                          />
                          {bulkCrewFilename && (
                            <span className="mt-1 block text-xs text-neutral-500">
                              Loaded: {bulkCrewFilename}
                            </span>
                          )}
                        </label>
                        <label className="text-xs font-semibold text-neutral-500">
                          Or paste list
                          <textarea
                            value={bulkCrewText}
                            onChange={(e) => setBulkCrewText(e.target.value)}
                            placeholder="Name, Phone, Role&#10;Jane Smith, 214-555-0100, Operator&#10;John Doe"
                            rows={4}
                            className="mt-1 w-full resize-y rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                          />
                        </label>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleBulkCrewParse(bulkCrewText)}
                          className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                        >
                          Preview List
                        </button>
                        <button
                          onClick={importBulkCrew}
                          disabled={bulkCrewImporting || bulkCrewRows.length === 0}
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          {bulkCrewImporting ? "Importing..." : `Import ${bulkCrewRows.length || ""}`}
                        </button>
                        <button
                          onClick={clearBulkCrew}
                          className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                        >
                          Clear
                        </button>
                        {bulkCrewError && (
                          <span className="text-sm font-semibold text-red-600">{bulkCrewError}</span>
                        )}
                      </div>
                      {bulkCrewRows.length > 0 && (
                        <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
                          Preview:
                          <div className="mt-1 flex flex-wrap gap-2">
                            {bulkCrewRows.slice(0, 8).map((row, idx) => (
                              <span key={`${row.name}-${idx}`} className="rounded-full bg-white px-2 py-1">
                                {row.name}{row.role ? ` — ${row.role}` : ""}{row.phone ? ` • ${row.phone}` : ""}
                              </span>
                            ))}
                            {bulkCrewRows.length > 8 && (
                              <span className="text-neutral-500">+{bulkCrewRows.length - 8} more</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Workers List */}
                    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
                      <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3">
                        <h3 className={`${lato.className} font-bold text-neutral-900`}>
                          Crew Members ({workers.length})
                        </h3>
                      </div>
                      <div className="divide-y">
                        {workers.length === 0 ? (
                          <div className="px-4 py-8 text-center text-neutral-500">
                            No crew members added yet.
                          </div>
                        ) : (
                          workers.map((worker) => (
                            <div
                              key={worker.id}
                              className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <div className="font-semibold text-neutral-900">{worker.name}</div>
                                  {worker.role && (
                                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                                      {worker.role}
                                    </span>
                                  )}
                                </div>
                                {worker.phone && (
                                  <div className="text-sm text-neutral-500">{worker.phone}</div>
                                )}
                                <div className="mt-2 flex items-center gap-2">
                                  <label className="text-xs font-semibold text-neutral-500">Title</label>
                                  <input
                                    type="text"
                                    defaultValue={worker.role || ""}
                                    placeholder="Set title..."
                                    onBlur={(e) =>
                                      updateWorker(worker.id, { role: e.target.value.trim() || null })
                                    }
                                    className="w-48 rounded border border-neutral-300 px-2 py-1 text-xs focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                                  />
                                </div>
                              </div>
                              <button
                                onClick={() => deleteWorker(worker.id)}
                                className="rounded-md px-3 py-1 text-sm text-neutral-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ---- SUPERS TAB ---- */}
                {managePanelTab === "supers" && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                      <h3 className={`${lato.className} mb-3 font-bold text-neutral-900`}>
                        Add New Superintendent
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        <input
                          type="text"
                          placeholder="Superintendent name"
                          value={newSuperintendentName}
                          onChange={(e) => setNewSuperintendentName(e.target.value)}
                          className="flex-1 min-w-[200px] rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                        <input
                          type="text"
                          placeholder="Phone (optional)"
                          value={newSuperintendentPhone}
                          onChange={(e) => setNewSuperintendentPhone(e.target.value)}
                          className="w-40 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                        <button
                          onClick={addSuperintendent}
                          disabled={saving || !newSuperintendentName.trim()}
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          Add Superintendent
                        </button>
                      </div>
                    </div>
                    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
                      <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3">
                        <h3 className={`${lato.className} font-bold text-neutral-900`}>
                          Superintendents ({superintendents.length})
                        </h3>
                      </div>
                      <div className="divide-y">
                        {superintendents.length === 0 ? (
                          <div className="px-4 py-8 text-center text-neutral-500">
                            No superintendents added yet.
                          </div>
                        ) : (
                          superintendents.map((s) => (
                            <div key={s.id} className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50">
                              <div>
                                <div className="font-semibold text-neutral-900">{s.name}</div>
                                {s.phone && <div className="text-sm text-neutral-500">{s.phone}</div>}
                              </div>
                              <button
                                onClick={() => deleteSuperintendent(s.id)}
                                className="rounded-md px-3 py-1 text-sm text-neutral-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ---- TRUCKS TAB ---- */}
                {managePanelTab === "trucks" && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                      <h3 className={`${lato.className} mb-3 font-bold text-neutral-900`}>
                        Add New Truck
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        <input
                          type="text"
                          placeholder="Truck number"
                          value={newTruckNumber}
                          onChange={(e) => setNewTruckNumber(e.target.value)}
                          className="w-40 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                        <input
                          type="text"
                          placeholder="Description (optional)"
                          value={newTruckDescription}
                          onChange={(e) => setNewTruckDescription(e.target.value)}
                          className="flex-1 min-w-[200px] rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                        <button
                          onClick={addTruck}
                          disabled={saving || !newTruckNumber.trim()}
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          Add Truck
                        </button>
                      </div>
                    </div>
                    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
                      <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3">
                        <h3 className={`${lato.className} font-bold text-neutral-900`}>
                          Trucks ({trucks.length})
                        </h3>
                      </div>
                      <div className="divide-y">
                        {trucks.length === 0 ? (
                          <div className="px-4 py-8 text-center text-neutral-500">
                            No trucks added yet.
                          </div>
                        ) : (
                          trucks.map((t) => (
                            <div key={t.id} className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50">
                              <div>
                                <div className="font-semibold text-neutral-900">Truck #{t.truck_number}</div>
                                {t.description && <div className="text-sm text-neutral-500">{t.description}</div>}
                              </div>
                              <button
                                onClick={() => deleteTruck(t.id)}
                                className="rounded-md px-3 py-1 text-sm text-neutral-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ---- JOBS TAB ---- */}
                {managePanelTab === "jobs" && (
                  <div className="space-y-4">
                    {!jobProgressAvailable && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                        Job progress tracking is unavailable right now. Run the scheduler
                        migration for `crew_job_progress` to enable holes and ETA tracking.
                      </div>
                    )}
                    {jobProgressStatus && (
                      <div
                        className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                          jobProgressStatus.type === "success"
                            ? "border border-green-200 bg-green-50 text-green-700"
                            : "border border-red-200 bg-red-50 text-red-700"
                        }`}
                      >
                        {jobProgressStatus.message}
                      </div>
                    )}

                    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className={`${lato.className} text-base font-bold text-neutral-900`}>
                            Quick Job Intake
                          </h3>
                          <p className="mt-1 text-sm text-neutral-600">
                            Paste rows from Tatum&apos;s spreadsheet (CSV or tab-separated). Existing
                            jobs match by job number, otherwise by job name.
                          </p>
                        </div>
                        {jobIntakePreviewRows.length > 0 && (
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                            {jobIntakePreviewRows.length} parsed
                          </span>
                        )}
                      </div>
                      <textarea
                        rows={6}
                        value={jobIntakeText}
                        onChange={(e) => setJobIntakeText(e.target.value)}
                        placeholder="Job Name,Job Number,Customer,Hiring Contractor,Address,City,ZIP,PM Name,PM Phone,Crane Required&#10;Dock Repair A,24001,Port Owner,ABC Marine,123 Harbor Way,Houston,77001,Alex PM,713-555-0112,Yes"
                        className="mt-3 w-full resize-y rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          onClick={previewJobIntake}
                          className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                        >
                          Preview Rows
                        </button>
                        <button
                          onClick={importJobIntake}
                          disabled={jobIntakeImporting}
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {jobIntakeImporting ? "Importing..." : "Import Jobs"}
                        </button>
                        <button
                          onClick={clearJobIntake}
                          className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                        >
                          Clear
                        </button>
                        <span className="text-xs text-neutral-500">
                          Tip: The AI Assistant can also create jobs if you paste these rows in chat.
                        </span>
                      </div>
                      {jobIntakeStatus && (
                        <div
                          className={`mt-3 rounded-lg px-3 py-2 text-sm font-semibold ${
                            jobIntakeStatus.type === "success"
                              ? "bg-green-50 text-green-700"
                              : jobIntakeStatus.type === "error"
                              ? "bg-red-50 text-red-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {jobIntakeStatus.message}
                        </div>
                      )}
                      {jobIntakePreviewRows.length > 0 && (
                        <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
                          Preview:
                          <div className="mt-1 flex flex-wrap gap-2">
                            {jobIntakePreviewRows.slice(0, 6).map((row, idx) => (
                              <span key={`${row.job_name}-${idx}`} className="rounded-full bg-white px-2 py-1">
                                {row.job_name}
                                {row.job_number ? ` #${row.job_number}` : ""}
                                {row.default_rig ? ` • ${row.default_rig}` : ""}
                              </span>
                            ))}
                            {jobIntakePreviewRows.length > 6 && (
                              <span className="text-neutral-500">
                                +{jobIntakePreviewRows.length - 6} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Add Job Form */}
                    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                      <h3 className={`${lato.className} mb-3 font-bold text-neutral-900`}>
                        Add New Job
                      </h3>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          type="text"
                          placeholder="Job Name *"
                          value={newJob.job_name}
                          onChange={(e) => setNewJob({ ...newJob, job_name: e.target.value })}
                          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                        <input
                          type="text"
                          placeholder="Job Number"
                          value={newJob.job_number}
                          onChange={(e) => setNewJob({ ...newJob, job_number: e.target.value })}
                          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                        <input
                          type="text"
                          placeholder="Dig Tess #"
                          value={newJob.dig_tess_number}
                          onChange={(e) => setNewJob({ ...newJob, dig_tess_number: e.target.value })}
                          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                        <input
                          type="text"
                          placeholder="Customer Name"
                          value={newJob.customer_name}
                          onChange={(e) => setNewJob({ ...newJob, customer_name: e.target.value })}
                          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                        <input
                          type="text"
                          placeholder="Hiring Contractor"
                          value={newJob.hiring_contractor}
                          onChange={(e) => setNewJob({ ...newJob, hiring_contractor: e.target.value })}
                          list="customer-options"
                          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                        <input
                          type="text"
                          placeholder="Contact Name"
                          value={newJob.hiring_contact_name}
                          onChange={(e) => setNewJob({ ...newJob, hiring_contact_name: e.target.value })}
                          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                        <input
                          type="text"
                          placeholder="Contact Phone"
                          value={newJob.hiring_contact_phone}
                          onChange={(e) => setNewJob({ ...newJob, hiring_contact_phone: e.target.value })}
                          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                        <input
                          type="email"
                          placeholder="Contact Email"
                          value={newJob.hiring_contact_email}
                          onChange={(e) => setNewJob({ ...newJob, hiring_contact_email: e.target.value })}
                          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                        <input
                          type="text"
                          placeholder="Address"
                          value={newJob.address}
                          onChange={(e) => setNewJob({ ...newJob, address: e.target.value })}
                          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                        <input
                          type="text"
                          placeholder="City"
                          value={newJob.city}
                          onChange={(e) => setNewJob({ ...newJob, city: e.target.value })}
                          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                        <input
                          type="text"
                          placeholder="ZIP"
                          value={newJob.zip}
                          onChange={(e) => setNewJob({ ...newJob, zip: e.target.value })}
                          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                        <input
                          type="text"
                          placeholder="S&W PM Name"
                          value={newJob.pm_name}
                          onChange={(e) => setNewJob({ ...newJob, pm_name: e.target.value })}
                          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                        <input
                          type="text"
                          placeholder="PM Phone"
                          value={newJob.pm_phone}
                          onChange={(e) => setNewJob({ ...newJob, pm_phone: e.target.value })}
                          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                        <input
                          type="text"
                          placeholder="Default Rig"
                          value={newJob.default_rig}
                          onChange={(e) => setNewJob({ ...newJob, default_rig: e.target.value })}
                          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                        <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
                          <span>Job Status</span>
                          <select
                            value={newJob.job_status}
                            onChange={(e) => setNewJob({ ...newJob, job_status: e.target.value })}
                            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-normal focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                          >
                            <option value="active">Active</option>
                            <option value="bid">Bid</option>
                            <option value="awarded">Awarded</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="on_hold">On Hold</option>
                          </select>
                        </label>
                      </div>

                      {/* Duration & Scope */}
                      <div className="mt-3 border-t border-neutral-100 pt-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Duration & Scope</p>
                        <div className="grid gap-3 sm:grid-cols-4">
                          <input
                            type="number"
                            min="0"
                            placeholder="Est. Days"
                            value={newJob.estimated_days}
                            onChange={(e) => setNewJob({ ...newJob, estimated_days: e.target.value })}
                            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                          />
                          <input
                            type="number"
                            min="0"
                            placeholder="Mob Days"
                            value={newJob.mob_days}
                            onChange={(e) => setNewJob({ ...newJob, mob_days: e.target.value })}
                            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                          />
                          <input
                            type="number"
                            min="0"
                            placeholder="Pier Count"
                            value={newJob.pier_count}
                            onChange={(e) => setNewJob({ ...newJob, pier_count: e.target.value })}
                            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                          />
                          <input
                            type="text"
                            placeholder="Scope (e.g. 24in piers to 30ft)"
                            value={newJob.scope_description}
                            onChange={(e) => setNewJob({ ...newJob, scope_description: e.target.value })}
                            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                          />
                        </div>
                      </div>

                      {/* Financial & Dates */}
                      <div className="mt-3 border-t border-neutral-100 pt-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Financial & Dates</p>
                        <div className="grid gap-3 sm:grid-cols-4">
                          <input
                            type="text"
                            placeholder="Bid Amount ($)"
                            value={newJob.bid_amount}
                            onChange={(e) => setNewJob({ ...newJob, bid_amount: e.target.value })}
                            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                          />
                          <input
                            type="text"
                            placeholder="Contract Amount ($)"
                            value={newJob.contract_amount}
                            onChange={(e) => setNewJob({ ...newJob, contract_amount: e.target.value })}
                            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                          />
                          <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
                            Start Date
                            <input
                              type="date"
                              value={newJob.start_date}
                              onChange={(e) => setNewJob({ ...newJob, start_date: e.target.value })}
                              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-normal text-neutral-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                            />
                          </label>
                          <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
                            End Date
                            <input
                              type="date"
                              value={newJob.end_date}
                              onChange={(e) => setNewJob({ ...newJob, end_date: e.target.value })}
                              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-normal text-neutral-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                            />
                          </label>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm text-neutral-600">
                          <input
                            type="checkbox"
                            checked={newJob.crane_required}
                            onChange={(e) => setNewJob({ ...newJob, crane_required: e.target.checked })}
                            className="rounded border-neutral-300 text-red-600 focus:ring-red-500"
                          />
                          Crane Required
                        </label>
                        <button
                          onClick={addJob}
                          disabled={saving || !newJob.job_name.trim()}
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          Add Job
                        </button>
                      </div>
                    </div>

                    {customerNames.length > 0 && (
                      <datalist id="customer-options">
                        {customerNames.map((name) => (
                          <option key={name} value={name} />
                        ))}
                      </datalist>
                    )}

                    {editingJob && (
                      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <h3 className={`${lato.className} font-bold text-neutral-900`}>
                            Edit Job: {editingJob.job_name || "Untitled"}
                          </h3>
                          <button
                            onClick={() => setEditingJob(null)}
                            className="rounded-md px-3 py-1 text-sm text-neutral-600 hover:bg-white/70"
                          >
                            Cancel
                          </button>
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <input type="text" placeholder="Job Name *" value={editingJob.job_name} onChange={(e) => setEditingJob({ ...editingJob, job_name: e.target.value })} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" />
                          <input type="text" placeholder="Job Number" value={editingJob.job_number} onChange={(e) => setEditingJob({ ...editingJob, job_number: e.target.value })} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" />
                          <input type="text" placeholder="Dig Tess #" value={editingJob.dig_tess_number} onChange={(e) => setEditingJob({ ...editingJob, dig_tess_number: e.target.value })} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" />
                          <input type="text" placeholder="Customer Name" value={editingJob.customer_name} onChange={(e) => setEditingJob({ ...editingJob, customer_name: e.target.value })} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" />
                          <input type="text" placeholder="Hiring Contractor" value={editingJob.hiring_contractor} onChange={(e) => setEditingJob({ ...editingJob, hiring_contractor: e.target.value })} list="customer-options" className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" />
                          <input type="text" placeholder="Contact Name" value={editingJob.hiring_contact_name} onChange={(e) => setEditingJob({ ...editingJob, hiring_contact_name: e.target.value })} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" />
                          <input type="text" placeholder="Contact Phone" value={editingJob.hiring_contact_phone} onChange={(e) => setEditingJob({ ...editingJob, hiring_contact_phone: e.target.value })} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" />
                          <input type="email" placeholder="Contact Email" value={editingJob.hiring_contact_email} onChange={(e) => setEditingJob({ ...editingJob, hiring_contact_email: e.target.value })} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" />
                          <input type="text" placeholder="Address" value={editingJob.address} onChange={(e) => setEditingJob({ ...editingJob, address: e.target.value })} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" />
                          <input type="text" placeholder="City" value={editingJob.city} onChange={(e) => setEditingJob({ ...editingJob, city: e.target.value })} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" />
                          <input type="text" placeholder="ZIP" value={editingJob.zip} onChange={(e) => setEditingJob({ ...editingJob, zip: e.target.value })} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" />
                          <input type="text" placeholder="S&W PM Name" value={editingJob.pm_name} onChange={(e) => setEditingJob({ ...editingJob, pm_name: e.target.value })} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" />
                          <input type="text" placeholder="PM Phone" value={editingJob.pm_phone} onChange={(e) => setEditingJob({ ...editingJob, pm_phone: e.target.value })} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" />
                          <input type="text" placeholder="Default Rig" value={editingJob.default_rig} onChange={(e) => setEditingJob({ ...editingJob, default_rig: e.target.value })} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" />
                          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
                            <span>Job Status</span>
                            <select
                              value={editingJob.job_status || "active"}
                              onChange={(e) => setEditingJob({ ...editingJob, job_status: e.target.value })}
                              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-normal focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                            >
                              <option value="active">Active</option>
                              <option value="bid">Bid</option>
                              <option value="awarded">Awarded</option>
                              <option value="scheduled">Scheduled</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                              <option value="on_hold">On Hold</option>
                            </select>
                          </label>
                        </div>
                        {/* Duration & Scope */}
                        <div className="mt-3 border-t border-blue-200 pt-3">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Duration & Scope</p>
                          <div className="grid gap-3 sm:grid-cols-4">
                            <input type="number" min="0" placeholder="Est. Days" value={editingJob.estimated_days || ""} onChange={(e) => setEditingJob({ ...editingJob, estimated_days: e.target.value })} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" />
                            <input type="number" min="0" placeholder="Mob Days" value={editingJob.mob_days || ""} onChange={(e) => setEditingJob({ ...editingJob, mob_days: e.target.value })} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" />
                            <input type="number" min="0" placeholder="Pier Count" value={editingJob.pier_count || ""} onChange={(e) => setEditingJob({ ...editingJob, pier_count: e.target.value })} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" />
                            <input type="text" placeholder="Scope Description" value={editingJob.scope_description || ""} onChange={(e) => setEditingJob({ ...editingJob, scope_description: e.target.value })} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" />
                          </div>
                        </div>
                        {/* Financial & Dates */}
                        <div className="mt-3 border-t border-blue-200 pt-3">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Financial & Dates</p>
                          <div className="grid gap-3 sm:grid-cols-4">
                            <input type="text" placeholder="Bid Amount ($)" value={editingJob.bid_amount || ""} onChange={(e) => setEditingJob({ ...editingJob, bid_amount: e.target.value })} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" />
                            <input type="text" placeholder="Contract Amount ($)" value={editingJob.contract_amount || ""} onChange={(e) => setEditingJob({ ...editingJob, contract_amount: e.target.value })} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" />
                            <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
                              Start Date
                              <input type="date" value={editingJob.start_date || ""} onChange={(e) => setEditingJob({ ...editingJob, start_date: e.target.value })} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-normal text-neutral-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" />
                            </label>
                            <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
                              End Date
                              <input type="date" value={editingJob.end_date || ""} onChange={(e) => setEditingJob({ ...editingJob, end_date: e.target.value })} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-normal text-neutral-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" />
                            </label>
                          </div>
                        </div>
                        {/* Actuals (for completed jobs) */}
                        {(editingJob.job_status === "completed" || editingJob.actual_days || editingJob.actual_mob_days) && (
                          <div className="mt-3 border-t border-blue-200 pt-3">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Actuals</p>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <input type="number" min="0" placeholder="Actual Work Days" value={editingJob.actual_days || ""} onChange={(e) => setEditingJob({ ...editingJob, actual_days: e.target.value })} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" />
                              <input type="number" min="0" placeholder="Actual Mob Days" value={editingJob.actual_mob_days || ""} onChange={(e) => setEditingJob({ ...editingJob, actual_mob_days: e.target.value })} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" />
                            </div>
                          </div>
                        )}
                        <div className="mt-3 flex items-center justify-between">
                          <label className="flex items-center gap-2 text-sm text-neutral-600">
                            <input
                              type="checkbox"
                              checked={editingJob.crane_required}
                              onChange={(e) => setEditingJob({ ...editingJob, crane_required: e.target.checked })}
                              className="rounded border-neutral-300 text-red-600 focus:ring-red-500"
                            />
                            Crane Required
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditingJob(null)}
                              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => updateJob(editingJob.id, normalizeJobInput(editingJob))}
                              disabled={!editingJob.job_name.trim()}
                              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Jobs List */}
                    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
                      <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <h3 className={`${lato.className} font-bold text-neutral-900`}>
                              Manage Jobs ({jobAdminRows.length})
                            </h3>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold">
                              <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
                                Active: {activeJobCount}
                              </span>
                              <span className="rounded-full bg-neutral-200 px-2 py-1 text-neutral-700">
                                Inactive: {jobAdminRows.length - activeJobCount}
                              </span>
                            </div>
                          </div>
                          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                            <input
                              type="text"
                              placeholder="Search jobs..."
                              value={jobListSearch}
                              onChange={(e) => setJobListSearch(e.target.value)}
                              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 sm:w-64"
                            />
                            <select
                              value={jobListFilter}
                              onChange={(e) => setJobListFilter(e.target.value)}
                              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                            >
                              <option value="active">Active Only</option>
                              <option value="inactive">Inactive Only</option>
                              <option value="all">All Jobs</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      <div className="divide-y">
                        {jobAdminRows.length === 0 ? (
                          <div className="px-4 py-8 text-center text-neutral-500">
                            No jobs yet. Add your first job above.
                          </div>
                        ) : filteredJobAdminRows.length === 0 ? (
                          <div className="px-4 py-8 text-center text-neutral-500">
                            No jobs match the current filter.
                          </div>
                        ) : (
                          filteredJobAdminRows.map((job) => {
                            const progress = getJobProgress(job.id);
                            const progressPercent = getProgressPercent(progress);
                            const isEditingProgress = editingProgressJobId === job.id;
                            const isJobActive = isCrewJobActive(job);

                            return (
                              <div
                                key={job.id}
                                className={`px-4 py-3 transition-colors ${
                                  isJobActive ? "hover:bg-neutral-50" : "bg-neutral-50/70 hover:bg-neutral-100"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-neutral-900">
                                        {job.job_name}
                                      </span>
                                      {job.job_number && (
                                        <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                                          #{job.job_number}
                                        </span>
                                      )}
                                      {job.crane_required && (
                                        <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                                          Crane
                                        </span>
                                      )}
                                      {job.job_status && job.job_status !== "active" && (
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                          { bid: "bg-amber-50 text-amber-700", awarded: "bg-blue-50 text-blue-700", scheduled: "bg-violet-50 text-violet-700", in_progress: "bg-cyan-50 text-cyan-700", completed: "bg-emerald-50 text-emerald-700", on_hold: "bg-orange-50 text-orange-700" }[job.job_status] || "bg-neutral-100 text-neutral-700"
                                        }`}>
                                          {(job.job_status || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                                        </span>
                                      )}
                                      <span
                                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                          isJobActive
                                            ? "bg-emerald-50 text-emerald-700"
                                            : "bg-neutral-200 text-neutral-700"
                                        }`}
                                      >
                                        {isJobActive ? "Active" : "Inactive"}
                                      </span>
                                    </div>
                                    <div className="mt-1 text-sm text-neutral-500">
                                      {[job.address, job.city, job.zip]
                                        .filter(Boolean)
                                        .join(", ") || "No address"}
                                    </div>
                                    {(job.pm_name || job.pm_phone) && (
                                      <div className="mt-1 text-sm text-neutral-500">
                                        PM: {job.pm_name}
                                        {job.pm_phone ? ` • ${job.pm_phone}` : ""}
                                      </div>
                                    )}
                                    {job.dig_tess_number && (
                                      <div className="mt-1 text-sm text-neutral-500">
                                        Dig Tess #: {job.dig_tess_number}
                                      </div>
                                    )}
                                    {(job.hiring_contractor ||
                                      job.hiring_contact_name ||
                                      job.hiring_contact_phone ||
                                      job.hiring_contact_email) && (
                                      <div className="mt-1 text-sm text-neutral-500">
                                        {job.hiring_contractor
                                          ? `Hiring: ${job.hiring_contractor}`
                                          : "Hiring Contact"}{" "}
                                        {[
                                          job.hiring_contact_name,
                                          job.hiring_contact_phone,
                                          job.hiring_contact_email,
                                        ]
                                          .filter(Boolean)
                                          .join(" • ")}
                                      </div>
                                    )}
                                    {job.customer_name && (
                                      <div className="mt-1 text-sm text-neutral-500">
                                        Customer: {job.customer_name}
                                      </div>
                                    )}
                                    {(job.estimated_days || job.mob_days || job.pier_count || job.scope_description) && (
                                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-neutral-500">
                                        {job.estimated_days != null && (
                                          <span className="rounded bg-neutral-100 px-1.5 py-0.5">{job.estimated_days}d est</span>
                                        )}
                                        {job.mob_days != null && (
                                          <span className="rounded bg-neutral-100 px-1.5 py-0.5">{job.mob_days}d mob</span>
                                        )}
                                        {job.pier_count != null && (
                                          <span className="rounded bg-neutral-100 px-1.5 py-0.5">{job.pier_count} piers</span>
                                        )}
                                        {job.scope_description && (
                                          <span className="rounded bg-neutral-100 px-1.5 py-0.5">{job.scope_description}</span>
                                        )}
                                      </div>
                                    )}
                                    {(job.bid_amount || job.contract_amount || job.start_date) && (
                                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-neutral-500">
                                        {job.bid_amount != null && (
                                          <span className="rounded bg-green-50 px-1.5 py-0.5 text-green-700">Bid: ${Number(job.bid_amount).toLocaleString()}</span>
                                        )}
                                        {job.contract_amount != null && (
                                          <span className="rounded bg-green-50 px-1.5 py-0.5 text-green-700">Contract: ${Number(job.contract_amount).toLocaleString()}</span>
                                        )}
                                        {job.start_date && (
                                          <span className="rounded bg-neutral-100 px-1.5 py-0.5">Start: {job.start_date}</span>
                                        )}
                                        {job.end_date && (
                                          <span className="rounded bg-neutral-100 px-1.5 py-0.5">End: {job.end_date}</span>
                                        )}
                                      </div>
                                    )}

                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-700">
                                        {getProgressStatusLabel(progress?.status || "planned")}
                                      </span>
                                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                                        Holes:{" "}
                                        {progress?.holes_completed ?? 0}
                                        {progress?.holes_target
                                          ? ` / ${progress.holes_target}`
                                          : ""}
                                        {progressPercent !== null
                                          ? ` (${progressPercent}%)`
                                          : ""}
                                      </span>
                                      {formatProgressDateRange(progress) && (
                                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                          ETA: {formatProgressDateRange(progress)}
                                        </span>
                                      )}
                                    </div>
                                    {progress?.notes && (
                                      <div className="mt-1 text-xs text-neutral-500">
                                        Progress note: {progress.notes}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {jobProgressAvailable && isJobActive && (
                                      <button
                                        onClick={() =>
                                          isEditingProgress
                                            ? cancelEditingProgress()
                                            : startEditingProgress(job.id)
                                        }
                                        className="rounded-md px-3 py-1 text-sm text-blue-700 hover:bg-blue-50 transition-colors"
                                      >
                                        {isEditingProgress
                                          ? "Close Progress"
                                          : "Update Progress"}
                                      </button>
                                    )}
                                    <button
                                      onClick={() => startEditingJob(job)}
                                      className="rounded-md px-3 py-1 text-sm text-neutral-600 hover:bg-neutral-100 transition-colors"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => toggleJobActive(job)}
                                      className={`rounded-md px-3 py-1 text-sm transition-colors ${
                                        isJobActive
                                          ? "text-neutral-500 hover:bg-red-50 hover:text-red-600"
                                          : "text-emerald-700 hover:bg-emerald-50"
                                      }`}
                                    >
                                      {isJobActive ? "Set Inactive" : "Set Active"}
                                    </button>
                                  </div>
                                </div>

                                {isEditingProgress && editingProgress && (
                                  <div className="mt-3 rounded-lg border border-neutral-200 bg-white p-3">
                                    <div className="grid gap-3 sm:grid-cols-2">
                                      <label className="text-xs font-semibold text-neutral-500">
                                        Status
                                        <select
                                          value={editingProgress.status}
                                          onChange={(e) =>
                                            setEditingProgress((prev) => ({
                                              ...prev,
                                              status: e.target.value,
                                            }))
                                          }
                                          className="mt-1 h-9 w-full rounded border border-neutral-300 px-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        >
                                          {JOB_PROGRESS_STATUS_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                              {option.label}
                                            </option>
                                          ))}
                                        </select>
                                      </label>
                                      <label className="text-xs font-semibold text-neutral-500">
                                        Holes Completed
                                        <input
                                          type="number"
                                          min="0"
                                          value={editingProgress.holes_completed}
                                          onChange={(e) =>
                                            setEditingProgress((prev) => ({
                                              ...prev,
                                              holes_completed: e.target.value,
                                            }))
                                          }
                                          className="mt-1 h-9 w-full rounded border border-neutral-300 px-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                      </label>
                                      <label className="text-xs font-semibold text-neutral-500">
                                        Total Holes (Estimate)
                                        <input
                                          type="number"
                                          min="0"
                                          value={editingProgress.holes_target}
                                          onChange={(e) =>
                                            setEditingProgress((prev) => ({
                                              ...prev,
                                              holes_target: e.target.value,
                                            }))
                                          }
                                          className="mt-1 h-9 w-full rounded border border-neutral-300 px-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                      </label>
                                      <label className="text-xs font-semibold text-neutral-500">
                                        Estimated Start
                                        <input
                                          type="date"
                                          value={editingProgress.estimated_start_date}
                                          onChange={(e) =>
                                            setEditingProgress((prev) => ({
                                              ...prev,
                                              estimated_start_date: e.target.value,
                                            }))
                                          }
                                          className="mt-1 h-9 w-full rounded border border-neutral-300 px-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                      </label>
                                      <label className="text-xs font-semibold text-neutral-500 sm:col-span-2">
                                        Estimated Finish
                                        <input
                                          type="date"
                                          value={editingProgress.estimated_end_date}
                                          onChange={(e) =>
                                            setEditingProgress((prev) => ({
                                              ...prev,
                                              estimated_end_date: e.target.value,
                                            }))
                                          }
                                          className="mt-1 h-9 w-full rounded border border-neutral-300 px-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                      </label>
                                      <label className="text-xs font-semibold text-neutral-500 sm:col-span-2">
                                        Progress Notes
                                        <textarea
                                          rows={2}
                                          value={editingProgress.notes}
                                          onChange={(e) =>
                                            setEditingProgress((prev) => ({
                                              ...prev,
                                              notes: e.target.value,
                                            }))
                                          }
                                          placeholder="Anything important from this update..."
                                          className="mt-1 w-full rounded border border-neutral-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                      </label>
                                    </div>
                                    <div className="mt-3 flex justify-end gap-2">
                                      <button
                                        onClick={cancelEditingProgress}
                                        className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={() => saveJobProgress(job.id)}
                                        disabled={savingProgress}
                                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                                      >
                                        {savingProgress ? "Saving..." : "Save Progress"}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ---- RIGS TAB ---- */}
                {managePanelTab === "rigs" && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                      <h3 className={`${lato.className} mb-3 font-bold text-neutral-900`}>
                        Add New Category
                      </h3>
                      <div className="flex flex-wrap items-center gap-3">
                        <input
                          type="text"
                          placeholder="Category name (e.g., Rig 1, Crane, Shop)"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          className="flex-1 min-w-[200px] rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-neutral-600">Color:</label>
                          <input
                            type="color"
                            value={newCategoryColor}
                            onChange={(e) => setNewCategoryColor(e.target.value)}
                            className="h-9 w-14 cursor-pointer rounded border border-neutral-300"
                          />
                        </div>
                        <button
                          onClick={addCategory}
                          disabled={saving || !newCategoryName.trim()}
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          Add Category
                        </button>
                      </div>
                    </div>

                    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
                      <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3">
                        <h3 className={`${lato.className} font-bold text-neutral-900`}>
                          Categories ({categories.length})
                        </h3>
                      </div>
                      <div className="divide-y">
                        {categories.length === 0 ? (
                          <div className="px-4 py-8 text-center text-neutral-500">
                            No categories created yet. Add categories like &quot;Rig 1&quot;, &quot;Crane&quot;, &quot;Equipment&quot;, etc.
                          </div>
                        ) : (
                          categories.map((category) => (
                            <div key={category.id} className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50">
                              <div className="flex items-center gap-3">
                                <div className="h-6 w-6 rounded" style={{ backgroundColor: category.color }}></div>
                                <span className="font-semibold text-neutral-900">{category.name}</span>
                              </div>
                              <button
                                onClick={() => deleteCategory(category.id)}
                                className="rounded-md px-3 py-1 text-sm text-neutral-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export { CrewScheduler };

CrewScheduler.getLayout = function getLayout(page) {
  return <TWAdminLayout>{page}</TWAdminLayout>;
};

export default withAuthTw(CrewScheduler);
