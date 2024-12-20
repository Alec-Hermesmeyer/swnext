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
  const [customers, setCustomers] = useState([]); // From getSalesData (Past Jobs)
  const [currentAndBidData, setCurrentAndBidData] = useState([]); // From getSalesandBidData (Current Jobs & Bids)

  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard");
  const [page, setPage] = useState(0);
  const pageSize = 245;
  const [totalPages, setTotalPages] = useState(0);

  const [selectedJob, setSelectedJob] = useState(null);

  // Fetch Past Jobs (already works as before)
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
      console.log("Current and Bid Data:", paginatedData);

      if (paginatedData) {
        setCurrentAndBidData(paginatedData);
      } else {
        console.log("No sales and bid data received for current jobs/bids");
      }
    };

    fetchSalesAndBidData();
  }, []);

  const handleCreateJob = (newJob) => {
    // Add the newly created job as a "Bidding" status job to currentAndBidData
    setCurrentAndBidData([
      ...currentAndBidData,
      {
        id: newJob.id,
        name: newJob.clientName,
        jobName: newJob.projectName,
        status: "Bidding",
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

  // Map past jobs
  const mappedPastJobs = customers.map((c) => ({
    id: c.id,
    jobNumber: c.id.toString(),
    companyName: c.name || "Unnamed Company",
    projectName: c.jobName || c.name || "Unnamed Project",
    status: c.status || "Awarded",
  }));

  const mappedCurrentAndBid = currentAndBidData.map((item) => ({
    id: item.id,
    jobNumber: item.jobNumber || item.id?.toString(), // fallback if needed
    companyName: item.customer || item.customer || "Unnamed Company",
    projectName: item.job_Name || item.project_name || "Unnamed Project",
    status: item.status || "Unknown",
    bidDate: item.date_bid || null, // If applicable
  }));

  // Separate the data into three categories
  const pastJobs = mappedPastJobs.filter((j) => j.status === "Awarded");
  const currentJobs = mappedCurrentAndBid.filter((j) => j.status === "Ongoing");
  const currentBids = mappedCurrentAndBid.filter((j) => j.status === "Bidding");

  return (
    <div className={styles.jobsDashboard}>
      <div className={styles.buttonContainer}>
        <Button onClick={() => setView("newJob")}>+ New Job</Button>
      </div>
      {view === "dashboard" && (
        <div>
          <div className={styles.topSection}>
            {/* Past Jobs (unchanged) */}
            <JobDashboard jobs={pastJobs} onSelectJob={handleSelectJob} />
          </div>

          <div className={styles.middleSection}>
            
            
              {/* Current Bids fetched from getSalesandBidData */}
              <JobDashboard jobs={currentBids} onSelectJob={handleSelectJob} />
            
          </div>
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
