import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import TWLayout from "@/components/TWLayout";
import { ServiceSchema, BreadcrumbListSchema } from "@/components/StructuredData";
import { usePageImages } from "@/context/ImageContext";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

function Hero({ images }) {
  return (
    <section className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 text-white min-h-[40vh] md:min-h-[50vh] flex items-center">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${images.pierDrillingHero}')`, backgroundPosition: "center" }} />
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative mx-auto w-full px-0 py-20 text-center">
        <h1 className={`${lato.className} text-4xl md:text-5xl font-extrabold`}>Pier Drilling</h1>
      </div>
    </section>
  );
}

export default function PierDrillingTW() {
  const { images } = usePageImages("services");
  const breadcrumbs = [
    { name: "Home", url: "https://www.swfoundation.com/" },
    { name: "Services", url: "https://www.swfoundation.com/services" },
    { name: "Pier Drilling", url: "https://www.swfoundation.com/pier-drilling" }
  ];

  return (
    <>
      <Head>
        <title>Commercial Pier Drilling Dallas | Foundation Pier Services | S&W Foundation</title>
        <meta 
          name="description" 
          content="Expert commercial pier drilling services in Dallas, TX. Professional foundation pier installation for commercial and industrial projects. Advanced drilling equipment and 35+ years experience." 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="keywords" content="pier drilling dallas, commercial pier drilling, foundation pier services, pier installation texas, commercial foundation contractors, deep pier drilling" />
        <meta name="robots" content="index, follow" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Commercial Pier Drilling Dallas | Foundation Pier Services" />
        <meta property="og:description" content="Expert commercial pier drilling services in Dallas, TX. Professional foundation pier installation with advanced equipment and 35+ years experience." />
        <meta property="og:url" content="https://www.swfoundation.com/pier-drilling" />
        <meta property="og:type" content="website" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://www.swfoundation.com/pier-drilling" />
      </Head>
      
      {/* Structured Data */}
      <ServiceSchema
        serviceName="Commercial Pier Drilling"
        description="Expert commercial pier drilling services in Dallas, TX. Professional foundation pier installation for commercial and industrial projects with advanced drilling equipment and 35+ years of experience."
        serviceType="ConstructionService"
        category="Foundation Pier Drilling"
        url="https://www.swfoundation.com/pier-drilling"
        image={images.pierDrillingHero}
      />
      <BreadcrumbListSchema breadcrumbs={breadcrumbs} />
      <main className="flex w-full flex-col">
        <Hero images={images} />
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
                  <Image src={images.pierDrillingContent} alt="S&W Drilling Rig" fill sizes="(min-width: 768px) 600px, 90vw" className="object-cover" unoptimized loader={({src})=>src} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Capabilities Section */}
        <section className="mx-auto w-full max-w-[1200px] px-6 py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column - Main Content */}
            <div>
              <h3 className={`${lato.className} text-2xl md:text-3xl font-extrabold text-[#0b2a5a] mb-6`}>We set the standard and innovate to overcome obstacles…</h3>
              <p className="leading-relaxed text-neutral-800 mb-6">We deliver comprehensive Pier Drilling Solutions for major construction projects across the United States. Our project management approach utilizes advanced technologies to drive efficiency and productivity onsite. We invest in state of the art hydraulic rotary drills, auger cast pile rigs, and excavator mounted equipment to execute pier installation rapidly and accurately.</p>
              <p className="leading-relaxed text-neutral-800">Our crews apply innovative drilling techniques and sequences tailored for specific soil conditions and project needs. Customers turn to us because they know we will deliver robust pier foundations that provide the load-bearing capacity required, even in challenging ground conditions. Our specialized expertise in caisson, pile, micropile and helix pier construction provides deep foundation solutions engineered for safety and longevity.</p>
            </div>
            
            {/* Right Column - Capabilities List */}
            <div className="bg-neutral-50 rounded-xl p-6">
              <h4 className={`${lato.className} text-xl font-bold text-[#0b2a5a] mb-4`}>Our Drilling Capabilities</h4>
              <ul className="space-y-3 text-sm text-neutral-700">
                <li className="flex items-start">
                  <span className="text-red-600 mr-2">•</span>
                  <span><strong>Depth Range:</strong> Surface to 200+ feet deep</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 mr-2">•</span>
                  <span><strong>Diameter Options:</strong> 18" to 120" diameter piers</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 mr-2">•</span>
                  <span><strong>Soil Conditions:</strong> Clay, sand, rock, mixed substrates</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 mr-2">•</span>
                  <span><strong>Load Capacities:</strong> Up to 4,000+ tons per pier</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 mr-2">•</span>
                  <span><strong>Fleet Size:</strong> 23 state-of-the-art drill rigs</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 mr-2">•</span>
                  <span><strong>Project Types:</strong> Commercial, industrial, infrastructure</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="mx-auto w-full max-w-[1200px] px-6 py-10 bg-white">
          <h3 className={`${lato.className} text-2xl md:text-3xl font-extrabold text-[#0b2a5a] mb-8 text-center`}>Our Pier Drilling Process</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Site Assessment",
                description: "Geotechnical analysis and site evaluation to determine optimal drilling methods and equipment requirements."
              },
              {
                step: "02", 
                title: "Engineering Design",
                description: "Collaborate with engineers to finalize pier specifications, load requirements, and installation sequences."
              },
              {
                step: "03",
                title: "Drilling Execution", 
                description: "Deploy appropriate drilling equipment and execute precision drilling with continuous quality monitoring."
              },
              {
                step: "04",
                title: "Quality Assurance",
                description: "Comprehensive testing and documentation to verify pier integrity and load-bearing capacity."
              }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-red-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className={`${lato.className} text-xl font-bold`}>{item.step}</span>
                </div>
                <h4 className={`${lato.className} text-lg font-bold text-[#0b2a5a] mb-3`}>{item.title}</h4>
                <p className="text-sm text-neutral-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTAs */}
        <section className="mx-auto w-full max-w-[1200px] px-6 pb-14">
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Link href="/services" className="inline-flex items-center rounded-md bg-red-600 px-5 py-3 font-bold text-white shadow hover:bg-red-700">Services</Link>
            <Link href="/limited-access" className="inline-flex items-center rounded-md bg-[#0b2a5a] px-5 py-3 font-bold text-white shadow hover:brightness-110">Limited-Access</Link>
          </div>
        </section>
      </main>
    </>
  );
}

PierDrillingTW.getLayout = function getLayout(page) {
  return <TWLayout>{page}</TWLayout>;
};


