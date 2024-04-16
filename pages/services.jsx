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
                         S&amp;W Foundation Contractors speacilizes in providing high quality pier drilling 
                         services for all types of commercial and industrial foundation projects. Our experienced
                         and knowledgeable team utilize state-of-the-art equipment to deliver robust pier solutions tailored to your 
                         exact specifiations and site conditions. You can trust our drilling experts to assess the site, recommend a suitable 
                         pier foundation system, and execute the instiallation plan effciently and safely. We stay current on the latest engineering best practices 
                         and technologies in the pier drilling industryso we can adapt to complex projects with innovative techniques and solutions.
                      </p>
                      <Link className={styles.infoBtn} href="/pier-drilling">Learn More</Link>
                    </div>
                  </div>
                  <div className={styles.infoTopRight}>
                    <Image
                      className={styles.infoImage}
                      src="Images/public/preperation.webp"
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
                        Many commercial construction projects require drilling piers in hard-to-access areas
                        with space constraints or obstacles. S&amp;W Foundation Contractors specializes in Limited-Access Pier Drilling using advanced techniques and equipment to overcome complex site conditions.
                        our experienced crews are highly trained to perform safe, effecient pier installation in the tightest spots.
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
                      Turn-Key Drilling Solutions stands at the forefront of providing comprehensive drilling services tailored to the unique needs 
                      of each project. Our expertise encompasses a full range of drilling requirements, from initial site assessment to the completion 
                      of complex drilling operations. With a focus on delivering all-inclusive, ready-to-implement solutions, we equip our clients with 
                      the convenience and efficiency of a single-source provider. Our team, armed with state-of-the-art technology and extensive industry 
                      knowledge, ensures precision, reliability, and timely execution. We pride ourselves on our ability to navigate challenging environments 
                      and deliver top-notch results, making Turn-Key Drilling Solutions the go-to choice for clients seeking efficient, high-quality drilling 
                      operations from start to finish.
                      </p>
                      <Link className={styles.infoBtn} href="/turn-key">Learn More</Link>
                    </div>
                  </div>
                  <div className={styles.infoTopRight}>
                    <Image
                      className={styles.infoImage}
                      src="Images/public/indacut.webp"
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
                      Our Crane Services offer unparalleled support for projects requiring high-level lifting and material handling. 
                      We specialize in providing a comprehensive range of crane solutions, tailored to meet the specific demands of 
                      each unique project. Our fleet, equipped with state-of-the-art cranes, is capable of handling a diverse array 
                      of lifting tasks, from the delicate placement of structural components to the heavy lifting of industrial equipment. 
                      Safety, precision, and efficiency are at the core of our operations. Our team of certified operators and technicians 
                      are rigorously trained and adhere to stringent safety standards, ensuring each lift is conducted with utmost precision 
                      and care. With a commitment to adaptability and reliability, our Crane Services are designed to tackle the most challenging 
                      tasks, ensuring your project&apos;s success with seamless, safe, and effective lifting solutions.
                        </p>
                        <Link className={styles.infoBtn} href="/crane">Learn More</Link>
                    </div>
                  </div>
                  <div className={styles.infoTopRightC}>
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


export default function Services() {
  return (
    <>
    
    <Head>
    <title>Services | S&amp;W Foundation - Comprehensive Pier Drilling Services in Dallas, TX. From Turn-Key to Drilled Piers, We Do It All!</title>
    <meta name="description" content="S&amp;W Foundation offers a suite of specialized services in Dallas, TX: pier drilling, limited-access pier drilling, turnkey solutions, crane, and trucking services. Leveraging years of experience and cutting-edge equipment, we&apos;re your trusted partner in commercial construction support." />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="keywords" content="pier drilling, limited-access pier drilling, crane services, trucking services, turnkey solutions, caisson, slurry" />
    <meta property="og:title" content="Services | S&amp;W Foundation - Your Partner in Commercial Construction in Dallas, TX" />
    <meta property="og:description" content="Discover S&amp;W Foundation&apos;s range of services: from expert pier drilling to crane and trucking solutions, we cater to all your commercial construction needs in the US." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://www.swfoundation.com/services/" />
    <meta property="og:image" content="https://edycymyofrowahspzzpg.supabase.co/storage/v1/object/public/Images/public/galleryImages/gal18.webp?t=2024-04-16T20%3A33%3A07.478Z" />
    <meta property='og:site_name' content='S&amp;W Commercial Pier Drilling Contractors' />
    <link rel="icon" href="/android-chrome-512x512.png" type='image/x-icon'/>
</Head>

     
    <div className={styles.service}>
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
  )
}
