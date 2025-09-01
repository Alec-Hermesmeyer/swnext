"use client"
import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import TWAdminLayout from "@/components/TWAdminLayout";
import withAuthTw from "@/components/withAuthTw";
import supabase from "@/components/Supabase";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

function JobListPreview() {
  const [jobs, setJobs] = useState([]);
  useEffect(() => {
    const fetchJobs = async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      if (!error) setJobs(data || []);
    };
    fetchJobs();
  }, []);
  return (
    <div className="divide-y">
      {jobs.map((job) => (
        <div key={job.id} className="flex items-center justify-between py-2">
          <div>
            <div className="font-semibold text-neutral-800">{job.jobTitle}</div>
            <div className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${job.is_Open ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>{job.is_Open ? 'Open' : 'Closed'}</div>
          </div>
        </div>
      ))}
      <div className="pt-3 text-sm"><Link href="/tw/admin/careers" className="text-red-700 hover:underline">View all jobs →</Link></div>
    </div>
  );
}

function ContactListPreview() {
  const [contacts, setContacts] = useState([]);
  useEffect(() => {
    const fetchContacts = async () => {
      const { data, error } = await supabase
        .from("company_contacts")
        .select("*")
        .order("id", { ascending: false })
        .limit(6);
      if (!error) setContacts(data || []);
    };
    fetchContacts();
  }, []);
  return (
    <div className="divide-y">
      {contacts.map((c) => (
        <div key={c.id} className="flex items-center justify-between py-2">
          <div>
            <div className="font-semibold text-neutral-800">{c.name}</div>
            <div className="text-sm text-neutral-600">{c.job_title}</div>
          </div>
          <div className="text-sm text-neutral-500">{c.email}</div>
        </div>
      ))}
      <div className="pt-3 text-sm"><Link href="/tw/admin/company-contacts" className="text-red-700 hover:underline">View all contacts →</Link></div>
    </div>
  );
}

function DashboardTW() {
  const [jobCount, setJobCount] = useState(0);
  const [contactCount, setContactCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const { count: jobCnt } = await supabase.from("jobs").select("*", { count: "exact", head: true });
        const { count: contactCnt } = await supabase.from("company_contacts").select("*", { count: "exact", head: true });
        setJobCount(jobCnt || 0);
        setContactCount(contactCnt || 0);
      } finally {
        setLoading(false);
      }
    };
    fetchCounts();
  }, []);

  return (
    <>
      <Head>
        <title>Dashboard | Tailwind</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className="mx-auto w-full max-w-[1200px] px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className={`${lato.className} text-2xl font-extrabold text-[#0b2a5a]`}>Dashboard</h1>
          <Link href="/tw/admin" className="rounded-lg bg-neutral-100 px-3 py-2 text-sm font-semibold text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-200">Admin Home</Link>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow">
            <div className="text-sm font-semibold text-neutral-500">Job Postings</div>
            <div className="mt-2 text-3xl font-extrabold text-neutral-900">{loading ? '—' : jobCount}</div>
            <Link href="/tw/admin/careers" className="mt-2 inline-block text-sm font-semibold text-red-700 hover:underline">Manage postings</Link>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow">
            <div className="text-sm font-semibold text-neutral-500">Company Contacts</div>
            <div className="mt-2 text-3xl font-extrabold text-neutral-900">{loading ? '—' : contactCount}</div>
            <Link href="/tw/admin/company-contacts" className="mt-2 inline-block text-sm font-semibold text-red-700 hover:underline">Manage contacts</Link>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow">
            <div className="text-sm font-semibold text-neutral-500">Total Records</div>
            <div className="mt-2 text-3xl font-extrabold text-neutral-900">{loading ? '—' : (jobCount + contactCount)}</div>
            <Link href="/tw/admin/contact" className="mt-2 inline-block text-sm font-semibold text-red-700 hover:underline">View submissions</Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow">
            <div className="mb-3 font-semibold text-neutral-700">Recent Job Postings</div>
            <JobListPreview />
          </section>
          <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow">
            <div className="mb-3 font-semibold text-neutral-700">Company Contacts</div>
            <ContactListPreview />
          </section>
        </div>
      </main>
    </>
  );
}

DashboardTW.getLayout = function getLayout(page) { return <TWAdminLayout>{page}</TWAdminLayout>; };

export default withAuthTw(DashboardTW);


