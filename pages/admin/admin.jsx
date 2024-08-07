import React, { useState, useEffect } from "react";
import styles from "@/styles/Admin.module.css";
import withAuth from "@/components/withAuth";
import { truncateText } from "@/utils/truncateText";
import { GridPattern } from "@/components/GridPattern";
import { useAuth } from "@/context/AuthContext";
import supabase from "@/components/Supabase";
import { Inter } from "next/font/google";
import { Lato } from "next/font/google";
import AdminLayout from "@/components/AdminLayout";

const lato = Lato({ weight: ["900"], subsets: ["latin"] });

function Spacer() {
  return (
    <GridPattern className={styles.gridPattern} yOffset={10} interactive={true} />
  );
}
function ContactSubmissions() {
  //this function will display contact submissions from the supabase database, allowing admin to view and delete them
  const [contactSubmission, setContactSubmission] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 5; // Number of submissions per page

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
              <summary className={lato.className}> {submission.name}</summary>
              <table className={styles.contactSubTable}>
        <thread className={styles.thread}>
        <tr className={styles.tableRow}>
            <th className={lato.className}>Name</th>
            <th className={lato.className}>Email</th>
            <th className={lato.className}>Number</th>
            <th className={lato.className}>Message</th>
            <th className={lato.className}>Company</th>
          </tr>
        </thread>
        <tbody className={styles.tableBody}>
            <tr className={styles.tableRow2}>
              <td className={lato.className}>{submission.name}</td>
              <td className={lato.className}>{submission.email}</td>
              <td className={lato.className}>{submission.number}</td>
              <td className={lato.className} title={submission.message}>
              <div className={styles.tooltip}>
                  {truncateText(submission.message, 5)}
                  <span className={styles.tooltiptext}>{submission.message}</span>
                </div>
              </td>
              <td className={lato.className}>{submission.company}</td>
              <span className={styles.deleteBtnContainerT}>
              <button className={styles.deleteBtn} onClick={() => handleDelete(submission.id)}>Delete</button>
            </span>
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
function JobApplicants() {
  //this function will display job applicants from the supabase database, allowing admin to view and delete them
  const [jobSubmission, setJobSubmission] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 10; // Number of submissions per page

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
              <summary className={lato.className}> {submission.name}</summary>
              <table className={styles.contactSubTable}>
        <thread className={styles.thread}>
        <tr className={styles.tableRow}>
            <th className={lato.className}>Name</th>
            <th className={lato.className}>Email</th>
            <th className={lato.className}>Number</th>
            <th className={lato.className}>Message</th>
            <th className={lato.className}>Position</th>
          </tr>
        </thread>
        <tbody className={styles.tableBody}>
            <tr className={styles.tableRow2}>
              <td className={lato.className}>{submission.name}</td>
              <td className={lato.className}>{submission.email}</td>
              <td className={lato.className}>{submission.number}</td>
              <td className={lato.className} title={submission.message}>
              <div className={styles.tooltip}>
                  {truncateText(submission.message, 5)}
                  <span className={styles.tooltiptext}>{submission.message}</span>
                </div>
              </td>
              <td className={lato.className}>{submission.position}</td>
              <span className={styles.deleteBtnContainerT}>
              <button className={styles.deleteBtn} onClick={() => handleDelete(submission.id)}>Delete</button>
            </span>
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
function Logout() {
  const { logout } = useAuth();
  return (
    <button className={styles.logoutBtn} onClick={logout}>
      Logout
    </button>
  );
}
const Admin = () => {
  // const { logout } = useAuth();
  return (
   
    <div className={styles.admin}>
      <Spacer className={styles.spacer} />
      <Logout />
      <section className={styles.contactWidget}>
        <ContactSubmissions />
      </section>
      <section className={styles.contactWidget}>
        <JobApplicants />
      </section>
      <Spacer className={styles.spacer} />
    </div>
    
  );
};

export default withAuth(Admin);
