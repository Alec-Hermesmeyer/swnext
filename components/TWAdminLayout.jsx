import Link from "next/link";
import Image from "next/image";

export default function TWAdminLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
      <header className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 border-b border-neutral-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-md ring-1 ring-neutral-200 bg-white shadow-sm">
              <Image src="/swlogorwb.png" alt="S&W" width={30} height={30} priority unoptimized loader={({src})=>src} />
            </div>
            <span className="text-sm font-black tracking-wide text-neutral-700">Admin Console</span>
          </div>
          <nav className="hidden items-center gap-4 text-sm font-semibold text-neutral-700 md:flex">
            <Link className="hover:text-red-700" href="/tw/admin">Home</Link>
            <Link className="hover:text-red-700" href="/tw/admin/dashboard">Dashboard</Link>
            <Link className="hover:text-red-700" href="/tw/admin/company-contacts">Contacts</Link>
            <Link className="hover:text-red-700" href="/tw/admin/careers">Careers</Link>
            <Link className="hover:text-red-700" href="/tw/admin/sales">Sales</Link>
            <Link className="hover:text-red-700" href="/tw/admin/contact">Submissions</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/" className="rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-bold text-neutral-800 ring-1 ring-neutral-300 hover:bg-neutral-200">Main Site</Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 border-t border-neutral-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-4 py-3 text-xs text-neutral-600 md:px-6">
          <div>© {new Date().getFullYear()} S&W Foundation Contractors</div>
          <div>Admin Console</div>
        </div>
      </footer>
    </div>
  );
}


