import React, { useState, useEffect } from "react";
import styles from "@/styles/Admin.module.css";
import withAuth from "@/components/withAuth";
import supabase from "@/components/Supabase";

function JobPostingsAdmin() {
  const [jobs, setJobs] = useState([]);
  const [newJob, setNewJob] = useState({ jobTitle: "", jobDesc: "", is_Open: true });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        let { data, error } = await supabase.from("jobs").select("*");
        if (error) {
          console.error("Error fetching jobs:", error);
        } else {
          setJobs(data);
        }
      } catch (error) {
        console.error("Unexpected error fetching jobs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const handleAddJob = async (e) => {
    e.preventDefault();
    try {
      let { data, error } = await supabase.from("jobs").insert([newJob]);
      if (error) {
        console.error("Error adding job:", error);
      } else {
        setJobs([...jobs, ...data]);
        setNewJob({ jobTitle: "", jobDesc: "", is_Open: true });
      }
    } catch (error) {
      console.error("Unexpected error adding job:", error);
    }
  };

  const handleDeleteJob = async (id) => {
    try {
      let { error } = await supabase.from("jobs").delete().eq("id", id);
      if (error) {
        console.error("Error deleting job:", error);
      } else {
        setJobs(jobs.filter((job) => job.id !== id));
      }
    } catch (error) {
      console.error("Unexpected error deleting job:", error);
    }
  };

  const handleToggleJob = async (id, is_Open) => {
    try {
      let { error } = await supabase.from("jobs").update({ is_Open }).eq("id", id);
      if (error) {
        console.error("Error updating job status:", error);
      } else {
        setJobs(jobs.map((job) => (job.id === id ? { ...job, is_Open } : job)));
      }
    } catch (error) {
      console.error("Unexpected error updating job status:", error);
    }
  };

  return (
    <div className={styles.manageJobs}>
      <h2>Manage Job Postings</h2>
      <form onSubmit={handleAddJob} className={styles.jobForm}>
        <div>
          <label>
            Job Title:
            <input
              type="text"
              value={newJob.jobTitle}
              onChange={(e) => setNewJob({ ...newJob, jobTitle: e.target.value })}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Job Description:
            <textarea
              value={newJob.jobDesc}
              onChange={(e) => setNewJob({ ...newJob, jobDesc: e.target.value })}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Open Position:
            <input
              type="checkbox"
              checked={newJob.is_Open}
              onChange={(e) => setNewJob({ ...newJob, is_Open: e.target.checked })}
            />
          </label>
        </div>
        <button type="submit">Add Job</button>
      </form>

      <h3>Current Job Postings</h3>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul className={styles.jobList}>
          {jobs.map((job) => (
            <li key={job.id} className={styles.jobItem}>
              <h4>{job.jobTitle}</h4>
              <p>{job.jobDesc}</p>
              <p className={job.is_Open ? styles.openJob : styles.closedJob}>
                {job.is_Open ? "Open" : "Closed"}
              </p>
              <div className={styles.jobActions}>
                <button onClick={() => handleToggleJob(job.id, !job.is_Open)}>
                  {job.is_Open ? "Close" : "Open"}
                </button>
                <button onClick={() => handleDeleteJob(job.id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const AdminJobs = () => {
  return (
    <div className={styles.admin}>
      <section className={styles.contactWidgetOffice}>
        <JobPostingsAdmin />
      </section>
    </div>
  );
};

export default withAuth(AdminJobs);
