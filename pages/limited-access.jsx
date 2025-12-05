import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import TWLayout from "@/components/TWLayout";
import { usePageImages } from "@/context/ImageContext";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

function Hero({ images }) {
  return (
    <section className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 text-white min-h-[40vh] md:min-h-[50vh] flex items-center">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${images.limitedAccessHero}')`, backgroundPosition: "center" }} />
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative mx-auto w-full px-0 py-20 text-center">
        <h1 className={`${lato.className} text-4xl md:text-5xl font-extrabold`}>Limited-Access Pier Drilling</h1>
      </div>
    </section>
  );
}

export default function LimitedAccessTW() {
  const { images } = usePageImages("services");
  return (
    <>
      <Head>
        <title>Limited Access Drilling | Tight Space Foundation Solutions | S&W Foundation Dallas</title>
        <meta 
          name="description" 
          content="Specialized limited access drilling services in Dallas, TX. Foundation solutions for tight spaces and confined areas. Expert drilling in challenging locations with specialized equipment." 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="keywords" content="limited access drilling dallas, tight space drilling, confined space foundation, specialized drilling equipment, limited access pier drilling, difficult access drilling texas" />
        <meta name="robots" content="index, follow" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Limited Access Drilling | Tight Space Foundation Solutions" />
        <meta property="og:description" content="Specialized limited access drilling services in Dallas, TX. Foundation solutions for tight spaces and confined areas with expert drilling techniques." />
        <meta property="og:url" content="https://www.swfoundation.com/limited-access" />
        <meta property="og:type" content="website" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://www.swfoundation.com/limited-access" />
      </Head>
      <main className="flex w-full flex-col">
        <Hero images={images} />
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
                  <Image src={images.limitedAccessContent} alt="Limited Access Drilling" fill sizes="(min-width: 768px) 600px, 90vw" className="object-cover" unoptimized loader={({src})=>src} />
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
            <Link href="/pier-drilling" className="inline-flex items-center rounded-md bg-red-600 px-5 py-3 font-bold text-white shadow hover:bg-red-700">Pier Drilling</Link>
            <Link href="/turn-key" className="inline-flex items-center rounded-md bg-[#0b2a5a] px-5 py-3 font-bold text-white shadow hover:brightness-110">Turn-Key</Link>
          </div>
        </section>
      </main>
    </>
  );
}

LimitedAccessTW.getLayout = function getLayout(page) {
  return <TWLayout>{page}</TWLayout>;
};


