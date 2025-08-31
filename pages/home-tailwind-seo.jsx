import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { GridPattern } from "@/components/GridPattern";
import { FadeIn, FadeInStagger } from "@/components/FadeIn";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

// SEO-optimized structured data
const structuredData = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://www.swfoundation.com/#organization",
  name: "S&W Foundation Contractors Inc.",
  alternateName: ["S&W Foundation", "S&W Foundation Contractors"],
  description: "Leading commercial pier drilling and foundation contractors in Dallas, TX. Over 35 years of experience providing nationwide foundation solutions, crane services, and turnkey construction support.",
  url: "https://www.swfoundation.com",
  logo: "https://www.swfoundation.com/swlogorwb.png",
  image: [
    "https://www.swfoundation.com/homeHero.webp",
    "https://www.swfoundation.com/Images/public/IMG_8061.webp",
    "https://www.swfoundation.com/Images/public/IMG_7620.webp"
  ],
  telephone: "+12147030484",
  email: "bids@swfoundation.com",
  foundingDate: "1986",
  address: {
    "@type": "PostalAddress",
    streetAddress: "2806 Singleton St.",
    addressLocality: "Rowlett",
    addressRegion: "TX",
    postalCode: "75088",
    addressCountry: "US"
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 32.90144,
    longitude: -96.57587
  },
  areaServed: [
    {
      "@type": "Country",
      name: "United States"
    },
    {
      "@type": "State",
      name: "Texas"
    },
    {
      "@type": "City",
      name: "Dallas"
    }
  ],
  serviceType: [
    "Commercial Pier Drilling",
    "Foundation Construction",
    "Limited Access Drilling",
    "Turn-Key Drilling Solutions",
    "Crane Services",
    "Helical Piles",
    "Deep Foundation Drilling",
    "Soil Testing"
  ],
  hasCredential: [
    {
      "@type": "EducationalOccupationalCredential",
      credentialCategory: "Safety Award",
      recognizedBy: {
        "@type": "Organization",
        name: "ADSC International Association of Foundation Drilling"
      }
    }
  ],
  openingHours: "Mo,Tu,We,Th,Fr 08:00-17:00",
  paymentAccepted: ["Cash", "Check", "Credit Card"],
  sameAs: [
    "https://www.facebook.com/SWFoundationContractors",
    "https://www.linkedin.com/company/s-w-foundation-contractors-inc"
  ]
};

// Breadcrumb structured data
const breadcrumbData = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://www.swfoundation.com/"
    }
  ]
};

function Hero() {
  return (
    <section 
      className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 text-white min-h-[70vh] md:min-h-[80vh] flex items-center"
      role="banner"
      aria-labelledby="hero-heading"
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/homeHero.webp')" }}
        role="img"
        aria-label="Commercial pier drilling construction site with heavy machinery"
      />
      <div className="absolute inset-0 bg-black/45" />

      <div className="relative mx-auto w-full px-0 py-28 md:py-40">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <FadeIn>
              <div className="space-y-3 pl-6 md:pl-10">
                <p className={`${lato.className} text-sm tracking-wide`}>
                  Commercial Pier Drilling - Dallas, Texas
                </p>
                <h1 
                  id="hero-heading"
                  className={`${lato.className} text-3xl md:text-5xl font-extrabold`}
                >
                  S&W Foundation Contractors
                </h1>
                <p className={`${lato.className} italic text-neutral-200 text-lg md:text-xl`}>
                  Drilling Beyond Limits
                </p>
                <div className="pt-2">
                  <Link 
                    href="/services" 
                    className="inline-flex items-center rounded-md bg-red-600 px-5 py-3 font-bold text-white shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    aria-label="View our commercial pier drilling services"
                  >
                    Our Services
                  </Link>
                </div>
              </div>
            </FadeIn>
            
            {/* Contact Info Card - SEO optimized */}
            <aside className="mt-8 pl-6 md:pl-10" role="complementary" aria-labelledby="contact-info-heading">
              <div className="w-full max-w-md rounded-2xl shadow-2xl ring-1 ring-black/10">
                <div className="h-3 rounded-t-2xl bg-red-600" />
                <div className="rounded-b-2xl bg-[#0b2a5a] p-8 md:p-9">
                  <h3 
                    id="contact-info-heading"
                    className={`${lato.className} mb-5 text-lg font-black text-white`}
                  >
                    We Provide Nation-Wide Service
                  </h3>
                  <address className="not-italic">
                    <ul className="space-y-2 text-sm text-neutral-200">
                      <li>
                        Phone: <Link 
                          href="tel:+12147030484" 
                          className="font-semibold text-white hover:text-red-400 focus:outline-none focus:underline"
                          aria-label="Call S&W Foundation Contractors at (214) 703-0484"
                        >
                          (214) 703-0484
                        </Link>
                      </li>
                      <li>
                        <span className="sr-only">Address: </span>
                        2806 Singleton St. Rowlett, TX 75088
                      </li>
                    </ul>
                  </address>
                  <nav className="mt-7 flex gap-3" role="navigation" aria-label="Primary actions">
                    <Link 
                      href="/contact" 
                      className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      aria-label="Contact S&W Foundation for a free quote"
                    >
                      Contact Us
                    </Link>
                    <Link 
                      href="/careers" 
                      className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      aria-label="View career opportunities at S&W Foundation"
                    >
                      Careers
                    </Link>
                  </nav>
                </div>
              </div>
            </aside>
          </div>
          <div />
        </div>
      </div>
    </section>
  );
}

