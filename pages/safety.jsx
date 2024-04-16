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
    <div className={styles.heroSectionSD}>
      <div className={styles.heroContainer}>
        <div className={styles.heroWrapper}>
          <h1 className={lato.className}>Safety</h1>
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
                      Safety
                      </h2>
                      <p className={lato.className}>
                         S&amp;W Foundation Contractors top priority is the safety of our employees, customers, and the general public. We are committed to providing a safe and healthy work environment for all of our employees and subcontractors. Our safety program is designed to meet or exceed all OSHA standards and regulations. We provide ongoing safety training to all employees to ensure that they are up-to-date on the latest safety procedures and best practices. Our safety program includes regular safety meetings, job site inspections, and safety audits to identify and correct potential hazards. We also have a comprehensive safety manual that outlines our safety policies and procedures. At S&amp;W Foundation Contractors, safety is not just a priority, it is a core value that guides everything we do.
                      </p>
                    </div>
                  </div>
                  <div className={styles.infoTopRight}>
                    <Image
                      className={styles.infoImage}
                      src="Images/public/IMG_7642.webp"
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
        <h3 className={lato.className}>Leaving How You Arrived Is The Standard...</h3>
        <div className={styles.contentContainer}>
          <article className={styles.articleContent}>
            <p className={lato.className}>
            S&amp;W Foundation Contractors commitment to safety is our highest priority. We are dedicated to providing a safe and healthy work environment for all of our employees, customers, and the general public. Our safety program is designed to meet or exceed all OSHA standards and regulations. We provide ongoing safety training to all employees to ensure that they are up-to-date on the latest safety procedures and best practices. Our safety program includes regular safety meetings, job site inspections, and safety audits to identify and correct potential hazards. We also have a comprehensive safety manual that outlines our safety policies and procedures. At S&amp;W Foundation Contractors, safety is not just a priority, it is a core value that guides everything we do.
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

const Safety = () => {
  return (
    <>
    <Head>
    <title>Safety | S&amp;W Foundation - Learn About Our Commitment to Safety &amp; How We Set The Industry Standard</title>
    <meta name="description" content="S&amp;W Foundation offers a suite of specialized services in Dallas, TX: pier drilling, limited-access pier drilling, turnkey solutions, crane, and trucking services. Leveraging years of experience and cutting-edge equipment, we&apos;re your trusted partner in commercial construction support." />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="keywords" content="pier drilling, limited-access pier drilling, crane services, trucking services, turnkey solutions, caisson, slurry" />
    <meta property="og:title" content="Services | S&amp;W Foundation - Your Partner in Commercial Construction in Dallas, TX" />
    <meta property="og:description" content="Discover S&amp;W Foundation&apos;s range of services: from expert pier drilling to crane and trucking solutions, we cater to all your commercial construction needs in the US." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://www.swfoundation.com/safety/" />
    <meta property="og:image" content="https://edycymyofrowahspzzpg.supabase.co/storage/v1/object/public/Images/public/newimages/IMG_6437.webp" />
    <meta property='og:site_name' content='S&amp;W Commercial Pier Drilling Contractors' />
    <link rel="canonical" href="https://www.swfoundation.com/safety" />
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

export default Safety;
