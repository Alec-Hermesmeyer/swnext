import React, { useState, useEffect } from "react";
import styles from "../../styles/Blog.module.css";
import Link from "next/link";
import Image from "next/image";
// import Head from "next/head";
import { Inter } from "next/font/google";
import { Oswald } from "next/font/google";
import { Montserrat } from "next/font/google";
import { Lato } from "next/font/google";
// import { FadeIn } from "@/components/FadeIn";
import supabase from "@/components/Supabase";
import { GridPattern } from "@/components/GridPattern";


const inter = Inter({ subsets: ["latin"] });
const oswald = Oswald({ subsets: ["latin"] });
const montserrat = Montserrat({ subsets: ["latin"] });
const lato = Lato({ weight: ["900"], subsets: ["latin"] });
function Spacer() {
  return <GridPattern />;
}
function Intro() {
  return (
    <div className={styles.introSection}>
       <GridPattern className={styles.gridPattern} yOffset={10} interactive />
      <div className={styles.introContainer}>
        <div className={styles.introWrapper}>
          <div className={styles.introContent}>
            <div className={styles.introContentContainer}>
              <div className={styles.introContentWrapper}>
                <div className={styles.introContentLeft}>
                  <span className={styles.imageContainer}>
                    <Image
                      className={styles.blogImg}
                      src="Images/public/newimages/IMG_8084.webp"
                      height={470}
                      width={550}
                      alt="Pier Drilling Rigs drilling out foundation piers"
                    />
                  </span>
                  <div className={styles.introLeftContact}>
                    <div className={styles.rightCard}>
                      <div className={styles.cardWrapper}>
                        <div className={styles.cardContent}>
                          <h3 className={lato.className}>
                            {" "}
                            We Provide Nation-Wide Service
                          </h3>
                          <ul>
                            <Link href="tel: +2147030484">
                              <li className={lato.className}>
                                Call: (214)-703-0484
                              </li>
                            </Link>
                            <li className={lato.className}>
                              Address: 2806 Singleton St. Rowlett, TX 75088
                            </li>
                          </ul>
                          <span>
                            <Link href="/contact">
                              <button className={lato.className}>
                                Contact Us
                              </button>
                            </Link>
                            <Link href="/services">
                              <button className={lato.className}>
                                Services
                              </button>
                            </Link>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={styles.introContentRight}>
                  <h1 className={lato.className}>
                    BUILDING THE FUTURE: THE INTRICATE ART OF COMMERCIAL PIER
                    DRILLING IN DALLAS
                  </h1>
                  <p className={lato.className}>
                    In the bustling city of Dallas, where the skyline is adorned
                    with towering structures, the foundation of every building
                    holds a story of precision, expertise, and technological
                    marvel. At the heart of this narrative is commercial pier
                    drilling, a crucial step in ensuring the stability and
                    longevity of structures. Our company, nestled in the heart
                    of Texas, specializes in providing top-notch commercial pier
                    drilling services, ensuring the structural integrity of
                    various projects across the city.
                  </p>
                  <article className={styles.blogArticle}>
                    <h2 className={lato.className}>
                      Understanding Pier Drilling
                    </h2>
                    <p className={lato.className}>
                      Pier drilling is a method used to install deep foundation
                      piers, which provide support to structures, ensuring they
                      remain stable on the underlying soil or rock. The process
                      involves drilling deep holes into the ground, which are
                      then filled with concrete and reinforced with steel to
                      form sturdy piers. This foundation solution is
                      particularly vital in Dallas, where the expansive clay
                      soil can pose challenges to the structural integrity of
                      buildings.
                    </p>
                    <h2 className={lato.className}>Our Process</h2>
                    <p className={lato.className}>
                      S&amp;W Foundation&apos;s seasoned team combines a wealth of
                      experience with cutting-edge technology to deliver
                      precision in every pier drilling project. From the initial
                      soil analysis to the final inspection, every step is
                      meticulously planned and executed. Our process ensures a
                      seamless workflow, timely completion, and adherence to the
                      highest industry standards.
                    </p>
                    <h2 className={lato.className}>Why Dallas Trusts Us</h2>
                    <p className={lato.className}>
                      S&amp;W Foundation&apos;s reputation as a reliable commercial pier
                      drilling company in Dallas stems from our dedication to
                      quality, punctuality, and customer satisfaction. With
                      every project, S&W Foundationstrive to exceed the
                      expectations of our clients, ensuring the safety and
                      durability of the structures we help build.
                      <br></br><br></br>
                      As Dallas continues to grow and reach for the sky, the
                      demand for reliable and professional pier drilling
                      services follows suit. S&W Foundation is proud to play a
                      pivotal role in the construction journey of this vibrant
                      city, one pier at a time. With every project we undertake,
                      we are not just drilling piers; we are building the future
                      of Dallas.
                    </p>
                    <h2 className={lato.className}>Contact Us</h2>
                    <p className={lato.className}>
                     Embark on your next construction project with the assurance
                     of a solid foundation. Reach out to us for unparalleled commercial 
                     pier drilling services in Dallas, Texas, and let&apos;s build the future, together.</p>
                  </article>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const Page = () => {
  return (
    <div className={styles.post}>
      <section className={styles.intro}>
        <Intro />
      </section>
    </div>
  );
};

export default Page;
