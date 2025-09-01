import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import TWLayout from "@/components/TWLayout";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

function Hero() {
  return (
    <section className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 text-white min-h-[40vh] md:min-h-[50vh] flex items-center">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('https://${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/Images/public/newimages/IMG_8084.webp')`, backgroundPosition: "center" }} />
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative mx-auto w-full px-0 py-20 text-center">
        <h1 className={`${lato.className} text-4xl md:text-5xl font-extrabold`}>Pier Drilling</h1>
      </div>
    </section>
  );
}

export default function PierDrillingTW() {
  return (
    <>
      <Head>
        <title>Pier Drilling | Tailwind Version</title>
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
                <h2 className={`${lato.className} text-2xl md:text-3xl font-extrabold`}>State of the Art Equipment</h2>
                <p className="mt-4 leading-relaxed text-white/90">S&W Foundation Contractors operates a fleet of 23 state-of-the-art drill rigs, allowing us to efficiently handle drilling operations for projects of all specializations and complexities. Our advanced drilling equipment ensures that each foundation is solid, stable and capable of withstanding the test of time.</p>
              </div>
              <div className="flex items-center justify-end">
                <div className="relative aspect-[4/3] w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/10 md:-mr-8">
                  <Image src={`https://${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/Images/public/redrig.webp`} alt="S&W Rig" fill sizes="(min-width: 768px) 600px, 90vw" className="object-cover" unoptimized loader={({src})=>src} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Article section */}
        <section className="mx-auto w-full max-w-[1200px] px-6 py-10">
          <h3 className={`${lato.className} text-2xl md:text-3xl font-extrabold text-[#0b2a5a]`}>We set the standard and innovate to overcome obstacles…</h3>
          <p className="mt-4 leading-relaxed text-neutral-800">We deliver comprehensive Pier Drilling Solutions for major construction projects across the United States. Our project management approach utilizes advanced technologies to drive efficiency and productivity onsite. We invest in state of the art hydraulic rotary drills, auger cast pile rigs, and excavator mounted equipment to execute pier installation rapidly and accurately. Our crews apply innovative drilling techniques and sequences tailored for specific soil conditions and project needs. Customers turn to us because they know we will deliver robust pier foundations that provide the load-bearing capacity required, even in challenging ground conditions. Our specialized expertise in caisson, pile, micropile and helix pier construction provides deep foundation solutions engineered for safety and longevity.</p>
        </section>

        {/* Bottom CTAs */}
        <section className="mx-auto w-full max-w-[1200px] px-6 pb-14">
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Link href="/tw/services" className="inline-flex items-center rounded-md bg-red-600 px-5 py-3 font-bold text-white shadow hover:bg-red-700">Services</Link>
            <Link href="/tw/limited-access" className="inline-flex items-center rounded-md bg-[#0b2a5a] px-5 py-3 font-bold text-white shadow hover:brightness-110">Limited-Access</Link>
          </div>
        </section>
      </main>
    </>
  );
}

PierDrillingTW.getLayout = function getLayout(page) {
  return <TWLayout>{page}</TWLayout>;
};


