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
    <div className={styles.heroSectionCV}>
      <div className={styles.heroContainer}>
        <div className={styles.heroWrapper}>
          <h1 className={lato.className}>Core Values</h1>
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
                      D.R.I.L.L.
                      </h2>
                      <p className={lato.className}>
                         S&amp;W Foundation Contractors is committed to delivering the highest quality drilling services to our customers. Our core values are the foundation of our business and guide our team in everything we do. We are dedicated to providing our customers with the best possible service and ensuring that every project is completed on time and within budget. Our core values are:
                         <br></br><br></br><b>Deditcated | Resilient | Impactful | Learners | Leaders </b>
                      </p>
                    </div>
                  </div>
                  <div className={styles.infoTopRight}>
                    <Image
                      className={styles.infoImage}
                      src="Images/public/coreValue.webp"
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
        <h3 className={lato.className}>United By Our Core Values...</h3>
        <div className={styles.contentContainer}>
          <article className={styles.articleContent}>
            <p className={lato.className}>
            At S&amp;W Foundation Contractors, our core values are not just words on a page; they are the bedrock upon which our company stands. These guiding principles have profoundly impacted our organization in countless positive ways, influencing every aspect of our operations. From fostering a culture of integrity and excellence to driving innovation and collaborative teamwork, our core values have been instrumental in shaping a cohesive, high-performing team. They ensure that we not only meet but exceed our clients&apos; expectations, building trust and establishing long-term relationships. Moreover, our commitment to these values has attracted top talent who are aligned with our mission, further fueling our success and growth. By embedding these core values into every action and decision, S&W Foundation Contractors has cultivated a strong, resilient company culture that is a testament to the power of principled business practice. This dedication to our core values has not only set us apart in the industry but has also paved the way for sustainable success and a legacy of positive impact.
             
            </p>
          </article>
        </div>
        <span className={styles.btns}>
            <Link className={styles.infoBtn1} href="/services">Services</Link>
            <Link  className={styles.infoBtn2} href="/about">About Us</Link>
          </span>
      </div>
    </div>
  </div>
    );
}

const CoreValues = () => {
  return (
    <>
    <Head>
    <title>Core Values | S&amp;W Foundation - Comprehensive Pier Drilling, Auger Cast, Caisson &amp; Slurry Piers in Dallas, TX</title>
    <meta name="description" content="At S&amp;W Foundation, our core values of Dedication, Resilience, Impact, Learning, and Leadership guide our commitment to excellence in drilling services." />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="keywords" content="core values, dedication, resilience, impact, learning, leadership, drilling services" />
    <meta property="og:title" content="Core Values | S&amp;W Foundation - Your Partner in Commercial Construction in Dallas, TX" />
    <meta property="og:description" content="Discover S&amp;W Foundation&apos;s range of services: from expert pier drilling to crane and trucking solutions, we cater to all your commercial construction needs in the US." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://www.swfoundation.com/core-values" />
    <meta property="og:image" content="https://edycymyofrowahspzzpg.supabase.co/storage/v1/object/public/Images/public/coreValue.webp" />
    <meta property='og:site_name' content='S&amp;W Commercial Pier Drilling Contractors'/>
    <link rel="canonical" href="https://www.swfoundation.com/core-values" />
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

export default CoreValues;
