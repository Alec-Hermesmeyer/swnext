import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import TWLayout from "@/components/TWLayout";
import { FadeIn, FadeInStagger } from "@/components/FadeIn";
import { ServiceSchema, BreadcrumbListSchema, OrganizationSchema } from "@/components/StructuredData";
import { usePageImages } from "@/context/ImageContext";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

function Hero({ images }) {
  return (
    <section className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 text-white min-h-[40vh] md:min-h-[50vh] flex items-center">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${images.servicesHero}')`, backgroundPosition: "bottom" }} />
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative mx-auto w-full px-0 py-20 text-center">
        <h1 className={`${lato.className} text-4xl md:text-5xl font-extrabold`}>Commercial Pier Drilling Services</h1>
      </div>
    </section>
  );
}

function ServiceCard({ title, text, img, imageRight = true, href }) {
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
                {href && (
                  <div className="mt-6">
                    <Link href={href} className="inline-flex items-center rounded-md bg-white/10 px-5 py-3 font-bold text-white ring-1 ring-white/30 hover:bg-white/20">Learn More</Link>
                  </div>
                )}
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

function ContactCTA({ images }) {
  return (
    <section className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 text-white min-h-[50vh] md:min-h-[55vh] flex items-center">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.63), rgba(0,0,0,0.13)),url('${images.contactCTA}')`,
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

export default function ServicesTW() {
  const { images } = usePageImages("services");
  const breadcrumbs = [
    { name: "Home", url: "https://www.swfoundation.com/" },
    { name: "Services", url: "https://www.swfoundation.com/services" }
  ];

  return (
    <>
      <Head>
        <title>Commercial Pier Drilling Services | S&W Foundation | Dallas Foundation Contractors</title>
        <meta
          name="description"
          content="Professional commercial pier drilling services in Dallas, TX. Helical piles, limited access drilling, crane services, and turn-key foundation solutions. Nationwide reach with 35+ years experience."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="keywords" content="commercial pier drilling services, helical piles dallas, limited access drilling, crane services texas, foundation contractors, turn-key solutions" />
        <meta name="robots" content="index, follow" />

        {/* Open Graph */}
        <meta property="og:title" content="Commercial Pier Drilling Services | S&W Foundation Dallas" />
        <meta property="og:description" content="Professional commercial pier drilling services in Dallas, TX. Helical piles, limited access drilling, crane services, and turn-key foundation solutions." />
        <meta property="og:url" content="https://www.swfoundation.com/services" />
        <meta property="og:type" content="website" />

        {/* Canonical URL */}
        <link rel="canonical" href="https://www.swfoundation.com/services" />
      </Head>

      {/* Structured Data */}
      <OrganizationSchema />
      <BreadcrumbListSchema breadcrumbs={breadcrumbs} />
      <ServiceSchema
        serviceName="Commercial Pier Drilling Services"
        description="Professional commercial and industrial deep foundation drilling services delivered safely and on schedule across the United States."
        serviceType="ConstructionService"
        category="Foundation Construction"
        url="https://www.swfoundation.com/services"
        image={images.servicesHero}
      />
      <ServiceSchema
        serviceName="Pier Drilling"
        description="Commercial and industrial deep foundation drilling, delivered safely and on schedule with advanced equipment and expert teams."
        serviceType="ConstructionService"
        category="Pier Drilling"
        url="https://www.swfoundation.com/pier-drilling"
        image={images.preparation}
      />
      <ServiceSchema
        serviceName="Limited-Access Pier Drilling"
        description="Specialized drilling services for tight sites with low overhead clearance, bringing expert gear and techniques to challenging environments."
        serviceType="ConstructionService"
        category="Limited Access Drilling"
        url="https://www.swfoundation.com/limited-access"
        image={images.pratt1}
      />
      <ServiceSchema
        serviceName="Turn-Key Drilling Solutions"
        description="Complete drilling project management from estimating to closeout, owning the entire scope and delivering guaranteed results."
        serviceType="ConstructionService"
        category="Project Management"
        url="https://www.swfoundation.com/turn-key"
        image={images.cutting}
      />
      <ServiceSchema
        serviceName="Crane Services"
        description="Modern crane fleet with experienced operators to keep construction projects moving efficiently and safely."
        serviceType="ConstructionService"
        category="Crane Operations"
        url="https://www.swfoundation.com/crane"
        image={images.home}
      />
      <ServiceSchema
        serviceName="Helical Piles"
        description="Efficient, reliable helical pile foundation systems engineered for longevity and superior load-bearing capacity."
        serviceType="ConstructionService"
        category="Helical Foundation Systems"
        url="https://www.swfoundation.com/helical-piles"
        image={images.pratt3}
      />
      <main className="flex w-full flex-col">
        <Hero images={images} />
        <section className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 bg-white">
          <div className="relative mx-auto w-full max-w-[1600px] px-6 md:px-10">
            <FadeInStagger>
              <ServiceCard
                title="Pier Drilling"
                text="Commercial and industrial deep foundation drilling services for buildings, bridges, and infrastructure projects. Our experienced crews use advanced drilling equipment to deliver precise, on-schedule results for foundations up to 200+ feet deep. We specialize in challenging soil conditions including rock, clay, and mixed substrates across Texas and nationwide."
                img={images.pierDrillingHero}
                imageRight
                href="/pier-drilling"
              />
              <ServiceCard
                title="Limited-Access Pier Drilling"
                text="Specialized drilling services for confined spaces, low overhead clearance, and tight job sites. Our compact drilling equipment and expert operators excel in challenging environments including interior spaces, under bridges, and areas with height restrictions. We maintain the same quality and safety standards regardless of site constraints."
                img={images.limitedAccessContent}
                imageRight={false}
                href="/limited-access"
              />
              <ServiceCard
                title="Turn-Key Drilling Solutions"
                text="Complete project management from initial estimating to final closeout. We take full ownership of your drilling scope, coordinating all aspects including permits, scheduling, materials, and quality control. This comprehensive approach reduces your project complexity while ensuring predictable timelines and costs."
                img={images.turnKeyContent}
                imageRight
                href="/turn-key"
              />
              <ServiceCard
                title="Crane Services"
                text="Modern crane fleet with certified operators available for material handling, equipment positioning, and construction support. Our cranes range from compact units for tight spaces to large capacity cranes for major projects. All operators are trained in safety protocols and maintain current certifications."
                img={images.craneContent}
                imageRight={false}
                href="/crane"
              />
              <ServiceCard
                title="Helical Piles"
                text="Engineered helical pile foundation systems providing superior load-bearing capacity for new construction and foundation repair projects. Our helical piles install quickly with minimal site disturbance, making them ideal for commercial, industrial, and residential applications requiring reliable deep foundation support."
                img={images.pratt3}
                imageRight
                href="/helical-piles"
              />
            </FadeInStagger>
          </div>
        </section>
        <ContactCTA images={images} />
      </main>
    </>
  );
}

ServicesTW.getLayout = function getLayout(page) {
  return <TWLayout>{page}</TWLayout>;
};


