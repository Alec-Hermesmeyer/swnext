
import {useEffect, useState} from "react";
import styles from "@/styles/Admin.module.css";
import withAuth from "@/components/withAuth";
import { truncateText } from "@/utils/truncateText";
import { GridPattern } from "@/components/GridPattern";
import { createClient } from "@supabase/supabase-js";
import { Inter } from "next/font/google";
import { Lato } from "next/font/google";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import supabase from "@/components/Supabase";

const lato = Lato({ weight: ["900"], subsets: ["latin"] });

function Spacer() {
  return (
    <GridPattern className={styles.gridPattern} yOffset={10} interactive />
  );
}
function ContactSubmissions() {
  //this function will display contact submissions from the supabase database, allowing admin to view and delete them
  const [contactSubmission, setContactSubmission] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 5; // Number of submissions per page
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchTotalCount = async () => {
      const { data, error, count } = await supabase
        .from("contact_form")
        .select("*", { count: "exact", head: true });

      if (error) {
        console.error("Error fetching total count:", error);
      } else {
        setTotalPages(Math.ceil(count / pageSize));
      }
    };

    fetchTotalCount();
  }, []);

  useEffect(() => {
    const fetchContactSubmissions = async () => {
      let { data, error } = await supabase
        .from("contact_form")
        .select("*")
        .range(page * pageSize, (page + 1) * pageSize - 1);
      if (error) {
        console.log(error);
      } else {
        setContactSubmission(data);
      }
      setLoading(false);
    };
    fetchContactSubmissions();
  }, [page]);

  const handlePreviousPage = () => {
    if (page > 0) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages - 1) {
      setPage(page + 1);
    }
  };
  const handleCopy = (submission) => {
    const text = `
      Name: ${submission.name}
      Email: ${submission.email}
      Number: ${submission.number}
      Message: ${submission.message}
      Position: ${submission.position}
    `;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleEmail = (submission) => {
    const subject = `Job Application from ${submission.name}`;
    const body = `
      Name: ${submission.name}
      Email: ${submission.email}
      Number: ${submission.number}
      Message: ${submission.message}
      Position: ${submission.position}
    `;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from("contact_form").delete().eq("id", id);
    if (error) {
      console.error("Error deleting contact submission:", error);
    } else {
      setContactSubmission(
        contactSubmission.filter((submission) => submission.id !== id)
      );
    }
  };

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
                <button className={styles.deleteBtn} onClick={() => handleDelete(submission.id)}>Delete</button>
                <button className={styles.deleteBtn} onClick={() => handleCopy(submission)}>Copy</button>
                <button className={styles.deleteBtn} onClick={() => handleEmail(submission)}>Email</button>
              </summary>              
              <table className={styles.contactSubTable}>
                <thead className={styles.thread}>
                  <tr className={styles.tableRow}>
                    <th className={lato.className}>Name</th>
                    <th className={lato.className}>Email</th>
                    <th className={lato.className}>Number</th>
                    <th className={lato.className}>Message</th>
                    <th className={lato.className}>Company</th>
                  </tr>
                </thead>
                <tbody className={styles.tableBody}>
                  <tr className={styles.tableRow2}>
                    <td className={lato.className}>{submission.name}</td>
                    <td className={lato.className}><Link href={`mailto:${submission.email}`}>{submission.email}</Link></td>
                    <td className={lato.className}><Link href={`tel:${submission.number}`}>{submission.number}</Link></td>
                    <td className={lato.className} title={submission.message}>
                      <div className={styles.tooltip}>
                        {truncateText(submission.message, 5)}
                        <span className={styles.tooltiptext}>{submission.message}</span>
                      </div>
                    </td>
                    <td className={lato.className}>{submission.company}</td>
                  </tr>
                </tbody>
              </table>
            </details>
          </div>
        ))}
        <div className={styles.pagination}>
          <button onClick={handlePreviousPage} disabled={page === 0}>
            Previous
          </button>
          <span>
            Page {page + 1} of {totalPages}
          </span>
          <button onClick={handleNextPage} disabled={page >= totalPages - 1}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
// const JobApplicants = ({ jobSubmission, handleDelete, handlePreviousPage, handleNextPage, page, totalPages }) => {

