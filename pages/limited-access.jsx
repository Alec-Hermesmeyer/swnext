import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import TWLayout from "@/components/TWLayout";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

function Hero() {
  return (
    <section className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 text-white min-h-[40vh] md:min-h-[50vh] flex items-center">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://edycymyofrowahspzzpg.supabase.co/storage/v1/object/public/Images/public/Pratt2.webp')", backgroundPosition: "center" }} />
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative mx-auto w-full px-0 py-20 text-center">
        <h1 className={`${lato.className} text-4xl md:text-5xl font-extrabold`}>Limited-Access Pier Drilling</h1>
      </div>
    </section>
  );
}

export default function LimitedAccessTW() {
  return (
    <>
      <Head>
        <title>Limited-Access | Tailwind Version</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className="flex w-full flex-col">
        <Hero />
        <section className="mx-auto w-full max-w-[1600px] px-6 py-10">
          <div className="relative overflow-hidden rounded-2xl bg-[#0b2a5a] text-white shadow-2xl ring-1 ring-black/10">
            <div className="absolute left-0 top-0 h-2 md:h-3 w-full bg-red-600" />
            <div className="grid grid-cols-1 items-center gap-6 p-6 md:grid-cols-2 md:p-12">
              <div>
                <h2 className={`${lato.className} text-2xl md:text-3xl font-extrabold`}>Tight sites, big results</h2>
                <p className="mt-4 leading-relaxed text-white/90">We specialize in low headroom and confined access drilling. Our purpose-built rigs and experienced crews deliver safely when space is limited.</p>
              </div>
              <div className="flex items-center justify-end">
                <div className="relative aspect-[4/3] w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/10 md:-mr-8">
                  <Image src={`https://${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/Images/public/home1.webp`} alt="Limited Access" fill sizes="(min-width: 768px) 600px, 90vw" className="object-cover" unoptimized loader={({src})=>src} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Article content */}
        <section className="mx-auto w-full max-w-[1200px] px-6 py-6">
          <h3 className={`${lato.className} text-2xl md:text-3xl font-extrabold text-[#0b2a5a]`}>We use our expertise to overcome obstacles...</h3>
          <p className="mt-4 leading-relaxed text-neutral-800">When it comes to Limited-Access Pier Drilling, S&W Foundation Contractors is the industry leader. Our team of experts is equipped with the knowledge, experience, and cutting-edge equipment necessary to tackle even the most challenging drilling projects. We specialize in providing comprehensive drilling solutions for projects with limited access, ensuring that each foundation is solid, stable, and built to last. With a focus on safety, efficiency, and quality, we are committed to delivering exceptional results that meet and exceed our clients’ expectations. Contact us today to learn more about our Limited-Access Pier Drilling services and how we can help you with your next project.</p>
        </section>

        <section className="mx-auto w-full max-w-[1200px] px-6 pb-14">
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Link href="/tw/pier-drilling" className="inline-flex items-center rounded-md bg-red-600 px-5 py-3 font-bold text-white shadow hover:bg-red-700">Pier Drilling</Link>
            <Link href="/tw/turn-key" className="inline-flex items-center rounded-md bg-[#0b2a5a] px-5 py-3 font-bold text-white shadow hover:brightness-110">Turn-Key</Link>
          </div>
        </section>
      </main>
    </>
  );
}

LimitedAccessTW.getLayout = function getLayout(page) {
  return <TWLayout>{page}</TWLayout>;
};


