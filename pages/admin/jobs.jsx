"use client";
import React, { useState, useEffect } from "react";
import JobDashboard from "@/components/JobDashboard";
import NewJobForm from "@/components/NewJobForm";
import JobDetail from "@/components/JobDetail";
import withAuth from "@/components/withAuth";
import styles from "@/styles/Jobs.module.css";
import { getSalesData } from "@/actions/jobInfo";
import { getSalesandBidData } from "@/actions/salesInfo";
import supabase from "@/components/Supabase";
import Button from "@/components/Button";

function Jobs() {
  const [jobNameFilter, setJobNameFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [customers, setCustomers] = useState([]);
  const [currentAndBidData, setCurrentAndBidData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard");
  const [page, setPage] = useState(0);
  const pageSize = 245;
  const [totalPages, setTotalPages] = useState(0);
  const [selectedJob, setSelectedJob] = useState(null);

  // Fetch Past Jobs
  useEffect(() => {
    const fetchAndSetSalesData = async () => {
      setLoading(true);
      const { paginatedData, totalCount } = await getSalesData(page, pageSize, {
        jobName: jobNameFilter,
        company: companyFilter,
      });

      if (paginatedData) {
        setCustomers(paginatedData);
        setTotalPages(Math.ceil(totalCount / pageSize));
      } else {
        console.log("No sales data received for past jobs");
      }
      setLoading(false);
    };

    fetchAndSetSalesData();
  }, [jobNameFilter, companyFilter, page]);

  // Fetch Current Jobs & Bids
  useEffect(() => {
    const fetchSalesAndBidData = async () => {
      const { paginatedData, totalCount } = await getSalesandBidData(0, 5, {});
      if (paginatedData) {
        setCurrentAndBidData(paginatedData);
      } else {
        console.log("No sales and bid data received for current jobs/bids");
      }
    };

    fetchSalesAndBidData();
  }, []);

  // ----------------------------
  // NEW: Function to update status
  // ----------------------------
  const handleUpdateStatus = async (jobId, newStatus) => {
    const { data, error } = await supabase
      .from("Sales")
      .update({ status: newStatus })
      .eq("id", jobId)
      .select(); // important to get updated row back

    if (error) {
      console.error("Error updating job status:", error);
      return;
    }

    if (data && data.length > 0) {
      const updatedJob = data[0];

      // Update old "customers" array if needed
      setCustomers((prev) =>
        prev.map((job) => (job.id === jobId ? updatedJob : job))
      );

      // Update "currentAndBidData" array
      setCurrentAndBidData((prev) =>
        prev.map((job) => (job.id === jobId ? updatedJob : job))
      );
    }
  };

  const handleCreateJob = (newJob) => {
    setCurrentAndBidData([
      ...currentAndBidData,
      {
        id: newJob.id,
        customer: newJob.customer,
        job_Name: newJob.job_Name,
        jobNumber: newJob.job_number,
        status: newJob.status ?? "Bidding",
      },
    ]);
    setView("dashboard");
  };

  const handleSelectJob = (job) => {
    setSelectedJob(job);
    setView("jobDetail");
  };

  const handleBackToDashboard = () => {
    setSelectedJob(null);
    setView("dashboard");
  };
  const mappedPastJobs = customers.map((c) => ({
    id: c.id,
    jobNumber: c.id.toString(),
    companyName: c.name || "Unnamed Company",
    projectName: c.jobName || c.name || "Unnamed Project",
    status: c.status || "Awarded",
  }));

  // Mapped Current & Bid
  const mappedCurrentAndBid = currentAndBidData.map((item) => ({
    id: item.id,
    jobNumber: item.jobNumber || item.id?.toString(),
    companyName: item.customer || "Unnamed Company",
    projectName: item.job_Name || item.project_name || "Unnamed Project",
    status: item.status || "Unknown",
    bidDate: item.date_bid || null,
  }));
  // All jobs that were ever "Bidding" or are currently "Bidding":
  // (If you only want "currently bidding," use 'biddingJobs.length')
  const totalBids = mappedCurrentAndBid.filter(
    (job) => job.status === "Bidding"
  ).length;

  // Jobs that ended up as "Completed" or "Awarded" = "won"
  const wonJobs = mappedCurrentAndBid.filter(
    (job) => job.status === "Completed" || job.status === "Awarded"
  ).length;

  // Jobs that ended up as "Lost"
  const lostJobsCount = mappedCurrentAndBid.filter(
    (job) => job.status === "Lost"
  ).length;

  const winPercentage =
    totalBids > 0 ? ((wonJobs / totalBids) * 100).toFixed(2) : 0;

  // Mapped Past Jobs
  

  // Filter them out
  // Replace "Ongoing" with "In Progress" if that's the final name
  const biddingJobs = mappedCurrentAndBid.filter((j) => j.status === "Bidding");
  const inProgressJobs = mappedCurrentAndBid.filter(
    (j) => j.status === "In Progress"
  );
  const completedJobs = mappedCurrentAndBid.filter(
    (j) => j.status === "Completed"
  );
  const lostJobs = mappedCurrentAndBid.filter((j) => j.status === "Lost");

  return (
    <div className={styles.jobsDashboard}>
      <div className={styles.buttonContainer}>
        <Button onClick={() => setView("newJob")}>+ New Job</Button>
      </div>
      {view === "dashboard" && (
        <div>
          {/* Display Stats */}
          <div className={styles.statsContainer}>
            <h3>Estimator Stats</h3>
            <p>Total Bids: {totalBids}</p>
            <p>Won: {wonJobs}</p>
            <p>Lost: {lostJobsCount}</p>
            <p>Win Rate: {winPercentage}%</p>
          </div>

          {/* Bidding */}
          <h2>Bidding</h2>
          <JobDashboard
            jobs={biddingJobs}
            onSelectJob={handleSelectJob}
            onUpdateStatus={handleUpdateStatus}
          />

          {/* In Progress */}
          <h2>In Progress</h2>
          <JobDashboard
            jobs={inProgressJobs}
            onSelectJob={handleSelectJob}
            onUpdateStatus={handleUpdateStatus}
          />

          {/* Completed */}
          <h2>Completed</h2>
          <JobDashboard
            jobs={completedJobs}
            onSelectJob={handleSelectJob}
            onUpdateStatus={handleUpdateStatus}
          />

          {/* Lost */}
          <h2>Lost</h2>
          <JobDashboard
            jobs={lostJobs}
            onSelectJob={handleSelectJob}
            onUpdateStatus={handleUpdateStatus}
          />
        </div>
      )}

      {view === "newJob" && (
        <NewJobForm
          onCancel={() => setView("dashboard")}
          onCreateJob={handleCreateJob}
        />
      )}

      {view === "jobDetail" && selectedJob && (
        <JobDetail job={selectedJob} onBack={handleBackToDashboard} />
      )}
    </div>
  );
}

export default withAuth(Jobs);
