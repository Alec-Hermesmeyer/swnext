import Head from "next/head";
import Link from "next/link";
import TWAdminLayout from "@/components/TWAdminLayout";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

export default function AdminHomeTW() {
  return (
    <>
      <Head>
        <title>Admin | Tailwind</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className="mx-auto w-full max-w-[1200px] px-6 py-10">
        <h1 className={`${lato.className} text-3xl font-extrabold text-[#0b2a5a]`}>Admin (Tailwind)</h1>
        <p className="mt-2 text-neutral-700">Quick links:</p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          <Link href="/tw/admin/dashboard" className="rounded-xl border border-neutral-200 bg-white p-5 shadow hover:shadow-md">Dashboard</Link>
          <Link href="/tw/admin/company-contacts" className="rounded-xl border border-neutral-200 bg-white p-5 shadow hover:shadow-md">Company Contacts</Link>
          <Link href="/tw/admin/careers" className="rounded-xl border border-neutral-200 bg-white p-5 shadow hover:shadow-md">Careers</Link>
          <Link href="/tw/admin/sales" className="rounded-xl border border-neutral-200 bg-white p-5 shadow hover:shadow-md">Sales</Link>
          <Link href="/tw/admin/contact" className="rounded-xl border border-neutral-200 bg-white p-5 shadow hover:shadow-md">Submissions</Link>
          <Link href="/tw/login" className="rounded-xl border border-neutral-200 bg-white p-5 shadow hover:shadow-md">Login</Link>
        </div>
      </main>
    </>
  );
}

AdminHomeTW.getLayout = function getLayout(page) {
  return <TWAdminLayout>{page}</TWAdminLayout>;
};


