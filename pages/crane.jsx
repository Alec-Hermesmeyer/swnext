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
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${images.craneHero}')`, backgroundPosition: "center" }} />
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative mx-auto w-full px-0 py-20 text-center">
        <h1 className={`${lato.className} text-4xl md:text-5xl font-extrabold`}>Crane Services</h1>
      </div>
    </section>
  );
}

export default function CraneTW() {
  const { images } = usePageImages("services");
  return (
    <>
      <Head>
        <title>Crane Services Dallas TX | Heavy Equipment Rental | S&W Foundation Contractors</title>
        <meta 
          name="description" 
          content="Professional crane services in Dallas, TX. Heavy equipment rental and crane operations for construction projects. Experienced crane operators and modern fleet. Commercial and industrial projects." 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="keywords" content="crane services dallas, heavy equipment rental texas, crane operations, construction crane rental, commercial crane services, crane operators dallas" />
        <meta name="robots" content="index, follow" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Crane Services Dallas TX | Heavy Equipment Rental" />
        <meta property="og:description" content="Professional crane services in Dallas, TX. Heavy equipment rental and crane operations for construction projects with experienced operators." />
        <meta property="og:url" content="https://www.swfoundation.com/crane" />
        <meta property="og:type" content="website" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://www.swfoundation.com/crane" />
      </Head>
      <main className="flex w-full flex-col">
        <Hero images={images} />
        <section className="mx-auto w-full max-w-[1600px] px-6 py-10">
          <div className="relative overflow-hidden rounded-2xl bg-[#0b2a5a] text-white shadow-2xl ring-1 ring-black/10">
            <div className="absolute left-0 top-0 h-2 md:h-3 w-full bg-red-600" />
            <div className="grid grid-cols-1 items-center gap-6 p-6 md:grid-cols-2 md:p-12">
              <div>
                <h2 className={`${lato.className} text-2xl md:text-3xl font-extrabold`}>Modern fleet</h2>
                <p className="mt-4 leading-relaxed text-white/90">Experienced operators and well-maintained equipment keep your project on schedule.</p>
              </div>
              <div className="flex items-center justify-end">
                <div className="relative aspect-[4/3] w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/10 md:-mr-8">
                  <Image src={images.craneContent} alt="Professional Crane Operations" fill sizes="(min-width: 768px) 600px, 90vw" className="object-cover" unoptimized loader={({src})=>src} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Article content */}
        <section className="mx-auto w-full max-w-[1200px] px-6 py-6">
          <h3 className={`${lato.className} text-2xl md:text-3xl font-extrabold text-[#0b2a5a]`}>If You Need A Lift, We Have Got You Covered...</h3>
          <p className="mt-4 leading-relaxed text-neutral-800">Clients entrust us for our proven ability to provide robust lifting solutions, regardless of complexity. Our specialized expertise spans a wide range, from heavy machinery to construction materials. Our crane services are designed to meet the expectations of the job at hand. Safety is paramount, and we ensure that all of our operators are trained and certified to operate our equipment. Contact us today to explore the comprehensive array of lifting solutions we offer—designed to elevate your projects to new heights while keeping safety and efficiency at the forefront.</p>
        </section>

        <section className="mx-auto w-full max-w-[1200px] px-6 pb-14">
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Link href="/services" className="inline-flex items-center rounded-md bg-red-600 px-5 py-3 font-bold text-white shadow hover:bg-red-700">All Services</Link>
            <Link href="/turn-key" className="inline-flex items-center rounded-md bg-[#0b2a5a] px-5 py-3 font-bold text-white shadow hover:brightness-110">Turn-Key</Link>
          </div>
        </section>
      </main>
    </>
  );
}

CraneTW.getLayout = function getLayout(page) {
  return <TWLayout>{page}</TWLayout>;
};


