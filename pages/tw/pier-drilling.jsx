import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import TWLayout from "@/components/TWLayout";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

function Hero() {
  return (
    <section className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 text-white min-h-[40vh] md:min-h-[50vh] flex items-center">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://edycymyofrowahspzzpg.supabase.co/storage/v1/object/public/Images/public/newimages/IMG_8084.webp')", backgroundPosition: "center" }} />
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
        <section className="mx-auto w-full max-w-[1200px] px-6 py-10">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="rounded-2xl bg-[#0b2a5a] p-6 text-white shadow ring-1 ring-white/10">
              <h2 className={`${lato.className} text-2xl font-extrabold`}>We set the standard</h2>
              <p className="mt-3 leading-relaxed text-white/90">We deliver comprehensive pier drilling solutions with a modern fleet and experienced operators. From friction piles to slurry piers, we engineer and execute for safety and longevity.</p>
              <div className="mt-6 flex gap-3">
                <Link href="/tw/services" className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 font-bold text-white shadow hover:bg-red-700">Services</Link>
                <Link href="/tw/limited-access" className="inline-flex items-center rounded-md bg-white/10 px-4 py-2 font-bold text-white ring-1 ring-white/30 hover:bg-white/20">Limited-Access</Link>
              </div>
            </div>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10">
              <Image src="/galleryImages/gal2.jpeg" alt="Pier Drilling" fill sizes="(min-width: 768px) 600px, 90vw" className="object-cover" unoptimized loader={({src})=>src} />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

PierDrillingTW.getLayout = function getLayout(page) {
  return <TWLayout>{page}</TWLayout>;
};