function JobApplicants() {
  //this function will display job applicants from the supabase database, allowing admin to view and delete them
  const [jobSubmission, setJobSubmission] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 5; // Number of submissions per page
  const [copied, setCopied] = useState(false);

  

  useEffect(() => {
    const fetchTotalCount = async () => {
      const { data, error, count } = await supabase
        .from("job_form")
        .select("*", { count: "exact", head: true });

      if (error) {
        console.error("Error fetching total count:", error);
      } else {
        setTotalPages(Math.ceil(count / pageSize));
      }
    };

    fetchTotalCount();
  }, []);

  useEffect(() => {
    const fetchJobSubmissions = async () => {
      let { data, error } = await supabase
        .from("job_form")
        .select("*")
        .range(page * pageSize, (page + 1) * pageSize - 1);
      if (error) {
        console.log(error);
      } else {
        setJobSubmission(data);
      }
      setLoading(false);
    };
    fetchJobSubmissions();
  }, [page]);

  const handlePreviousPage = () => {
    if (page > 0) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages - 1) {
      setPage(page + 1);
    }
  };
  const handleCopy = (submission) => {
    const text = `
      Name: ${submission.name}
      Email: ${submission.email}
      Number: ${submission.number}
      Message: ${submission.message}
      Position: ${submission.position}
    `;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleEmail = (submission) => {
    const subject = `Job Application from ${submission.name}`;
    const body = `
      Name: ${submission.name}
      Email: ${submission.email}
      Number: ${submission.number}
      Message: ${submission.message}
      Position: ${submission.position}
    `;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from("job_form").delete().eq("id", id);
    if (error) {
      console.error("Error deleting contact submission:", error);
    } else {
      setJobSubmission(
        jobSubmission.filter((submission) => submission.id !== id)
      );
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }
  

  return (
    <div className={styles.contactSubContainer}>
      <h1 className={lato.className}>Job Applicants</h1>
      <div className={styles.contactSubWrapper}>
        {jobSubmission.map((submission) => (
          <div className={styles.contactSubCard} key={submission.id}>
            <details className={styles.details}>
            <summary className={lato.className}>
                <span>{submission.name}</span>
                <button className={styles.deleteBtn} onClick={() => handleDelete(submission.id)}>Delete</button>
                <button className={styles.deleteBtn} onClick={() => handleCopy(submission)}>Copy</button>
                <button className={styles.deleteBtn} onClick={() => handleEmail(submission)}>Email</button>
              </summary>
                <table className={styles.contactSubTable}>
                <thead className={styles.thread}>
                  <tr className={styles.tableRow}>
                    <th className={lato.className}>Name</th>
                    <th className={lato.className}>Email</th>
                    <th className={lato.className}>Number</th>
                    <th className={lato.className}>Message</th>
                    <th className={lato.className}>Position</th>
                  </tr>
                </thead>
                <tbody className={styles.tableBody}>
                  <tr className={styles.tableRow2}>
                    <td className={lato.className}>{submission.name}</td>
                    <td className={lato.className}><Link href={`mailto:${submission.email}`}>{submission.email}</Link></td>
                    <td className={lato.className}><Link href={`tel:${submission.number}`}>{submission.number}</Link></td>
                    <td className={lato.className} title={submission.message}>
                      <div className={styles.tooltip}>
                        {truncateText(submission.message, 5)}
                        <span className={styles.tooltiptext}>{submission.message}</span>
                      </div>
                    </td>
                    <td className={lato.className}>{submission.position}</td>
                  </tr>
                </tbody>
              </table>
            </details>
          </div>
        ))}
        <div className={styles.pagination}>
          <button onClick={handlePreviousPage} disabled={page === 0}>
            Previous
          </button>
          <span>
            Page {page + 1} of {totalPages}
          </span>
          <button onClick={handleNextPage} disabled={page >= totalPages - 1}>
            Next
          </button>
        </div>
      </div>
    </div>
  );

}
function AddUser() {
  //this function will allow admin to add a new user to the supabase database
  return (
    <div>
      <h1>Add User</h1>
    </div>
  );
}

function DeleteUser() {
  //this function will allow admin to delete a user from the supabase database
  return (
    <div>
      <h1>Delete User</h1>
    </div>
  );
}


const Admin = () => {
  return (
    <div className={styles.admin}>
      <Spacer className={styles.spacer} />
      <section className={styles.contactWidget}>
        <ContactSubmissions />
      </section>
      <section id="applicants" className={styles.contactWidget}>
        <JobApplicants />
      </section>
      <Spacer className={styles.spacer} />
    </div>
    
  );
};

export default withAuth(Admin);
