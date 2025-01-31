"use client";
import React, { useState, useEffect } from "react";
import JobDashboard from "@/components/JobDashboard";
import NewJobForm from "@/components/NewJobForm";
import JobDetail from "@/components/JobDetail";
import withAuth from "@/components/withAuth";
import styles from "@/styles/Jobs.module.css";
import supabase from "@/components/Supabase";
import Button from "@/components/Button";

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard");
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      const { data, error } = await supabase.from("Sales").select("*");
      if (!error) {
        // Ensure proper field mapping
        const mappedJobs = data.map((job) => ({
          id: job.id,
          jobNumber: job.jobNumber || job.id.toString(),
          companyName: job.customer || "Unnamed Company",
          projectName: job.job_Name || "Unnamed Project",
          status: job.status || "Unknown",
        }));

        setJobs(mappedJobs);
      }
      setLoading(false);
    };
    fetchJobs();
  }, []);

  const handleSelectJob = (job) => {
    console.log("Opening Job Details for:", job); // Debugging
    setSelectedJob(job);
    setView("jobDetail");
  };

  const handleCreateJob = (newJob) => {
    const formattedJob = {
      id: newJob.id,
      jobNumber: newJob.jobNumber || newJob.id.toString(),
      companyName: newJob.customer || "Unnamed Company",
      projectName: newJob.job_Name || "Unnamed Project",
      status: newJob.status || "Unknown",
    };
    setJobs([...jobs, formattedJob]);
    setView("dashboard");
  };

  const handleDeleteJob = async (id) => {
    await supabase.from("Sales").delete().eq("id", id);
    setJobs(jobs.filter((job) => job.id !== id));
  };

  const handleUpdateJob = (updatedJob) => {
    const formattedJob = {
      id: updatedJob.id,
      jobNumber: updatedJob.jobNumber || updatedJob.id.toString(),
      companyName: updatedJob.customer || "Unnamed Company",
      projectName: updatedJob.job_Name || "Unnamed Project",
      status: updatedJob.status || "Unknown",
    };
    setJobs(jobs.map((job) => (job.id === updatedJob.id ? formattedJob : job)));
    setSelectedJob(null);
    setView("dashboard");
  };

  if (loading) return <p className={styles.loading}>Loading...</p>;

  return (
    <div className={styles.adminJobsContainer}>
      <div className={styles.header}>
        <h2>Job Management</h2>
        <Button onClick={() => setView("newJob")}>+ Add New Job</Button>
      </div>

      {view === "dashboard" && (
        <JobDashboard 
          jobs={jobs} 
          onSelectJob={handleSelectJob}  // <-- Fixed this to properly navigate to JobDetail
          onDeleteJob={handleDeleteJob} 
        />
      )}

      {view === "newJob" && (
        <NewJobForm 
          onCancel={() => setView("dashboard")} 
          onCreateJob={handleCreateJob} 
        />
      )}

      {view === "jobDetail" && selectedJob && (
        <JobDetail 
          job={selectedJob} 
          onBack={() => setView("dashboard")} 
          onUpdateJob={handleUpdateJob} 
        />
      )}
    </div>
  );
}

export default withAuth(Jobs);
