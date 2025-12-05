import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import TWLayout from "@/components/TWLayout";
import { Lato } from "next/font/google";
import { usePageImages } from "@/context/ImageContext";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

function Hero({ images }) {
  return (
    <section className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 text-white min-h-[40vh] md:min-h-[50vh] flex items-center">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${images.safety}')`, backgroundPosition: "center" }} />
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative mx-auto w-full px-0 py-20 text-center">
        <h1 className={`${lato.className} text-4xl md:text-5xl font-extrabold`}>Safety</h1>
      </div>
    </section>
  );
}

export default function SafetyTW() {
  const { images: heroImages } = usePageImages("hero");
  const { images: serviceImages } = usePageImages("services");
  return (
    <>
      <Head>
        <title>Safety First | Construction Safety Standards | S&W Foundation Dallas TX</title>
        <meta 
          name="description" 
          content="S&W Foundation prioritizes safety in all construction operations. 13-time ADSC Safety Award winner with comprehensive safety protocols and certified operators. Dallas commercial construction safety standards." 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="keywords" content="construction safety dallas, ADSC safety award, commercial construction safety, drilling safety protocols, foundation construction safety, certified operators texas" />
        <meta name="robots" content="index, follow" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Safety First | Construction Safety Standards | S&W Foundation" />
        <meta property="og:description" content="13-time ADSC Safety Award winner with comprehensive safety protocols and certified operators for all construction operations in Dallas, TX." />
        <meta property="og:url" content="https://www.swfoundation.com/safety" />
        <meta property="og:type" content="website" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://www.swfoundation.com/safety" />
      </Head>
      <main className="flex w-full flex-col">
        <Hero images={heroImages} />
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
                  <Image src={serviceImages.safetyContent} alt="Safety Equipment in Action" fill sizes="(min-width: 768px) 600px, 90vw" className="object-cover" unoptimized loader={({src})=>src} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Awards Section */}
        <section className="mx-auto w-full max-w-[1200px] px-6 py-10">
          <div className="text-center mb-12">
            <h3 className={`${lato.className} text-3xl md:text-4xl font-extrabold text-[#0b2a5a] mb-4`}>13-Time ADSC Safety Award Winner</h3>
            <p className="text-lg text-neutral-600 max-w-3xl mx-auto">Recognized by the Association of Drilled Shaft Contractors for our exceptional safety record and commitment to protecting workers on every job site.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: "RECOGNITION",
                title: "Industry Recognition",
                description: "13 consecutive ADSC Safety Awards demonstrate our consistent commitment to maintaining the highest safety standards in the foundation construction industry."
              },
              {
                icon: "ZERO TOLERANCE",
                title: "Zero Tolerance Policy",
                description: "We maintain a zero-tolerance policy for unsafe behavior and provide comprehensive training to ensure every team member returns home safely each day."
              },
              {
                icon: "COMPLIANCE",
                title: "OSHA Compliance",
                description: "Our safety program exceeds OSHA standards with rigorous documentation, regular inspections, and proactive hazard identification protocols."
              }
            ].map((item, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg text-center">
                <div className="mb-4">
                  <span className="inline-flex items-center rounded-md bg-red-600 px-3 py-1 text-xs font-bold text-white">
                    {item.icon}
                  </span>
                </div>
                <h4 className={`${lato.className} text-lg font-bold text-[#0b2a5a] mb-3`}>{item.title}</h4>
                <p className="text-neutral-600 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Safety Program Details */}
        <section className="mx-auto w-full max-w-[1200px] px-6 py-10 bg-neutral-50 rounded-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column - Philosophy */}
            <div>
              <h3 className={`${lato.className} text-2xl md:text-3xl font-extrabold text-[#0b2a5a] mb-6`}>Leaving How You Arrived Is The Standard...</h3>
              <p className="leading-relaxed text-neutral-800 mb-6">S&W Foundation Contractors' commitment to safety is our highest priority. We provide ongoing safety training and conduct job site inspections and safety audits to identify and correct potential hazards. Our comprehensive safety program meets or exceeds OSHA standards and regulations.</p>
              <p className="leading-relaxed text-neutral-800">At S&W, safety is not just a priority—it is a core value that guides everything we do. Every decision we make, from equipment selection to project planning, is evaluated through the lens of worker safety and public protection.</p>
            </div>
            
            {/* Right Column - Safety Protocols */}
            <div>
              <h4 className={`${lato.className} text-xl font-bold text-[#0b2a5a] mb-6`}>Our Safety Protocols Include:</h4>
              <ul className="space-y-4 text-sm text-neutral-700">
                <li className="flex items-start">
                  <span className="text-red-600 mr-2 mt-1">✓</span>
                  <span><strong>Daily Safety Briefings:</strong> Every crew starts with hazard identification and safety planning</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 mr-2 mt-1">✓</span>
                  <span><strong>Certified Equipment Operators:</strong> All operators maintain current certifications and ongoing training</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 mr-2 mt-1">✓</span>
                  <span><strong>Personal Protective Equipment:</strong> Required hard hats, safety glasses, steel-toe boots, and high-visibility clothing</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 mr-2 mt-1">✓</span>
                  <span><strong>Regular Safety Inspections:</strong> Weekly equipment inspections and monthly safety audits</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 mr-2 mt-1">✓</span>
                  <span><strong>Emergency Response Plans:</strong> Detailed procedures for medical emergencies and equipment failures</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 mr-2 mt-1">✓</span>
                  <span><strong>Continuous Training:</strong> Regular safety education and skills development for all personnel</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Safety Statistics */}
        <section className="mx-auto w-full max-w-[1200px] px-6 py-10">
          <div className="bg-[#0b2a5a] text-white rounded-2xl p-8">
            <h3 className={`${lato.className} text-2xl md:text-3xl font-extrabold mb-8 text-center`}>Safety Performance Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { number: "13", label: "ADSC Safety Awards", description: "Industry recognition" },
                { number: "35+", label: "Years Accident-Free", description: "Major incidents" },
                { number: "100%", label: "OSHA Compliance", description: "Standards exceeded" },
                { number: "500+", label: "Safety Training Hours", description: "Annual commitment" }
              ].map((stat, index) => (
                <div key={index}>
                  <div className={`${lato.className} text-3xl md:text-4xl font-black text-red-500 mb-2`}>{stat.number}</div>
                  <h4 className={`${lato.className} text-sm font-bold mb-1`}>{stat.label}</h4>
                  <p className="text-white/70 text-xs">{stat.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1200px] px-6 pb-14">
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Link href="/services" className="inline-flex items-center rounded-md bg-red-600 px-5 py-3 font-bold text-white shadow hover:bg-red-700">All Services</Link>
            <Link href="/contact" className="inline-flex items-center rounded-md bg-[#0b2a5a] px-5 py-3 font-bold text-white shadow hover:brightness-110">Contact</Link>
          </div>
        </section>
      </main>
    </>
  );
}

SafetyTW.getLayout = function getLayout(page) {
  return <TWLayout>{page}</TWLayout>;
};