function InfoBlocks() {
  const blocks = [
    {
      title: "Foundation Contracting Excellence Since 1986",
      text: "Based in Rowlett, Texas, S&W Foundation Contractors has been delivering reliable and high-quality pier drilling services for over three decades. Our foundation is rooted in family values, commitment to safety, and innovative technology, which have allowed us to become a nationally recognized name in the foundation construction industry.",
      bullets: [
        "Commercial and industrial foundation projects",
        "Advanced equipment and expert team",
        "Commitment to safety and integrity",
      ],
      img: "/Images/public/IMG_8061.webp",
      imgAlt: "S&W Foundation Contractors commercial pier drilling equipment and crew working on a construction site",
      bar: "red",
      imageRight: true,
    },
    {
      title: "Nationwide Pier Drilling and Foundation Services",
      text: "S&W Foundation Contractors proudly serves Dallas, Texas, and extends our high-quality pier drilling and foundation services nationwide. With years of experience in diverse terrains and challenging environments, our team is equipped to provide region-specific solutions for various projects.",
      bullets: [
        "Specialized pier drilling for commercial projects",
        "Expertise in diverse terrains and soils",
        "Reliable results for projects nationwide",
      ],
      img: "/Images/public/IMG_7620.webp",
      imgAlt: "Professional foundation drilling crew using specialized equipment for commercial construction projects",
      bar: "#0b2a5a",
      imageRight: false,
    },
    {
      title: "Comprehensive Foundation Solutions for Dallas and Beyond",
      text: "Our services include not only pier drilling but also soil testing, deep foundation drilling, and site analysis, tailored to meet the specific needs of commercial, industrial, and residential projects. Our commitment to innovation ensures we provide the best foundation solutions.",
      bullets: [
        "Full-service foundation solutions",
        "Customized drilling based on geotechnical needs",
        "Innovative technology for quality assurance",
      ],
      img: "/Images/public/IMG_7653.webp",
      imgAlt: "Advanced pier drilling machinery and foundation construction equipment in Dallas, Texas",
      bar: "red",
      imageRight: true,
    },
  ];

  return (
    <section 
      className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 bg-white py-12 md:py-16"
      role="main"
      aria-labelledby="services-overview"
    >
      <div className="mx-auto w-full px-0">
        <div className="sr-only">
          <h2 id="services-overview">Our Foundation Drilling Services and Company Overview</h2>
        </div>
        <FadeInStagger>
          {blocks.map((b, i) => (
            <FadeIn key={b.title}>
              <article className="py-8 md:py-12">
                <div className="group relative mx-auto w-full md:w-[min(100%,1600px)] overflow-hidden rounded-xl bg-white shadow ring-1 ring-neutral-200 transition duration-300 hover:shadow-lg hover:ring-neutral-300">
                  <div className="absolute left-0 top-0 h-3 w-full overflow-hidden">
                    <div className="absolute inset-0 opacity-40" style={{background: `linear-gradient(to right, ${b.bar==='red'?'#dc2626':'#0b2a5a'} 0%, ${b.bar==='red'?'#dc2626':'#0b2a5a'} 50%, ${b.bar==='red'?'#0b2a5a':'#dc2626'} 50%, ${b.bar==='red'?'#0b2a5a':'#dc2626'} 100%)`}} />
                    <div className="absolute inset-0 origin-left scale-x-0 transition-transform duration-700 ease-out group-hover:scale-x-100" style={{background: `linear-gradient(to right, ${b.bar==='red'?'#dc2626':'#0b2a5a'} 0%, ${b.bar==='red'?'#dc2626':'#0b2a5a'} 50%, ${b.bar==='red'?'#0b2a5a':'#dc2626'} 50%, ${b.bar==='red'?'#0b2a5a':'#dc2626'} 100%)`}} />
                  </div>
                  <div className={`grid grid-cols-1 items-center gap-8 p-6 md:p-12 md:grid-cols-2 ${b.imageRight ? "" : "md:[&>div:first-child]:order-2"}`}>
                    <div>
                      <header>
                        <h2 className={`${lato.className} mb-3 text-center text-2xl md:text-3xl font-extrabold text-neutral-900 md:text-left`}>
                          {b.title}
                        </h2>
                      </header>
                      <p className={`${lato.className} mx-auto max-w-3xl text-center text-neutral-700 md:text-left leading-relaxed`}>
                        {b.text}
                      </p>
                      <ul className={`${lato.className} mx-auto mt-5 max-w-2xl list-disc space-y-2 pl-5 text-neutral-900 md:mx-0`}>
                        {b.bullets.map((li) => (
                          <li key={li} className="font-semibold">{li}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex items-center justify-center">
                      <figure className="relative aspect-[4/3] w-full max-w-xl rounded-md overflow-hidden transition duration-500 ease-out will-change-transform group-hover:scale-[1.03]">
                        <Image 
                          src={b.img} 
                          alt={b.imgAlt}
                          fill 
                          sizes="(min-width: 768px) 600px, 90vw" 
                          className="object-cover" 
                          priority={i === 0}
                          quality={85}
                        />
                      </figure>
                    </div>
                  </div>
                </div>
              </article>
            </FadeIn>
          ))}
        </FadeInStagger>
      </div>
    </section>
  );
}

function Services() {
  const cards = [
    { 
      t: "Pier Drilling", 
      href: "/pier-drilling", 
      img: "/galleryImages/gal9.jpeg",
      description: "Professional commercial pier drilling services for foundation construction"
    },
    { 
      t: "Core Values", 
      href: "/core-values", 
      img: "/galleryImages/gal31.jpeg",
      description: "Learn about S&W Foundation's commitment to safety, integrity, and excellence"
    },
    { 
      t: "Turn-Key Drilling Solutions", 
      href: "/turn-key", 
      img: "/galleryImages/gal22.jpeg",
      description: "Complete drilling solutions from planning to completion for commercial projects"
    },
  ];
  
  return (
    <section 
      className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 py-16 md:py-24"
      role="region"
      aria-labelledby="featured-services"
    >
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-red-700 via-white to-[#0b2a5a]" />
      <div className="absolute inset-0 z-0 opacity-60 pointer-events-none">
        <GridPattern
          yOffset={0}
          interactive={false}
          className="h-full w-full"
          strokeColor="#ffffff"
          strokeWidth={1.5}
          strokeOpacity={0.8}
          aria-hidden="true"
        />
      </div>
      <div className="mx-auto w-full max-w-[1600px] px-6 md:px-10 relative z-10">
        <header className="text-center mb-12">
          <h2 id="featured-services" className={`${lato.className} text-3xl md:text-4xl font-extrabold text-neutral-900 mb-4`}>
            Featured Services
          </h2>
          <p className="text-lg text-neutral-700 max-w-3xl mx-auto">
            Discover our specialized foundation drilling services and company values that have made us a trusted partner for over 35 years.
          </p>
        </header>
        <FadeInStagger>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3" role="list">
            {cards.map((c, index) => (
              <FadeIn key={c.t}>
                <article 
                  className="group relative h-96 md:h-[26rem] overflow-hidden rounded-xl ring-1 ring-white/20 shadow-lg transition duration-300 ease-out will-change-transform transform-gpu hover:-translate-y-1 hover:shadow-2xl hover:ring-white/30"
                  role="listitem"
                >
                  <div className="relative h-full">
                    <Image 
                      src={c.img} 
                      alt={c.description}
                      fill 
                      sizes="(min-width: 768px) 33vw, 100vw" 
                      className="object-cover" 
                      priority={index === 0}
                      quality={80}
                      unoptimized 
                      loader={({ src }) => src}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-red-800/60 via-black/40 to-transparent transition-opacity duration-300 group-hover:opacity-70" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center p-6">
                      <header>
                        <h3 className="text-2xl font-extrabold text-white drop-shadow-sm md:text-3xl">
                          {c.t}
                        </h3>
                      </header>
                      <Link 
                        href={c.href} 
                        className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 font-bold text-white drop-shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        aria-label={`Learn more about ${c.t.toLowerCase()}`}
                      >
                        Learn More
                      </Link>
                    </div>
                  </div>
                </article>
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
    <section 
      className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 text-white min-h-[55vh] md:min-h-[60vh] flex items-center"
      role="region"
      aria-labelledby="contact-cta-heading"
    >
      <div className="absolute inset-0">
        <Image 
          src="/galleryImages/gal28.jpeg" 
          alt="S&W Foundation Contractors construction site with drilling equipment and professional crew" 
          fill 
          className="object-cover" 
          priority={false}
          quality={85}
          unoptimized 
          loader={({ src }) => src}
        />
      </div>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative mx-auto w-full px-6 md:px-10 py-24 text-center">
        <header>
          <h2 
            id="contact-cta-heading"
            className={`${lato.className} mx-auto max-w-5xl text-3xl font-extrabold md:text-5xl leading-tight`}
          >
            Get Your Free Quote Today and Let S&W Take Your Next Project To New Depths
          </h2>
        </header>
        <div className="mt-8">
          <Link 
            href="/contact" 
            className="inline-flex items-center rounded-md bg-red-600 px-8 py-4 text-xl font-black text-white shadow-xl hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-4 focus:ring-white/20 transition-colors duration-200"
            aria-label="Contact S&W Foundation Contractors for your free foundation drilling quote"
          >
            Get Free Quote
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function HomeTailwindSEO() {
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
        <meta property="og:image:alt" content="S&W Foundation Contractors commercial pier drilling equipment at construction site in Dallas, Texas" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="en_US" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Commercial Pier Drilling Dallas TX | S&W Foundation Contractors" />
        <meta name="twitter:description" content="Leading commercial pier drilling contractor in Dallas, TX since 1986. Nationwide foundation construction, crane services, limited access drilling." />
        <meta name="twitter:image" content="https://www.swfoundation.com/homeHero.webp" />
        <meta name="twitter:image:alt" content="S&W Foundation Contractors commercial pier drilling equipment at construction site in Dallas, Texas" />
        
        {/* Additional SEO Tags */}
        <link rel="canonical" href="https://www.swfoundation.com/" />
        <link rel="alternate" hrefLang="en-us" href="https://www.swfoundation.com/" />
        
        {/* Favicon and Icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Preconnect for Performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
        />
        
        {/* Theme Color */}
        <meta name="theme-color" content="#dc2626" />
        <meta name="msapplication-TileColor" content="#dc2626" />
        
        {/* Google Site Verification (placeholder - replace with actual) */}
        <meta name="google-site-verification" content="DOxscx8m8UxfwG_v4MKHOndXU19gJHMMVf5cvy5V46c" />
      </Head>
      
      <div className="min-h-screen">
        <Hero />
        <InfoBlocks />
        <Services />
        <ContactCTA />
      </div>
    </>
  );
}