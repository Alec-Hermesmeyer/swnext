import React, { useState, useEffect } from "react";
import styles from "../styles/Individual.module.css";
import Link from "next/link";
import Image from "next/image";
import Head from "next/head";
import { Inter } from "next/font/google";
import { Oswald } from "next/font/google";
import { Montserrat } from "next/font/google";
import { Lato } from "next/font/google";
import { FadeIn } from "@/components/FadeIn";
import { GridPattern } from "@/components/GridPattern";
import supabase from "@/components/Supabase";

const inter = Inter({ subsets: ["latin"] });
const oswald = Oswald({ subsets: ["latin"] });
const montserrat = Montserrat({ subsets: ["latin"] });
const lato = Lato({ weight: ["900"], subsets: ["latin"] });
function Spacer() {
  return (
    <GridPattern />
  )
}

function Hero() {
  return (
    <div className={styles.heroSection}>
      <div className={styles.heroContainer}>
        <div className={styles.heroWrapper}>
          <h1 className={lato.className}>Careers</h1>
          <span>
            <Link className={styles.heroLink} href="/contact">
              Contact Us
            </Link>
            <Link className={styles.heroLink} href="/services">
              Services
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
                    <div className={styles.infoTopLeftContainerCareer}>
                      <h2 className={lato.className}>Join the Family!</h2>
                      <p className={lato.className}>
                        S&amp;W Foundation Contractors is always looking to
                        grow! We are a family owned and operated business that
                        has been in the industry for over 30 years. We are
                        always looking for hard working individuals to join our
                        team. If you are interested in joining our team, please
                        check out the positions we have and if they are
                        available below!
                      </p>
                      <Link className={styles.infoBtn1} href='#jobPostings'>
                        Learn More
                      </Link>
                    </div>
                  </div>
                  <div className={styles.infoTopRight}>
                    <Image
                      className={styles.infoImage}
                      src="Images/public/newimages/AFDB03DE-805D-45B2-9A37-1EAFA841A828.webp"
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

function JobPostings() {
  const [jobPostings, setJobPostings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchJobPostings = async () => {
      let { data, error } = await supabase.from("jobs").select("*");
      if (error) {
        console.log(error);
      } else {
        setJobPostings(data);
      }
      setIsLoading(false);
    };
    fetchJobPostings();
  }, []);
  if (isLoading) {
    return <div>Loading....</div>;
  }
  // Filter the jobPostings to only include those where isOpen is true
  const openJobPostings = jobPostings.filter(jobPosting => jobPosting.is_Open);
  return (
    <div className={styles.jobPostingsSection}>
      <div className={styles.grid}>
      {openJobPostings.map((jobPosting, index) => (
        <div className={styles.card} key={index}>
          <FadeIn>
        <details className={styles.jobPostInfo}>
        <summary className={lato.className}>{jobPosting.jobTitle}</summary>
        {/* <p className={lato.className}>{jobPosting.jobDesc}</p> */}
        <span className={styles.jobBtns}><Link className={styles.infoBtn3} href='/contact#jobForm'><p className={lato.className}>Apply Today</p></Link></span>
      </details>
      </FadeIn>
      </div>
      ))}
      </div>
    </div>
  );
}


const Careers = () => {
  return (
    <>
      <Head>
        <title>
          Careers | S&amp;W Foundation - Kick start your career in the commercial Pier Drilling 
          industry. Join our team in Dallas, TX today!
          
        </title>
        <meta
          name="description"
          content="Explore exciting career opportunities at S&amp;W Foundation. Join our team in Dallas, TX, and be part of a leading company in commercial pier drilling and construction support."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="keywords"
          content="pier drilling, limited-access pier drilling, crane services, trucking services, turnkey solutions, caisson, slurry"
        />
        <meta
          property="og:title"
          content="Careers | S&amp;W Foundation - Your Partner in Commercial Construction in Dallas, TX"
        />
        <meta
          property="og:description"
          content="Discover S&amp;W Foundation's range of services: from expert pier drilling to crane and trucking solutions, we cater to all your commercial construction needs in the US."
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content="https://www.swfoundation.com/careers"
        />
        <meta
          property="og:image"
          content="https://edycymyofrowahspzzpg.supabase.co/storage/v1/object/public/Images/public/galleryImages/gal18.webp?t=2024-04-16T20%3A33%3A07.478Z"
        />
        <meta
          property="og:site_name"
          content="S&amp;W Commercial Construction Support"
        />
        <meta name="twitter:card" content="summary" />
        <meta
          name="twitter:title"
          content="S&amp;W Foundation | Dallas, TX's Premier Commercial Construction Partner"
        />
        <meta
          name="twitter:description"
          content="Expertise in commercial pier drilling, crane &amp; trucking services, and more. See why businesses trust S&amp;W Foundation for their construction needs."
        />
        <meta
          name="twitter:image"
          content="https://edycymyofrowahspzzpg.supabase.co/storage/v1/object/public/Images/public/att.webp?t=2024-04-16T20%3A11%3A20.126Z"
        />
        <link rel="canonical" href="https://www.swfoundation.com/careers" />
        <link
          rel="icon"
          href="/android-chrome-512x512.png"
          type="image/x-icon"
        />
      </Head>

      <div className={styles.page}>
        <section className={styles.hero}>
          <Hero />
        </section>
         <section className={styles.info}>
          <InfoSection />
        </section>
        <section id='jobPostings' className={styles.jobPostings}>
          <JobPostings />
        </section>
        <div className={styles.spacer}>
          <GridPattern className={styles.gridPattern} yOffset={10} interactive />
          </div>
      </div>
    </>
  );
};

export default Careers;
