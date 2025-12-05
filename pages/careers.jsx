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
    <section className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 text-white min-h-[60vh] md:min-h-[70vh] flex items-center">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://edycymyofrowahspzzpg.supabase.co/storage/v1/object/public/Images/public/newimages/IMG_5171.webp?version=1')" }} />
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative mx-auto w-full px-6 md:px-10 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className={`${lato.className} text-4xl md:text-6xl font-extrabold mb-6`}>
            Build Your Career With Us
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
            Join a team of professionals who value safety, excellence, and family. 
            We're building more than foundations – we're building careers.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="#open-positions" className="inline-flex items-center rounded-md bg-red-600 px-8 py-4 text-lg font-bold text-white shadow-xl hover:bg-red-700 transition-colors">
              View Open Positions
            </Link>
            <Link href="#why-sw" className="inline-flex items-center rounded-md bg-white/10 px-8 py-4 text-lg font-bold text-white ring-1 ring-white/30 hover:bg-white/20 transition-colors">
              Why S&W Foundation?
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function WhyWorkWithUs() {
  const benefits = [
    {
      title: "Competitive Compensation",
      description: "Industry-leading pay rates with performance bonuses and regular reviews to reward your expertise and dedication.",
      badge: "COMPENSATION"
    },
    {
      title: "Comprehensive Benefits",
      description: "Full health, dental, and vision insurance plus 401(k) matching, paid time off, and professional development opportunities.",
      badge: "BENEFITS"
    },
    {
      title: "Safety First Culture",
      description: "13-time ADSC Safety Award winner with comprehensive training programs and zero-tolerance safety policies to protect every team member.",
      badge: "SAFETY"
    },
    {
      title: "Career Growth",
      description: "Clear advancement paths, mentorship programs, and skills training to help you build a long-term career in foundation construction.",
      badge: "GROWTH"
    },
    {
      title: "Nationwide Projects",
      description: "Work on exciting commercial and industrial projects across the United States, gaining diverse experience and expertise.",
      badge: "PROJECTS"
    },
    {
      title: "Family Values",
      description: "Join a company that truly values work-life balance and treats every employee like family, not just a number.",
      badge: "FAMILY"
    }
  ];

  return (
    <section id="why-sw" className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 py-16 md:py-24 bg-neutral-50">
      <div className="mx-auto w-full max-w-7xl px-6 md:px-10">
        <FadeIn>
          <div className="text-center mb-12">
            <h2 className={`${lato.className} text-3xl md:text-4xl font-extrabold text-[#0b2a5a] mb-4`}>
              Why Choose S&W Foundation?
            </h2>
            <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
              We're more than just a construction company – we're a family of professionals committed to excellence, safety, and your success.
            </p>
          </div>
        </FadeIn>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <FadeIn key={index}>
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
                <div className="mb-4">
                  <span className="inline-flex items-center rounded-md bg-red-600 px-3 py-1 text-xs font-bold text-white">
                    {benefit.badge}
                  </span>
                </div>
                <h3 className={`${lato.className} text-lg font-bold text-[#0b2a5a] mb-3`}>
                  {benefit.title}
                </h3>
                <p className="text-neutral-600 text-sm leading-relaxed flex-1">
                  {benefit.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function JobListings({ jobs, loading }) {
  return (
    <section id="open-positions" className="mx-auto w-full max-w-7xl px-6 py-16">
      <div className="text-center mb-12">
        <h2 className={`${lato.className} text-3xl md:text-4xl font-extrabold text-[#0b2a5a] mb-4`}>
          Open Positions
        </h2>
        <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
          Ready to join our team? Explore our current openings and find the perfect fit for your skills and career goals.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin mr-2"></div>
            Loading opportunities...
          </div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-white rounded-xl p-8 shadow-lg max-w-2xl mx-auto">
            <h3 className={`${lato.className} text-xl font-bold text-[#0b2a5a] mb-4`}>
              No Current Openings
            </h3>
            <p className="text-neutral-600 mb-6">
              While we don't have any posted positions at the moment, we're always looking for talented professionals to join our team.
            </p>
            <Link href="/contact" className="inline-flex items-center rounded-md bg-red-600 px-6 py-3 font-bold text-white shadow hover:bg-red-700 transition-colors">
              Submit Your Resume
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <FadeIn key={job.id}>
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                <div className="h-2 bg-red-600"></div>
                <div className="p-6">
                  <h3 className={`${lato.className} text-xl font-bold text-[#0b2a5a] mb-3`}>
                    {job.jobTitle}
                  </h3>
                  {job.location && (
                    <p className="text-neutral-500 text-sm mb-3 flex items-center">
                      <span className="mr-2 text-red-600 font-bold">•</span>
                      {job.location}
                    </p>
                  )}
                  {job.description && (
                    <p className="text-neutral-600 text-sm leading-relaxed mb-4 line-clamp-3">
                      {job.description}
                    </p>
                  )}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link href="/contact#jobForm" className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-red-700 transition-colors">
                      Apply Now
                    </Link>
                    <Link href="/contact" className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-bold text-[#0b2a5a] ring-1 ring-gray-300 hover:bg-gray-50 transition-colors">
                      Learn More
                    </Link>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      )}
    </section>
  );
}

function CallToAction() {
  return (
    <section className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 py-16 bg-[#0b2a5a] text-white">
      <div className="mx-auto w-full max-w-4xl px-6 text-center">
        <h2 className={`${lato.className} text-3xl md:text-4xl font-extrabold mb-6`}>
          Ready to Start Your Career Journey?
        </h2>
        <p className="text-xl text-white/90 mb-8">
          Don't see the perfect position? We're always interested in hearing from talented professionals who share our commitment to safety and excellence.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/contact" className="inline-flex items-center rounded-md bg-red-600 px-8 py-4 text-lg font-bold text-white shadow-xl hover:bg-red-700 transition-colors">
            Submit Your Resume
          </Link>
          <Link href="/contact" className="inline-flex items-center rounded-md bg-white/10 px-8 py-4 text-lg font-bold text-white ring-1 ring-white/30 hover:bg-white/20 transition-colors">
            Contact Our Team
          </Link>
        </div>
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
        <title>Careers at S&W Foundation | Join Our Drilling Team | Dallas Construction Jobs</title>
        <meta 
          name="description" 
          content="Join the S&W Foundation team! We're hiring experienced drilling operators, equipment operators, and construction professionals in Dallas, TX. Competitive pay, benefits, and nationwide projects." 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="keywords" content="drilling jobs dallas, construction careers texas, pier drilling operator jobs, equipment operator careers, foundation construction employment" />
        <meta name="robots" content="index, follow" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Careers at S&W Foundation | Join Our Drilling Team" />
        <meta property="og:description" content="Join the S&W Foundation team! We're hiring experienced drilling operators, equipment operators, and construction professionals in Dallas, TX." />
        <meta property="og:url" content="https://www.swfoundation.com/careers" />
        <meta property="og:type" content="website" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://www.swfoundation.com/careers" />
      </Head>
      <main className="relative flex w-full flex-col">
        <div className="pointer-events-none fixed inset-0 -z-10">
          <GridPattern className="h-full w-full" yOffset={0} interactive strokeColor="#0b2a5a" strokeOpacity={0.12} />
        </div>
        <Hero />
        <WhyWorkWithUs />
        <JobListings jobs={jobs} loading={loading} />
        <CallToAction />
      </main>
    </>
  );
}

CareersTW.getLayout = function getLayout(page) {
  return <TWLayout>{page}</TWLayout>;
};


