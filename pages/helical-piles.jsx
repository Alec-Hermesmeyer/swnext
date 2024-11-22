import React from 'react';
import styles from '../styles/Individual.module.css';
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
    <div className={styles.heroSectionHP}>
      <div className={styles.heroContainer}>
        <div className={styles.heroWrapper}>
          <h1 className={lato.className}>Helical Piles</h1>
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
                      <h2 className={lato.className}>Innovative Helical Pile Solutions</h2>
                      <p className={lato.className}>
                        At S&amp;W Foundation Contractors, we specialize in helical pile installation for a wide variety of construction projects. Helical piles provide exceptional load-bearing capacity with minimal environmental impact, making them ideal for challenging soil conditions and limited-access areas. Our team leverages advanced equipment and techniques to deliver precision and efficiency on every project.
                      </p>
                    </div>
                  </div>
                  <div className={styles.infoTopRight}>
                    <Image
                      className={styles.infoImage}
                      src="Images/public/Pratt3.webp"
                      height={380}
                      width={410}
                      alt="Helical Piles"
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
            <h3 className={lato.className}>Setting New Standards in Helical Pile Installation</h3>
            <div className={styles.contentContainer}>
              <article className={styles.articleContent}>
                <p className={lato.className}>
                  Helical piles are a versatile and efficient deep foundation solution, offering rapid installation with minimal vibration and noise. 
                  They are ideal for commercial construction projects requiring stable foundations in challenging soil conditions. 
                  S&amp;W Foundation Contractors specializes in delivering precision and reliability for large-scale projects, ensuring long-lasting performance.
                  <br />
                  <br />
                  As a full-service subcontractor, S&amp;W Foundation handles every aspect of the process—from hauling our own state-of-the-art equipment 
                  to utilizing our in-house crane fleet for seamless installation. Our experienced team is equipped to meet the demands of even the 
                  most complex commercial projects, providing robust and efficient foundation solutions tailored to your specific needs.
                  <br />
                  <br />
                  Contact us today to learn more about how our helical pile services can support your commercial construction project.
                </p>
              </article>
            </div>
            <span className={styles.btns}>
              <Link className={styles.infoBtn1} href="/services">Services</Link>
              <Link className={styles.infoBtn2} href="/contact">Contact Us</Link>
            </span>
          </div>
        </div>
      </div>
    );
  }
  

const HelicalPiles = () => {
  return (
    <>
      <Head>
        <title>Helical Piles | S&amp;W Foundation - Reliable Deep Foundation Solutions</title>
        <meta name="description" content="S&amp;W Foundation offers expert helical pile installation for challenging soil conditions and limited-access areas. Learn more about our innovative solutions." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="keywords" content="helical piles, deep foundation solutions, limited-access drilling, construction" />
        <link rel="canonical" href="https://www.swfoundation.com/helical-piles" />
        <link rel="icon" href="/android-chrome-512x512.png" type="image/x-icon" />
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

export default HelicalPiles;
