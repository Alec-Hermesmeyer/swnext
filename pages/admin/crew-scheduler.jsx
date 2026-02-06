"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import Head from "next/head";
import withAuthTw from "@/components/withAuthTw";
import TWAdminLayout from "@/components/TWAdminLayout";
import supabase from "@/components/Supabase";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

// Format date for display
const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Format date for input
const toDateString = (date) => {
  const d = new Date(date);
  return d.toISOString().split("T")[0];
};

function CrewScheduler() {
  const [activeTab, setActiveTab] = useState("schedule");
  const [selectedDate, setSelectedDate] = useState(toDateString(new Date()));
  const [workers, setWorkers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [currentSchedule, setCurrentSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const printRef = useRef(null);

  // New worker form
  const [newWorkerName, setNewWorkerName] = useState("");
  const [newWorkerPhone, setNewWorkerPhone] = useState("");

  // New category form
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#6b7280");

  // New job form
  const [newJob, setNewJob] = useState({
    job_name: "",
    job_number: "",
    customer_name: "",
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

  // Fetch workers, categories, jobs, superintendents, trucks on mount
  useEffect(() => {
    fetchWorkers();
    fetchCategories();
    fetchJobs();
    fetchSuperintendents();
    fetchTrucks();
  }, []);

  // Fetch schedule when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchSchedule(selectedDate);
    }
  }, [selectedDate]);

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

  const addJob = async () => {
    if (!newJob.job_name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("crew_jobs").insert({
      ...newJob,
      job_name: newJob.job_name.trim(),
      job_number: newJob.job_number.trim() || null,
      customer_name: newJob.customer_name.trim() || null,
      address: newJob.address.trim() || null,
      city: newJob.city.trim() || null,
      zip: newJob.zip.trim() || null,
      pm_name: newJob.pm_name.trim() || null,
      pm_phone: newJob.pm_phone.trim() || null,
      default_rig: newJob.default_rig.trim() || null,
    });
    if (!error) {
      setNewJob({
        job_name: "",
        job_number: "",
        customer_name: "",
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
      .insert({ name: newWorkerName.trim(), phone: newWorkerPhone.trim() || null });
    if (!error) {
      setNewWorkerName("");
      setNewWorkerPhone("");
      fetchWorkers();
    }
    setSaving(false);
  };

  const deleteWorker = async (id) => {
    if (!confirm("Remove this worker?")) return;
    await supabase.from("crew_workers").update({ is_active: false }).eq("id", id);
    fetchWorkers();
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
            truck_number: rigData.crew_trucks?.truck_number || "",
          },
        }));
      }
    }
  };

  // --- Phase 5: Save & Email Schedule ---
  const handleSaveAndEmail = async () => {
    if (!currentSchedule) return;
    if (!confirm("Finalize and email this schedule? Cesar will receive the schedule and Phil will be notified.")) return;

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
        worker_name: a.crew_workers?.name || "Unassigned",
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
  const scheduledJobsForDate = useMemo(() => {
    // Get unique jobs from assignments
    const jobMap = new Map();
    assignments.forEach((a) => {
      if (!a.job_id || !a.crew_jobs) return;
      if (!jobMap.has(a.job_id)) {
        const job = a.crew_jobs;
        const cat = a.crew_categories || {};
        const detail = rigDetails[a.category_id] || {};
        const crewForJob = assignments
          .filter((x) => x.job_id === a.job_id)
          .map((x) => x.crew_workers?.name)
          .filter(Boolean);

        jobMap.set(a.job_id, {
          job_id: a.job_id,
          assignment: a,
          job_name: job.job_name,
          job_number: job.job_number,
          customer_name: job.customer_name,
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
          truck_number: detail.truck_number || "",
          crane_info: detail.crane_info || "",
          crew_names: crewForJob.join(", "),
        });
      }
    });
    return Array.from(jobMap.values());
  }, [assignments, rigDetails]);

  // --- Phase 6: Update dig tess number on blur ---
  const updateDigTessNumber = async (jobId, value) => {
    await supabase.from("crew_jobs").update({ dig_tess_number: value || null }).eq("id", jobId);
  };

  // --- Phase 6: Email all packets ---
  const handleEmailPackets = async () => {
    if (scheduledJobsForDate.length === 0) {
      alert("No jobs scheduled for this date.");
      return;
    }
    if (!confirm(`Email ${scheduledJobsForDate.length} cover sheet packet(s) to Phil?`)) return;

    setPacketsSending(true);
    setPacketsStatus(null);

    try {
      const packets = scheduledJobsForDate.map((j) => ({
        job_name: j.job_name,
        job_number: j.job_number,
        customer_name: j.customer_name,
        address: j.address,
        city: j.city,
        zip: j.zip,
        pm_name: j.pm_name,
        pm_phone: j.pm_phone,
        dig_tess_number: j.dig_tess_number,
        rig_name: j.rig_name,
        superintendent_name: j.superintendent_name,
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
    const crewNames = crewForJob.map((a) => a.crew_workers?.name).filter(Boolean).join(", ");

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cover Sheet - ${job.job_name || "Job"}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .pm-stamp { border: 1px solid #000; padding: 10px; width: 100px; height: 60px; text-align: center; }
          .field-row { display: flex; gap: 20px; margin-bottom: 12px; flex-wrap: wrap; }
          .field { display: flex; align-items: baseline; gap: 4px; }
          .field label { font-weight: bold; white-space: nowrap; }
          .field-value { border-bottom: 1px solid #000; min-width: 120px; padding: 2px 4px; }
          .field-value.wide { min-width: 200px; }
          .section-title { font-weight: bold; margin: 16px 0 8px; border-bottom: 1px solid #000; padding-bottom: 4px; }
          .text-area { border: 1px solid #000; min-height: 80px; padding: 8px; margin-bottom: 12px; }
          .text-area.large { min-height: 200px; }
          .equipment-lines { border: 1px solid #000; padding: 8px; }
          .equipment-lines .line { border-bottom: 1px solid #ccc; height: 24px; margin-bottom: 4px; }
          .equipment-lines .line:last-child { border-bottom: none; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div></div>
          <div class="pm-stamp">PM Stamp</div>
        </div>

        <div class="field-row">
          <div class="field">
            <label>OP:</label>
            <span class="field-value">${assignment.crew_workers?.name || ""}</span>
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
    const crewNames = crewForJob.map((a) => a.crew_workers?.name).filter(Boolean).join(", ");

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
          body { font-family: Arial, sans-serif; padding: 15px; font-size: 11px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 15px; }
          .pm-stamp { border: 1px solid #000; padding: 8px; width: 80px; height: 50px; text-align: center; font-size: 10px; }
          .field-row { display: flex; gap: 15px; margin-bottom: 8px; flex-wrap: wrap; }
          .field { display: flex; align-items: baseline; gap: 3px; }
          .field label { font-weight: bold; white-space: nowrap; font-size: 10px; }
          .field-value { border-bottom: 1px solid #000; min-width: 80px; padding: 1px 3px; font-size: 10px; }
          .field-value.wide { min-width: 150px; }
          .section-title { font-weight: bold; margin: 12px 0 6px; border-bottom: 1px solid #000; padding-bottom: 3px; font-size: 11px; }
          .text-area { border: 1px solid #000; min-height: 60px; padding: 6px; margin-bottom: 10px; }
          .pier-table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 9px; }
          .pier-table th, .pier-table td { border: 1px solid #000; padding: 2px 4px; text-align: center; }
          .pier-table th { background: #f0f0f0; font-size: 8px; }
          .pier-table td { height: 16px; }
          .signature-line { margin-top: 20px; }
          .signature-line label { font-weight: bold; }
          .signature-value { border-bottom: 1px solid #000; display: inline-block; width: 300px; }
          @media print {
            body { padding: 5px; }
            .pier-table { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div></div>
          <div class="pm-stamp">PM Stamp</div>
        </div>

        <div class="field-row">
          <div class="field">
            <label>OP:</label>
            <span class="field-value">${assignment.crew_workers?.name || ""}</span>
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
            <label>Crane:</label>
            <span class="field-value">${detail.crane_info || (job.crane_required ? "Yes" : "")}</span>
          </div>
          <div class="field">
            <label>Truck Number:</label>
            <span class="field-value">${detail.truck_number || ""}</span>
          </div>
          <div class="field">
            <label>S&W PM:</label>
            <span class="field-value">${job.pm_name || ""}</span>
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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            color: #1f2937;
          }
          .header {
            text-align: center;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 2px solid #0b2a5a;
          }
          .header h1 {
            font-size: 24px;
            font-weight: 800;
            color: #0b2a5a;
          }
          .header .date {
            font-size: 18px;
            color: #4b5563;
            margin-top: 4px;
          }
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
            .header { border-bottom-width: 1px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>S&W Foundation - Daily Crew Schedule</h1>
          <div class="date">${formatDate(selectedDate)}</div>
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
                            a.crew_workers?.name || "Unassigned"
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
    { id: "workers", label: "Workers" },
    { id: "superintendents", label: "Superintendents" },
    { id: "trucks", label: "Trucks" },
    { id: "categories", label: "Categories" },
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
          <div>
            <h1
              className={`${lato.className} text-2xl font-extrabold text-[#0b2a5a]`}
            >
              Crew Scheduler
            </h1>
            <p className="mt-1 text-sm text-neutral-600">
              Build daily crew assignments, email schedules, and print packets
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Finalized badge */}
            {currentSchedule?.is_finalized && (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                Finalized
              </span>
            )}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            <button
              onClick={handlePrint}
              className="rounded-lg bg-neutral-600 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700 transition-colors"
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
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
            >
              Print All Forms
            </button>
            <button
              onClick={handleSaveAndEmail}
              disabled={emailSending}
              className="rounded-lg bg-[#0b2a5a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a2350] disabled:opacity-50 transition-colors"
            >
              {emailSending ? "Sending..." : "Save & Email Schedule"}
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
            This schedule has been finalized and emailed. Edits will not be automatically re-sent.
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
                          placeholder="Crane info"
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
                          placeholder="Notes"
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
                                  {w.name}
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
              <h3 className={`${lato.className} text-lg font-bold text-neutral-900`}>
                Daily Packets - {formatDate(selectedDate)}
              </h3>
              <button
                onClick={handleEmailPackets}
                disabled={packetsSending || scheduledJobsForDate.length === 0}
                className="rounded-lg bg-[#0b2a5a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a2350] disabled:opacity-50 transition-colors"
              >
                {packetsSending ? "Sending..." : `Email All Packets (${scheduledJobsForDate.length})`}
              </button>
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

            {scheduledJobsForDate.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-12 text-center">
                <p className="text-neutral-600">
                  No jobs scheduled for this date. Build the schedule first.
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
                {scheduledJobsForDate.map((job) => (
                  <div
                    key={job.job_id}
                    className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden"
                  >
                    <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-neutral-900">
                            {job.job_name}
                          </span>
                          {job.job_number && (
                            <span className="ml-2 rounded bg-neutral-200 px-2 py-0.5 text-xs text-neutral-600">
                              #{job.job_number}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handlePrintCoverSheet(job.assignment)}
                            className="rounded-md bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                          >
                            Cover Sheet
                          </button>
                          <button
                            onClick={() => handlePrintDailyLog(job.assignment)}
                            className="rounded-md bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 hover:bg-green-100 transition-colors"
                          >
                            Daily Log
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="px-4 py-3 space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {job.customer_name && (
                          <div>
                            <span className="text-neutral-500">Customer:</span>{" "}
                            <span className="font-medium">{job.customer_name}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-neutral-500">Rig:</span>{" "}
                          <span className="font-medium">{job.rig_name}</span>
                        </div>
                        {job.superintendent_name && (
                          <div>
                            <span className="text-neutral-500">Supt:</span>{" "}
                            <span className="font-medium">{job.superintendent_name}</span>
                          </div>
                        )}
                        {job.truck_number && (
                          <div>
                            <span className="text-neutral-500">Truck:</span>{" "}
                            <span className="font-medium">{job.truck_number}</span>
                          </div>
                        )}
                      </div>
                      {job.crew_names && (
                        <div>
                          <span className="text-neutral-500">Crew:</span>{" "}
                          <span className="font-medium">{job.crew_names}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 pt-1">
                        <label className="text-xs font-semibold text-neutral-500 whitespace-nowrap">
                          Dig Tess #:
                        </label>
                        <input
                          type="text"
                          defaultValue={job.dig_tess_number}
                          onBlur={(e) => {
                            updateDigTessNumber(job.job_id, e.target.value);
                            // Also update local jobs list
                            setJobs((prev) =>
                              prev.map((j) =>
                                j.id === job.job_id
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
                ))}
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
                  placeholder="Customer Name"
                  value={newJob.customer_name}
                  onChange={(e) =>
                    setNewJob({ ...newJob, customer_name: e.target.value })
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
                          {job.customer_name && (
                            <div className="mt-1 text-sm text-neutral-500">
                              Customer: {job.customer_name}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => deleteJob(job.id)}
                          className="rounded-md px-3 py-1 text-sm text-neutral-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          Deactivate
                        </button>
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
                Add New Worker
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
                <button
                  onClick={addWorker}
                  disabled={saving || !newWorkerName.trim()}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  Add Worker
                </button>
              </div>
            </div>

            {/* Workers List */}
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3">
                <h3
                  className={`${lato.className} font-bold text-neutral-900`}
                >
                  Workers ({workers.length})
                </h3>
              </div>
              <div className="divide-y">
                {workers.length === 0 ? (
                  <div className="px-4 py-8 text-center text-neutral-500">
                    No workers added yet. Add your first worker above.
                  </div>
                ) : (
                  workers.map((worker) => (
                    <div
                      key={worker.id}
                      className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50"
                    >
                      <div>
                        <div className="font-semibold text-neutral-900">
                          {worker.name}
                        </div>
                        {worker.phone && (
                          <div className="text-sm text-neutral-500">
                            {worker.phone}
                          </div>
                        )}
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
