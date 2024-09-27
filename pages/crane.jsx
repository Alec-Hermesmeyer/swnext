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
    <div className={styles.heroSectionCD}>
      <div className={styles.heroContainer}>
        <div className={styles.heroWrapper}>
          <h1 className={lato.className}>Crane Services</h1>
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
                      Crane Services
                      </h2>
                      <p className={lato.className}>
                         S&amp;W Foundation Contractors owns and operates a fleet of 6 state of the art crane rigs, and has been leading the way for crane services and construction needs across Texas. We stress the importance of safety and high-quality work to ensure
                         that evert project is completed to the best of our ability, while mitigating risks involved with this line of work. Working with heavy equipment can often present many dangers and challenges,
                         but our years of professional experience make us the best choice for your crane service needs. Contact us today to learn more about our comprehensive portfolio of Crane Services.
                      </p>
                    </div>
                  </div>
                  <div className={styles.infoTopRight}>
                    <Image
                      className={styles.infoImage}
                      src="Images/public/newimages/IMG_6825.webp"
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
        <h3 className={lato.className}>If You Need A Lift, We Have Got You Covered...</h3>
        <div className={styles.contentContainer}>
          <article className={styles.articleContent}>
            <p className={lato.className}>
              Clients entrust us for our proven ability to provide robust lifting solutions, regardless of complexity. Our specialized
              expertise spans a wide range, from heavy machinery to construction materials. Our crane services are designed to meet the expecations of the job at hand.
              Our Commitment to Safety is paramount, and we ensure that all of our operators are trained and certified to operate our equipment. Contact us today to explore the comprehensive array of lifting solutions we offer, designed to elevate your 
              projects to new heights while keeping safety and effeciency at the forefront of our operations.
            </p>
          </article>
        </div>
        <span className={styles.btns}>
        <Link  className={styles.infoBtn1} href="/turn-key">Turn-Key</Link>
        <Link className={styles.infoBtn2} href="/services">Services</Link>
          </span>
      </div>
    </div>
  </div>
    );
}

const Crane = () => {
  return (
    <>
    <Head>
    <title>Crane Services | S&amp;W Foundation - Comprehensive Pier Drilling &amp; Construction Support in Dallas, TX</title>
    <meta name="description" content="S&amp;W Foundation offers a suite of specialized Crane services in Dallas, TX: pier drilling, limited-access pier drilling, turnkey solutions, crane, and trucking services. Leveraging years of experience and cutting-edge equipment, we&apos;re your trusted partner in commercial construction support." />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="keywords" content="pier drilling, limited-access pier drilling, crane services, trucking services, turnkey solutions, caisson, slurry" />
    <meta property="og:title" content="Crane Services | S&amp;W Foundation - Your Partner in Commercial Construction in Dallas, TX" />
    <meta property="og:description" content="Discover S&amp;W Foundation&apos;s range of services: from expert pier drilling to crane and trucking solutions, we cater to all your commercial construction needs in the US." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://www.swfoundation.com/crane" />
    <meta property="og:image" content="https://edycymyofrowahspzzpg.supabase.co/storage/v1/object/public/Images/public/newimages/IMG_4838.webp" />
    <meta property='og:site_name' content='S&amp;W Commercial Pier Drilling Contractors' />
    <link rel="canonical" href="https://www.swfoundation.com/crane" />
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

export default Crane;
