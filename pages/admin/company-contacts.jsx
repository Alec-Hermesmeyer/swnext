import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import TWAdminLayout from "@/components/TWAdminLayout";
import withAuthTw from "@/components/withAuthTw";
import supabase from "@/components/Supabase";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

function CompanyContactsTW() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", job_title: "", email: "", phone: "" });

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('company_contacts').select('*').order('id', { ascending: false });
      setContacts(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const add = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.from('company_contacts').upsert([form]).select('*');
    if (!error && data) {
      setContacts([data[0], ...contacts]);
      setForm({ name: "", job_title: "", email: "", phone: "" });
    }
  };

  const remove = async (id) => {
    await supabase.from('company_contacts').delete().eq('id', id);
    setContacts(contacts.filter((c) => c.id !== id));
  };

  return (
    <>
      <Head>
        <title>Company Contacts | Tailwind</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className="mx-auto w-full max-w-[1200px] px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className={`${lato.className} text-2xl font-extrabold text-[#0b2a5a]`}>Company Contacts</h1>
          <Link href="/tw/admin" className="rounded-lg bg-neutral-100 px-3 py-2 text-sm font-semibold text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-200">Back to Admin</Link>
        </div>

        <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow">
          <form onSubmit={add} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-neutral-700">Name</label>
              <input className="mt-1 h-10 w-full rounded-md border border-neutral-300 px-3 shadow-sm focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30" value={form.name} onChange={(e)=>setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="text-sm font-semibold text-neutral-700">Job Title</label>
              <input className="mt-1 h-10 w-full rounded-md border border-neutral-300 px-3 shadow-sm focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30" value={form.job_title} onChange={(e)=>setForm({ ...form, job_title: e.target.value })} required />
            </div>
            <div>
              <label className="text-sm font-semibold text-neutral-700">Email</label>
              <input type="email" className="mt-1 h-10 w-full rounded-md border border-neutral-300 px-3 shadow-sm focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30" value={form.email} onChange={(e)=>setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="text-sm font-semibold text-neutral-700">Phone</label>
              <input className="mt-1 h-10 w-full rounded-md border border-neutral-300 px-3 shadow-sm focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30" value={form.phone} onChange={(e)=>setForm({ ...form, phone: e.target.value })} required />
            </div>
            <div className="md:col-span-2">
              <button className="inline-flex items-center rounded-md bg-red-600 px-5 py-2 font-bold text-white shadow hover:bg-red-700" type="submit">Add Contact</button>
            </div>
          </form>
        </section>

        <section className="mt-6 rounded-xl border border-neutral-200 bg-white p-5 shadow">
          <div className="mb-4 font-semibold text-neutral-700">Contacts</div>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="text-left text-sm text-neutral-600">
                    <th className="p-2">Name</th>
                    <th className="p-2">Title</th>
                    <th className="p-2">Email</th>
                    <th className="p-2">Phone</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody className="text-sm text-neutral-800">
                  {contacts.map((c) => (
                    <tr key={c.id} className="border-t">
                      <td className="p-2">{c.name}</td>
                      <td className="p-2">{c.job_title}</td>
                      <td className="p-2">{c.email}</td>
                      <td className="p-2">{c.phone}</td>
                      <td className="p-2">
                        <button className="rounded-md bg-rose-600 px-3 py-1 text-white hover:bg-rose-700" onClick={()=>remove(c.id)}>Delete</button>
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

CompanyContactsTW.getLayout = function getLayout(page) {
  return <TWAdminLayout>{page}</TWAdminLayout>;
};

export default withAuthTw(CompanyContactsTW);


