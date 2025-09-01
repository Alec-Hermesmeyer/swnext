import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import TWLayout from "@/components/TWLayout";
import { GridPattern } from "@/components/GridPattern";
import { FadeIn } from "@/components/FadeIn";
import { useEffect, useState } from "react";
import supabase from "@/components/Supabase";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

function Hero() {
  return (
    <section className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 text-white min-h-[40vh] md:min-h-[50vh] flex items-center">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://edycymyofrowahspzzpg.supabase.co/storage/v1/object/public/Images/public/newimages/IMG_5171.webp?version=1')" }} />
      <div className="absolute inset-0 bg-black/45" />
      <div className="relative mx-auto w-full px-0 py-16 text-center">
        <h1 className={`${lato.className} text-4xl md:text-5xl font-extrabold`}>Careers</h1>
      </div>
    </section>
  );
}

export default function CareersTW() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{
    const load = async ()=>{
      const { data } = await supabase.from('jobs').select('*');
      setJobs((data||[]).filter(j=>j.is_Open));
      setLoading(false);
    };
    load();
  },[]);

  return (
    <>
      <Head>
        <title>Careers | Tailwind</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className="relative flex w-full flex-col">
        <div className="pointer-events-none fixed inset-0 -z-10">
          <GridPattern className="h-full w-full" yOffset={0} interactive strokeColor="#0b2a5a" strokeOpacity={0.12} />
        </div>
        <Hero />
        <section className="mx-auto w-full max-w-[1200px] px-6 py-12">
          <h2 className={`${lato.className} mb-6 text-center text-3xl font-extrabold text-[#0b2a5a]`}>Join Our Team</h2>
          {loading ? (
            <p>Loading...</p>
          ) : jobs.length === 0 ? (
            <p>No open positions at the moment.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {jobs.map((job)=> (
                <FadeIn key={job.id}>
                  <div className="rounded-2xl bg-[#0b2a5a] p-5 text-white shadow ring-1 ring-white/10">
                    <details>
                      <summary className={`${lato.className} cursor-pointer text-lg font-extrabold`}>{job.jobTitle}</summary>
                      <div className="mt-3">
                        <Link href="/tw/contact#jobForm" className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 font-bold text-white shadow hover:bg-red-700">Apply Today</Link>
                      </div>
                    </details>
                  </div>
                </FadeIn>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}

CareersTW.getLayout = function getLayout(page) {
  return <TWLayout>{page}</TWLayout>;
};


