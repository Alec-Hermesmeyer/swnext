import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

export default function TWAdminLayout({ children }) {
  const router = useRouter();
  const currentPath = router.pathname;

  const navLinks = [
    { href: "/admin", label: "Home" },
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/social-media", label: "Social Media" },
    { href: "/admin/image-assignments", label: "Page Images" },
    { href: "/admin/company-contacts", label: "Contacts" },
    { href: "/admin/careers", label: "Careers" },
    { href: "/admin/sales", label: "Sales" },
    { href: "/admin/contact", label: "Submissions" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-[#0b2a5a] shadow-lg">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm">
              <Image src="/swlogorwb.png" alt="S&W" width={28} height={28} priority unoptimized loader={({src})=>src} />
            </div>
            <div>
              <span className={`${lato.className} text-lg font-bold text-white`}>S&W Admin</span>
              <span className="hidden md:inline ml-2 text-xs text-white/60">Console</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 transition-colors">
              View Site
            </Link>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-neutral-200 bg-white shadow-sm">
        <div className="mx-auto w-full max-w-[1400px] px-4 md:px-6">
          <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
            {navLinks.map((link) => {
              const isActive = currentPath === link.href ||
                (link.href !== "/admin" && currentPath.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-red-600 text-white"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-6">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-4 py-4 text-sm text-neutral-500 md:px-6">
          <div>&copy; {new Date().getFullYear()} S&W Foundation Contractors</div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500"></span>
              Admin Console
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}


