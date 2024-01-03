import React from 'react'
import styles from '../styles/Serve.module.css'
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
          <h1 className={lato.className}>Services</h1>
          <span>
            <Link className={styles.heroLink} href="/contact">
              Contact Us
            </Link>
            <Link className={styles.heroLink} href="/safety">
              Safety
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
                        Pier Drilling
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
                      <Link className={styles.infoBtn} href="/pier-drilling">Learn More</Link>
                    </div>
                  </div>
                  <div className={styles.infoTopRight}>
                    <Image
                      className={styles.infoImage}
                      src="Images/public/home.webp"
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
                        Limited-Access Pier Drilling
                      </h2>
                      <p className={lato.className}>
                        At S&W Foundation Contractors, we aim to be your your one-stop shop for all of your pier drilling needs. With over 30 years experience in the indusry, we offer comprehensive drilling services
                        for commercial and industrial projects across the United States. Whether you require supplementary labor or a complete product we offer a wide range of services delivered by our versatile and experienced team, backed 
                        by our state of the art fleet. Trust us to provide reliable, efficient, and cost-effective solutions to meet your drilling needs. 
                        <br></br><strong>Your hole is our goal!</strong>
                      </p>
                      <Link className={styles.infoBtn} href="/limited-access">Learn More</Link>
                    </div>
                  </div>
                  <div className={styles.infoTopRightC}>
                    <Image
                      className={styles.infoImage}
                      src="Images/public/prat1e.webp"
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
                        Turn-Key Drilling Solutions
                      </h2>
                      <p className={lato.className}>
                        S&W Foundation Contractors, is a name you can trust for all of your pier drilling needs.
                        Our team of experienced professionals are equipped with the latest technolgy and techniques
                        to provide innovative drilling solutions tailored to your specific requirements. 
                        We take pride in operating one of the largest fleets of limited access pier drilling equipment in the United States,
                        ensuring that we have the right tools and equipment for any job, no matter how complex. 
                        Our commitment to safety and efficiency in every project means you can rely on us to deliver high-quality drilling services that
                        exceed all expectations.
                      </p>
                      <Link className={styles.infoBtn} href="/turn-key">Learn More</Link>
                    </div>
                  </div>
                  <div className={styles.infoTopRight}>
                    <Image
                      className={styles.infoImage}
                      src="Images/public/1703009714442.webp"
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
                       Crane Services
                      </h2>
                      <p className={lato.className}>
                        Since 1986, S&W Foundation Contractors has been a leading family-owned and operated pier drilling
                        company based in Rowlett, Texas, serving clients across the United States. Our commitment to providing
                        reliable and efficient pier drilling services and solutions has earned us a reputation for excellence in the industry.
                        Our team of experts, equipped with the latest drilling technology and equipment, works closely with our clients to ensure their project requirements are met
                        with precision and efficiency. From Limited Access Pier Drilling to soil retention and crane services, we offer a wide range of drilling solutions to meet your specific needs.
                        </p>
                        <Link className={styles.infoBtn} href="/crane">Learn More</Link>
                    </div>
                  </div>
                  <div className={styles.infoTopRightC}>
                    <Image
                      className={styles.infoImage}
                      src="Images/public/IMG_7621.webp"
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


export default function Services() {
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

     
    <div className={styles.service}>
    <section className={styles.hero}>
          <Hero />
        </section>
        <section className={styles.info}>
          <InfoSection />
        </section>
    </div>
    </>
  )
}
