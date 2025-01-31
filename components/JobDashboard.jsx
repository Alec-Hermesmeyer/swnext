import React from "react";
import styles from "@/styles/Jobs.module.css";

function JobDashboard({ jobs, onSelectJob, onDeleteJob }) {
  return (
    <div className={styles.dashboardContainer}>
      <table className={styles.jobTable}>
        <thead>
          <tr>
            <th>Job #</th>
            <th>Company Name</th>
            <th>Project Name</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.length === 0 ? (
            <tr>
              <td colSpan="5" className={styles.noJobs}>No jobs available</td>
            </tr>
          ) : (
            jobs.map((job) => (
              <tr key={job.id}>
                <td>{job.jobNumber}</td>
                <td>{job.companyName}</td>
                <td>{job.projectName}</td>
                <td>{job.status}</td>
                <td>
                  <button 
                    className={styles.viewBtn} 
                    onClick={() => onSelectJob(job)}
                  >
                    View
                  </button>
                  <button 
                    className={styles.deleteBtn} 
                    onClick={() => onDeleteJob(job.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default JobDashboard;
