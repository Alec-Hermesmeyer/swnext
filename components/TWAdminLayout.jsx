import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { Lato } from "next/font/google";
import AIChatBubble from "@/components/admin/AIChatBubble";
import { useAuth } from "@/context/AuthContext";
import { getVisibleNavLinks } from "@/lib/roles";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

const ROLE_LABELS = {
  admin: "Admin",
  operations: "Operations",
  social_media: "Social Media",
  hr: "HR",
  sales: "Sales",
  viewer: "Viewer",
};

export default function TWAdminLayout({ children }) {
  const router = useRouter();
  const currentPath = router.pathname;
  const { role } = useAuth();

  const navLinks = getVisibleNavLinks(role);

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
            {role && ROLE_LABELS[role] ? (
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white/80">
                {ROLE_LABELS[role]}
              </span>
            ) : null}
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

      {/* AI Assistant */}
      <AIChatBubble />
    </div>
  );
}

