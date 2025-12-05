import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import TWLayout from "@/components/TWLayout";
import { FadeIn, FadeInStagger } from "@/components/FadeIn";
import { OrganizationSchema, BreadcrumbListSchema, PersonSchema } from "@/components/StructuredData";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

function Hero() {
  return (
    <section className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 text-white min-h-[40vh] md:min-h-[50vh] flex items-center">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('https://edycymyofrowahspzzpg.supabase.co/storage/v1/object/public/Images/public/IMG_7297.webp?version=1')", backgroundPosition: "bottom" }}
      />
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative mx-auto w-full px-0 py-20 text-center">
        <h1 className={`${lato.className} text-4xl md:text-5xl font-extrabold`}>About Us</h1>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link href="/contact" className="inline-flex items-center rounded-md bg-red-600 px-5 py-3 font-bold text-white shadow-md hover:bg-red-700">Contact Us</Link>
          <Link href="/core-values" className="inline-flex items-center rounded-md bg-white/10 px-5 py-3 font-bold text-white ring-1 ring-white/30 hover:bg-white/20">Our Culture</Link>
        </div>
      </div>
    </section>
  );
}

function InfoBlock({ title, text, img, imageRight = true, bar = "red" }) {
  return (
    <FadeIn>
      <div className="py-8 md:py-12">
        <div className="mx-auto w-full md:w-[min(100%,1600px)]">
          <div className="relative overflow-hidden rounded-2xl bg-[#0b2a5a] text-white shadow-2xl ring-1 ring-black/10">
            <div className="absolute left-0 top-0 h-2 md:h-3 w-full bg-red-600" />
            <div className={`grid grid-cols-1 items-center gap-6 p-6 md:p-12 md:grid-cols-2 ${imageRight ? '' : 'md:[&>div:first-child]:order-2'}`}>
              <div>
                <h2 className={`${lato.className} mb-4 text-center text-3xl font-extrabold md:text-left`}>{title}</h2>
                <p className={`${lato.className} mx-auto max-w-3xl text-center text-white/90 md:text-left leading-relaxed md:text-[1.02rem]`}>{text}</p>
              </div>
              <div className={`flex items-center ${imageRight ? 'justify-end' : 'justify-start'}`}>
                <div className={`relative aspect-[4/3] w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/10 ${imageRight ? 'md:-mr-8' : 'md:-ml-8'}`}>
                  <Image src={img} alt={title} fill sizes="(min-width: 768px) 600px, 90vw" className="object-cover" unoptimized loader={({src})=>src} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}

function InfoSection() {
  return (
    <section className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 bg-white">
      <div className="relative mx-auto w-full max-w-[1600px] px-6 md:px-10">
        <FadeInStagger>
          <InfoBlock
            title="The Leaders In Drilling Never Stop"
            text="At S&W Foundation Contractors, our story is one of family, hard work, and dedication. Founded in 1986 in Rowlett Texas, our business has grown to become a leader in the pier drilling industry, with a reputation for providing reliable, high-quality solutions to our clients across the United States. Today, we remain a family-owned and operated business, with a commitment to upholding the values of honesty, integrity , and excellence that have been at the core of our success for over 35 years. From our state of the art equipment to our team of experienced professionals, every aspect of our business is designed to meet the needs of clients and exceed their expectations."
            img={`https://${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/Images/public/IMG_7617.webp`}
            bar="red"
            imageRight
          />
          <InfoBlock
            title="Pier Drilling Services Tailored To Your Needs"
            text="At S&W Foundation Contractors, we aim to be your your one-stop shop for all of your pier drilling needs. With over 30 years experience in the indusry, we offer comprehensive drilling services for commercial and industrial projects across the United States. Whether you require supplementary labor or a complete product we offer a wide range of services delivered by our versatile and experienced team, backed by our state of the art fleet. Trust us to provide reliable, efficient, and cost-effective solutions to meet your drilling needs. Your hole is our goal!"
            img={`https://${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/Images/public/2rigs1pipe.webp`}
            bar="#0b2a5a"
            imageRight={false}
          />
          <InfoBlock
            title="Experience You Can Count On"
            text="S&W Foundation Contractors, is a name you can trust for all of your pier drilling needs. Our team of experienced professionals are equipped with the latest technolgy and techniques to provide innovative drilling solutions tailored to your specific requirements. We take pride in operating one of the largest fleets of limited access pier drilling equipment in the United States, ensuring that we have the right tools and equipment for any job, no matter how complex. Our commitment to safety and efficiency in every project means you can rely on us to deliver high-quality drilling services that exceed all expectations."
            img={`https://${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/Images/public/1703009714442.webp`}
            bar="red"
            imageRight
          />
          <InfoBlock
            title="Trusted By Clients Nation Wide"
            text="Since 1986, S&W Foundation Contractors has been a leading family-owned and operated pier drilling company based in Rowlett, Texas, serving clients across the United States. Our commitment to providing reliable and efficient pier drilling services and solutions has earned us a reputation for excellence in the industry. Our team of experts, equipped with the latest drilling technology and equipment, works closely with our clients to ensure their project requirements are met with precision and efficiency. From Limited Access Pier Drilling to soil retention and crane services, we offer a wide range of drilling solutions to meet your specific needs."
            img={`https://${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/Images/public/IMG_7621.webp`}
            bar="#0b2a5a"
            imageRight={false}
          />
        </FadeInStagger>
      </div>
    </section>
  );
}

function LeadershipSection() {
  const leaders = [
    {
      name: "James Millhorn",
      title: "Owner & President",
      description: "James Millhorn leads S&W Foundation Contractors with a commitment to maintaining the company's legacy of safety excellence and quality workmanship. Under his leadership, the company continues to uphold the highest standards in commercial pier drilling and foundation construction.",
      img: "/galleryImages/leadership/james.jpeg",
    },
    {
      name: "David Bollman", 
      title: "Owner & Vice President",
      description: "David Bollman brings operational expertise and strategic vision to S&W Foundation's continued growth. His focus on innovation and efficiency ensures the company remains at the forefront of foundation construction technology and practices.",
      img: "/galleryImages/leadership/david.jpeg",
    },
  ];

  return (
    <section className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 py-16 md:py-24 bg-neutral-50">
      <div className="mx-auto w-full max-w-7xl px-6 md:px-10">
        <FadeIn>
          <div className="text-center mb-12">
            <h2 className={`${lato.className} text-3xl md:text-4xl font-extrabold text-[#0b2a5a] mb-4`}>
              Leadership Team
            </h2>
            <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
              Founded in 1986 and now owned by James Millhorn and David Bollman, S&W Foundation continues its commitment to excellence in commercial pier drilling and foundation construction.
            </p>
          </div>
        </FadeIn>
        
        <FadeInStagger>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {leaders.map((leader, index) => (
              <FadeIn key={index}>
                <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="w-24 h-24 bg-[#0b2a5a] rounded-full mx-auto mb-6 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">{leader.name.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  <h3 className={`${lato.className} text-xl font-bold text-[#0b2a5a] mb-2 text-center`}>
                    {leader.name}
                  </h3>
                  <p className="text-red-600 font-semibold text-center mb-4">
                    {leader.title}
                  </p>
                  <p className="text-neutral-600 text-center leading-relaxed">
                    {leader.description}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </FadeInStagger>
      </div>
    </section>
  );
}

function CompanyStats() {
  const stats = [
    { number: "35+", label: "Years of Excellence", description: "Serving clients since 1986" },
    { number: "13x", label: "ADSC Safety Awards", description: "Industry-leading safety record" },
    { number: "1000+", label: "Projects Completed", description: "Commercial & industrial" },
    { number: "50+", label: "States Served", description: "Nationwide coverage" },
  ];

  return (
    <section className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 py-16 bg-[#0b2a5a] text-white">
      <div className="mx-auto w-full max-w-7xl px-6 md:px-10">
        <FadeIn>
          <div className="text-center mb-12">
            <h2 className={`${lato.className} text-3xl md:text-4xl font-extrabold mb-4`}>
              By The Numbers
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Our track record speaks for itself - delivering exceptional results across decades of foundation construction.
            </p>
          </div>
        </FadeIn>
        
        <FadeInStagger>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <FadeIn key={index}>
                <div className="text-center">
                  <div className={`${lato.className} text-4xl md:text-5xl font-black text-red-500 mb-2`}>
                    {stat.number}
                  </div>
                  <h3 className={`${lato.className} text-lg font-bold mb-2`}>
                    {stat.label}
                  </h3>
                  <p className="text-white/70 text-sm">
                    {stat.description}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </FadeInStagger>
      </div>
    </section>
  );
}

function ContactCTA() {
  return (
    <section className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 text-white min-h-[50vh] md:min-h-[55vh] flex items-center">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.63), rgba(0,0,0,0.13)),url(https://${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/Images/public/IMG_7753.webp)`,
          backgroundPosition: "bottom"
        }}
      />
      <div className="relative mx-auto w-full px-0 py-20 text-center">
        <h2 className={`${lato.className} mx-auto max-w-5xl text-3xl font-extrabold md:text-5xl`}>
          Get Your Free Quote Today and Let S&W Take Your Next Project To New Depths
        </h2>
        <div className="mt-6">
          <Link href="/contact" className="inline-flex items-center rounded-md bg-red-600 px-8 py-4 text-xl font-black text-white shadow-xl hover:bg-red-700">Contact Us</Link>
        </div>
      </div>
    </section>
  );
}

export default function AboutTW() {
  const breadcrumbs = [
    { name: "Home", url: "https://www.swfoundation.com/" },
    { name: "About", url: "https://www.swfoundation.com/about" }
  ];

  return (
    <>
      <Head>
        <title>About S&W Foundation | 35+ Years Commercial Pier Drilling Excellence</title>
        <meta 
          name="description" 
          content="Learn about S&W Foundation Contractors, Dallas-based commercial pier drilling experts since 1986. Family-owned company with nationwide reach, ADSC safety awards, and industry-leading foundation solutions." 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="keywords" content="about s&w foundation, commercial pier drilling company, dallas foundation contractors, pier drilling history, foundation construction expertise, ADSC safety awards" />
        <meta name="robots" content="index, follow" />
        
        {/* Open Graph */}
        <meta property="og:title" content="About S&W Foundation | 35+ Years Commercial Pier Drilling Excellence" />
        <meta property="og:description" content="Learn about S&W Foundation Contractors, Dallas-based commercial pier drilling experts since 1986. Family-owned company with nationwide reach and industry-leading foundation solutions." />
        <meta property="og:url" content="https://www.swfoundation.com/about" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://edycymyofrowahspzzpg.supabase.co/storage/v1/object/public/Images/public/IMG_7297.webp" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://www.swfoundation.com/about" />
      </Head>
      
      {/* Structured Data */}
      <OrganizationSchema />
      <BreadcrumbListSchema breadcrumbs={breadcrumbs} />
      <PersonSchema
        name="James Millhorn"
        jobTitle="Owner & President"
        description="Owner and President of S&W Foundation Contractors, maintaining the company's legacy of safety excellence and quality workmanship in commercial pier drilling."
        image="https://www.swfoundation.com/james-millhorn.jpg"
      />
      <PersonSchema
        name="David Bollman"
        jobTitle="Owner & Vice President"
        description="Owner and Vice President of S&W Foundation Contractors, bringing operational expertise and strategic vision to foundation construction excellence."
        image="https://www.swfoundation.com/david-bollman.jpg"
      />
      <main className="flex w-full flex-col">
        <Hero />
        <InfoSection />
        <CompanyStats />
        <LeadershipSection />
        <ContactCTA />
      </main>
    </>
  );
}

AboutTW.getLayout = function getLayout(page) {
  return <TWLayout>{page}</TWLayout>;
};


