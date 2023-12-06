import Head from 'next/head';
import Image from 'next/image';
import styles from '@/styles/Home.module.css';
// import Hero from '@/components/Hero';
// import Info from '@/components/Info';
// import Grid from '@/components/Grid';
// import SocialGrid from '@/components/SocialGrid';
import handler from '../pages/api/gridData';
import Script from 'next/script';
import { GridPattern } from '@/components/GridPattern';
import { Container } from '@/components/Container';
import { FadeIn } from '@/components/FadeIn';
import { Inter } from "next/font/google";
// import { Container } from '@/components/Container';

const inter = Inter({ subsets: ["latin"] });
const LogoImage = () => (
  <Image
    className={styles.logo}
    src='/att.png'
    height={300}
    width={300}
    alt='S&amp;W Foundations Logo'
    loading='lazy'
    quality={80}
  />
);
function HeroSection () {
  return(
    <section className={styles.heroSection}>
        <div className={styles.heroContainer}>
          <div className={styles.heroWrapper}>
            <div className={styles.heroLeft}>
           <h1>Left</h1>
            </div>
            <div className={styles.heroCenter}>
            <div className={styles.heroContent}>
          <h1 className={inter.className}>S&amp;W Foundation Contractors</h1>
          <h2 className={inter.className}>Commercial Pier Drilling</h2>
          <span><button>Contact Us Today</button><button>Join Our Team</button></span>
        </div>
            </div>
            <div className={styles.heroRight}>
              {/* <span>
              <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3349.8883093482623!2d-96.57852562368612!3d32.90112117763211!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x864ea800d0cccb39%3A0x3140a4ce8b0e4e7!2s2806%20Singleton%20St%2C%20Rowlett%2C%20TX%2075088!5e0!3m2!1sen!2sus!4v1701818848986!5m2!1sen!2sus"  allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade" style={{width:'500px', height:'480px'}}></iframe>
              </span> */}
            </div>
          </div>
        </div>
       
        </section>
  )
}

function ServicesSection () {
  return (
  <Container>
    <FadeIn>
      <div className={styles.servicesSection}>
        <div className={styles.servicesContainer}>
          <div className={styles.servicesWrapper}>
            <div className={styles.servicesLeft}>
              <div className={styles.serviceLeftContainer}>
                <div className={styles.serviceLeftWrapper}>
                  <div className={styles.serviceLeftTop}>
                    <h3 className={inter.className}>Pier Drilling</h3>
                    <details>
                      <summary className={inter.className}>Click me</summary>
                      <p className={inter.className}>Here&apos;s some content to show when you click the button.</p>
                    </details>
                  </div>
                  <div className={styles.serviceLeftBottom}>
                  <h3 className={inter.className}>Limited-Access Drilling</h3>
                    <details>
                      <summary className={inter.className}>Click me</summary>
                      <p className={inter.className}>Here&apos;s some content to show when you click the button.</p>
                    </details>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.servicesCenter}>
            <h3 className={inter.className}>About Us</h3>
                    <details>
                      <summary className={inter.className}>Click me</summary>
                      <p className={inter.className}>Here&apos;s some content to show when you click the button.</p>
                    </details>
            </div>
            <div className={styles.servicesRight}>
              <div className={styles.serviceRightContainer}>
                <div className={styles.serviceRightWrapper}>
                  <div className={styles.serviceRightTop}>
                  <h3 className={inter.className}>Turn-Key Drilling Solutions</h3>
                    <details>
                      <summary className={inter.className}>Click me</summary>
                      <p>Here&apos;s some content to show when you click the button.</p>
                    </details>
                  </div>
                  <div className={styles.serviceRightBottom}>
                  <h3 className={inter.className}>All Services</h3>
                    <details>
                      <summary className={inter.className}>Click me</summary>
                      <p className={inter.className}>Here&apos;s some content to show when you click the button.</p>
                    </details>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FadeIn>
  </Container>
)
  }

  function SpacerSection () {
    return (
      <div className={styles.spacerSection}>
        <GridPattern
            className={styles.gridPattern}
            yOffset={-96}
            interactive
          />
      </div>
    )
  }


