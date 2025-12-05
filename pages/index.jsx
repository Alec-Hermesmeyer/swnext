import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { GridPattern } from "@/components/GridPattern";
import { FadeIn, FadeInStagger } from "@/components/FadeIn";
import { OrganizationSchema, LocalBusinessSchema, WebSiteSchema, BreadcrumbListSchema } from "@/components/StructuredData";
import { Lato } from "next/font/google";
import { usePageImages } from "@/context/ImageContext";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

function Hero({ images }) {
  return (
    <section className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 text-white min-h-[85vh] md:min-h-[90vh] flex items-center">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${images.hero}')` }}
      />
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative mx-auto w-full px-6 md:px-10 py-32 md:py-48">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center max-w-7xl mx-auto">
          <div>
            <FadeIn>
              <div className="space-y-6">
                <div>
                  <span className="inline-flex items-center rounded-full bg-red-600/20 px-4 py-2 text-sm font-bold text-white ring-1 ring-red-500/30">
                    13-Time ADSC Safety Award Winner
                  </span>
                </div>
                <h1 className={`${lato.className} text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight`}>
                  Foundation Excellence Since{" "}
                  <span className="text-red-500">1986</span>
                </h1>
                <p className="text-xl md:text-2xl text-white/90 leading-relaxed max-w-2xl">
                  Leading commercial pier drilling contractor in Dallas, TX. We build the foundations that support America's infrastructure, one project at a time.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Link href="/contact" className="inline-flex items-center justify-center rounded-lg bg-red-600 px-8 py-4 text-lg font-bold text-white shadow-xl hover:bg-red-700 transition-colors">
                    Get Free Quote
                  </Link>
                  <Link href="/services" className="inline-flex items-center justify-center rounded-lg bg-white/10 px-8 py-4 text-lg font-bold text-white ring-1 ring-white/30 hover:bg-white/20 transition-colors">
                    Our Services
                  </Link>
                </div>
              </div>
            </FadeIn>
          </div>
          
          {/* Enhanced Info Card */}
          <div className="lg:flex lg:justify-end">
            <FadeIn>
              <div className="w-full max-w-md rounded-2xl shadow-2xl ring-1 ring-black/10 backdrop-blur-sm">
                <div className="h-3 rounded-t-2xl bg-red-600" />
                <div className="rounded-b-2xl bg-[#0b2a5a]/95 p-8">
                  <h3 className={`${lato.className} mb-6 text-xl font-black text-white`}>
                    Ready to Start Your Project?
                  </h3>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="text-white font-semibold">Call for Immediate Support</p>
                        <Link href="tel:+12147030484" className="text-red-400 hover:text-red-300 font-bold text-lg">
                          (214) 703-0484
                        </Link>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="text-white font-semibold">Dallas Headquarters</p>
                        <p className="text-white/80 text-sm">2806 Singleton St, Rowlett, TX 75088</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="text-white font-semibold">Service Area</p>
                        <p className="text-white/80 text-sm">Nationwide Commercial Projects</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Link href="/contact" className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700 transition-colors">
                      Get Quote
                    </Link>
                    <Link href="/gallery" className="inline-flex items-center justify-center rounded-lg bg-white/10 px-4 py-3 text-sm font-bold text-white ring-1 ring-white/30 hover:bg-white/20 transition-colors">
                      View Work
                    </Link>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoBlocks({ images }) {
  const blocks = [
    {
      title: "Foundation Contracting Excellence Since 1986",
      text:
        "Based in Rowlett, Texas, S&W Foundation Contractors has been delivering reliable and high-quality pier drilling services for over three decades. Our foundation is rooted in family values, commitment to safety, and innovative technology, which have allowed us to become a nationally recognized name in the foundation construction industry.",
      bullets: [
        "Commercial and industrial foundation projects",
        "Advanced equipment and expert team",
        "Commitment to safety and integrity",
      ],
      stats: [
        { number: "35+", label: "Years Experience" },
        { number: "1000+", label: "Projects Completed" }
      ],
      badges: ["FAMILY OWNED", "ADSC MEMBER"],
      img: images.infoBlock1,
      bar: "red",
      imageRight: true,
    },
    {
      title: "Nationwide Pier Drilling and Foundation Services",
      text:
        "S&W Foundation Contractors proudly serves Dallas, Texas, and extends our high-quality pier drilling and foundation services nationwide. With years of experience in diverse terrains and challenging environments, our team is equipped to provide region-specific solutions for various projects.",
      bullets: [
        "Specialized pier drilling for commercial projects",
        "Expertise in diverse terrains and soils",
        "Reliable results for projects nationwide",
      ],
      stats: [
        { number: "50+", label: "States Served" },
        { number: "23", label: "Drilling Rigs" }
      ],
      badges: ["NATIONWIDE", "ALL TERRAINS"],
      img: images.infoBlock2,
      bar: "#0b2a5a",
      imageRight: false,
    },
    {
      title: "Comprehensive Foundation Solutions for Dallas and Beyond",
      text:
        "Our services include not only pier drilling but also soil testing, deep foundation drilling, and site analysis, tailored to meet the specific needs of commercial, industrial, and residential projects. Our commitment to innovation ensures we provide the best foundation solutions.",
      bullets: [
        "Full-service foundation solutions",
        "Customized drilling based on geotechnical needs",
        "Innovative technology for quality assurance",
      ],
      stats: [
        { number: "13x", label: "Safety Awards" },
        { number: "100%", label: "OSHA Compliant" }
      ],
      badges: ["FULL SERVICE", "SAFETY FIRST"],
      img: images.infoBlock3,
      bar: "red",
      imageRight: true,
    },
  ];

  return (
    <section className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 bg-white">
      <div className="mx-auto w-full px-0">
        <FadeInStagger>
          {blocks.map((b, i) => (
            <FadeIn key={b.title}>
              <div className="py-8 md:py-12">
                <div className="group relative mx-auto w-full md:w-[min(100%,1600px)] overflow-hidden rounded-xl bg-white shadow ring-1 ring-neutral-200 transition duration-300 hover:shadow-lg hover:ring-neutral-300">
                  <div className="absolute left-0 top-0 h-3 w-full overflow-hidden">
                    <div className="absolute inset-0 opacity-40" style={{background: `linear-gradient(to right, ${b.bar==='red'?'#dc2626':'#0b2a5a'} 0%, ${b.bar==='red'?'#dc2626':'#0b2a5a'} 50%, ${b.bar==='red'?'#0b2a5a':'#dc2626'} 50%, ${b.bar==='red'?'#0b2a5a':'#dc2626'} 100%)`}} />
                    <div className="absolute inset-0 origin-left scale-x-0 transition-transform duration-700 ease-out group-hover:scale-x-100" style={{background: `linear-gradient(to right, ${b.bar==='red'?'#dc2626':'#0b2a5a'} 0%, ${b.bar==='red'?'#dc2626':'#0b2a5a'} 50%, ${b.bar==='red'?'#0b2a5a':'#dc2626'} 50%, ${b.bar==='red'?'#0b2a5a':'#dc2626'} 100%)`}} />
                  </div>
                  <div className={`grid grid-cols-1 items-center gap-8 p-6 md:p-12 md:grid-cols-2 ${b.imageRight ? "" : "md:[&>div:first-child]:order-2"}`}>
                    <div>
                      {/* Professional Badges */}
                      <div className="mb-4 flex flex-wrap justify-center md:justify-start gap-2">
                        {b.badges.map((badge) => (
                          <span key={badge} className="inline-flex items-center rounded-md bg-red-600 px-3 py-1 text-xs font-bold text-white">
                            {badge}
                          </span>
                        ))}
                      </div>
                      
                      <h2 className={`${lato.className} mb-3 text-center text-3xl font-extrabold text-neutral-900 md:text-left`}>{b.title}</h2>
                      
                      {/* Statistics Row */}
                      <div className="mb-4 flex justify-center md:justify-start gap-6">
                        {b.stats.map((stat) => (
                          <div key={stat.label} className="text-center">
                            <div className={`${lato.className} text-2xl font-black text-red-600`}>{stat.number}</div>
                            <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">{stat.label}</div>
                          </div>
                        ))}
                      </div>
                      
                      <p className={`${lato.className} mx-auto max-w-3xl text-center text-neutral-700 md:text-left mb-5`}>{b.text}</p>
                      <ul className={`${lato.className} mx-auto mt-5 max-w-2xl list-disc space-y-2 pl-5 text-neutral-900 md:mx-0`}>
                        {b.bullets.map((li) => (<li key={li} className="font-semibold">{li}</li>))}
                      </ul>
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="relative aspect-[4/3] w-full max-w-xl rounded-md overflow-hidden transition duration-500 ease-out will-change-transform group-hover:scale-[1.03]">
                        <Image src={b.img} alt={b.title} fill sizes="(min-width: 768px) 600px, 90vw" className="object-contain" priority />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </FadeInStagger>
      </div>
    </section>
  );
}

function Services({ images }) {
  const cards = [
    { t: "Pier Drilling", href: "/pier-drilling", img: images.pierDrillingCard },
    { t: "Limited Access Drilling", href: "/limited-access", img: images.limitedAccessCard },
    { t: "Turn-Key Drilling Solutions", href: "/turn-key", img: images.turnKeyCard },
    { t: "Crane Services", href: "/crane", img: images.craneCard },
    { t: "Helical Piles", href: "/helical-piles", img: images.helicalPilesCard },
    { t: "Safety Excellence", href: "/safety", img: images.safetyCard },
  ];
  return (
    <section className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 py-16 md:py-24 bg-gradient-to-r from-red-700 via-white to-[#0b2a5a]">
      {/* Smooth red→white→blue gradient background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-red-700 via-white to-[#0b2a5a]" />
      <div className="absolute inset-0 z-0 opacity-60 pointer-events-none">
        <GridPattern
          yOffset={0}
          interactive
          className="h-full w-full"
          strokeColor="#ffffff"
          strokeWidth={1.5}
          strokeOpacity={0.8}
        />
      </div>
      <div className="mx-auto w-full max-w-[1600px] px-6 md:px-10">
        <FadeInStagger>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((c) => (
              <FadeIn key={c.t}>
                <div className="group relative h-96 md:h-[26rem] overflow-hidden rounded-xl ring-1 ring-white/20 shadow-lg transition duration-300 ease-out will-change-transform transform-gpu hover:-translate-y-1 hover:shadow-2xl hover:ring-white/30">
                  <Image src={c.img} alt={c.t} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" unoptimized loader={({ src }) => src} />
                  <div className="absolute inset-0 bg-gradient-to-r from-red-800/60 via-black/40 to-transparent transition-opacity duration-300 group-hover:opacity-70" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
                    <h3 className="text-2xl font-extrabold text-white drop-shadow-sm md:text-3xl">{c.t}</h3>
                    <Link href={c.href} className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 font-bold text-white drop-shadow hover:bg-red-700">Learn More</Link>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </FadeInStagger>
      </div>
    </section>
  );
}

function AwardsSection() {
  const awards = [
    {
      title: "13-Time ADSC Safety Award Winner",
      description: "Association of Drilled Shaft Contractors recognizes S&W Foundation's exceptional safety record and commitment to protecting workers on every job site.",
      icon: "AWARD",
    },
    {
      title: "Texas State Licensed & Insured",
      description: "Fully licensed by the Texas State License Board with comprehensive insurance coverage for all commercial and industrial projects.",
      icon: "CERTIFIED",
    },
    {
      title: "35+ Years of Excellence",
      description: "Since 1986, we've built a reputation for delivering quality foundation work across Texas and nationwide, earning trust through consistent results.",
      icon: "EXPERIENCE",
    },
    {
      title: "Nationwide Service Coverage",
      description: "While based in Dallas, TX, our experienced crews provide foundation drilling services across the United States for large-scale commercial projects.",
      icon: "COVERAGE",
    },
  ];

  return (
    <section className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 py-16 md:py-24 bg-neutral-50">
      <div className="mx-auto w-full max-w-7xl px-6 md:px-10">
        <FadeIn>
          <div className="text-center mb-12">
            <h2 className={`${lato.className} text-3xl md:text-4xl font-extrabold text-[#0b2a5a] mb-4`}>
              Awards & Certifications
            </h2>
            <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
              Our commitment to safety, quality, and excellence has earned us recognition throughout the foundation construction industry.
            </p>
          </div>
        </FadeIn>
        
        <FadeInStagger>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {awards.map((award, index) => (
              <FadeIn key={index}>
                <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
                  <div className="mb-4">
                    <span className="inline-flex items-center rounded-md bg-red-600 px-3 py-1 text-xs font-bold text-white">
                      {award.icon}
                    </span>
                  </div>
                  <h3 className={`${lato.className} text-lg font-bold text-[#0b2a5a] mb-3 min-h-[3rem] flex items-start`}>
                    {award.title}
                  </h3>
                  <p className="text-neutral-600 text-sm leading-relaxed flex-1">
                    {award.description}
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


function WhyChooseUs() {
  const reasons = [
    {
      title: "Proven Track Record",
      description: "35+ years of successful foundation projects across 50+ states with a portfolio of satisfied clients and complex project completions.",
      badge: "PROVEN"
    },
    {
      title: "Safety Excellence",
      description: "13-time ADSC Safety Award winner with comprehensive safety protocols and zero-tolerance policies protecting every team member.",
      badge: "SAFETY"
    },
    {
      title: "Advanced Equipment",
      description: "Fleet of 23 state-of-the-art drill rigs with specialized equipment for limited access and challenging site conditions.",
      badge: "EQUIPMENT"
    },
    {
      title: "Expert Team",
      description: "Certified operators and experienced crews with deep expertise in commercial pier drilling and foundation construction.",
      badge: "EXPERTISE"
    }
  ];

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-16">
      <FadeIn>
        <div className="text-center mb-12">
          <h2 className={`${lato.className} text-3xl md:text-4xl font-extrabold text-[#0b2a5a] mb-4`}>
            Why Dallas Chooses S&W Foundation
          </h2>
          <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
            From small commercial projects to large industrial complexes, we deliver the expertise, safety, and reliability that contractors trust.
          </p>
        </div>
      </FadeIn>
      
      <FadeInStagger>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reasons.map((reason, index) => (
            <FadeIn key={index}>
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 text-center h-full flex flex-col">
                <div className="mb-4">
                  <span className="inline-flex items-center rounded-md bg-red-600 px-3 py-1 text-xs font-bold text-white">
                    {reason.badge}
                  </span>
                </div>
                <h3 className={`${lato.className} text-lg font-bold text-[#0b2a5a] mb-3`}>
                  {reason.title}
                </h3>
                <p className="text-neutral-600 text-sm leading-relaxed flex-1">
                  {reason.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </FadeInStagger>
    </section>
  );
}

function ContactCTA({ images }) {
  return (
    <section className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 text-white min-h-[55vh] md:min-h-[60vh] flex items-center">
      <div className="absolute inset-0">
        <Image src={images.contactCTA} alt="cta" fill className="object-cover" unoptimized loader={({ src }) => src} />
      </div>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative mx-auto w-full px-0 py-24 text-center">
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

export default function HomePage() {
  const { images } = usePageImages("homepage");
  const breadcrumbs = [
    { name: "Home", url: "https://www.swfoundation.com/" }
  ];

  return (
    <>
      <Head>
        {/* Primary Meta Tags */}
        <title>Commercial Pier Drilling Dallas TX | S&W Foundation Contractors | 35+ Years Experience</title>
        <meta 
          name="description" 
          content="Leading commercial pier drilling contractor in Dallas, TX since 1986. Nationwide foundation construction, crane services, limited access drilling. 13-time ADSC Safety Award winner. Free quotes: (214) 703-0484." 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        
        {/* SEO Meta Tags */}
        <meta name="keywords" content="commercial pier drilling dallas, foundation contractors texas, pier drilling services, dallas foundation construction, commercial drilling contractors, limited access drilling, crane services dallas, helical piles texas, deep foundation drilling" />
        <meta name="author" content="S&W Foundation Contractors Inc." />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="language" content="en-US" />
        <meta name="geo.region" content="US-TX" />
        <meta name="geo.placename" content="Dallas, Texas" />
        <meta name="geo.position" content="32.90144;-96.57587" />
        <meta name="ICBM" content="32.90144, -96.57587" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Commercial Pier Drilling Dallas TX | S&W Foundation Contractors" />
        <meta property="og:description" content="Leading commercial pier drilling contractor in Dallas, TX since 1986. Nationwide foundation construction, crane services, limited access drilling. 13-time ADSC Safety Award winner." />
        <meta property="og:url" content="https://www.swfoundation.com/" />
        <meta property="og:site_name" content="S&W Foundation Contractors" />
        <meta property="og:image" content="https://www.swfoundation.com/homeHero.webp" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="S&W Foundation commercial pier drilling equipment on construction site" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Commercial Pier Drilling Dallas TX | S&W Foundation Contractors" />
        <meta name="twitter:description" content="Leading commercial pier drilling contractor in Dallas, TX since 1986. Nationwide foundation construction, crane services, limited access drilling." />
        <meta name="twitter:image" content="https://www.swfoundation.com/homeHero.webp" />
        <meta name="twitter:image:alt" content="S&W Foundation commercial pier drilling equipment" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://www.swfoundation.com/" />
        
        {/* Additional SEO */}
        <meta name="theme-color" content="#dc2626" />
        <meta name="msapplication-TileColor" content="#dc2626" />
      </Head>
      
      {/* Structured Data */}
      <OrganizationSchema />
      <LocalBusinessSchema />
      <WebSiteSchema />
      <BreadcrumbListSchema breadcrumbs={breadcrumbs} />
      <main className="flex w-full flex-col">
        <Hero images={images} />
        <InfoBlocks images={images} />
        <Services images={images} />
        <AwardsSection />
        <WhyChooseUs />
        <ContactCTA images={images} />
      </main>
    </>
  );
}


