import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import TWLayout from "@/components/TWLayout";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

function Hero() {
  return (
    <section className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 text-white min-h-[40vh] md:min-h-[50vh] flex items-center">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/Pratt3.jpeg')", backgroundPosition: "center" }} />
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative mx-auto w-full px-0 py-20 text-center">
        <h1 className={`${lato.className} text-4xl md:text-5xl font-extrabold`}>Helical Piles</h1>
      </div>
    </section>
  );
}

export default function HelicalPilesTW() {
  return (
    <>
      <Head>
        <title>Helical Piles | Tailwind Version</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className="flex w-full flex-col">
        <Hero />
        {/* Info Row as a single navy card with red bar and image on right */}
        <section className="mx-auto w-full max-w-[1600px] px-6 py-10">
          <div className="relative overflow-hidden rounded-2xl bg-[#0b2a5a] text-white shadow-2xl ring-1 ring-black/10">
            <div className="absolute left-0 top-0 h-2 md:h-3 w-full bg-red-600" />
            <div className="grid grid-cols-1 items-center gap-6 p-6 md:grid-cols-2 md:p-12">
              <div>
                <h2 className={`${lato.className} text-2xl md:text-3xl font-extrabold`}>Engineering Support & Load Testing</h2>
                <p className="mt-4 leading-relaxed text-white/90">We provide design-assist, pre-production load tests, and torque monitoring on every installation. Our certified crews verify capacity in real time and deliver documentation that meets engineer-of-record and AHJ requirements, helping you accelerate approvals and reduce rework.</p>
                <div className="mt-6 flex gap-3">
                  <Link href="/tw/services" className="inline-flex items-center rounded-md bg-red-600 px-5 py-3 font-bold text-white shadow hover:bg-red-700">All Services</Link>
                  <Link href="/tw/contact" className="inline-flex items-center rounded-md bg-white/10 px-5 py-3 font-bold text-white ring-1 ring-white/30 hover:bg-white/20">Contact</Link>
                </div>
              </div>
              <div className="flex items-center justify-end">
                <div className="relative aspect-[4/3] w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/10 md:-mr-8">
                  <Image src="/Pratt2.jpeg" alt="Helical Pile Load Testing" fill sizes="(min-width: 768px) 600px, 90vw" className="object-cover" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Article section */}
        <section className="mx-auto w-full max-w-[1200px] px-6 py-10">
          <h3 className={`${lato.className} text-2xl md:text-3xl font-extrabold text-[#0b2a5a]`}>Setting new standards in helical pile installation</h3>
          <p className="mt-4 leading-relaxed text-neutral-800">Helical piles are a versatile, low-vibration deep foundation system ideal for poor soils, tight access, and fast schedules. We engineer and install commercial-grade helical piles with predictable capacity, immediate load transfer, and minimal spoils. Typical applications include boardwalks, pipe racks, tank farms, mezzanines, signage, and structure underpinning. Our turnkey delivery includes design-assist, pre-production load testing, certified installation, and real-time torque monitoring to verify capacity. We mobilize our own equipment and crane support to reduce dependencies and keep projects on schedule.</p>
        </section>

        {/* Bottom CTAs */}
        <section className="mx-auto w-full max-w-[1200px] px-6 pb-14">
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Link href="/tw/pier-drilling" className="inline-flex items-center rounded-md bg-red-600 px-5 py-3 font-bold text-white shadow hover:bg-red-700">Pier Drilling</Link>
            <Link href="/tw/limited-access" className="inline-flex items-center rounded-md bg-[#0b2a5a] px-5 py-3 font-bold text-white shadow hover:brightness-110">Limited-Access</Link>
          </div>
        </section>
      </main>
    </>
  );
}

HelicalPilesTW.getLayout = function getLayout(page) {
  return <TWLayout>{page}</TWLayout>;
};


