import React, { useState, useEffect } from "react";
import styles from "@/styles/Admin.module.css";
import withAuth from "@/components/withAuth";
import AdminLayout from "@/components/AdminLayout";
import supabase from "@/components/Supabase";

function CompanyContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", job_title: "", email: "", phone: "" });

  const load = async () => {
    const { data } = await supabase.from('company_contacts').select('*').order('id', { ascending: false });
    setContacts(data || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.from('company_contacts').upsert([form]).select('*');
    if (!error && data) {
      setContacts([data[0], ...contacts]);
      setForm({ name: "", job_title: "", email: "", phone: "" });
    }
  }
  const remove = async (id) => {
    await supabase.from('company_contacts').delete().eq('id', id);
    setContacts(contacts.filter(c => c.id !== id));
  }

  return (
    <AdminLayout>
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <div className={styles.pageTitle}>Company Contacts</div>
        </div>

        <section className={styles.formPanel}>
          <form onSubmit={add} className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label}>Name</label>
              <input className={styles.input} value={form.name} onChange={e=>setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Job Title</label>
              <input className={styles.input} value={form.job_title} onChange={e=>setForm({ ...form, job_title: e.target.value })} required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <input type="email" className={styles.input} value={form.email} onChange={e=>setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Phone</label>
              <input className={styles.input} value={form.phone} onChange={e=>setForm({ ...form, phone: e.target.value })} required />
            </div>
            <div className={styles.actionsRow}>
              <button className={styles.btn} type="submit">Add Contact</button>
            </div>
          </form>
        </section>

        <section className={styles.tablePanel}>
          <div className={styles.tableHeader}>Contacts</div>
          {loading ? (
            <div className={styles.listPanelBody}>Loading...</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Title</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {contacts.map(c => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.job_title}</td>
                    <td>{c.email}</td>
                    <td>{c.phone}</td>
                    <td className={styles.tableActions}>
                      <button className={styles.btnDanger} onClick={()=>remove(c.id)}>Delete</button>
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

export default withAuth(CompanyContactsPage);
