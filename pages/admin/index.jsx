import Head from "next/head";
import Link from "next/link";
import withAuthTw from "@/components/withAuthTw";
import TWAdminLayout from "@/components/TWAdminLayout";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "📊", description: "View stats and overview", color: "bg-blue-50 border-blue-200" },
  { href: "/admin/social-media", label: "Social Media", icon: "📱", description: "AI-powered social manager", color: "bg-sky-50 border-sky-200" },
  { href: "/admin/image-assignments", label: "Page Images", icon: "🖼️", description: "Assign images to pages", color: "bg-orange-50 border-orange-200" },
  { href: "/admin/company-contacts", label: "Company Contacts", icon: "👥", description: "Manage team contacts", color: "bg-green-50 border-green-200" },
  { href: "/admin/careers", label: "Careers", icon: "💼", description: "Manage job postings", color: "bg-purple-50 border-purple-200" },
  { href: "/admin/sales", label: "Sales", icon: "📈", description: "Sales pipeline data", color: "bg-yellow-50 border-yellow-200" },
  { href: "/admin/contact", label: "Submissions", icon: "📩", description: "Form submissions", color: "bg-pink-50 border-pink-200" },
];

function AdminHomeTW() {
  return (
    <>
      <Head>
        <title>Admin Home | S&W Foundation</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div>
        <div className="mb-8">
          <h1 className={`${lato.className} text-3xl font-extrabold text-[#0b2a5a]`}>Welcome to Admin</h1>
          <p className="mt-2 text-neutral-600">Select a section below to get started</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`group rounded-xl border-2 ${link.color} p-6 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1`}
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">{link.icon}</div>
                <div className="flex-1">
                  <h2 className={`${lato.className} text-lg font-bold text-neutral-800 group-hover:text-red-600 transition-colors`}>
                    {link.label}
                  </h2>
                  <p className="mt-1 text-sm text-neutral-600">{link.description}</p>
                </div>
                <div className="text-neutral-400 group-hover:text-red-600 transition-colors">→</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h3 className={`${lato.className} text-lg font-bold text-[#0b2a5a] mb-4`}>Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/careers"
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
            >
              + Add Job Posting
            </Link>
            <Link
              href="/admin/image-assignments"
              className="inline-flex items-center gap-2 rounded-lg bg-[#0b2a5a] px-4 py-2 text-sm font-semibold text-white hover:brightness-110 transition-all"
            >
              Manage Images
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-200 transition-colors"
            >
              View Live Site →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

AdminHomeTW.getLayout = function getLayout(page) {
  return <TWAdminLayout>{page}</TWAdminLayout>;
};

export default withAuthTw(AdminHomeTW);



