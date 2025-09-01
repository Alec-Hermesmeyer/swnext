import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import TWLayout from "@/components/TWLayout";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

function Hero() {
  return (
    <section className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 text-white min-h-[40vh] md:min-h-[50vh] flex items-center">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('https://${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/Images/public/newimages/IMG_7642.webp')`, backgroundPosition: "center" }} />
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative mx-auto w-full px-0 py-20 text-center">
        <h1 className={`${lato.className} text-4xl md:text-5xl font-extrabold`}>Safety</h1>
      </div>
    </section>
  );
}

export default function SafetyTW() {
  return (
    <>
      <Head>
        <title>Safety | Tailwind Version</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className="flex w-full flex-col">
        <Hero />
        <section className="mx-auto w-full max-w-[1600px] px-6 py-10">
          <div className="relative overflow-hidden rounded-2xl bg-[#0b2a5a] text-white shadow-2xl ring-1 ring-black/10">
            <div className="absolute left-0 top-0 h-2 md:h-3 w-full bg-red-600" />
            <div className="grid grid-cols-1 items-center gap-6 p-6 md:grid-cols-2 md:p-12">
              <div>
                <h2 className={`${lato.className} text-2xl md:text-3xl font-extrabold`}>Safety is non-negotiable</h2>
                <p className="mt-4 leading-relaxed text-white/90">We uphold the highest standards of safety and execution across all jobsites, with proactive training and accountability.</p>
              </div>
              <div className="flex items-center justify-end">
                <div className="relative aspect-[4/3] w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/10 md:-mr-8">
                  <Image src={`https://${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/Images/public/newimages/IMG_7642.webp`} alt="Safety" fill sizes="(min-width: 768px) 600px, 90vw" className="object-cover" unoptimized loader={({src})=>src} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Article content */}
        <section className="mx-auto w-full max-w-[1200px] px-6 py-6">
          <h3 className={`${lato.className} text-2xl md:text-3xl font-extrabold text-[#0b2a5a]`}>Leaving How You Arrived Is The Standard...</h3>
          <p className="mt-4 leading-relaxed text-neutral-800">S&W Foundation Contractors’ commitment to safety is our highest priority. We provide ongoing safety training and conduct job site inspections and safety audits to identify and correct potential hazards. Our comprehensive safety program meets or exceeds OSHA standards and regulations. At S&W, safety is not just a priority—it is a core value that guides everything we do.</p>
        </section>

        <section className="mx-auto w-full max-w-[1200px] px-6 pb-14">
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Link href="/tw/services" className="inline-flex items-center rounded-md bg-red-600 px-5 py-3 font-bold text-white shadow hover:bg-red-700">All Services</Link>
            <Link href="/tw/contact" className="inline-flex items-center rounded-md bg-[#0b2a5a] px-5 py-3 font-bold text-white shadow hover:brightness-110">Contact</Link>
          </div>
        </section>
      </main>
    </>
  );
}

SafetyTW.getLayout = function getLayout(page) {
  return <TWLayout>{page}</TWLayout>;
};


