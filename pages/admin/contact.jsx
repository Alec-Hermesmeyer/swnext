import { useEffect, useState } from "react";
import styles from "@/styles/Admin.module.css";
import withAuth from "@/components/withAuth";
import { truncateText } from "@/utils/truncateText";
import { GridPattern } from "@/components/GridPattern";
import { Lato } from "next/font/google";
import Link from "next/link";
import supabase from "@/components/Supabase";

const lato = Lato({ weight: ["900"], subsets: ["latin"] });

function ContactSubmissions() {
  const [contactSubmission, setContactSubmission] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 5; 

  useEffect(() => {
    const fetchTotalCount = async () => {
      const { count, error } = await supabase
        .from("contact_form")
        .select("*", { count: "exact", head: true });

      if (!error) {
        setTotalPages(Math.ceil(count / pageSize));
      }
    };

    fetchTotalCount();
  }, []);

  useEffect(() => {
    const fetchContactSubmissions = async () => {
      const { data, error } = await supabase
        .from("contact_form")
        .select("*")
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (!error) {
        setContactSubmission(data);
      }
      setLoading(false);
    };

    fetchContactSubmissions();
  }, [page]);

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className={styles.contactSubContainer}>
      <h1>Contact Submissions</h1>
      <div className={styles.contactSubWrapper}>
        {contactSubmission.map((submission) => (
          <div className={styles.contactSubCard} key={submission.id}>
            <details className={styles.details}>
              <summary className={lato.className}>
                <span>{submission.name}</span>
              </summary>
              <table className={styles.contactSubTable}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Number</th>
                    <th>Company</th>
                    <th>Message</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{submission.name}</td>
                    <td><Link href={`mailto:${submission.email}`}>{submission.email}</Link></td>
                    <td><Link href={`tel:${submission.number}`}>{submission.number}</Link></td>
                    <td>{submission.company}</td>
                    <td title={submission.message}>
                      <div className={styles.tooltip}>
                        {truncateText(submission.message, 5)}
                        <span className={styles.tooltiptext}>{submission.message}</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}

function JobApplicants() {
  const [jobSubmission, setJobSubmission] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 5;
  const [selectedPosition, setSelectedPosition] = useState(""); 

  useEffect(() => {
    const fetchTotalCount = async () => {
      const { count, error } = await supabase
        .from("job_form")
        .select("*", { count: "exact", head: true });

      if (!error) {
        setTotalPages(Math.ceil(count / pageSize));
      }
    };

    fetchTotalCount();
  }, []);

  useEffect(() => {
    const fetchJobSubmissions = async () => {
      const { data, error } = await supabase
        .from("job_form")
        .select("*")
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (!error) {
        setJobSubmission(data);
      }
      setLoading(false);
    };

    fetchJobSubmissions();
  }, [page]);

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className={styles.contactSubContainer}>
      <h1>Job Applicants</h1>

      {/* Filter by Position Dropdown */}
      <div className={styles.filterContainer}>
        <label htmlFor="positionFilter">Filter by Position:</label>
        <select
          id="positionFilter"
          value={selectedPosition}
          onChange={(e) => setSelectedPosition(e.target.value)}
        >
          <option value="">All Positions</option>
          {Array.from(new Set(jobSubmission.map((job) => job.position)))
            .map((position) => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
        </select>
      </div>

      <div className={styles.contactSubWrapper}>
        {jobSubmission
          .filter((submission) =>
            selectedPosition ? submission.position === selectedPosition : true
          )
          .map((submission) => (
            <div className={styles.contactSubCard} key={submission.id}>
              <details className={styles.details}>
                <summary className={lato.className}>
                  <span>{submission.name}</span>
                </summary>
                <table className={styles.contactSubTable}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Number</th>
                      <th>Message</th>
                      <th>Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{submission.name}</td>
                      <td><Link href={`mailto:${submission.email}`}>{submission.email}</Link></td>
                      <td><Link href={`tel:${submission.number}`}>{submission.number}</Link></td>
                      <td title={submission.message}>
                        <div className={styles.tooltip}>
                          {truncateText(submission.message, 5)}
                          <span className={styles.tooltiptext}>{submission.message}</span>
                        </div>
                      </td>
                      <td>{submission.position}</td>
                    </tr>
                  </tbody>
                </table>
              </details>
            </div>
          ))}
      </div>

      {/* Pagination Controls */}
      <div className={styles.pagination}>
        <button onClick={() => setPage(page - 1)} disabled={page === 0}>
          Previous
        </button>
        <span>
          Page {page + 1} of {totalPages}
        </span>
        <button onClick={() => setPage(page + 1)} disabled={page >= totalPages - 1}>
          Next
        </button>
      </div>
    </div>
  );
}

const Admin = () => {
  return (
    <div className={styles.admin}>
      <section className={styles.contactWidget}>
        <ContactSubmissions />
      </section>
      <section id="applicants" className={styles.contactWidget}>
        <JobApplicants />
      </section>
    </div>
  );
};

export default withAuth(Admin);
