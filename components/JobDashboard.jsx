import React from "react";
import styles from '@/styles/Jobs.module.css';

function JobDashboard({ jobs, onSelectJob }) {
  if (jobs.length === 0) {
    return <div>No jobs to display</div>;
  }

  // Determine if we are dealing with bidding jobs or not
  const isBidding = jobs[0].status === "Bidding";

  return (
    <div className={styles.dashboardContainer}>
      <table className={styles.jobTable}>
        <thead>
          <tr>
            {/* If bidding jobs, show "Bid Date", else "Job Number" */}
            <th>{isBidding ? "Bid Date" : "Job Number"}</th>
            <th>Company Name</th>
            <th>Project Name</th>
            <th>Status</th>
            <th>Open</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map(job => (
            <tr key={job.id}>
              {/* If bidding job, display bidDate, else jobNumber */}
              <td>{isBidding ? job.bidDate : job.jobNumber}</td>
              <td>{job.companyName}</td>
              <td>{job.projectName}</td>
              <td>{job.status}</td>
              <td>
                <button className={styles.openButton} onClick={() => onSelectJob(job)}>Open Folder</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default JobDashboard;
