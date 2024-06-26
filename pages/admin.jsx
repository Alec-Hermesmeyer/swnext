import React, { useState, useEffect } from "react";import styles from '../styles/Admin.module.css';
import withAuth from '@/components/withAuth';
import { truncateText } from "@/utils/truncateText";
import { GridPattern } from '@/components/GridPattern';
import { useAuth } from '@/context/AuthContext';
import { createClient } from "@supabase/supabase-js";
import { Inter } from "next/font/google";

const supabaseUrl = "https://edycymyofrowahspzzpg.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkeWN5bXlvZnJvd2Foc3B6enBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzcyNTExMzAsImV4cCI6MTk5MjgyNzEzMH0.vJ8DvHPikZp2wQRXEbQ2h7JNgyJyDs0smEcJYjrjcVg";

const supabase = createClient(supabaseUrl, supabaseKey);
const inter = Inter({ subsets: ["latin"] });



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
  const pageSize = 10; // Number of submissions per page


  useEffect(() => {
    const fetchTotalCount = async () => {
      const { data, error, count } = await supabase
        .from('contact_form')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error fetching total count:', error);
      } else {
        setTotalPages(Math.ceil(count / pageSize));
      }
    };

    fetchTotalCount();
  }, []);

  useEffect(() => {
    const fetchContactSubmissions = async () => {
      let { data, error } = await supabase.from("contact_form").select("*").range(page * pageSize, (page + 1) * pageSize - 1);
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
    const { error } = await supabase.from('contact_form').delete().eq('id', id);
    if (error) {
      console.error('Error deleting contact submission:', error);
    } else {
      setContactSubmission(contactSubmission.filter((submission) => submission.id !== id));
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className={styles.contactSubContainer}>
      <table className={styles.contactSubTable}>
        <thread className={styles.thread}>
        <tr className={styles.tableRow}>
            <th>Name</th>
            <th>Email</th>
            <th>Number</th>
            <th>Message</th>
            <th>Company</th>
          </tr>
        </thread>
        <tbody className={styles.tableBody}>
          {contactSubmission.map((submission) => (
            <tr className={styles.tableRow2} key={submission.id}>
              <td>{submission.name}</td>
              <td>{submission.email}</td>
              <td>{submission.number}</td>
              <td title={submission.message}>
              <div className={styles.tooltip}>
                  {truncateText(submission.message, 5)}
                  <span className={styles.tooltiptext}>{submission.message}</span>
                </div>
              </td>
              <td>{submission.company}</td>
              <span className={styles.deleteBtnContainerT}>
              <button className={styles.deleteBtn} onClick={() => handleDelete(submission.id)}>Delete</button>
            </span>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={styles.pagination}>
        <button onClick={handlePreviousPage} disabled={page === 0}>
          Previous
        </button>
        <span>Page {page + 1} of {totalPages}</span>
        <button onClick={handleNextPage} disabled={page >= totalPages - 1}>
          Next
        </button>
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
        .from('job_form')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error fetching total count:', error);
      } else {
        setTotalPages(Math.ceil(count / pageSize));
      }
    };

    fetchTotalCount();
  }, []);

  useEffect(() => {
    const fetchJobSubmissions = async () => {
      let { data, error } = await supabase.from("job_form").select("*").range(page * pageSize, (page + 1) * pageSize - 1);
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
    const { error } = await supabase.from('job_form').delete().eq('id', id);
    if (error) {
      console.error('Error deleting contact submission:', error);
    } else {
      setJobSubmission(jobSubmission.filter((submission) => submission.id !== id));
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className={styles.contactSubContainer}>
      <table className={styles.contactSubTable}>
        <thread className={styles.thread}>
        <tr className={styles.tableRow}>
            <th>Name</th>
            <th>Email</th>
            <th>Number</th>
            <th>Message</th>
            <th>Position</th>
          </tr>
        </thread>
        <tbody className={styles.tableBody}>
          {jobSubmission.map((submission) => (
            <tr className={styles.tableRow2} key={submission.id}>
              <td>{submission.name}</td>
              <td>{submission.email}</td>
              <td>{submission.number}</td>
              <td title={submission.message}>
              <div className={styles.tooltip}>
                  {truncateText(submission.message, 5)}
                  <span className={styles.tooltiptext}>{submission.message}</span>
                </div>
              </td>
              <td>{submission.position}</td>
              <span className={styles.deleteBtnContainer}>
              <button className={styles.deleteBtn} onClick={() => handleDelete(submission.id)}>Delete</button>
            </span>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={styles.pagination}>
        <button onClick={handlePreviousPage} disabled={page === 0}>
          Previous
        </button>
        <span>Page {page + 1} of {totalPages}</span>
        <button onClick={handleNextPage} disabled={page >= totalPages - 1}>
          Next
        </button>
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
    <button className={styles.logoutBtn} onClick={logout}>Logout</button>
  );

}
const Admin = () => {
  const { logout } = useAuth();
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
      <Logout className={styles.lowerBtn}/>
      <Spacer className={styles.spacer} />
    </div>
  )
}

export default withAuth(Admin)