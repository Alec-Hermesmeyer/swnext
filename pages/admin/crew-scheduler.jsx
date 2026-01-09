"use client";
import { useEffect, useState, useRef } from "react";
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

  // Fetch workers, categories, and jobs on mount
  useEffect(() => {
    fetchWorkers();
    fetchCategories();
    fetchJobs();
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
    } else {
      setAssignments([]);
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
            return `
              <div class="category">
                <div class="category-header" style="background-color: ${cat.color}">
                  ${cat.name}
                </div>
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
                          <span class="job-name">${a.job_name || ""}</span>
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

  // Print Cover Sheet for a specific job assignment
  const handlePrintCoverSheet = (assignment) => {
    const job = assignment.crew_jobs || {};
    const category = assignment.crew_categories || {};
    const crewForJob = assignments.filter(a => a.job_id === assignment.job_id);
    const crewNames = crewForJob.map(a => a.crew_workers?.name).filter(Boolean).join(", ");

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
            <label>Rig:</label>
            <span class="field-value">${category.name || job.default_rig || ""}</span>
          </div>
          <div class="field">
            <label>Crane:</label>
            <span class="field-value">${job.crane_required ? "Yes" : ""}</span>
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label>Truck Number:</label>
            <span class="field-value"></span>
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

  // Print Daily Log & Inspection for a specific job
  const handlePrintDailyLog = (assignment) => {
    const job = assignment.crew_jobs || {};
    const category = assignment.crew_categories || {};
    const crewForJob = assignments.filter(a => a.job_id === assignment.job_id);
    const crewNames = crewForJob.map(a => a.crew_workers?.name).filter(Boolean).join(", ");

    // Generate pier rows (40 rows)
    const pierRows = Array.from({ length: 40 }, (_, i) => `
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
    `).join("");

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
            <label>Rig:</label>
            <span class="field-value">${category.name || job.default_rig || ""}</span>
          </div>
          <div class="field">
            <label>Crane:</label>
            <span class="field-value">${job.crane_required ? "Yes" : ""}</span>
          </div>
          <div class="field">
            <label>Truck Number:</label>
            <span class="field-value"></span>
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

  // Print all forms for a category/rig
  const handlePrintAllForCategory = (categoryId) => {
    const catAssignments = assignments.filter(a => a.category_id === categoryId && a.job_id);
    // Get unique jobs for this category
    const uniqueJobs = [...new Map(catAssignments.map(a => [a.job_id, a])).values()];

    if (uniqueJobs.length === 0) {
      alert("No jobs assigned to this category. Assign jobs first.");
      return;
    }

    uniqueJobs.forEach(assignment => {
      handlePrintCoverSheet(assignment);
      setTimeout(() => handlePrintDailyLog(assignment), 500);
    });
  };

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
            <h1 className={`${lato.className} text-2xl font-extrabold text-[#0b2a5a]`}>
              Crew Scheduler
            </h1>
            <p className="mt-1 text-sm text-neutral-600">
              Build daily crew assignments and export to PDF
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
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
                const jobAssignments = assignments.filter(a => a.job_id);
                const uniqueJobs = [...new Map(jobAssignments.map(a => [a.job_id, a])).values()];
                if (uniqueJobs.length === 0) {
                  alert("No jobs assigned. Select jobs in the schedule first.");
                  return;
                }
                if (confirm(`Print Cover Sheets and Daily Logs for ${uniqueJobs.length} job(s)?`)) {
                  uniqueJobs.forEach((assignment, i) => {
                    setTimeout(() => handlePrintCoverSheet(assignment), i * 600);
                    setTimeout(() => handlePrintDailyLog(assignment), i * 600 + 300);
                  });
                }
              }}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
            >
              Print All Forms
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-lg bg-neutral-100 p-1">
          {[
            { id: "schedule", label: "Build Schedule" },
            { id: "jobs", label: "Manage Jobs" },
            { id: "workers", label: "Manage Workers" },
            { id: "categories", label: "Categories" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Schedule Tab */}
        {activeTab === "schedule" && (
          <div ref={printRef}>
            <div className="mb-4 rounded-lg bg-[#0b2a5a] px-4 py-3">
              <h2 className={`${lato.className} text-lg font-bold text-white`}>
                {formatDate(selectedDate)}
              </h2>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {categories.map((category) => {
                const catAssignments = assignments.filter(
                  (a) => a.category_id === category.id
                );
                return (
                  <div
                    key={category.id}
                    className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden"
                  >
                    <div
                      className="flex items-center justify-between px-4 py-3"
                      style={{ backgroundColor: category.color }}
                    >
                      <h3 className={`${lato.className} font-bold text-white`}>
                        {category.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePrintAllForCategory(category.id)}
                          className="rounded-md bg-white/20 px-2 py-1 text-xs font-semibold text-white hover:bg-white/30 transition-colors"
                          title="Print all forms for this rig"
                        >
                          🖨️ Print Forms
                        </button>
                        <button
                          onClick={() => addAssignment(category.id)}
                          className="rounded-md bg-white/20 px-2 py-1 text-xs font-semibold text-white hover:bg-white/30 transition-colors"
                        >
                          + Add Crew
                        </button>
                      </div>
                    </div>
                    <div className="divide-y">
                      {catAssignments.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-neutral-400">
                          No crew assigned. Click "+ Add Crew" to start.
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
                                  job_name: e.target.value ? jobs.find(j => j.id === e.target.value)?.job_name : assignment.job_name,
                                })
                              }
                              className="flex-1 rounded-md border border-neutral-300 px-2 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                            >
                              <option value="">Select job...</option>
                              {jobs.map((j) => (
                                <option key={j.id} value={j.id}>
                                  {j.job_number ? `${j.job_number} - ` : ""}{j.job_name}
                                </option>
                              ))}
                            </select>
                            {assignment.job_id && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handlePrintCoverSheet(assignment)}
                                  className="rounded-md p-2 text-neutral-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                  title="Print Cover Sheet"
                                >
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handlePrintDailyLog(assignment)}
                                  className="rounded-md p-2 text-neutral-400 hover:bg-green-50 hover:text-green-600 transition-colors"
                                  title="Print Daily Log & Inspection"
                                >
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </button>
                              </div>
                            )}
                            <button
                              onClick={() => deleteAssignment(assignment.id)}
                              className="rounded-md p-2 text-neutral-400 hover:bg-neutral-100 hover:text-red-600 transition-colors"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                <p className="text-neutral-600">No categories created yet.</p>
                <button
                  onClick={() => setActiveTab("categories")}
                  className="mt-2 text-sm font-semibold text-red-600 hover:text-red-700"
                >
                  Create your first category →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === "jobs" && (
          <div className="space-y-4">
            {/* Add Job Form */}
            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <h3 className={`${lato.className} mb-3 font-bold text-neutral-900`}>
                Add New Job
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                  placeholder="Customer Name"
                  value={newJob.customer_name}
                  onChange={(e) => setNewJob({ ...newJob, customer_name: e.target.value })}
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

            {/* Jobs List */}
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3">
                <h3 className={`${lato.className} font-bold text-neutral-900`}>
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
                            {[job.address, job.city, job.zip].filter(Boolean).join(", ") || "No address"}
                          </div>
                          {(job.pm_name || job.pm_phone) && (
                            <div className="mt-1 text-sm text-neutral-500">
                              PM: {job.pm_name}{job.pm_phone ? ` • ${job.pm_phone}` : ""}
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

        {/* Workers Tab */}
        {activeTab === "workers" && (
          <div className="space-y-4">
            {/* Add Worker Form */}
            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <h3 className={`${lato.className} mb-3 font-bold text-neutral-900`}>
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
                <h3 className={`${lato.className} font-bold text-neutral-900`}>
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

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <div className="space-y-4">
            {/* Add Category Form */}
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

            {/* Categories List */}
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3">
                <h3 className={`${lato.className} font-bold text-neutral-900`}>
                  Categories ({categories.length})
                </h3>
              </div>
              <div className="divide-y">
                {categories.length === 0 ? (
                  <div className="px-4 py-8 text-center text-neutral-500">
                    No categories created yet. Add categories like "Rig 1", "Crane", "Equipment", etc.
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
