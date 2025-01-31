"use client"
import { useEffect, useState } from "react";
import styles from "@/styles/AdminSubmissions.module.css";
import withAuth from "@/components/withAuth";
import supabase from "@/components/Supabase";
import Link from "next/link";

function ContactSubmissions() {
  const [contactSubmission, setContactSubmission] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContactSubmissions = async () => {
      const { data, error } = await supabase.from("contact_form").select("*");
      if (!error) {
        setContactSubmission(data);
      }
      setLoading(false);
    };
    fetchContactSubmissions();
  }, []);

  const handleDelete = async (id) => {
    await supabase.from("contact_form").delete().eq("id", id);
    setContactSubmission(contactSubmission.filter((submission) => submission.id !== id));
  };

  if (loading) return <p className={styles.loading}>Loading...</p>;

  return (
    <div className={styles.submissionsContainer}>
      <h2>Contact Submissions</h2>
      <div className={styles.tableWrapper}>
        <table className={styles.submissionsTable}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Company</th>
              <th>Message</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {contactSubmission.map((submission) => (
              <tr key={submission.id}>
                <td>{submission.name}</td>
                <td><Link href={`mailto:${submission.email}`}>{submission.email}</Link></td>
                <td><Link href={`tel:${submission.number}`}>{submission.number}</Link></td>
                <td>{submission.company}</td>
                <td>{submission.message}</td>
                <td>
                  <button className={styles.deleteBtn} onClick={() => handleDelete(submission.id)}>🗑 Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function JobApplicants() {
  const [jobSubmission, setJobSubmission] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPosition, setSelectedPosition] = useState("");

  useEffect(() => {
    const fetchJobSubmissions = async () => {
      const { data, error } = await supabase.from("job_form").select("*");
      if (!error) {
        setJobSubmission(data);
      }
      setLoading(false);
    };
    fetchJobSubmissions();
  }, []);

  const handleDelete = async (id) => {
    await supabase.from("job_form").delete().eq("id", id);
    setJobSubmission(jobSubmission.filter((submission) => submission.id !== id));
  };

  if (loading) return <p className={styles.loading}>Loading...</p>;

  return (
    <div className={styles.submissionsContainer}>
      <h2>Job Applicants</h2>

      {/* Filter by Position */}
      <div className={styles.filterContainer}>
        <label>Filter by Position:</label>
        <select value={selectedPosition} onChange={(e) => setSelectedPosition(e.target.value)}>
          <option value="">All Positions</option>
          {Array.from(new Set(jobSubmission.map((job) => job.position))).map((position) => (
            <option key={position} value={position}>{position}</option>
          ))}
        </select>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.submissionsTable}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Message</th>
              <th>Position</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobSubmission.filter((submission) =>
              selectedPosition ? submission.position === selectedPosition : true
            ).map((submission) => (
              <tr key={submission.id}>
                <td>{submission.name}</td>
                <td><Link href={`mailto:${submission.email}`}>{submission.email}</Link></td>
                <td><Link href={`tel:${submission.number}`}>{submission.number}</Link></td>
                <td>{submission.message}</td>
                <td>{submission.position}</td>
                <td>
                  <button className={styles.deleteBtn} onClick={() => handleDelete(submission.id)}>🗑 Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const AdminSubmissions = () => {
  return (
    <div className={styles.adminContainer}>
      <section className={styles.submissionSection}>
        <ContactSubmissions />
      </section>
      <section className={styles.submissionSection}>
        <JobApplicants />
      </section>
    </div>
  );
};

export default withAuth(AdminSubmissions);
