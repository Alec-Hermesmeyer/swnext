"use client";
import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import TWAdminLayout from "@/components/TWAdminLayout";
import withAuthTw from "@/components/withAuthTw";
import supabase from "@/components/Supabase";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

function SubmissionTable({ title, data, handleDelete, filterOptions, filterState }) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow">
      <div className="mb-3 font-semibold text-neutral-700">{title}</div>
      {filterOptions && (
        <div className="mb-3 text-sm">
          <label className="mr-2 font-semibold text-neutral-700">Filter by Position:</label>
          <select className="h-9 rounded-md border border-neutral-300 px-2" value={filterState.value} onChange={(e)=>filterState.setValue(e.target.value)}>
            <option value="">All Positions</option>
            {Array.from(new Set(filterOptions)).map((opt)=>(<option key={opt} value={opt}>{opt}</option>))}
          </select>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="text-left text-sm text-neutral-600">
              {Object.keys(data[0] || {}).map((key) => key !== 'id' && (<th key={key} className="p-2">{key.replace('_',' ')}</th>))}
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm text-neutral-800">
            {data.map((submission)=> (
              <tr key={submission.id} className="border-t">
                {Object.entries(submission).map(([key, value]) => key !== 'id' ? (
                  <td key={key} className="p-2">
                    {key === 'email' ? <Link href={`mailto:${value}`}>{value}</Link> :
                     key === 'number' ? <Link href={`tel:${value}`}>{value}</Link> :
                     key === 'created_at' ? new Date(value).toLocaleDateString() : value}
                  </td>
                ) : null)}
                <td className="p-2">
                  <button className="rounded-md bg-rose-600 px-3 py-1 text-white hover:bg-rose-700" onClick={()=>handleDelete(submission.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ContactSubmissionsTW() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{
    const load = async () => {
      const { data, error } = await supabase.from('contact_form').select('*');
      if (!error) setRows(data || []);
      setLoading(false);
    };
    load();
  },[]);
  const handleDelete = async (id) => {
    await supabase.from('contact_form').delete().eq('id', id);
    setRows(rows.filter((r)=>r.id!==id));
  };
  if (loading) return <div>Loading...</div>;
  return <SubmissionTable title="Contact Submissions" data={rows} handleDelete={handleDelete} />;
}

function JobApplicantsTW() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPosition, setSelectedPosition] = useState('');
  useEffect(()=>{
    const load = async () => {
      const { data, error } = await supabase.from('job_form').select('*').order('created_at', { ascending: false });
      if (!error) setRows(data || []);
      setLoading(false);
    };
    load();
  },[]);
  const handleDelete = async (id) => {
    await supabase.from('job_form').delete().eq('id', id);
    setRows(rows.filter((r)=>r.id!==id));
  };
  if (loading) return <div>Loading...</div>;
  return (
    <SubmissionTable
      title="Job Applicants"
      data={rows.filter((r)=> selectedPosition ? r.position === selectedPosition : true)}
      handleDelete={handleDelete}
      filterOptions={rows.map((r)=>r.position)}
      filterState={{ value: selectedPosition, setValue: setSelectedPosition }}
    />
  );
}

function ContactTW() {
  return (
    <>
      <Head>
        <title>Submissions | Tailwind</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className="mx-auto w-full max-w-[1200px] px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className={`${lato.className} text-2xl font-extrabold text-[#0b2a5a]`}>Submissions</h1>
          <Link href="/tw/admin" className="rounded-lg bg-neutral-100 px-3 py-2 text-sm font-semibold text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-200">Back to Admin</Link>
        </div>
        <div className="grid grid-cols-1 gap-6">
          <ContactSubmissionsTW />
          <JobApplicantsTW />
        </div>
      </main>
    </>
  );
}

ContactTW.getLayout = function getLayout(page) { return <TWAdminLayout>{page}</TWAdminLayout>; };

export default withAuthTw(ContactTW);


