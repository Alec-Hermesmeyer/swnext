import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import styles from "@/styles/Home.module.css";
import { GridPattern } from "@/components/GridPattern";
import { Container } from "@/components/Container";
import { FadeIn, FadeInStagger } from "@/components/FadeIn";
import { Inter } from "next/font/google";
import { Oswald } from "next/font/google";
import { Montserrat } from "next/font/google";
import { Lato } from "next/font/google";
import supabaseLoader from "@/supabase-image-loader";
import { GrayscaleTransitionImage } from "@/components/GrayscaleTransitionImage";
// import { Container } from '@/components/Container';

const inter = Inter({ subsets: ["latin"] });
const oswald = Oswald({ subsets: ["latin"] });
const montserrat = Montserrat({ subsets: ["latin"] });
const lato = Lato({
  weight: ["900", "100", "300", "400", "700"],
  subsets: ["latin"],
});
const LogoImage = () => (
  <Image
    className={styles.logo}
    src="/att.png"
    height={300}
    width={300}
    alt="S&amp;W Foundations Logo"
    loading="lazy"
    quality={80}
  />
);
function HeroSection() {
  return (
    <section className={styles.heroSection}>
      <div className={styles.heroContainer}>
        <div className={styles.heroWrapper}>
          <div className={styles.heroLeft}>
            <FadeIn>
              <div className={styles.heroContent}>
                <h1 className={lato.className}>
                  S&amp;W Foundation Contractors
                </h1>
                <h2 className={lato.className}>
                  Commercial Pier Drilling Contractors - Dallas, Texas
                </h2>
                <h3 className={lato.className}>
                  <em>Drilling Beyond Limits</em>
                </h3>
                <span>
                  <Link href="/services">
                    <button className={lato.className}>Our Services</button>
                  </Link>
                </span>
              </div>
            </FadeIn>
          </div>
          <div className={styles.heroRight}>
            <div className={styles.rightCard}>
              <div className={styles.cardWrapper}>
                <div className={styles.cardContent}>
                  <h3 className={lato.className}>
                    {" "}
                    We Provide Nation-Wide Service
                  </h3>
                  <ul>
                    <Link href="tel: +2147030484">
                      <li className={lato.className}>Call: (214)-703-0484</li>
                    </Link>
                    <li>Address: 2806 Singleton St. Rowlett, TX 75088</li>
                  </ul>
                  <span>
                    <Link href="/contact">
                      <button className={lato.className}>Contact Us</button>
                    </Link>
                    <Link href="/careers">
                      <button className={lato.className}>Careers</button>
                    </Link>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
function InfoSection() {
  return (
    <Container>
      <section className={styles.infoSection}>
        <div className={styles.infoContainer}>
          <div className={styles.infoWrapper}>
            <FadeIn>
              <div className={styles.infoTop}>
                <div className={styles.infoTopContainer}>
                  <div className={styles.infoTopWrapper}>
                    <div className={styles.infoTopLeft}>
                      <article className={styles.article}>
                        <h2 className={lato.className}>
                          A Legacy of Excellence in Foundation Contracting
                        </h2>
                        <p className={lato.className}>
                          S&W Foundation Contractors is distinguished by its
                          exceptional blend of customer service, vast
                          experience, advanced equipment, and a strong
                          commitment to safety. Our company&apos;s journey began
                          in 1986 in Rowlett, Texas, rooted in family values,
                          hard work, and a steadfast dedication to our craft. As
                          a family-run business, we have evolved into a
                          prominent name in the pier drilling sector, recognized
                          nationwide for delivering dependable and
                          superior-quality services. For more than three
                          decades, our guiding principles of honesty, integrity,
                          and excellence have been fundamental to our enduring
                          success. Our business is equipped with cutting-edge
                          technology and staffed by skilled professionals, all
                          focused on fulfilling and surpassing the expectations
                          of our clients. We take immense pride in both the
                          quality of our work and the strong client
                          relationships we&apos;ve fostered over the years. As
                          we look to the future, S&W Foundation Contractors is
                          excited to continue providing top-tier services to the
                          construction industry for many more years.
                        </p>
                      </article>
                    </div>
                    <div className={styles.infoTopRight}>
                      <div className={styles.imgContainer}>
                        <Image
                          className={styles.infoImage}
                          src="Images/public/IMG_8061.webp"
                          height={400}
                          width={320}
                          alt="S&W Foundations"
                          loading="lazy"
                          quality={80}
                        />
                        
                      </div>
                     
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
            <FadeInStagger>
              <FadeIn>
                <div className={styles.infoTop}>
                  <div className={styles.infoTopContainer}>
                    <div className={styles.infoTopWrapperC}>
                      <div className={styles.infoTopLeftC}>
                        <article className={styles.article}>
                          <h2 className={lato.className}>
                            Expert Pier Drilling Services Offered Nationwide
                          </h2>
                          <p className={lato.className}>
                            At S&W Foundation Contractors, we specialize in
                            providing expert commercial pier drilling services
                            that cater to a diverse range of projects, both
                            locally in Dallas, Texas, and across the nation. Our
                            roots in Dallas give us a unique understanding of
                            the local terrain and construction needs, allowing
                            us to offer specialized, region-specific solutions
                            right at the heart of Texas. This local expertise,
                            combined with our extensive experience, positions us
                            perfectly to extend our services on a national
                            scale. We harness the same dedication and precision
                            that we apply in our local projects to serve clients
                            across the United States. Our team is equipped to
                            handle the logistical and technical demands of
                            nationwide operations, ensuring the same high
                            standards of quality and reliability, regardless of
                            location. Whether it&apos;s a project in the
                            bustling urban landscape of Dallas or a large-scale
                            operation in another state, S&W Foundation
                            Contractors is committed to delivering excellence in
                            pier drilling, tailored to the unique needs of each
                            project and location.
                          </p>
                        </article>
                      </div>
                      <div className={styles.infoTopRight}>
                        <div className={styles.imgContainer}>
                          <Image
                            className={styles.infoImage}
                            src="Images/public/IMG_7620.webp"
                            height={400}
                            width={320}
                            alt="S&W Foundations"
                            loading="lazy"
                            quality={80}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            </FadeInStagger>
            <FadeInStagger>
              <FadeIn>
                <div className={styles.infoTop}>
                  <div className={styles.infoTopContainer}>
                    <div className={styles.infoTopWrapper}>
                      <div className={styles.infoTopLeft}>
                        <article className={styles.article}>
                          <h2 className={lato.className}>
                            Bringing Foundation Drilling Solutions to Dallas
                          </h2>
                          <p className={lato.className}>
                            We&apos;re a full service pier drilling contractor
                            with expertise in commercial and industrial
                            foundation projects, large-scale residential
                            developments, tilt-up pier construction,
                            cast-in-place pier networks, and a full range of
                            drilling-related specialties. Beyond these core
                            services, we offer a comprehensive range of
                            drilling-related specialties. This includes but is
                            not limited to soil testing, site analysis, deep
                            foundation drilling, and customized drilling
                            solutions tailored to the specific geotechnical
                            needs of each project. Our team is adept at
                            navigating the intricacies of different soil types
                            and environmental conditions, ensuring optimal
                            foundation solutions irrespective of the
                            project&apos;s complexity or scale. Our commitment
                            to innovation and staying abreast of the latest
                            industry advancements allows us to offer our clients
                            cutting-edge solutions in pier drilling and
                            foundation construction. Whether it&apos;s a
                            challenging industrial project requiring precise and
                            deep drilling, or a residential development seeking
                            a reliable foundation, our goal is to provide
                            top-tier service and results that not only meet but
                            exceed expectations. With S&W Foundation
                            Contractors, clients are assured of a partner that
                            brings expertise, experience, and excellence to
                            every project.
                          </p>
                        </article>
                      </div>
                      <div className={styles.infoTopRight}>
                        <div className={styles.imgContainer}>
                          <Image
                            className={styles.infoImage}
                            src="Images/public/IMG_7653.webp"
                            height={400}
                            width={320}
                            alt="S&W Foundations"
                            loading="lazy"
                            quality={80}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            </FadeInStagger>
          </div>
        </div>
      </section>
    </Container>
  );
}
function InfoSectionMobile() {
  return (
    <Container>
      <section className={styles.infoSectionMobile}>
        <div className={styles.infoContainerMobile}>
          <div className={styles.infoWrapperMobile}>
          <FadeIn>
            <div className={styles.infoTopMobile}>
              <div className={styles.infoTopContainerMobile}>
                <div className={styles.infoMobileContent}>
                <h2 className={lato.className}>
                          A Legacy of Excellence in Foundation Contracting
                        </h2>
                        <p className={lato.className}>
                          S&W Foundation Contractors is distinguished by its
                          exceptional blend of customer service, vast
                          experience, advanced equipment, and a strong
                          commitment to safety. Our company&apos;s journey began
                          in 1986 in Rowlett, Texas, rooted in family values,
                          hard work, and a steadfast dedication to our craft. As
                          a family-run business, we have evolved into a
                          prominent name in the pier drilling sector, recognized
                          nationwide for delivering dependable and
                          superior-quality services. For more than three
                          decades, our guiding principles of honesty, integrity,
                          and excellence have been fundamental to our enduring
                          success. Our business is equipped with cutting-edge
                          technology and staffed by skilled professionals, all
                          focused on fulfilling and surpassing the expectations
                          of our clients. We take immense pride in both the
                          quality of our work and the strong client
                          relationships we&apos;ve fostered over the years. As
                          we look to the future, S&W Foundation Contractors is
                          excited to continue providing top-tier services to the
                          construction industry for many more years.
                        </p>
                        <Image
                          className={styles.infoImageMobile}
                          src="Images/public/IMG_8061.webp"
                          height={300}
                          width={320}
                          alt="S&W Foundations"
                          loading="lazy"
                          quality={80}
                        />
                </div>
              </div>
            </div>
            </FadeIn>
            <FadeInStagger>
              <FadeIn>
            <div className={styles.infoCenterMobile}>
              <div className={styles.infoCenterContainerMobile}>
                <div className={styles.infoMobileContent}>
                <h2 className={lato.className}>
                            Expert Pier Drilling Services Offered Nationwide
                          </h2>
                          <p className={lato.className}>
                            At S&W Foundation Contractors, we specialize in
                            providing expert commercial pier drilling services
                            that cater to a diverse range of projects, both
                            locally in Dallas, Texas, and across the nation. Our
                            roots in Dallas give us a unique understanding of
                            the local terrain and construction needs, allowing
                            us to offer specialized, region-specific solutions
                            right at the heart of Texas. This local expertise,
                            combined with our extensive experience, positions us
                            perfectly to extend our services on a national
                            scale. We harness the same dedication and precision
                            that we apply in our local projects to serve clients
                            across the United States. Our team is equipped to
                            handle the logistical and technical demands of
                            nationwide operations, ensuring the same high
                            standards of quality and reliability, regardless of
                            location. Whether it&apos;s a project in the
                            bustling urban landscape of Dallas or a large-scale
                            operation in another state, S&W Foundation
                            Contractors is committed to delivering excellence in
                            pier drilling, tailored to the unique needs of each
                            project and location.
                          </p>
                          <Image
                            className={styles.infoImageMobile}
                            src="Images/public/IMG_7620.webp"
                            height={300}
                            width={320}
                            alt="S&W Foundations"
                            loading="lazy"
                            quality={80}
                          />
                </div>
              </div>
            </div>
            </FadeIn>
            </FadeInStagger>
            <FadeInStagger>
              <FadeIn>
            <div className={styles.infoBottomMobile}>
              <div className={styles.infoBottomContainerMobile}>
                <div className={styles.infoMobileContent}>
                <h2 className={lato.className}>
                            Bringing Foundation Drilling Solutions to Dallas
                          </h2>
                          <p className={lato.className}>
                            We&apos;re a full service pier drilling contractor
                            with expertise in commercial and industrial
                            foundation projects, large-scale residential
                            developments, tilt-up pier construction,
                            cast-in-place pier networks, and a full range of
                            drilling-related specialties. Beyond these core
                            services, we offer a comprehensive range of
                            drilling-related specialties. This includes but is
                            not limited to soil testing, site analysis, deep
                            foundation drilling, and customized drilling
                            solutions tailored to the specific geotechnical
                            needs of each project. Our team is adept at
                            navigating the intricacies of different soil types
                            and environmental conditions, ensuring optimal
                            foundation solutions irrespective of the
                            project&apos;s complexity or scale. Our commitment
                            to innovation and staying abreast of the latest
                            industry advancements allows us to offer our clients
                            cutting-edge solutions in pier drilling and
                            foundation construction. Whether it&apos;s a
                            challenging industrial project requiring precise and
                            deep drilling, or a residential development seeking
                            a reliable foundation, our goal is to provide
                            top-tier service and results that not only meet but
                            exceed expectations. With S&W Foundation
                            Contractors, clients are assured of a partner that
                            brings expertise, experience, and excellence to
                            every project.
                          </p>
                          <Image
                            className={styles.infoImageMobile}
                            src="Images/public/IMG_7653.webp"
                            height={300}
                            width={320}
                            alt="S&W Foundations"
                            loading="lazy"
                            quality={80}
                          />
                </div>
              </div>
            </div>
            </FadeIn>
            </FadeInStagger>
          </div>
        </div>
      </section>
    </Container>
  );
}
function ServicesSection() {
  return (
    <Container>
      <div className={styles.servicesSection}>
        <div className={styles.servicesContainer}>
          <div className={styles.servicesWrapper}>
            <div className={styles.servicesLeft}>
              <div className={styles.serviceLeftContainer}>
                <div className={styles.serviceLeftWrapper}>
                  <div className={styles.serviceLeftTop}>
                    <div className={styles.serviceLeftTopContainer}>
                      <h3 className={inter.className}>Pier Drilling</h3>
                      <Link href="/pier-drilling">
                        <button className={montserrat.className}>
                          Learn More
                        </button>
                      </Link>
                    </div>
                  </div>
                  <div className={styles.serviceLeftBottom}>
                    <div className={styles.serviceLeftBottomContainer}>
                      <h3 className={inter.className}>
                        Limited-Access Drilling
                      </h3>
                      <Link href="/limited-access">
                        <button className={montserrat.className}>
                          Learn More
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.servicesCenter}>
              <div className={styles.serviceCenterContainer}>
                <h3 className={inter.className}>About Us</h3>
                <Link href="/about">
                  <button className={montserrat.className}>Learn More</button>
                </Link>
              </div>
            </div>
            <div className={styles.servicesRight}>
              <div className={styles.serviceRightContainer}>
                <div className={styles.serviceRightWrapper}>
                  <div className={styles.serviceRightTop}>
                    <div className={styles.serviceRightTopContainer}>
                      <h3 className={inter.className}>
                        Turn-Key Drilling Solutions
                      </h3>
                      <Link href="/turn-key">
                        <button className={montserrat.className}>
                          Learn More
                        </button>
                      </Link>
                    </div>
                  </div>
                  <div className={styles.serviceRightBottom}>
                    <div className={styles.serviceRightBottomContainer}>
                      <h3 className={inter.className}>Careers</h3>
                      <Link href="/careers#jobPostings">
                        <button className={montserrat.className}>
                          Learn More
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
function ContactSection() {
  return (
    <div className={styles.contactSection}>
      <div className={styles.contactContainer}>
        <div className={styles.contactWrapper}>
          <FadeIn>
            <div className={styles.map}>
              <h2 className={lato.className}>
                Get Your Free Quote Today and Let S&amp;W Take Your Next Project
                To New Depths
              </h2>
              <Link href="/contact">
                <button className={lato.className}>Contact Us</button>
              </Link>
            </div>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}

export default function Home({ data }) {
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
       {/* <Script
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
      </Script>  */}

      <div className={styles.main}>
        <section className={styles.hero}>
          <HeroSection />
        </section>

        <section className={styles.info}>
          <InfoSection />
          <InfoSectionMobile />
        </section>
        <section className={styles.services}>
          <ServicesSection />
          <GridPattern className={styles.gridPattern} yOffset={0} interactive />
        </section>
        <section className={styles.contact}>
          <ContactSection />
        </section>
      </div>
    </>
  );
}

export async function getServerSideProps({ req, res }) {
  // const data = await handler();
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=31536000, stale-while-revalidate"
  );

  return {
    props: {},
  };
}
