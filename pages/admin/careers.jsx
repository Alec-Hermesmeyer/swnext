import React, { useState, useEffect } from "react";
import styles from "@/styles/Admin.module.css";
import withAuth from "@/components/withAuth";
import AdminLayout from "@/components/AdminLayout";
import supabase from "@/components/Supabase";

function CareersPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ jobTitle: '', jobDesc: '', is_Open: true });

  const load = async () => {
    const { data } = await supabase.from('jobs').select('*').order('id', { ascending: false });
    setJobs(data || []); setLoading(false);
  }
  useEffect(()=>{ load(); },[]);

  const add = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.from('jobs').insert([form]).select('*');
    if (!error && data) { setJobs([data[0], ...jobs]); setForm({ jobTitle:'', jobDesc:'', is_Open:true }); }
  }
  const toggleOpen = async (id, isOpen) => {
    const { error } = await supabase.from('jobs').update({ is_Open: !isOpen }).eq('id', id);
    if (!error) setJobs(jobs.map(j=> j.id===id? { ...j, is_Open: !isOpen }: j));
  }
  const remove = async (id) => {
    await supabase.from('jobs').delete().eq('id', id);
    setJobs(jobs.filter(j=> j.id!==id));
  }

  return (
    <AdminLayout>
      <div className={styles.page}>
        <div className={styles.pageHeader}><div className={styles.pageTitle}>Careers</div></div>

        <section className={styles.formPanel}>
          <form onSubmit={add} className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label}>Job Title</label>
              <input className={styles.input} value={form.jobTitle} onChange={e=>setForm({ ...form, jobTitle: e.target.value })} required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Job Description</label>
              <textarea className={styles.textarea} value={form.jobDesc} onChange={e=>setForm({ ...form, jobDesc: e.target.value })} required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Open</label>
              <select className={styles.select} value={form.is_Open ? 'open' : 'closed'} onChange={e=>setForm({ ...form, is_Open: e.target.value==='open' })}>
                <option value='open'>Open</option>
                <option value='closed'>Closed</option>
              </select>
            </div>
            <div className={styles.actionsRow}><button className={styles.btn}>Add Job</button></div>
          </form>
        </section>

        <section className={styles.tablePanel}>
          <div className={styles.tableHeader}>Job Postings</div>
          {loading ? (
            <div className={styles.listPanelBody}>Loading...</div>
          ) : (
            <table className={styles.table}>
              <thead><tr><th>Title</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {jobs.map(j => (
                  <tr key={j.id}>
                    <td>{j.jobTitle}</td>
                    <td>{j.is_Open ? 'Open' : 'Closed'}</td>
                    <td className={styles.tableActions}>
                      <button className={styles.btnSecondary} onClick={()=>toggleOpen(j.id, j.is_Open)}>{j.is_Open ? 'Close' : 'Open'}</button>
                      <button className={styles.btnDanger} onClick={()=>remove(j.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </AdminLayout>
  )
}

export default withAuth(CareersPage);
