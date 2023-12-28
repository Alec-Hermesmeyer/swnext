import React from "react";
import styles from "../styles/About.module.css";
import Link from "next/link";
import Image from "next/image";
import Head from "next/head";
import { Inter } from "next/font/google";
import { Oswald } from "next/font/google";
import { Montserrat } from "next/font/google";
import { Lato } from "next/font/google";
import { FadeIn } from "@/components/FadeIn";
// import { Container } from '@/components/Container';

const inter = Inter({ subsets: ["latin"] });
const oswald = Oswald({ subsets: ["latin"] });
const montserrat = Montserrat({ subsets: ["latin"] });
const lato = Lato({ weight: ["900"], subsets: ["latin"] });

function Hero() {
  return (
    <div className={styles.heroSection}>
      <div className={styles.heroContainer}>
        <div className={styles.heroWrapper}>
          <h1 className={lato.className}>About Us</h1>
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
                        The Leaders In Drilling Never Stop
                      </h2>
                      <p className={lato.className}>
                        At S&W Foundation Contractors, our story is one of
                        family, hard work, and dedication. Founded in 1986 in
                        Rowlett Texas, our business has grown to become a leader
                        in the pier drilling industry, with a reputation for
                        providing reliable, high-quality solutions to our
                        clients across the United States. Today, we remain a
                        family-owned and operated business, with a commitment to
                        upholding the values of honesty, integrity , and
                        excellence that have been at the core of our success for
                        over 35 years. From our state of the art equipment to
                        our team of experienced professionals, every aspect of
                        our business is designed to meet the needs of clients
                        and exceed their expectations.
                      </p>
                    </div>
                  </div>
                  <div className={styles.infoTopRight}>
                    <Image
                      className={styles.infoImage}
                      src="Images/public/galleryImages/gal21.jpeg"
                      height={380}
                      width={430}
                      alt="S&W Foundations"
                      loading="lazy"
                      quality={80}
                    />
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
          <FadeIn>
            <div className={styles.infoCenter}>
              <div className={styles.infoTopContainer}>
                <div className={styles.infoTopWrapperC}>
                  <div className={styles.infoTopLeftC}>
                    <div className={styles.infoTopLeftContainerC}>
                      <h2 className={lato.className}>
                        The Leaders In Drilling Never Stop
                      </h2>
                      <p className={lato.className}>
                        At S&W Foundation Contractors, our story is one of
                        family, hard work, and dedication. Founded in 1986 in
                        Rowlett Texas, our business has grown to become a leader
                        in the pier drilling industry, with a reputation for
                        providing reliable, high-quality solutions to our
                        clients across the United States. Today, we remain a
                        family-owned and operated business, with a commitment to
                        upholding the values of honesty, integrity , and
                        excellence that have been at the core of our success for
                        over 35 years. From our state of the art equipment to
                        our team of experienced professionals, every aspect of
                        our business is designed to meet the needs of clients
                        and exceed their expectations.
                      </p>
                    </div>
                  </div>
                  <div className={styles.infoTopRightC}>
                    <Image
                      className={styles.infoImage}
                      src="Images/public/galleryImages/gal21.jpeg"
                      height={380}
                      width={430}
                      alt="S&W Foundations"
                      loading="lazy"
                      quality={80}
                    />
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
          <FadeIn>
            <div className={styles.infoBottom}>
              <div className={styles.infoTopContainer}>
                <div className={styles.infoTopWrapper}>
                  <div className={styles.infoTopLeft}>
                    <div className={styles.infoTopLeftContainer}>
                      <h2 className={lato.className}>
                        The Leaders In Drilling Never Stop
                      </h2>
                      <p className={lato.className}>
                        At S&W Foundation Contractors, our story is one of
                        family, hard work, and dedication. Founded in 1986 in
                        Rowlett Texas, our business has grown to become a leader
                        in the pier drilling industry, with a reputation for
                        providing reliable, high-quality solutions to our
                        clients across the United States. Today, we remain a
                        family-owned and operated business, with a commitment to
                        upholding the values of honesty, integrity , and
                        excellence that have been at the core of our success for
                        over 35 years. From our state of the art equipment to
                        our team of experienced professionals, every aspect of
                        our business is designed to meet the needs of clients
                        and exceed their expectations.
                      </p>
                    </div>
                  </div>
                  <div className={styles.infoTopRight}>
                    <Image
                      className={styles.infoImage}
                      src="Images/public/galleryImages/gal21.jpeg"
                      height={380}
                      width={430}
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

export default function About() {
  return (
    <>
      <Head>
        <title>
          About S&W Foundation | Commercial Pier Drilling Specialists in Dallas,
          TX
        </title>
        <meta
          name="description"
          content="S&W Foundation specializes in commercial pier drilling for new construction projects across Dallas, TX and beyond. Rely on S&W for unmatched expertise, top-tier equipment, and paramount safety."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="keywords"
          content="commercial pier drilling, Dallas, TX, construction projects, top-tier equipment, safety, S&W Foundation, new construction, expertise, commitment to excellence"
        />
        <meta
          property="og:title"
          content="About S&W Foundation | Commercial Pier Drilling Specialists in Dallas, TX"
        />
        <meta
          property="og:description"
          content="S&W Foundation offers premier commercial pier drilling services for various projects across the US. Discover our commitment to excellence and safety!"
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.swfoundation.com/about/" />
        <meta
          property="og:image"
          content="https://www.swfoundation.com/images/home.jpeg"
        />
        <meta property="og:site_name" content="S&W Commercial Pier Drilling" />
        <link rel="canonical" href="https://www.swfoundation.com/about" />
        <link
          rel="icon"
          href="/android-chrome-512x512.png"
          type="image/x-icon"
        />
      </Head>
      <div className={styles.about}>
        <section className={styles.hero}>
          <Hero />
        </section>
        <section className={styles.info}>
          <InfoSection />
        </section>
      </div>
    </>
  );
}
