"use client"
import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import withAuthTw from "@/components/withAuthTw";
import TWAdminLayout from "@/components/TWAdminLayout";
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
      <div className="pt-3 text-sm"><Link href="/admin/careers" className="text-red-700 hover:underline">View all jobs →</Link></div>
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
      <div className="pt-3 text-sm"><Link href="/admin/company-contacts" className="text-red-700 hover:underline">View all contacts →</Link></div>
    </div>
  );
}

function DashboardTW() {
  const [jobCount, setJobCount] = useState(0);
  const [contactCount, setContactCount] = useState(0);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const { count: jobCnt } = await supabase.from("jobs").select("*", { count: "exact", head: true });
        const { count: contactCnt } = await supabase.from("company_contacts").select("*", { count: "exact", head: true });
        const { count: subCnt } = await supabase.from("contact_form").select("*", { count: "exact", head: true });
        setJobCount(jobCnt || 0);
        setContactCount(contactCnt || 0);
        setSubmissionCount(subCnt || 0);
      } finally {
        setLoading(false);
      }
    };
    fetchCounts();
  }, []);

  return (
    <>
      <Head>
        <title>Dashboard | Admin</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div>
        <div className="mb-6">
          <h1 className={`${lato.className} text-2xl font-extrabold text-[#0b2a5a]`}>Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-600">Overview of your site data and quick actions</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-neutral-500">Job Postings</div>
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-xl">💼</div>
            </div>
            <div className={`${lato.className} mt-2 text-3xl font-extrabold text-neutral-900`}>{loading ? '—' : jobCount}</div>
            <Link href="/admin/careers" className="mt-2 inline-block text-sm font-semibold text-red-600 hover:text-red-700">Manage →</Link>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-neutral-500">Company Contacts</div>
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center text-xl">👥</div>
            </div>
            <div className={`${lato.className} mt-2 text-3xl font-extrabold text-neutral-900`}>{loading ? '—' : contactCount}</div>
            <Link href="/admin/company-contacts" className="mt-2 inline-block text-sm font-semibold text-red-600 hover:text-red-700">Manage →</Link>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-neutral-500">Form Submissions</div>
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center text-xl">📩</div>
            </div>
            <div className={`${lato.className} mt-2 text-3xl font-extrabold text-neutral-900`}>{loading ? '—' : submissionCount}</div>
            <Link href="/admin/contact" className="mt-2 inline-block text-sm font-semibold text-red-600 hover:text-red-700">View →</Link>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-neutral-500">Page Images</div>
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center text-xl">🖼️</div>
            </div>
            <div className={`${lato.className} mt-2 text-3xl font-extrabold text-neutral-900`}>—</div>
            <Link href="/admin/image-assignments" className="mt-2 inline-block text-sm font-semibold text-red-600 hover:text-red-700">Manage →</Link>
          </div>
        </div>

        {/* Recent Data Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className={`${lato.className} mb-4 text-lg font-bold text-[#0b2a5a]`}>Recent Job Postings</div>
            <JobListPreview />
          </section>
          <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className={`${lato.className} mb-4 text-lg font-bold text-[#0b2a5a]`}>Company Contacts</div>
            <ContactListPreview />
          </section>
        </div>
      </div>
    </>
  );
}

DashboardTW.getLayout = function getLayout(page) {
  return <TWAdminLayout>{page}</TWAdminLayout>;
};

export default withAuthTw(DashboardTW);


