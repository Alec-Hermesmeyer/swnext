import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import NavTailwind from "@/components/NavTailwind";
import HeroTailwind from "@/components/HeroTailwind";
import { Inter, Lato, Montserrat } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });
const lato = Lato({
  weight: ["100", "300", "400", "700", "900"],
  subsets: ["latin"],
});
const montserrat = Montserrat({ subsets: ["latin"] });

export default function HomeTailwind() {
  const businessSchema = {
    "@context": "http://schema.org",
    "@type": "LocalBusiness",
    name: "S&W Foundation Contractors Inc.",
    description:
      "S&W Foundations specializes in laying strong foundations for new commercial construction projects. With a focus on innovation and durability, our team ensures the groundwork for your venture is set to the highest standards. We cater exclusively to commercial clients and do not offer foundation repair or residential services.",
    image: "http://www.swfoundation.com/swlogorwb.png",
    telephone: "(214) 703-0484",
    email: "bids@swfoundation.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "2806 Singleton St.",
      addressLocality: "Rowlett",
      addressRegion: "TX",
      postalCode: "75088",
      addressCountry: "USA",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "32.90144",
      longitude: "-96.57587",
    },
    url: "http://www.swfoundation.com",
    paymentAccepted: "Cash, Credit Card",
    openingHours: "Mo,Tu,We,Th,Fr 08:00-17:00",
    sameAs: [
      "http://www.facebook.com/SWFoundationContractors",
      "http://www.linkedin.com/company/s-w-foundation-contractors-inc",
    ],
  };

  return (
    <>
      <Head>
        <title>
          S&amp;W Foundation | Leading Commercial Pier Drilling &amp;
          Construction Services in Dallas, TX
        </title>
        <meta
          name="description"
          content="S&amp;W Foundation, based in Dallas, TX, offers premier commercial pier drilling, crane, trucking, and turnkey construction solutions. With unparalleled experience, top-tier equipment, and a stellar safety record, we're your trusted partner for commercial construction support in the US."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="google-site-verification"
          content="DOxscx8m8UxfwG_v4MKHOndXU19gJHMMVf5cvy5V46c"
        />
        <meta
          property="og:title"
          content="S&amp;W Foundation | Expert Commercial Construction &amp; Pier Drilling in Dallas, TX"
        />
        <meta
          property="og:description"
          content="From commercial pier drilling to turnkey construction solutions, S&amp;W Foundation stands as the go-to choice for businesses across the US. Discover our legacy of excellence."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.swfoundation.com/" />
        <meta
          property="og:image"
          content="https://edycymyofrowahspzzpg.supabase.co/storage/v1/object/public/Images/public/att.webp?t=2024-04-16T20%3A11%3A20.126Z"
        />
        <meta
          name="keywords"
          content="commercial pier drilling, construction services, Dallas, TX, S&W Foundation, crane services, trucking services, turnkey construction, trusted partner, commercial construction support, US, top-tier equipment, safety record"
        />
        <meta name="twitter:card" content="summary" />
        <meta
          name="twitter:title"
          content="S&amp;W Foundation | Dallas, TX's Premier Commercial Construction Partner"
        />
        <meta
          name="twitter:description"
          content="Expertise in commercial pier drilling, crane &amp; trucking services, and more. See why businesses trust S&amp;W Foundation for their construction needs."
        />
        <meta
          name="twitter:image"
          content="https://edycymyofrowahspzzpg.supabase.co/storage/v1/object/public/Images/public/att.webp?t=2024-04-16T20%3A11%3A20.126Z"
        />
        <link rel="canonical" href="https://www.swfoundation.com/" />
        <link
          rel="icon"
          href="/android-chrome-512x512.png"
          type="image/x-icon"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }}
        />
      </Head>

      {/* Navigation */}
      <NavTailwind />

      {/* Hero Section */}
      <HeroTailwind />

      {/* Info Section - Foundation Excellence Since 1986 */}
      <section className="bg-white py-16 lg:py-24">
        <div className="container mx-auto px-4">
          {/* Desktop Layout */}
          <div className="hidden lg:block">
            <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
              <div>
                <h2 className={`${lato.className} text-3xl lg:text-4xl font-bold text-gray-800 mb-6`}>
                  Foundation Contracting Excellence Since 1986
                </h2>
                <p className={`${lato.className} text-lg text-gray-700 leading-relaxed mb-6`}>
                  Based in Rowlett, Texas, S&W Foundation Contractors has been delivering reliable and high-quality pier drilling services for over three decades. Our foundation is rooted in family values, commitment to safety, and innovative technology, which have allowed us to become a nationally recognized name in the foundation construction industry.
                </p>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-red-600 mr-3">•</span>
                    Commercial and industrial foundation projects
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-3">•</span>
                    Advanced equipment and expert team
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-3">•</span>
                    Commitment to safety and integrity
                  </li>
                </ul>
              </div>
              <div className="flex justify-center">
                <Image
                  src="Images/public/IMG_8061.webp"
                  height={400}
                  width={320}
                  alt="S&W Foundation Contractors"
                  className="rounded-lg shadow-lg"
                  quality={80}
                />
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
              <div className="order-2 lg:order-1 flex justify-center">
                <Image
                  src="Images/public/IMG_7620.webp"
                  height={400}
                  width={320}
                  alt="S&W Foundation Contractors Nationwide Services"
                  className="rounded-lg shadow-lg"
                  quality={80}
                />
              </div>
              <div className="order-1 lg:order-2">
                <h2 className={`${lato.className} text-3xl lg:text-4xl font-bold text-gray-800 mb-6`}>
                  Nationwide Pier Drilling and Foundation Services
                </h2>
                <p className={`${lato.className} text-lg text-gray-700 leading-relaxed mb-6`}>
                  S&W Foundation Contractors proudly serves Dallas, Texas, and extends our high-quality pier drilling and foundation services nationwide. With years of experience in diverse terrains and challenging environments, our team is equipped to provide region-specific solutions for various projects.
                </p>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-red-600 mr-3">•</span>
                    Specialized pier drilling for commercial projects
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-3">•</span>
                    Expertise in diverse terrains and soils
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-3">•</span>
                    Reliable results for projects nationwide
                  </li>
                </ul>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className={`${lato.className} text-3xl lg:text-4xl font-bold text-gray-800 mb-6`}>
                  Comprehensive Foundation Solutions for Dallas and Beyond
                </h2>
                <p className={`${lato.className} text-lg text-gray-700 leading-relaxed mb-6`}>
                  Our services include not only pier drilling but also soil testing, deep foundation drilling, and site analysis, tailored to meet the specific needs of commercial, industrial, and residential projects. Our commitment to innovation ensures we provide the best foundation solutions.
                </p>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-red-600 mr-3">•</span>
                    Full-service foundation solutions
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-3">•</span>
                    Customized drilling based on geotechnical needs
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-3">•</span>
                    Innovative technology for quality assurance
                  </li>
                </ul>
              </div>
              <div className="flex justify-center">
                <Image
                  src="Images/public/IMG_7653.webp"
                  height={400}
                  width={320}
                  alt="S&W Foundation Contractors in Dallas"
                  className="rounded-lg shadow-lg"
                  quality={80}
                />
              </div>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="lg:hidden space-y-12">
            <div className="text-center">
              <h2 className={`${lato.className} text-2xl md:text-3xl font-bold text-gray-800 mb-6`}>
                A Legacy of Excellence in Foundation Contracting
              </h2>
              <p className={`${lato.className} text-base text-gray-700 leading-relaxed mb-8`}>
                S&W Foundation Contractors is distinguished by its exceptional blend of customer service, vast experience, advanced equipment, and a strong commitment to safety. Our company's journey began in 1986 in Rowlett, Texas, rooted in family values, hard work, and a steadfast dedication to our craft. As a family-run business, we have evolved into a prominent name in the pier drilling sector, recognized nationwide for delivering dependable and superior-quality services. For more than three decades, our guiding principles of honesty, integrity, and excellence have been fundamental to our enduring success. Our business is equipped with cutting-edge technology and staffed by skilled professionals, all focused on fulfilling and surpassing the expectations of our clients. We take immense pride in both the quality of our work and the strong client relationships we've fostered over the years. As we look to the future, S&W Foundation Contractors is excited to continue providing top-tier services to the construction industry for many more years.
              </p>
              <Image
                src="Images/public/IMG_8061.webp"
                height={300}
                width={320}
                alt="S&W Foundation Contractors"
                className="rounded-lg shadow-lg mx-auto mb-8"
                quality={80}
              />
            </div>

            <div className="text-center">
              <h2 className={`${lato.className} text-2xl md:text-3xl font-bold text-gray-800 mb-6`}>
                Expert Pier Drilling Services Offered Nationwide
              </h2>
              <p className={`${lato.className} text-base text-gray-700 leading-relaxed mb-8`}>
                At S&W Foundation Contractors, we specialize in providing expert commercial pier drilling services that cater to a diverse range of projects, both locally in Dallas, Texas, and across the nation. Our roots in Dallas give us a unique understanding of the local terrain and construction needs, allowing us to offer specialized, region-specific solutions right at the heart of Texas. This local expertise, combined with our extensive experience, positions us perfectly to extend our services on a national scale. We harness the same dedication and precision that we apply in our local projects to serve clients across the United States. Our team is equipped to handle the logistical and technical demands of nationwide operations, ensuring the same high standards of quality and reliability, regardless of location. Whether it's a project in the bustling urban landscape of Dallas or a large-scale operation in another state, S&W Foundation Contractors is committed to delivering excellence in pier drilling, tailored to the unique needs of each project and location.
              </p>
              <Image
                src="Images/public/IMG_7620.webp"
                height={300}
                width={320}
                alt="S&W Foundation Contractors Nationwide Services"
                className="rounded-lg shadow-lg mx-auto mb-8"
                quality={80}
              />
            </div>

            <div className="text-center">
              <h2 className={`${lato.className} text-2xl md:text-3xl font-bold text-gray-800 mb-6`}>
                Bringing Foundation Drilling Solutions to Dallas
              </h2>
              <p className={`${lato.className} text-base text-gray-700 leading-relaxed mb-8`}>
                We're a full service pier drilling contractor with expertise in commercial and industrial foundation projects, large-scale residential developments, tilt-up pier construction, cast-in-place pier networks, and a full range of drilling-related specialties. Beyond these core services, we offer a comprehensive range of drilling-related specialties. This includes but is not limited to soil testing, site analysis, deep foundation drilling, and customized drilling solutions tailored to the specific geotechnical needs of each project. Our team is adept at navigating the intricacies of different soil types and environmental conditions, ensuring optimal foundation solutions irrespective of the project's complexity or scale. Our commitment to innovation and staying abreast of the latest industry advancements allows us to offer our clients cutting-edge solutions in pier drilling and foundation construction. Whether it's a challenging industrial project requiring precise and deep drilling, or a residential development seeking a reliable foundation, our goal is to provide top-tier service and results that not only meet but exceed expectations. With S&W Foundation Contractors, clients are assured of a partner that brings expertise, experience, and excellence to every project.
              </p>
              <Image
                src="Images/public/IMG_7653.webp"
                height={300}
                width={320}
                alt="S&W Foundation Contractors in Dallas"
                className="rounded-lg shadow-lg mx-auto"
                quality={80}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="bg-gray-50 py-16 lg:py-24 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="grid grid-cols-12 h-full">
            {Array.from({ length: 144 }).map((_, i) => (
              <div key={i} className="border border-gray-300"></div>
            ))}
          </div>
        </div>
        
        <div className="container mx-auto px-4 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 h-96">
            
            {/* Left Column - 2 Services */}
            <div className="lg:col-span-2 grid grid-rows-2 gap-6">
              {/* Pier Drilling */}
              <div className="bg-cover bg-center relative rounded-lg overflow-hidden shadow-lg group" 
                   style={{backgroundImage: "url('/heroImg1.png')"}}>
                <div className="absolute inset-0 bg-black bg-opacity-60 group-hover:bg-opacity-70 transition-all duration-300"></div>
                <div className="relative z-10 p-6 h-full flex flex-col justify-between">
                  <h3 className={`${inter.className} text-white text-xl font-bold mb-4`}>
                    Pier Drilling
                  </h3>
                  <Link href="/pier-drilling">
                    <button className={`${montserrat.className} bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded transition-colors duration-300 font-semibold`}>
                      Learn More
                    </button>
                  </Link>
                </div>
              </div>

              {/* Limited-Access Drilling */}
              <div className="bg-cover bg-center relative rounded-lg overflow-hidden shadow-lg group" 
                   style={{backgroundImage: "url('/heroImg1.png')"}}>
                <div className="absolute inset-0 bg-black bg-opacity-60 group-hover:bg-opacity-70 transition-all duration-300"></div>
                <div className="relative z-10 p-6 h-full flex flex-col justify-between">
                  <h3 className={`${inter.className} text-white text-xl font-bold mb-4`}>
                    Limited-Access Drilling
                  </h3>
                  <Link href="/limited-access">
                    <button className={`${montserrat.className} bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded transition-colors duration-300 font-semibold`}>
                      Learn More
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Center Column - Core Values */}
            <div className="lg:col-span-1">
              <div className="bg-cover bg-center relative rounded-lg overflow-hidden shadow-lg group h-full" 
                   style={{backgroundImage: "url('/heroImg1.png')"}}>
                <div className="absolute inset-0 bg-black bg-opacity-60 group-hover:bg-opacity-70 transition-all duration-300"></div>
                <div className="relative z-10 p-6 h-full flex flex-col justify-between">
                  <h3 className={`${inter.className} text-white text-xl font-bold mb-4`}>
                    Core Values
                  </h3>
                  <Link href="/core-values">
                    <button className={`${montserrat.className} bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded transition-colors duration-300 font-semibold`}>
                      Learn More
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Column - 2 Services */}
            <div className="lg:col-span-2 grid grid-rows-2 gap-6">
              {/* Turn-Key Solutions */}
              <div className="bg-cover bg-center relative rounded-lg overflow-hidden shadow-lg group" 
                   style={{backgroundImage: "url('/heroImg1.png')"}}>
                <div className="absolute inset-0 bg-black bg-opacity-60 group-hover:bg-opacity-70 transition-all duration-300"></div>
                <div className="relative z-10 p-6 h-full flex flex-col justify-between">
                  <h3 className={`${inter.className} text-white text-xl font-bold mb-4`}>
                    Turn-Key Drilling Solutions
                  </h3>
                  <Link href="/turn-key">
                    <button className={`${montserrat.className} bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded transition-colors duration-300 font-semibold`}>
                      Learn More
                    </button>
                  </Link>
                </div>
              </div>

              {/* Careers */}
              <div className="bg-cover bg-center relative rounded-lg overflow-hidden shadow-lg group" 
                   style={{backgroundImage: "url('/heroImg1.png')"}}>
                <div className="absolute inset-0 bg-black bg-opacity-60 group-hover:bg-opacity-70 transition-all duration-300"></div>
                <div className="relative z-10 p-6 h-full flex flex-col justify-between">
                  <h3 className={`${inter.className} text-white text-xl font-bold mb-4`}>
                    Careers
                  </h3>
                  <Link href="/careers#jobPostings">
                    <button className={`${montserrat.className} bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded transition-colors duration-300 font-semibold`}>
                      Learn More
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="bg-blue-800 py-16 lg:py-24 text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className={`${lato.className} text-3xl lg:text-4xl font-bold mb-8`}>
            Get Your Free Quote Today and Let S&W Take Your Next Project To New Depths
          </h2>
          <Link href="/contact">
            <button className={`${lato.className} bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors duration-300 shadow-lg`}>
              Contact Us
            </button>
          </Link>
        </div>
      </section>

      {/* Analytics Scripts */}
      <Script
        id="google-tag-manager"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){
              w[l]=w[l]||[];
              w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});
              var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
              j.async=true;
              j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
              f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-MJNDLQZ');
          `,
        }}
      />
      
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-BXEC44GZQV"
        strategy="afterInteractive"
        async
      />
      
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-BXEC44GZQV');
        `}
      </Script>
    </>
  );
}

export async function getServerSideProps({ req, res }) {
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=31536000, stale-while-revalidate"
  );

  return {
    props: {},
  };
}