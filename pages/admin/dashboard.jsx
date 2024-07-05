import React, { useState, useEffect } from "react";
import styles from "@/styles/Admin.module.css";
import withAuth from "@/components/withAuth";
import { truncateText } from "@/utils/truncateText";
import { GridPattern } from "@/components/GridPattern";
import { createClient } from "@supabase/supabase-js";
import { Inter } from "next/font/google";
import { Lato } from "next/font/google";
import AdminLayout from "@/components/AdminLayout";
import { useRouter } from "next/router";
import Link from "next/link";



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
function Dashboard() {
  return (
    <div className={styles.dashboardContainer}>
    <div className={styles.cardsContainer}>
      <div className={styles.db_Card}>
        <h2>Contact Forms</h2>
        <Link className={lato.className} href="/admin/contact">View and manage contact form submissions</Link>
      </div>
      <div className={styles.db_Card}>
        <h2>Job Postings</h2>
        <Link className={lato.className} href="/admin/job-openings">Manage, create and review job postings.</Link>
        <p></p>
      </div>
      <div className={styles.db_Card}>
        <h2>Applications</h2>
        <Link className={lato.className} href="/admin/contact#applicants">Review job applications.</Link>
      </div>
      <div className={styles.db_Card}>
        <h2>Company Contacts</h2>
        <Link className={lato.className} href="/admin/company-contacts">Manage, create and review company contact</Link>
      </div>
    </div>
    </div>
  );
}

const Admin = () => {
  return (
   
    <div className={styles.admin}>
      <Spacer />
      <section className={styles.dashboardWidget}>
       <Dashboard />
      </section>
      <Spacer />
    </div>
    
  );
};

export default withAuth(Admin);
