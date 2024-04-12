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
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://edycymyofrowahspzzpg.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkeWN5bXlvZnJvd2Foc3B6enBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzcyNTExMzAsImV4cCI6MTk5MjgyNzEzMH0.vJ8DvHPikZp2wQRXEbQ2h7JNgyJyDs0smEcJYjrjcVg";

const supabase = createClient(supabaseUrl, supabaseKey);

const inter = Inter({ subsets: ["latin"] });
const oswald = Oswald({ subsets: ["latin"] });
const montserrat = Montserrat({ subsets: ["latin"] });
const lato = Lato({ weight: ["900"], subsets: ["latin"] });

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
                    <div className={styles.infoTopLeftContainer}>
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

function ArticleSection() {
  return (
    <div className={styles.articleSection}>
      <div className={styles.articleContainer}>
        <div className={styles.articleWrapper}>
          <h3 className={lato.className}>
            We set the standard and innovate to overcome obstacles...
          </h3>
          <div className={styles.contentContainer}>
            <article className={styles.articleContent}>
              <p className={lato.className}>
                We are the leaders in Commercial Pier Drilling for good reason!
                We deliver comprehensive Pier Drilling Solutions for major
                construction projects across the United States. Our project
                management approach utilizes advanced technologies to drive
                efficiency and productivty onsite. We invest in state of the art
                hydraulic rotary drills, auger cast pile rigs, and excavator
                mounted equipment to execute pier installation rapidly and
                accurately. Our crews apply innovative drilling techniques and
                sequences tailored for specific soil conditions and project
                needs. Customers turn to us because the know we will deliver
                robust pier foundations that provide the load-bearing capacity
                required, even in challeging ground conditions. Our specialized
                expertise in caisson, pile, micropile and helix pier
                construction provides deep foundation solutions enginnered for
                safety and longevity. Whether it&apos;s constructing a high-rise
                core on friction piles, securing a hillside on caisson secant
                walls, or anchoring a tank farm on helical piers, you can count
                on us to deliver. Contact us today to learn more about our
                comprehensive portfolio of Commercial Pier Drilling Services.
              </p>
            </article>
          </div>
          <span className={styles.btns}>
            <Link className={styles.infoBtn1} href="/services">
              Services
            </Link>
            <Link className={styles.infoBtn2} href="/limited-access">
              Limited-Access
            </Link>
          </span>
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
        <p className={lato.className}>{jobPosting.jobDesc}</p>
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
          Careers | S&amp;W Foundation - Comprehensive Pier Drilling &amp;
          Construction Support in Dallas, TX
        </title>
        <meta
          name="description"
          content="S&amp;W Foundation offers a suite of specialized services in Dallas, TX: pier drilling, limited-access pier drilling, turnkey solutions, crane, and trucking services. Leveraging years of experience and cutting-edge equipment, we're your trusted partner in commercial construction support."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="keywords"
          content="pier drilling, limited-access pier drilling, crane services, trucking services, turnkey solutions, caisson, slurry"
        />
        <meta
          property="og:title"
          content="Services | S&amp;W Foundation - Your Partner in Commercial Construction in Dallas, TX"
        />
        <meta
          property="og:description"
          content="Discover S&amp;W Foundation's range of services: from expert pier drilling to crane and trucking solutions, we cater to all your commercial construction needs in the US."
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content="https://www.swfoundation.com/careers/"
        />
        <meta
          property="og:image"
          content="https://www.swfoundation.com/images/galleryImages/gal18.jpeg"
        />
        <meta
          property="og:site_name"
          content="S&amp;W Commercial Construction Support"
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
       {/* <section className={styles.article}>
          <ArticleSection />
        </section> */}
        <section id='jobPostings' className={styles.jobPostings}>
          <JobPostings />
        </section>
      </div>
    </>
  );
};

export default Careers;
