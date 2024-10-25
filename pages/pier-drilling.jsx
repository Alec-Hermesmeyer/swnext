import React from 'react';
import styles from '../styles/Individual.module.css'
import Link from "next/link";
import Image from "next/image";
import Head from "next/head";
import { Inter } from "next/font/google";
import { Oswald } from "next/font/google";
import { Montserrat } from "next/font/google";
import { Lato } from "next/font/google";
import { FadeIn } from "@/components/FadeIn";


const inter = Inter({ subsets: ["latin"] });
const oswald = Oswald({ subsets: ["latin"] });
const montserrat = Montserrat({ subsets: ["latin"] });
const lato = Lato({ weight: ["900"], subsets: ["latin"] });

function Hero() {
  return (
    <div className={styles.heroSectionPD}>
      <div className={styles.heroContainer}>
        <div className={styles.heroWrapper}>
          <h1 className={lato.className}>Pier Drilling</h1>
          <span>
            <Link className={styles.heroLink} href="/contact">
              Contact Us
            </Link>
            <Link className={styles.heroLink} href="/careers">
              Careers
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}
function InfoSection() {
  return (
    <div className={styles.infoSection}>
      <div className={styles.infoContainer}>
        <div className={styles.infoWrapper}>
          <FadeIn>
            <div className={styles.infoTop}>
              <div className={styles.infoTopContainer}>
                <div className={styles.infoTopWrapper}>
                  <div className={styles.infoTopLeft}>
                    <div className={styles.infoTopLeftContainer}>
                      <h2 className={lato.className}>
                       State of the Art Equipment
                      </h2>
                      <p className={lato.className}>
                         S&amp;W Foundation Contractors operates a fleet of 23 state-of-the-art drill rigs, allowing us to effeciently handle drilling operations for projects of all speacilizesand complexities. Our Advanced drilling equipment ensures that each foundation is solid, stable and capable of withstanding the test of time.
                      </p>
                    </div>
                  </div>
                  <div className={styles.infoTopRight}>
                    <Image
                      className={styles.infoImage}
                      src="Images/public/redrig.webp"
                      height={380}
                      width={410}
                      alt="S&W Foundations"
                      loading="lazy"
                      quality={80}
                    />
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}

function ArticleSection() {
  return (
  <div className={styles.articleSection}>
    <div className={styles.articleContainer}>
      <div className={styles.articleWrapper}>
        <h3 className={lato.className}>We set the standard and innovate to overcome obstacles...</h3>
        <div className={styles.contentContainer}>
          <article className={styles.articleContent}>
            <p className={lato.className}>
              We are the leaders in Commercial Pier Drilling for good reason! We deliver comprehensive Pier Drilling Solutions for major construction
              projects across the United States. Our project management approach utilizes advanced technologies to drive efficiency and productivty onsite.
              We invest in state of the art hydraulic rotary drills, auger cast pile rigs, and excavator mounted equipment to execute pier installation rapidly
              and accurately. Our crews apply innovative drilling techniques and sequences tailored for specific soil conditions and project needs. Customers turn 
              to us because the know we will deliver robust pier foundations that provide the load-bearing capacity required, even in challeging ground conditions.
              Our specialized expertise in caisson, pile, micropile and helix pier construction provides deep foundation solutions enginnered for safety and longevity.
              Whether it&apos;s constructing a high-rise core on friction piles, securing a hillside on caisson secant walls, or anchoring a tank farm on helical piers, you can count 
              on us to deliver. Contact us today to learn more about our comprehensive portfolio of Commercial Pier Drilling Services.
            </p>
          </article>
        </div>
        <span className={styles.btns}>
            <Link className={styles.infoBtn1} href="/services">Services</Link>
            <Link  className={styles.infoBtn2} href="/limited-access">Limited-Access</Link>
          </span>
      </div>
    </div>
  </div>
    );
}

const PierDrilling = () => {
  return (
    <>
    <Head>
    <title>Pier Drilling | S&amp;W Foundation - Comprehensive Pier Drilling, Auger Cast, Caisson &amp; Slurry Piers in Dallas, TX</title>
    <meta name="description" content="S&amp;W Foundation provides expert Pier Drilling services in Dallas, TX, including limited-access drilling, turnkey solutions, and more. Trust us for your commercial construction needs." />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="keywords" content="pier drilling, limited-access pier drilling, crane services, trucking services, turnkey solutions, caisson, slurry" />
    <meta property="og:title" content="Pier Drilling Services | S&amp;W Foundation - Your Partner in Commercial Construction in Dallas, TX" />
    <meta property="og:description" content="Discover S&amp;W Foundation&apos;s range of services: from expert pier drilling to crane and trucking solutions, we cater to all your commercial construction needs in the US." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://www.swfoundation.com/pier-drilling" />
    <meta property="og:image" content="https://edycymyofrowahspzzpg.supabase.co/storage/v1/object/public/Images/public/newimages/IMG_8084.webp" />
    <meta property='og:site_name' content='S&amp;W Commercial Pier Drilling Contractors'/>
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
    <link rel="canonical" href="https://www.swfoundation.com/pier-drilling" />
    <link rel="icon" href="/android-chrome-512x512.png" type='image/x-icon'/>
</Head>

    <div className={styles.page}>
      <section className={styles.hero}>
        <Hero />
      </section>
      <section className={styles.info}>
          <InfoSection />
      </section>
      <section className={styles.article}>
          <ArticleSection />
      </section>
    </div>
    </>
  );
};

export default PierDrilling;
