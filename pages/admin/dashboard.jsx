"use client"
import React, { useState, useEffect } from "react"
import styles from "@/styles/Admin.module.css"
import withAuth from "@/components/withAuth"
import supabase from "@/components/Supabase"
import Link from "next/link"

function ContactListPreview() {
  const [contacts, setContacts] = useState([])

  useEffect(() => {
    const fetchContacts = async () => {
      let { data, error } = await supabase.from("company_contacts").select("*").limit(5)
      if (!error) setContacts(data)
    }
    fetchContacts()
  }, [])

  return (
    <div className={styles.previewList}>
      {contacts.map((contact) => (
        <div key={contact.id} className={styles.previewItem}>
          <h3>{contact.name}</h3>
          <p>{contact.job_title}</p>
        </div>
      ))}
      <Link href="/admin/contacts" className={styles.viewMore}>View All Contacts →</Link>
    </div>
  )
}


function JobListPreview() {
  const [jobs, setJobs] = useState([])

  useEffect(() => {
    const fetchJobs = async () => {
      let { data, error } = await supabase.from("jobs").select("*").limit(5)
      if (!error) setJobs(data)
    }
    fetchJobs()
  }, [])

  return (
    <div className={styles.previewList}>
      {jobs.map((job) => (
        <div key={job.id} className={styles.previewItem}>
          <h3>{job.jobTitle}</h3>
          <p className={job.is_Open ? styles.openJob : styles.closedJob}>
            {job.is_Open ? "Open" : "Closed"}
          </p>
        </div>
      ))}
      <Link href="/admin/jobs" className={styles.viewMore}>View All Jobs →</Link>
    </div>
  )
}


function Dashboard() {
  const [jobCount, setJobCount] = useState(0)
  const [contactCount, setContactCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const { count: jobCount, error: jobError } = await supabase
          .from("jobs")
          .select("*", { count: "exact", head: true })

        const { count: contactCount, error: contactError } = await supabase
          .from("company_contacts")
          .select("*", { count: "exact", head: true })

        if (!jobError) setJobCount(jobCount)
        if (!contactError) setContactCount(contactCount)
      } catch (error) {
        console.error("Error fetching counts:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCounts()
  }, [])

  if (loading) return <p>Loading...</p>

  return (
    <div className={styles.adminDashboard}>
      <h1 className={styles.dashboardTitle}>Admin Dashboard</h1>

      {/* Overview Cards */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <h2>Job Postings</h2>
          <p>{jobCount}</p>
          <Link href="/admin/careers" className={styles.manageLink}>
            Manage Jobs Postings →
          </Link>
        </div>
        <div className={styles.statCard}>
          <h2>Company Contacts</h2>
          <p>{contactCount}</p>
          <Link href="/admin/contacts" className={styles.manageLink}>
            Manage Contacts →
          </Link>
        </div>
      </div>

      {/* Jobs Preview */}
      <div className={styles.section}>
        <h2>Recent Job Postings</h2>
        <JobListPreview />
      </div>

      {/* Contacts Preview */}
      <div className={styles.section}>
        <h2>Company Contacts</h2>
        <ContactListPreview />
      </div>
    </div>
  )
}

export default withAuth(Dashboard)
