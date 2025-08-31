import NavTailwind from "./NavTailwind";
import Image from "next/image";
import Link from "next/link";

export default function TWLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900">
      <header className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2">
        <NavTailwind />
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 bg-[#0b2a5a] text-white">
        <div className="mx-auto w-full px-0">
          <div className="grid grid-cols-1 gap-6 px-6 py-10 md:grid-cols-3 md:px-10">
            <div>
              <div className="inline-flex h-20 w-20 items-center justify-center">
                <Image
                  src="/swlogorwb.png"
                  alt="S&W"
                  width={90}
                  height={26}
                  sizes="90px"
                  priority
                  unoptimized
                  loader={({ src }) => src}
                />
              </div>
              <p className="mt-3 text-sm text-neutral-200">Commercial Pier Drilling - Dallas, Texas</p>
            </div>
            <div>
              <h4 className="font-black">Company</h4>
              <ul className="mt-2 space-y-2 text-sm">
                <li><Link href="/tw/about" className="hover:text-red-400">About</Link></li>
                <li><Link href="/tw/core-values" className="hover:text-red-400">Core Values</Link></li>
                <li><Link href="/tw/contact" className="hover:text-red-400">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black">Contact</h4>
              <ul className="mt-2 space-y-2 text-sm">
                <li>Phone: (214)-703-0484</li>
                <li>Address: 2806 Singleton St. Rowlett, TX 75088</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 px-6 py-4 text-center text-sm md:px-10">© {new Date().getFullYear()} S&W Foundation Contractors</div>
        </div>
      </footer>
    </div>
  );
}

 