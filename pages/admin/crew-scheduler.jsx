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

// Format date for input
const toDateString = (date) => {
  const d = new Date(date);
  return d.toISOString().split("T")[0];
};

const formatWorkerLabel = (worker) => {
  if (!worker?.name) return "";
  return worker.role ? `${worker.name} (${worker.role})` : worker.name;
};

const formatWorkerOption = (worker) => {
  if (!worker?.name) return "";
  return worker.role ? `${worker.name} — ${worker.role}` : worker.name;
};

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

function CrewScheduler() {
  const [activeTab, setActiveTab] = useState("schedule");
  const [selectedDate, setSelectedDate] = useState(toDateString(new Date()));
  const [workers, setWorkers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [jobs, setJobs] = useState([]);
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
  const [newJob, setNewJob] = useState({
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
  });
  const [editingJob, setEditingJob] = useState(null);

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
  const [copyStartDate, setCopyStartDate] = useState(toDateString(new Date()));
  const [copyEndDate, setCopyEndDate] = useState(toDateString(new Date()));
  const [copyOverwrite, setCopyOverwrite] = useState(false);
  const [copyingCategoryId, setCopyingCategoryId] = useState(null);
  const [copyStatus, setCopyStatus] = useState(null);

  // Fetch workers, categories, jobs, superintendents, trucks on mount
  useEffect(() => {
    fetchWorkers();
    fetchCategories();
    fetchJobs();
    fetchSuperintendents();
    fetchTrucks();
    fetchCustomers();
    fetchRecentSchedules();
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
      .eq("is_active", true)
      .order("job_name");
    if (!error) setJobs(data || []);
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

  const normalizeJobInput = (job) => ({
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
  });

  const addJob = async () => {
    const payload = normalizeJobInput(newJob);
    if (!payload.job_name) return;
    setSaving(true);
    const { error } = await supabase.from("crew_jobs").insert(payload);
    if (!error) {
      await ensureCustomerExists(payload.hiring_contractor);
      setNewJob({
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
      });
      fetchJobs();
    }
    setSaving(false);
  };

  const updateJob = async (id, updates) => {
    await supabase.from("crew_jobs").update(updates).eq("id", id);
    fetchJobs();
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
    });
  };

  const deleteJob = async (id) => {
    if (!confirm("Deactivate this job? It will no longer appear in the scheduler.")) return;
    await supabase.from("crew_jobs").update({ is_active: false }).eq("id", id);
    fetchJobs();
  };

  const fetchSchedule = async (date) => {
    // Get or create schedule for this date
    let { data: schedule, error } = await supabase
      .from("crew_schedules")
      .select("*")
      .eq("schedule_date", date)
      .single();

    if (error && error.code === "PGRST116") {
      // No schedule exists, create one
      const { data: newSchedule } = await supabase
        .from("crew_schedules")
        .insert({ schedule_date: date })
        .select()
        .single();
      schedule = newSchedule;
    }

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

      const emailAssignments = assignments.map((a) => ({
        category_id: a.category_id,
        worker_name: formatWorkerLabel(a.crew_workers) || "Unassigned",
        job_name: a.crew_jobs?.job_name || a.job_name || "",
      }));

      const emailRigDetails = Object.entries(rigDetails).map(([catId, detail]) => ({
        category_id: catId,
        superintendent_name: detail.superintendent_name || "",
        truck_number: detail.truck_number || "",
        crane_info: detail.crane_info || "",
      }));

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
            const detail = rigDetails[cat.id] || {};
            const detailLine = [
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
                    catAssignments.length > 0
                          ? catAssignments
                          .map(
                            (a) => `
                        <div class="assignment">
                          <span class="worker-name">${
                            formatWorkerLabel(a.crew_workers) || "Unassigned"
                          }</span>
                          <span class="job-name">${a.crew_jobs?.job_name || a.job_name || ""}</span>
                        </div>
                      `
                          )
                          .join("")
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

  // --- Tab definitions ---
  const tabs = [
    { id: "schedule", label: "Build Schedule" },
    { id: "packets", label: "Daily Packets" },
    { id: "jobs", label: "Manage Jobs" },
    { id: "workers", label: "Crew & Titles" },
    { id: "categories", label: "Rigs & Categories" },
    { id: "superintendents", label: "Superintendents" },
    { id: "trucks", label: "Trucks" },
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
      <div>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/att.png"
              alt="S&W Foundation logo"
              className="h-12 w-12 object-contain"
            />
            <div>
              <h1
                className={`${lato.className} text-2xl font-extrabold text-[#0b2a5a]`}
              >
                S&amp;W Foundation Crew Scheduler
              </h1>
              <p className="mt-1 text-sm text-neutral-600">
                Foundation since 1986 • Build daily crew assignments, email schedules,
                and print packets
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Finalized badge */}
            {currentSchedule?.is_finalized && (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                Finalized
              </span>
            )}
            <div className="flex items-center gap-2">
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
                onClick={() => setSelectedDate(toDateString(new Date()))}
                className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                Today
              </button>
            </div>
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
                  ...new Map(
                    jobAssignments.map((a) => [a.job_id, a])
                  ).values(),
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
                    setTimeout(
                      () => handlePrintCoverSheet(assignment),
                      i * 600
                    );
                    setTimeout(
                      () => handlePrintDailyLog(assignment),
                      i * 600 + 300
                    );
                  });
                }
              }}
              className="h-9 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
            >
              Print All Forms
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
                : "Save & Email Schedule"}
            </button>
          </div>
        </div>

        {/* Email status messages */}
        {emailStatus && (
          <div
            className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${
              emailStatus.type === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {emailStatus.message}
            <button
              onClick={() => setEmailStatus(null)}
              className="ml-2 font-bold"
            >
              x
            </button>
          </div>
        )}

        {/* Finalized warning */}
        {currentSchedule?.is_finalized && activeTab === "schedule" && (
          <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
            This schedule was finalized
            {currentSchedule?.finalized_at
              ? ` on ${formatDateTime(currentSchedule.finalized_at)}`
              : ""}. You can still edit and resend if plans change.
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-1 overflow-x-auto rounded-lg bg-neutral-100 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ============================================ */}
        {/* Schedule Tab (Phase 3: enhanced with rig details) */}
        {/* ============================================ */}
        {activeTab === "schedule" && (
          <div ref={printRef}>
            <div className="mb-4 rounded-lg bg-[#0b2a5a] px-4 py-3">
              <h2
                className={`${lato.className} text-lg font-bold text-white`}
              >
                {formatDate(selectedDate)}
              </h2>
            </div>

            <div className="print:hidden mb-4 grid gap-4 lg:grid-cols-[1.2fr,1.8fr]">
              <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className={`${lato.className} text-base font-bold text-neutral-900`}>
                    Prepopulate By Rig
                  </h3>
                </div>
                <p className="mt-1 text-sm text-neutral-600">
                  Choose a date range, then click &quot;Copy Rig&quot; on the rig
                  card you want to prefill.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <label className="text-xs font-semibold text-neutral-500">
                    Start date
                    <input
                      type="date"
                      value={copyStartDate}
                      onChange={(e) => setCopyStartDate(e.target.value)}
                      className="mt-1 h-9 w-full rounded-lg border border-neutral-300 px-3 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </label>
                  <label className="text-xs font-semibold text-neutral-500">
                    End date
                    <input
                      type="date"
                      value={copyEndDate}
                      onChange={(e) => setCopyEndDate(e.target.value)}
                      className="mt-1 h-9 w-full rounded-lg border border-neutral-300 px-3 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </label>
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-neutral-600">
                    <input
                      type="checkbox"
                      checked={copyOverwrite}
                      onChange={(e) => setCopyOverwrite(e.target.checked)}
                      className="rounded border-neutral-300 text-red-600 focus:ring-red-500"
                    />
                    Overwrite existing schedules in range
                  </label>
                  <span className="text-xs font-semibold text-neutral-500">
                    Use each rig&apos;s Copy button
                  </span>
                </div>
                <p className="mt-2 text-xs text-neutral-500">
                  Current day is excluded to prevent duplicates.
                </p>
                {copyStatus && (
                  <div
                    className={`mt-3 rounded-lg px-3 py-2 text-xs font-semibold ${
                      copyStatus.type === "success"
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {copyStatus.message}
                    <button
                      onClick={() => setCopyStatus(null)}
                      className="ml-2 font-bold"
                    >
                      x
                    </button>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-neutral-200 bg-gradient-to-br from-blue-50 via-white to-red-50 p-4 shadow-sm">
                <h3 className={`${lato.className} text-base font-bold text-neutral-900`}>
                  Suggested Flow
                </h3>
                <div className="mt-2 space-y-2 text-sm text-neutral-700">
                  <div>
                    <span className="font-semibold text-[#0b2a5a]">1.</span> Add
                    jobs with addresses and PM info.
                  </div>
                  <div>
                    <span className="font-semibold text-[#0b2a5a]">2.</span> Add
                    crew members and job titles.
                  </div>
                  <div>
                    <span className="font-semibold text-[#0b2a5a]">3.</span> Set
                    up rigs, cranes, or shop categories.
                  </div>
                  <div>
                    <span className="font-semibold text-[#0b2a5a]">4.</span> Build
                    the schedule, then prepopulate future days.
                  </div>
                </div>
              </div>
            </div>

            {recentSchedules.length > 0 && (
              <div className="print:hidden mb-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className={`${lato.className} text-base font-bold text-neutral-900`}>
                      Recent Schedules
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Jump to a previous day to review, edit, or resend.
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedDate(toDateString(new Date()))}
                    className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                  >
                    Go to Today
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {recentSchedules.map((sched) => {
                    const isSelected = sched.schedule_date === selectedDate;
                    const statusClass = sched.is_finalized
                      ? isSelected
                        ? "text-emerald-200"
                        : "text-emerald-600"
                      : isSelected
                      ? "text-neutral-200"
                      : "text-neutral-400";
                    return (
                      <button
                        key={sched.id}
                        onClick={() => setSelectedDate(sched.schedule_date)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          isSelected
                            ? "border-[#0b2a5a] bg-[#0b2a5a] text-white"
                            : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                        }`}
                      >
                        {formatShortDate(sched.schedule_date)}
                        <span
                          className={`ml-2 text-[10px] uppercase ${statusClass}`}
                        >
                          {sched.is_finalized ? "Finalized" : "Draft"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
              {categories.map((category) => {
                const catAssignments = assignments.filter(
                  (a) => a.category_id === category.id
                );
                const detail = rigDetails[category.id] || {};

                return (
                  <div
                    key={category.id}
                    className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden"
                  >
                    <div
                      className="flex items-center justify-between px-4 py-3"
                      style={{ backgroundColor: category.color }}
                    >
                      <h3
                        className={`${lato.className} font-bold text-white`}
                      >
                        {category.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            handlePrintAllForCategory(category.id)
                          }
                          className="rounded-md bg-white/20 px-2 py-1 text-xs font-semibold text-white hover:bg-white/30 transition-colors"
                          title="Print all forms for this rig"
                        >
                          Print Forms
                        </button>
                        <button
                          onClick={() => handleCopyCategoryRange(category.id)}
                          disabled={copyingCategoryId !== null}
                          className="rounded-md bg-white/20 px-2 py-1 text-xs font-semibold text-white hover:bg-white/30 transition-colors disabled:opacity-60"
                          title="Copy this rig's crews to the date range above"
                        >
                          {copyingCategoryId === category.id ? "Copying..." : "Copy Rig"}
                        </button>
                        <button
                          onClick={() => clearCategorySchedule(category.id)}
                          className="rounded-md bg-white/20 px-2 py-1 text-xs font-semibold text-white hover:bg-white/30 transition-colors"
                          title="Clear crew assignments and rig details for this category"
                        >
                          Clear Rig
                        </button>
                        <button
                          onClick={() => addAssignment(category.id)}
                          className="rounded-md bg-white/20 px-2 py-1 text-xs font-semibold text-white hover:bg-white/30 transition-colors"
                        >
                          + Add Crew
                        </button>
                      </div>
                    </div>

                    {/* Phase 3: Per-rig details section */}
                    <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-2">
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={detail.superintendent_id || ""}
                          onChange={(e) =>
                            updateRigDetail(
                              category.id,
                              "superintendent_id",
                              e.target.value || null
                            )
                          }
                          className="rounded border border-neutral-300 px-2 py-1.5 text-xs focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                        >
                          <option value="">Superintendent...</option>
                          {superintendents.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                        <select
                          value={detail.truck_id || ""}
                          onChange={(e) =>
                            updateRigDetail(
                              category.id,
                              "truck_id",
                              e.target.value || null
                            )
                          }
                          className="rounded border border-neutral-300 px-2 py-1.5 text-xs focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                        >
                          <option value="">Truck #...</option>
                          {trucks.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.truck_number}
                              {t.description
                                ? ` - ${t.description}`
                                : ""}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Crane ID / Name"
                          defaultValue={detail.crane_info || ""}
                          onBlur={(e) =>
                            updateRigDetail(
                              category.id,
                              "crane_info",
                              e.target.value
                            )
                          }
                          className="rounded border border-neutral-300 px-2 py-1.5 text-xs focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                        <input
                          type="text"
                          placeholder="Location / Notes"
                          defaultValue={detail.notes || ""}
                          onBlur={(e) =>
                            updateRigDetail(
                              category.id,
                              "notes",
                              e.target.value
                            )
                          }
                          className="rounded border border-neutral-300 px-2 py-1.5 text-xs focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                      </div>
                    </div>

                    <div className="divide-y">
                      {catAssignments.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-neutral-400">
                          No crew assigned. Click &quot;+ Add Crew&quot; to
                          start.
                        </div>
                      ) : (
                        catAssignments.map((assignment) => (
                          <div
                            key={assignment.id}
                            className="flex items-center gap-2 px-4 py-3"
                          >
                            <select
                              value={assignment.worker_id || ""}
                              onChange={(e) =>
                                updateAssignment(assignment.id, {
                                  worker_id: e.target.value || null,
                                })
                              }
                              className="w-36 rounded-md border border-neutral-300 px-2 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                            >
                              <option value="">Select worker...</option>
                              {workers.map((w) => (
                                <option key={w.id} value={w.id}>
                                  {formatWorkerOption(w)}
                                </option>
                              ))}
                            </select>
                            <select
                              value={assignment.job_id || ""}
                              onChange={(e) =>
                                updateAssignment(assignment.id, {
                                  job_id: e.target.value || null,
                                  job_name: e.target.value
                                    ? jobs.find(
                                        (j) => j.id === e.target.value
                                      )?.job_name
                                    : assignment.job_name,
                                })
                              }
                              className="flex-1 rounded-md border border-neutral-300 px-2 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                            >
                              <option value="">Select job...</option>
                              {jobs.map((j) => (
                                <option key={j.id} value={j.id}>
                                  {j.job_number
                                    ? `${j.job_number} - `
                                    : ""}
                                  {j.job_name}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => splitAssignment(assignment)}
                              className="rounded-md border border-neutral-200 px-2 py-1 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
                              title="Add another job for this crew member"
                            >
                              Split
                            </button>
                            {assignment.job_id && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() =>
                                    handlePrintCoverSheet(assignment)
                                  }
                                  className="rounded-md p-2 text-neutral-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                  title="Print Cover Sheet"
                                >
                                  <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                  </svg>
                                </button>
                                <button
                                  onClick={() =>
                                    handlePrintDailyLog(assignment)
                                  }
                                  className="rounded-md p-2 text-neutral-400 hover:bg-green-50 hover:text-green-600 transition-colors"
                                  title="Print Daily Log & Inspection"
                                >
                                  <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                  </svg>
                                </button>
                              </div>
                            )}
                            <button
                              onClick={() =>
                                deleteAssignment(assignment.id)
                              }
                              className="rounded-md p-2 text-neutral-400 hover:bg-neutral-100 hover:text-red-600 transition-colors"
                            >
                              <svg
                                className="h-4 w-4"
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
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {categories.length === 0 && (
              <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-12 text-center">
                <p className="text-neutral-600">
                  No categories created yet.
                </p>
                <button
                  onClick={() => setActiveTab("categories")}
                  className="mt-2 text-sm font-semibold text-red-600 hover:text-red-700"
                >
                  Create your first category
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============================================ */}
        {/* Daily Packets Tab (Phase 6) */}
        {/* ============================================ */}
        {activeTab === "packets" && (
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
                              // Also update local jobs list
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
        )}

        {/* ============================================ */}
        {/* Jobs Tab */}
        {/* ============================================ */}
        {activeTab === "jobs" && (
          <div className="space-y-4">
            {/* Add Job Form */}
            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <h3
                className={`${lato.className} mb-3 font-bold text-neutral-900`}
              >
                Add New Job
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <input
                  type="text"
                  placeholder="Job Name *"
                  value={newJob.job_name}
                  onChange={(e) =>
                    setNewJob({ ...newJob, job_name: e.target.value })
                  }
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <input
                  type="text"
                  placeholder="Job Number"
                  value={newJob.job_number}
                  onChange={(e) =>
                    setNewJob({ ...newJob, job_number: e.target.value })
                  }
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <input
                  type="text"
                  placeholder="Dig Tess #"
                  value={newJob.dig_tess_number}
                  onChange={(e) =>
                    setNewJob({ ...newJob, dig_tess_number: e.target.value })
                  }
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={newJob.customer_name}
                  onChange={(e) =>
                    setNewJob({ ...newJob, customer_name: e.target.value })
                  }
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <input
                  type="text"
                  placeholder="Hiring Contractor"
                  value={newJob.hiring_contractor}
                  onChange={(e) =>
                    setNewJob({ ...newJob, hiring_contractor: e.target.value })
                  }
                  list="customer-options"
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <input
                  type="text"
                  placeholder="Contact Name"
                  value={newJob.hiring_contact_name}
                  onChange={(e) =>
                    setNewJob({ ...newJob, hiring_contact_name: e.target.value })
                  }
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <input
                  type="text"
                  placeholder="Contact Phone"
                  value={newJob.hiring_contact_phone}
                  onChange={(e) =>
                    setNewJob({ ...newJob, hiring_contact_phone: e.target.value })
                  }
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <input
                  type="email"
                  placeholder="Contact Email"
                  value={newJob.hiring_contact_email}
                  onChange={(e) =>
                    setNewJob({ ...newJob, hiring_contact_email: e.target.value })
                  }
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <input
                  type="text"
                  placeholder="Address"
                  value={newJob.address}
                  onChange={(e) =>
                    setNewJob({ ...newJob, address: e.target.value })
                  }
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <input
                  type="text"
                  placeholder="City"
                  value={newJob.city}
                  onChange={(e) =>
                    setNewJob({ ...newJob, city: e.target.value })
                  }
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <input
                  type="text"
                  placeholder="ZIP"
                  value={newJob.zip}
                  onChange={(e) =>
                    setNewJob({ ...newJob, zip: e.target.value })
                  }
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <input
                  type="text"
                  placeholder="S&W PM Name"
                  value={newJob.pm_name}
                  onChange={(e) =>
                    setNewJob({ ...newJob, pm_name: e.target.value })
                  }
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <input
                  type="text"
                  placeholder="PM Phone"
                  value={newJob.pm_phone}
                  onChange={(e) =>
                    setNewJob({ ...newJob, pm_phone: e.target.value })
                  }
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <input
                  type="text"
                  placeholder="Default Rig"
                  value={newJob.default_rig}
                  onChange={(e) =>
                    setNewJob({ ...newJob, default_rig: e.target.value })
                  }
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
              <p className="mt-2 text-xs text-neutral-500">
                Hiring contractor names come from your customer list. Start typing to select
                an existing name or enter a new one.
              </p>
              <div className="mt-3 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-neutral-600">
                  <input
                    type="checkbox"
                    checked={newJob.crane_required}
                    onChange={(e) =>
                      setNewJob({
                        ...newJob,
                        crane_required: e.target.checked,
                      })
                    }
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
                  <h3
                    className={`${lato.className} font-bold text-neutral-900`}
                  >
                    Edit Job: {editingJob.job_name || "Untitled"}
                  </h3>
                  <button
                    onClick={() => setEditingJob(null)}
                    className="rounded-md px-3 py-1 text-sm text-neutral-600 hover:bg-white/70"
                  >
                    Cancel
                  </button>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <input
                    type="text"
                    placeholder="Job Name *"
                    value={editingJob.job_name}
                    onChange={(e) =>
                      setEditingJob({ ...editingJob, job_name: e.target.value })
                    }
                    className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                  <input
                    type="text"
                    placeholder="Job Number"
                    value={editingJob.job_number}
                    onChange={(e) =>
                      setEditingJob({ ...editingJob, job_number: e.target.value })
                    }
                    className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                  <input
                    type="text"
                    placeholder="Dig Tess #"
                    value={editingJob.dig_tess_number}
                    onChange={(e) =>
                      setEditingJob({
                        ...editingJob,
                        dig_tess_number: e.target.value,
                      })
                    }
                    className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                  <input
                    type="text"
                    placeholder="Customer Name"
                    value={editingJob.customer_name}
                    onChange={(e) =>
                      setEditingJob({
                        ...editingJob,
                        customer_name: e.target.value,
                      })
                    }
                    className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                  <input
                    type="text"
                    placeholder="Hiring Contractor"
                    value={editingJob.hiring_contractor}
                    onChange={(e) =>
                      setEditingJob({
                        ...editingJob,
                        hiring_contractor: e.target.value,
                      })
                    }
                    list="customer-options"
                    className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                  <input
                    type="text"
                    placeholder="Contact Name"
                    value={editingJob.hiring_contact_name}
                    onChange={(e) =>
                      setEditingJob({
                        ...editingJob,
                        hiring_contact_name: e.target.value,
                      })
                    }
                    className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                  <input
                    type="text"
                    placeholder="Contact Phone"
                    value={editingJob.hiring_contact_phone}
                    onChange={(e) =>
                      setEditingJob({
                        ...editingJob,
                        hiring_contact_phone: e.target.value,
                      })
                    }
                    className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                  <input
                    type="email"
                    placeholder="Contact Email"
                    value={editingJob.hiring_contact_email}
                    onChange={(e) =>
                      setEditingJob({
                        ...editingJob,
                        hiring_contact_email: e.target.value,
                      })
                    }
                    className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                  <input
                    type="text"
                    placeholder="Address"
                    value={editingJob.address}
                    onChange={(e) =>
                      setEditingJob({ ...editingJob, address: e.target.value })
                    }
                    className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                  <input
                    type="text"
                    placeholder="City"
                    value={editingJob.city}
                    onChange={(e) =>
                      setEditingJob({ ...editingJob, city: e.target.value })
                    }
                    className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                  <input
                    type="text"
                    placeholder="ZIP"
                    value={editingJob.zip}
                    onChange={(e) =>
                      setEditingJob({ ...editingJob, zip: e.target.value })
                    }
                    className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                  <input
                    type="text"
                    placeholder="S&W PM Name"
                    value={editingJob.pm_name}
                    onChange={(e) =>
                      setEditingJob({ ...editingJob, pm_name: e.target.value })
                    }
                    className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                  <input
                    type="text"
                    placeholder="PM Phone"
                    value={editingJob.pm_phone}
                    onChange={(e) =>
                      setEditingJob({ ...editingJob, pm_phone: e.target.value })
                    }
                    className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                  <input
                    type="text"
                    placeholder="Default Rig"
                    value={editingJob.default_rig}
                    onChange={(e) =>
                      setEditingJob({ ...editingJob, default_rig: e.target.value })
                    }
                    className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-neutral-600">
                    <input
                      type="checkbox"
                      checked={editingJob.crane_required}
                      onChange={(e) =>
                        setEditingJob({
                          ...editingJob,
                          crane_required: e.target.checked,
                        })
                      }
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
                      onClick={() =>
                        updateJob(editingJob.id, normalizeJobInput(editingJob))
                      }
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
                <h3
                  className={`${lato.className} font-bold text-neutral-900`}
                >
                  Active Jobs ({jobs.length})
                </h3>
              </div>
              <div className="divide-y">
                {jobs.length === 0 ? (
                  <div className="px-4 py-8 text-center text-neutral-500">
                    No active jobs. Add your first job above.
                  </div>
                ) : (
                  jobs.map((job) => (
                    <div
                      key={job.id}
                      className="px-4 py-3 hover:bg-neutral-50"
                    >
                      <div className="flex items-start justify-between">
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
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startEditingJob(job)}
                            className="rounded-md px-3 py-1 text-sm text-neutral-600 hover:bg-neutral-100 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteJob(job.id)}
                            className="rounded-md px-3 py-1 text-sm text-neutral-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                          >
                            Deactivate
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* Workers Tab */}
        {/* ============================================ */}
        {activeTab === "workers" && (
          <div className="space-y-4">
            {/* Add Worker Form */}
            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <h3
                className={`${lato.className} mb-3 font-bold text-neutral-900`}
              >
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
                    Upload a CSV or paste a list. Supported columns: `name`, `phone`,
                    `role` (optional). You can also paste one name per line.
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
                    placeholder="Name, Phone, Role\nJane Smith, 214-555-0100, Operator\nJohn Doe\n"
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
                  {bulkCrewImporting
                    ? "Importing..."
                    : `Import ${bulkCrewRows.length || ""}`}
                </button>
                <button
                  onClick={clearBulkCrew}
                  className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  Clear
                </button>
                {bulkCrewError && (
                  <span className="text-sm font-semibold text-red-600">
                    {bulkCrewError}
                  </span>
                )}
              </div>

              {bulkCrewRows.length > 0 && (
                <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
                  Preview:
                  <div className="mt-1 flex flex-wrap gap-2">
                    {bulkCrewRows.slice(0, 8).map((row, idx) => (
                      <span
                        key={`${row.name}-${idx}`}
                        className="rounded-full bg-white px-2 py-1"
                      >
                        {row.name}
                        {row.role ? ` — ${row.role}` : ""}
                        {row.phone ? ` • ${row.phone}` : ""}
                      </span>
                    ))}
                    {bulkCrewRows.length > 8 && (
                      <span className="text-neutral-500">
                        +{bulkCrewRows.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Workers List */}
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3">
                <h3
                  className={`${lato.className} font-bold text-neutral-900`}
                >
                  Crew Members ({workers.length})
                </h3>
              </div>
              <div className="divide-y">
                {workers.length === 0 ? (
                  <div className="px-4 py-8 text-center text-neutral-500">
                    No crew members added yet. Add your first crew member above.
                  </div>
                ) : (
                  workers.map((worker) => (
                    <div
                      key={worker.id}
                      className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-neutral-900">
                            {worker.name}
                          </div>
                          {worker.role && (
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                              {worker.role}
                            </span>
                          )}
                        </div>
                        {worker.phone && (
                          <div className="text-sm text-neutral-500">
                            {worker.phone}
                          </div>
                        )}
                        <div className="mt-2 flex items-center gap-2">
                          <label className="text-xs font-semibold text-neutral-500">
                            Title
                          </label>
                          <input
                            type="text"
                            defaultValue={worker.role || ""}
                            placeholder="Set title..."
                            onBlur={(e) =>
                              updateWorker(worker.id, {
                                role: e.target.value.trim() || null,
                              })
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

        {/* ============================================ */}
        {/* Superintendents Tab (Phase 2) */}
        {/* ============================================ */}
        {activeTab === "superintendents" && (
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
                    No superintendents added yet. Add your first superintendent above.
                  </div>
                ) : (
                  superintendents.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50"
                    >
                      <div>
                        <div className="font-semibold text-neutral-900">{s.name}</div>
                        {s.phone && (
                          <div className="text-sm text-neutral-500">{s.phone}</div>
                        )}
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

        {/* ============================================ */}
        {/* Trucks Tab (Phase 2) */}
        {/* ============================================ */}
        {activeTab === "trucks" && (
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
                    No trucks added yet. Add your first truck above.
                  </div>
                ) : (
                  trucks.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50"
                    >
                      <div>
                        <div className="font-semibold text-neutral-900">
                          Truck #{t.truck_number}
                        </div>
                        {t.description && (
                          <div className="text-sm text-neutral-500">{t.description}</div>
                        )}
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

        {/* ============================================ */}
        {/* Categories Tab */}
        {/* ============================================ */}
        {activeTab === "categories" && (
          <div className="space-y-4">
            {/* Add Category Form */}
            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <h3
                className={`${lato.className} mb-3 font-bold text-neutral-900`}
              >
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

            {/* Categories List */}
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3">
                <h3
                  className={`${lato.className} font-bold text-neutral-900`}
                >
                  Categories ({categories.length})
                </h3>
              </div>
              <div className="divide-y">
                {categories.length === 0 ? (
                  <div className="px-4 py-8 text-center text-neutral-500">
                    No categories created yet. Add categories like &quot;Rig
                    1&quot;, &quot;Crane&quot;, &quot;Equipment&quot;, etc.
                  </div>
                ) : (
                  categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-6 w-6 rounded"
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span className="font-semibold text-neutral-900">
                          {category.name}
                        </span>
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
    </>
  );
}

CrewScheduler.getLayout = function getLayout(page) {
  return <TWAdminLayout>{page}</TWAdminLayout>;
};

export default withAuthTw(CrewScheduler);
