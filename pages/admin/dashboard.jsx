"use client"
import React, { useState, useEffect } from "react"
import styles from "@/styles/Admin.module.css"
import withAuth from "@/components/withAuth"
import AdminLayout from "@/components/AdminLayout"
import supabase from "@/components/Supabase"
import Link from "next/link"

function JobListPreview() {
  const [jobs, setJobs] = useState([])
  useEffect(() => {
    const fetchJobs = async () => {
      let { data, error } = await supabase.from("jobs").select("*").order('created_at', { ascending: false }).limit(5)
      if (!error) setJobs(data || [])
    }
    fetchJobs()
  }, [])
  return (
    <div className={styles.listPanelBody}>
      {jobs.map((job) => (
        <div key={job.id} className={styles.listItem}>
          <div>
            <div className={styles.itemTitle}>{job.jobTitle}</div>
            <div className={job.is_Open ? styles.badgeOpen : styles.badgeClosed}>{job.is_Open ? "Open" : "Closed"}</div>
          </div>
        </div>
      ))}
      <div className={styles.panelFooterRow}><Link href="/admin/jobs">View all jobs →</Link></div>
    </div>
  )
}

function ContactListPreview() {
  const [contacts, setContacts] = useState([])
  useEffect(() => {
    const fetchContacts = async () => {
      let { data, error } = await supabase.from("company_contacts").select("*").order('id', { ascending: false }).limit(6)
      if (!error) setContacts(data || [])
    }
    fetchContacts()
  }, [])
  return (
    <div className={styles.listPanelBody}>
      {contacts.map((c) => (
        <div key={c.id} className={styles.listItem}>
          <div>
            <div className={styles.itemTitle}>{c.name}</div>
            <div className={styles.itemSub}>{c.job_title}</div>
          </div>
          <div className={styles.itemMeta}>{c.email}</div>
        </div>
      ))}
      <div className={styles.panelFooterRow}><Link href="/admin/company-contacts">View all contacts →</Link></div>
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
        const { count: jobCount } = await supabase.from("jobs").select("*", { count: "exact", head: true })
        const { count: contactCount } = await supabase.from("company_contacts").select("*", { count: "exact", head: true })
        setJobCount(jobCount || 0)
        setContactCount(contactCount || 0)
      } finally {
        setLoading(false)
      }
    }
    fetchCounts()
  }, [])

  return (
    <AdminLayout>
      <div className={styles.dashContainer}>
        <div className={styles.cardsRow}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>Job Postings</div>
            <div className={styles.kpiValue}>{loading ? '—' : jobCount}</div>
            <Link href="/admin/careers" className={styles.kpiLink}>Manage postings</Link>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>Company Contacts</div>
            <div className={styles.kpiValue}>{loading ? '—' : contactCount}</div>
            <Link href="/admin/company-contacts" className={styles.kpiLink}>Manage contacts</Link>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>Total Records</div>
            <div className={styles.kpiValue}>{loading ? '—' : (jobCount + contactCount)}</div>
            <Link href="/admin/contact" className={styles.kpiLink}>View submissions</Link>
          </div>
        </div>

        <div className={styles.panelsGrid}>
          <section className={styles.listPanel}>
            <div className={styles.listPanelHeader}>Recent Job Postings</div>
            <JobListPreview />
          </section>
          <section className={styles.listPanel}>
            <div className={styles.listPanelHeader}>Company Contacts</div>
            <ContactListPreview />
          </section>
        </div>
      </div>
    </AdminLayout>
  )
}

export default withAuth(Dashboard)
