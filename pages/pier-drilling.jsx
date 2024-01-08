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
    <div className={styles.heroSection}>
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

const PierDrilling = () => {
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
    </div>
    </>
  );
};

export default PierDrilling;
