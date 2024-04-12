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
    <div className={styles.heroSectionLD}>
      <div className={styles.heroContainer}>
        <div className={styles.heroWrapper}>
          <h1 className={lato.className}>Limited-Access Pier Drilling</h1>
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
                      Limited-Access Pier Drilling Experts
                      </h2>
                      <p className={lato.className}>
                         S&amp;W Foundation Contractors maintains a fleet of 23 cutting-edge drill rigs, enabling us to adeptly manage limited access drilling operations across a wide range of project specifications and complexities. Our sophisticated drilling technology guarantees the creation of foundations that are robust, stable, and designed to endure over time.
                      </p>
                    </div>
                  </div>
                  <div className={styles.infoTopRight}>
                    <Image
                      className={styles.infoImage}
                      src="Images/public/Pratt3.webp"
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
        <h3 className={lato.className}>We use our expertise innovate to overcome obstacles...</h3>
        <div className={styles.contentContainer}>
          <article className={styles.articleContent}>
            <p className={lato.className}>
              When it comes to Limited-Access Pier Drilling, S&amp;W Foundation Contractors is the industry leader. 
              Our team of experts is equipped with the knowledge, experience, and cutting-edge equipment necessary 
              to tackle even the most challenging drilling projects. We specialize in providing comprehensive drilling 
              solutions for projects with limited access, ensuring that each foundation is solid, stable, and built to last. 
              With a focus on safety, efficiency, and quality, we are committed to delivering exceptional results that meet and 
              exceed our clients expectations. Contact us today to learn more about our Limited-Access Pier Drilling services and 
              how we can help you with your next project.
            </p>
          </article>
        </div>
        <span className={styles.btns}>
            <Link className={styles.infoBtn1} href="/pier-drilling">Pier Drilling</Link>
            <Link  className={styles.infoBtn2} href="/turn-key">Turn-Key</Link>
          </span>
      </div>
    </div>
  </div>
    );
}

const LimtedAccess = () => {
  return (
    <>
    <Head>
    <title>Services | S&amp;W Foundation - Comprehensive Pier Drilling &amp; Construction Support in Dallas, TX</title>
    <meta name="description" content="S&amp;W Foundation offers a suite of specialized services in Dallas, TX: pier drilling, limited-access pier drilling, turnkey solutions, crane, and trucking services. Leveraging years of experience and cutting-edge equipment, we&apos;re your trusted partner in commercial construction support." />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="keywords" content="pier drilling, limited-access pier drilling, crane services, trucking services, turnkey solutions, caisson, slurry" />
    <meta property="og:title" content="Services | S&amp;W Foundation - Your Partner in Commercial Construction in Dallas, TX" />
    <meta property="og:description" content="Discover S&amp;W Foundation&apos;s range of services: from expert pier drilling to crane and trucking solutions, we cater to all your commercial construction needs in the US." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://www.swfoundation.com/services/" />
    <meta property="og:image" content="https://www.swfoundation.com/images/galleryImages/gal18.jpeg" />
    <meta property='og:site_name' content='S&amp;W Commercial Construction Support' />
    <link rel="canonical" href="https://www.swfoundation.com/services" />
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

export default LimtedAccess;
