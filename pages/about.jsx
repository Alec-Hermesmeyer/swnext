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
          <span>
            <Link className={styles.heroLink} href="/contact">
              Contact Us
            </Link>
            <Link className={styles.heroLink} href="/core-values">
              Our Culture
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
                      src="Images/public/IMG_7617.webp"
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
                        Pier Drilling Services Tailored To Your Needs
                      </h2>
                      <p className={lato.className}>
                        At S&W Foundation Contractors, we aim to be your your one-stop shop for all of your pier drilling needs. With over 30 years experience in the indusry, we offer comprehensive drilling services
                        for commercial and industrial projects across the United States. Whether you require supplementary labor or a complete product we offer a wide range of services delivered by our versatile and experienced team, backed 
                        by our state of the art fleet. Trust us to provide reliable, efficient, and cost-effective solutions to meet your drilling needs. 
                        <br></br> <br></br><strong>Your hole is our goal!</strong>
                      </p>
                    </div>
                  </div>
                  <div className={styles.infoTopRightC}>
                    <Image
                      className={styles.infoImage}
                      src="Images/public/2rigs1pipe.webp"
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
                        Experience You Can Count On
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
                       Trusted By Clients Nation Wide
                      </h2>
                      <p className={lato.className}>
                        Since 1986, S&W Foundation Contractors has been a leading family-owned and operated pier drilling
                        company based in Rowlett, Texas, serving clients across the United States. Our commitment to providing
                        reliable and efficient pier drilling services and solutions has earned us a reputation for excellence in the industry.
                        Our team of experts, equipped with the latest drilling technology and equipment, works closely with our clients to ensure their project requirements are met
                        with precision and efficiency. From Limited Access Pier Drilling to soil retention and crane services, we offer a wide range of drilling solutions to meet your specific needs.
                        </p>
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
function ContactSection() {
  return (
    <div className={styles.contactSection}>
      <div className={styles.contactContainer}>
        <div className={styles.contactWrapper}>
            
              <FadeIn>
              <div className={styles.map}>
              <h2 className={lato.className}>Get Your Free Quote Today and
                                            Let S&amp;W Take Your Next Project To New Depths
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
          content="https://edycymyofrowahspzzpg.supabase.co/storage/v1/object/public/Images/public/IMG_7297.webp"
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
        <section className={styles.contact}>
          <ContactSection />
        </section>
      </div>
    </>
  );
}