export default function Home({ data}) {
  const businessSchema = {
    "@context": "http://schema.org",
    "@type": "LocalBusiness",
    "name": "S&W Foundation Contractors Inc.",
    "description": "S&W Foundations specializes in laying strong foundations for new commercial construction projects. With a focus on innovation and durability, our team ensures the groundwork for your venture is set to the highest standards. We cater exclusively to commercial clients and do not offer foundation repair or residential services.",
    "image": "http://www.swfoundation.com/swlogorwb.png",
    "telephone": "(214) 703-0484",
    "email": "bids@swfoundation.com",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "2806 Singleton St.",
      "addressLocality": "Rowlett",
      "addressRegion": "TX",
      "postalCode": "75088",
      "addressCountry": "USA"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "32.90144",
      "longitude": "-96.57587"
    },
    "url": "http://www.swfoundation.com",
    "paymentAccepted": "Cash, Credit Card",
    "openingHours": "Mo,Tu,We,Th,Fr 08:00-17:00",
    "sameAs": [
      "http://www.facebook.com/SWFoundationContractors",
      "http://www.linkedin.com/company/s-w-foundation-contractors-inc",
    ]
  };


  return (
    <>
     <Head>
    <title>S&amp;W Foundation | Leading Commercial Pier Drilling &amp; Construction Services in Dallas, TX</title>
    <meta name="description" content="S&amp;W Foundation, based in Dallas, TX, offers premier commercial pier drilling, crane, trucking, and turnkey construction solutions. With unparalleled experience, top-tier equipment, and a stellar safety record, we&apos;re your trusted partner for commercial construction support in the US." />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="google-site-verification" content="DOxscx8m8UxfwG_v4MKHOndXU19gJHMMVf5cvy5V46c" />
    <meta property="og:title" content="S&amp;W Foundation | Expert Commercial Construction &amp; Pier Drilling in Dallas, TX" />
    <meta property="og:description" content="From commercial pier drilling to turnkey construction solutions, S&amp;W Foundation stands as the go-to choice for businesses across the US. Discover our legacy of excellence." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://www.swfoundation.com/" />
    <meta property="og:image" content="https://www.swfoundation.com/images/logo.png" />
    <meta name="keywords" content="commercial pier drilling, construction services, Dallas, TX, S&W Foundation, crane services, trucking services, turnkey construction, trusted partner, commercial construction support, US, top-tier equipment, safety record" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="S&amp;W Foundation | Dallas, TX&apos;s Premier Commercial Construction Partner" />
    <meta name="twitter:description" content="Expertise in commercial pier drilling, crane &amp; trucking services, and more. See why businesses trust S&amp;W Foundation for their construction needs." />
    <meta name="twitter:image" content="https://www.swfoundation.com/images/logo.png" />
    <link rel="canonical" href="https://www.swfoundation.com/" />
    <link rel="icon" href="/android-chrome-512x512.png" type='image/x-icon'/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }} />
</Head>
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



      <div className={styles.main}>
        <section className={styles.hero}><HeroSection /></section>
        <section className={styles.info}><SpacerSection /></section>
        <section className={styles.services}><ServicesSection /></section>
      
        
        
          
         
        {/* <section style={{ marginBottom: 5 }} className={styles.info}><Info /></section>
        <section className={styles.gridSection}><Grid data={data} /></section>
        <div className={styles.break1}></div>
        <div className={styles.image}>
          <LogoImage />
        </div>
        <br />
        <div className={styles.break2}></div>
        <section className={styles.socialG}><SocialGrid /></section> */}
       
        

      </div>
    </>
  );
}

export async function getServerSideProps() {
  const data = await handler();

  return {
    props: {  data }
  };
}
