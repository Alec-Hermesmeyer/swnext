import React, { useState, useEffect } from "react";
import styles from "@/styles/Admin.module.css";
import withAuth from "@/components/withAuth";
import { truncateText } from "@/utils/truncateText";
import { GridPattern } from "@/components/GridPattern";
import { createClient } from "@supabase/supabase-js";
import { Inter } from "next/font/google";
import { Lato } from "next/font/google";
import { FadeIn } from "@/components/FadeIn";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";

const supabaseUrl = "https://edycymyofrowahspzzpg.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkeWN5bXlvZnJvd2Foc3B6enBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzcyNTExMzAsImV4cCI6MTk5MjgyNzEzMH0.vJ8DvHPikZp2wQRXEbQ2h7JNgyJyDs0smEcJYjrjcVg";

const supabase = createClient(supabaseUrl, supabaseKey);
const lato = Lato({ weight: ["900"], subsets: ["latin"] });

function Spacer() {
  return (
    <GridPattern className={styles.gridPattern} yOffset={10} interactive />
  );
}
function JobPostings() {
  const [jobPostings, setJobPostings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchJobPostings = async () => {
      let { data, error } = await supabase.from("jobs").select("*");
      if (error) {
        console.log(error);
      } else {
        setJobPostings(data);
      }
      setIsLoading(false);
    };
    fetchJobPostings();
  }, []);
  if (isLoading) {
    return <div>Loading....</div>;
  }
  // Filter the jobPostings to only include those where isOpen is true
  const openJobPostings = jobPostings.filter(jobPosting => jobPosting.is_Open);
  return (
    <div className={styles.jobPostingsSection}>
      <div className={styles.grid}>
      {openJobPostings.map((jobPosting, index) => (
        <div className={styles.card} key={index}>
          <FadeIn>
        <details className={styles.jobPostInfo}>
        <summary className={lato.className}>{jobPosting.jobTitle}</summary>
        {/* <p className={lato.className}>{jobPosting.jobDesc}</p> */}
        <span className={styles.jobBtns}><Link className={styles.infoBtn3} href='/contact#jobForm'><p className={lato.className}>Apply Today</p></Link></span>
      </details>
      </FadeIn>
      </div>
      ))}
      </div>
    </div>
  );
}
function ManageJobPostings() {
  const [jobPostings, setJobPostings] = useState([]);
  const [newJob, setNewJob] = useState({ jobTitle: '', jobDesc: '', is_Open: true });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchJobPostings = async () => {
      let { data, error } = await supabase.from('jobs').select('*');
      if (error) {
        console.log(error);
      } else {
        setJobPostings(data);
      }
      setIsLoading(false);
    };
    fetchJobPostings();
  }, []);

  const handleAddJob = async (e) => {
    e.preventDefault();
    try {
      let { data, error } = await supabase
        .from('jobs')
        .insert([newJob]);

      if (error) {
        console.error('Error adding job:', error);
      } else {
        setJobPostings([...jobPostings, ...data]);
        setNewJob({ jobTitle: '', jobDesc: '', is_Open: true });
      }
    } catch (error) {
      console.error('Unexpected error adding job:', error);
    }
  };

  const handleToggleJob = async (id, isOpen) => {
    try {
      let { error } = await supabase
        .from('jobs')
        .update({ is_Open: !isOpen })
        .eq('id', id);

      if (error) {
        console.log('Error toggling job:', error);
      } else {
        setJobPostings(
          jobPostings.map((job) => (job.id === id ? { ...job, is_Open: !isOpen } : job))
        );
      }
    } catch (error) {
      console.log('Unexpected error toggling job:', error);
    }
  };

  if (isLoading) {
    return <div>Loading....</div>;
  }

  return (
    <div className={styles.manageJobPostings}>
    <h2>Manage Job Postings</h2>
    <form onSubmit={handleAddJob}>
      <div className= {styles.top}>
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
      <div className={styles.bottom}>
        <label>
          Job Description:
          <textarea
            value={newJob.jobDesc}
            onChange={(e) => setNewJob({ ...newJob, jobDesc: e.target.value })}
            required
          />
        </label>
      </div>
      <button type="submit">Add Job</button>
    </form>

    <h3>Current Job Postings</h3>
    <ul className={styles.currentList}>
      {jobPostings.map((job) => (
        <li key={job.id}>
          {job.jobTitle} - {job.is_Open ? 'Open' : 'Closed'}
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={job.is_Open}
              onChange={() => handleToggleJob(job.id, job.is_Open)}
            />
            <span className={styles.slider}></span>
          </label>
        </li>
      ))}
    </ul>
  </div>
  );
}



const Admin = () => {
  return (
   
    <div className={styles.admin}>
      <Spacer className={styles.spacer} />
      <section className={styles.contactWidgetOffice}>
       <JobPostings />
      </section>
      <section className={styles.contactWidgetOffice}>
      <ManageJobPostings />
      </section>
      <Spacer className={styles.spacer} />
    </div>
    
  );
};

export default withAuth(Admin);
