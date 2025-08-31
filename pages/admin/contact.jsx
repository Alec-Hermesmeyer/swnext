"use client";

import { useEffect, useState } from "react";
import styles from "@/styles/Admin.module.css";
import withAuth from "@/components/withAuth";
import AdminLayout from "@/components/AdminLayout";
import supabase from "@/components/Supabase";
import Link from "next/link";

const SubmissionTable = ({ title, data, handleDelete, filterOptions, filterState }) => {
  return (
    <section className={styles.tablePanel}>
      <div className={styles.tableHeader}>{title}</div>
      {filterOptions && (
        <div className={styles.listPanelBody}>
          <label className={styles.label} style={{ marginRight: 8 }}>Filter by Position:</label>
          <select className={styles.select} value={filterState.value} onChange={(e) => filterState.setValue(e.target.value)}>
            <option value="">All Positions</option>
            {Array.from(new Set(filterOptions)).map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      )}
      <table className={styles.table}>
        <thead>
          <tr>
            {Object.keys(data[0] || {}).map((key) => key !== "id" && <th key={key}>{key.replace("_", " ")}</th>)}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((submission) => (
            <tr key={submission.id}>
              {Object.entries(submission).map(([key, value]) =>
                key !== "id" ? (
                  <td key={key}>
                    {key === "email" ? <Link href={`mailto:${value}`}>{value}</Link> :
                     key === "number" ? <Link href={`tel:${value}`}>{value}</Link> :
                     key === "created_at" ? new Date(value).toLocaleDateString() :
                     value}
                  </td>
                ) : null
              )}
              <td className={styles.tableActions}>
                <button className={styles.btnDanger} onClick={() => handleDelete(submission.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};

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

  return <SubmissionTable title="Contact Submissions" data={contactSubmission} handleDelete={handleDelete} />;
}

function JobApplicants() {
  const [jobSubmission, setJobSubmission] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPosition, setSelectedPosition] = useState("");

  useEffect(() => {
    const fetchJobSubmissions = async () => {
      const { data, error } = await supabase.from("job_form").select("*").order("created_at", { ascending: false });
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
    <SubmissionTable
      title="Job Applicants"
      data={jobSubmission.filter((job) => (selectedPosition ? job.position === selectedPosition : true))}
      handleDelete={handleDelete}
      filterOptions={jobSubmission.map((job) => job.position)}
      filterState={{ value: selectedPosition, setValue: setSelectedPosition }}
    />
  );
}

const AdminSubmissions = () => {
  return (
    <AdminLayout>
      <div className={styles.page}>
        <div className={styles.pageHeader}><div className={styles.pageTitle}>Submissions</div></div>
        <ContactSubmissions />
        <JobApplicants />
      </div>
    </AdminLayout>
  );
};

export default withAuth(AdminSubmissions);
