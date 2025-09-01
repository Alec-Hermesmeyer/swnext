import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import TWAdminLayout from "@/components/TWAdminLayout";
import withAuthTw from "@/components/withAuthTw";
import supabase from "@/components/Supabase";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

function CareersTW() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ jobTitle: '', jobDesc: '', is_Open: true });

  useEffect(()=>{
    const load = async () => {
      const { data } = await supabase.from('jobs').select('*').order('id', { ascending: false });
      setJobs(data || []);
      setLoading(false);
    };
    load();
  },[]);

  const add = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.from('jobs').insert([form]).select('*');
    if (!error && data) { setJobs([data[0], ...jobs]); setForm({ jobTitle:'', jobDesc:'', is_Open:true }); }
  };

  const toggleOpen = async (id, isOpen) => {
    const { error } = await supabase.from('jobs').update({ is_Open: !isOpen }).eq('id', id);
    if (!error) setJobs(jobs.map(j=> j.id===id? { ...j, is_Open: !isOpen }: j));
  };

  const remove = async (id) => {
    await supabase.from('jobs').delete().eq('id', id);
    setJobs(jobs.filter(j=> j.id!==id));
  };

  return (
    <>
      <Head>
        <title>Careers | Tailwind</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className="mx-auto w-full max-w-[1200px] px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className={`${lato.className} text-2xl font-extrabold text-[#0b2a5a]`}>Careers</h1>
          <Link href="/tw/admin" className="rounded-lg bg-neutral-100 px-3 py-2 text-sm font-semibold text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-200">Back to Admin</Link>
        </div>

        <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow">
          <form onSubmit={add} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-neutral-700">Job Title</label>
              <input className="mt-1 h-10 w-full rounded-md border border-neutral-300 px-3 shadow-sm focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30" value={form.jobTitle} onChange={(e)=>setForm({ ...form, jobTitle: e.target.value })} required />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-neutral-700">Job Description</label>
              <textarea className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30" value={form.jobDesc} onChange={(e)=>setForm({ ...form, jobDesc: e.target.value })} required />
            </div>
            <div>
              <label className="text-sm font-semibold text-neutral-700">Open</label>
              <select className="mt-1 h-10 w-full rounded-md border border-neutral-300 px-3 shadow-sm focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30" value={form.is_Open ? 'open' : 'closed'} onChange={(e)=>setForm({ ...form, is_Open: e.target.value==='open' })}>
                <option value='open'>Open</option>
                <option value='closed'>Closed</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <button className="inline-flex items-center rounded-md bg-red-600 px-5 py-2 font-bold text-white shadow hover:bg-red-700" type="submit">Add Job</button>
            </div>
          </form>
        </section>

        <section className="mt-6 rounded-xl border border-neutral-200 bg-white p-5 shadow">
          <div className="mb-4 font-semibold text-neutral-700">Job Postings</div>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="text-left text-sm text-neutral-600"><th className="p-2">Title</th><th className="p-2">Status</th><th className="p-2"></th></tr>
                </thead>
                <tbody className="text-sm text-neutral-800">
                  {jobs.map(j => (
                    <tr key={j.id} className="border-t">
                      <td className="p-2">{j.jobTitle}</td>
                      <td className="p-2">{j.is_Open ? 'Open' : 'Closed'}</td>
                      <td className="p-2 space-x-2">
                        <button className="rounded-md bg-neutral-200 px-3 py-1 text-neutral-800 ring-1 ring-neutral-300 hover:bg-neutral-300" onClick={()=>toggleOpen(j.id, j.is_Open)}>{j.is_Open ? 'Close' : 'Open'}</button>
                        <button className="rounded-md bg-rose-600 px-3 py-1 text-white hover:bg-rose-700" onClick={()=>remove(j.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </>
  );
}

CareersTW.getLayout = function getLayout(page) {
  return <TWAdminLayout>{page}</TWAdminLayout>;
};

export default withAuthTw(CareersTW);


