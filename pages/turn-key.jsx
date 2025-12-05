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
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${images.turnKeyHero}')`, backgroundPosition: "center" }} />
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative mx-auto w-full px-0 py-20 text-center">
        <h1 className={`${lato.className} text-4xl md:text-5xl font-extrabold`}>Turn-Key Drilling Solutions</h1>
      </div>
    </section>
  );
}

export default function TurnKeyPage() {
  const { images } = usePageImages("services");
  return (
    <>
      <Head>
        <title>Turn-Key Services | S&W Foundation - Comprehensive Pier Drilling & Turn-Key Services in Dallas, TX</title>
        <meta name="description" content="S&W Foundation offers a suite of specialized Turn-Key Drilling services in Dallas, TX: pier drilling, limited-access pier drilling, turnkey solutions, crane, and trucking services. Leveraging years of experience and cutting-edge equipment, we're your trusted partner in commercial construction support." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="keywords" content="pier drilling, limited-access pier drilling, crane services, trucking services, turnkey solutions, caisson, slurry" />
        <meta property="og:title" content="Turn-Key Services | S&W Foundation - Your Partner in Commercial Construction in Dallas, TX" />
        <meta property="og:description" content="Discover S&W Foundation's range of services: from expert pier drilling to crane and trucking solutions, we cater to all your commercial construction needs in the US." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.swfoundation.com/turn-key" />
        <meta property="og:image" content={images.turnKeyHero} />
        <meta property='og:site_name' content='S&W Commercial Pier Drilling Contractors' />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="S&W Foundation | Dallas, TX's Premier Commercial Construction Partner" />
        <meta name="twitter:description" content="Expertise in commercial pier drilling, crane & trucking services, and more. See why businesses trust S&W Foundation for their construction needs." />
        <meta name="twitter:image" content={images.turnKeyHero} />
        <link rel="canonical" href="https://www.swfoundation.com/turn-key" />
        <link rel="icon" href="/android-chrome-512x512.png" type='image/x-icon'/>
      </Head>
      <main className="flex w-full flex-col">
        <Hero images={images} />

        {/* Main Info Section with navy background, red bar, and image */}
        <section className="mx-auto w-full max-w-[1600px] px-6 py-10">
          <div className="relative overflow-hidden rounded-2xl bg-[#0b2a5a] text-white shadow-2xl ring-1 ring-black/10">
            <div className="absolute left-0 top-0 h-2 md:h-3 w-full bg-red-600" />
            <div className="grid grid-cols-1 items-center gap-6 p-6 md:grid-cols-2 md:p-12">
              <div>
                <h2 className={`${lato.className} text-2xl md:text-3xl font-extrabold`}>Turn-Key Drilling Solutions</h2>
                <p className="mt-4 leading-relaxed text-white/90">S&W Foundation Contractors offers comprehensive Turn-Key Drilling Solutions for commercial construction projects across the United States. Our turn-key approach to drilling services ensures that we handle every aspect of the project from start to finish. We provide a full suite of drilling services, including pier drilling, limited-access drilling, and crane services. Our team of experts will work with you to develop a customized drilling plan that meets your project's unique requirements.</p>
              </div>
              <div className="flex items-center justify-end">
                <div className="relative aspect-[4/3] w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/10 md:-mr-8">
                  <Image src={images.turnKeyContent} alt="Turn-Key Drilling Solutions" fill sizes="(min-width: 768px) 600px, 90vw" className="object-cover" unoptimized loader={({src})=>src} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Article Section */}
        <section className="mx-auto w-full max-w-[1200px] px-6 py-10">
          <h3 className={`${lato.className} text-2xl md:text-3xl font-extrabold text-[#0b2a5a]`}>Innovative Solutions For All Your Project Needs...</h3>
          <p className="mt-4 leading-relaxed text-neutral-800">S&W Foundation Contractors is a forward-looking contractor with the capability to handle projects through various contracting models. As our financial strength has expanded, we have embraced Turn-Key contracts for select clients. Through this approach, we have effectively managed multiple projects from start to finish with great success. This contracting method offers a streamlined experience, serving as a single point of contact to ensure the safety, budget adherence, and timely completion of your project. Should you have a specific project in mind, please contact us to discuss how we can help you achieve your goals.</p>
        </section>

        {/* Bottom CTAs */}
        <section className="mx-auto w-full max-w-[1200px] px-6 pb-14">
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Link href="/limited-access" className="inline-flex items-center rounded-md bg-red-600 px-5 py-3 font-bold text-white shadow hover:bg-red-700">Limited-Access</Link>
            <Link href="/crane" className="inline-flex items-center rounded-md bg-[#0b2a5a] px-5 py-3 font-bold text-white shadow hover:brightness-110">Crane Services</Link>
          </div>
        </section>
      </main>
    </>
  );
}

TurnKeyPage.getLayout = function getLayout(page) {
  return <TWLayout>{page}</TWLayout>;
};

