import React from "react";
import styles from "../styles/GalleryGrid.module.css";
import Link from "next/link";
import Image from "next/image";
import { Inter } from "next/font/google";
import { FadeIn, FadeInStagger } from "./FadeIn";
import { Container } from "./Container";

const inter = Inter({ subsets: ["latin"] });

const GalleryGrid = () => {
  return (
    <>
      <Container>
        <FadeInStagger>
          <FadeIn>
            <div className={styles.grid}>
              <div className={styles.card}>
                <Image
                  className={styles.img}
                  src="Images/public/tkds.webp"
                  height={300}
                  width={300}
                  alt="S&amp;W Trucks and Cranes at a Commercial Pier Drilling jobsite"
                  quality={80}
                  priority
                />
              </div>
              <div className={styles.card}>
                <Image
                  className={styles.img}
                  src="Images/public/galleryImages/gal2.webp"
                  height={300}
                  width={300}
                  alt="S&amp;W Crew Getting A Freshly Drilled Hole Prepared to set cages"
                  quality={80}
                  priority
                />
              </div>
              <div className={styles.card}>
                <Image
                  className={styles.img}
                  src="Images/public/galleryImages/gal3.webp"
                  height={300}
                  width={300}
                  alt="S&amp;W Crews setting pipe in the ground at a Commercial Construction Jobsite"
                  quality={80}
                  priority
                />
              </div>
              <div className={styles.card}>
                <Image
                  className={styles.img}
                  src="Images/public/galleryImages/gal4.webp"
                  height={300}
                  width={300}
                  alt="Two Drilling Rigs basking in the sunlight"
                  quality={80}
                  priority
                />
              </div>
            </div>
            <div className={styles.grid}>
              <div className={styles.card}>
                <Image
                  className={styles.img}
                  src="Images/public/galleryImages/gal5.webp"
                  height={300}
                  width={300}
                  alt="Pier Drilling Rig at Dusk with a view of Downtown Dallas"
                  quality={80}
                  priority
                />
              </div>
              <div className={styles.card}>
                <Image
                  className={styles.img}
                  src="Images/public/galleryImages/gal6.webp"
                  height={300}
                  width={300}
                  alt="S&amp;W Pier Drilling Rig and Crane working on a commercial construction jobsite"
                  quality={80}
                  priority
                />
              </div>
              <div className={styles.card}>
                <Image
                  className={styles.img}
                  src="Images/public/galleryImages/gal7.webp"
                  height={300}
                  width={300}
                  alt="S&amp;W Pier Drilling Rig, drilling holes at a job site"
                  quality={80}
                  priority
                />
              </div>
              <div className={styles.card}>
                <Image
                  className={styles.img}
                  src="Images/public/galleryImages/gal41.webp"
                  height={300}
                  width={300}
                  alt="Groundhand working hard to make sure the hole is prepared for the S&amp;W Pier Drilling Rig to continue drilling"
                  quality={80}
                  priority
                />
              </div>
            </div>
          </FadeIn>
        </FadeInStagger>
      </Container>
      <Container>
        <FadeInStagger>
          <FadeIn>
            <div className={styles.grid}>
              <div className={styles.card}>
                <Image
                  className={styles.img}
                  src="Images/public/galleryImages/gal9.webp"
                  height={300}
                  width={300}
                  alt="S&amp;W Drilling Rig Drilling Limited-Access Piers"
                  quality={80}
                  // priority
                  loading="lazy"
                />
              </div>

              <div className={styles.card}>
                <Image
                  className={styles.img}
                  src="Images/public/galleryImages/gal10.webp"
                  height={300}
                  width={300}
                  alt="Overhead shot of S&amp;W Cranes and Drilling Rigs working on a dam"
                  quality={80}
                  // priority
                  loading="lazy"
                />
              </div>
              <div className={styles.card}>
                <Image
                  className={styles.img}
                  src="Images/public/galleryImages/gal11.webp"
                  height={300}
                  width={300}
                  alt="S&amp;W Drill Rig preparing for Foundation Repair on a Commercial Construction Jobsite"
                  quality={80}
                  // priority
                  loading="lazy"
                />
              </div>
              <div className={styles.card}>
                <Image
                  className={styles.img}
                  src="Images/public/galleryImages/gal12.webp"
                  height={300}
                  width={300}
                  alt="S&amp;W Crew Safely Drilling Holes as Foundation Contractor on a Commercial Construction Jobsite"
                  quality={80}
                  // priority
                  loading="lazy"
                />
              </div>
            </div>
            <div className={styles.grid}>
              <div className={styles.card}>
                <Image
                  className={styles.img}
                  src="Images/public/galleryImages/gal13.webp"
                  height={300}
                  width={300}
                  alt="Pier Drilling Rig in the sunset after a long day of Foundation Repair on a Commercial Construction Jobsite as a Foundation Contractor"
                  quality={80}
                  // priority
                  loading="lazy"
                />
              </div>

              <div className={styles.card}>
                <Image
                  className={styles.img}
                  src="Images/public/galleryImages/gal14.webp"
                  height={300}
                  width={300}
                  alt="S&amp;W Employees posing on their Pier Drilling Rig while perfoming foundation repair as a Foundation Contractors on a Commercial Construction Jobsite"
                  quality={80}
                  // priority
                  loading="lazy"
                />
              </div>
              <div className={styles.card}>
                <Image
                  className={styles.img}
                  src="Images/public/galleryImages/gal15.webp"
                  height={300}
                  width={300}
                  alt="S&amp;W Employees posing on their Pier Drilling Rig while perfoming foundation repair as a Foundation Contractors on a Commercial Construction Jobsite"
                  quality={80}
                  // priority
                  loading="lazy"
                />
              </div>
              <div className={styles.card}>
                <Image
                  className={styles.img}
                  src="Images/public/galleryImages/gal16.webp"
                  height={300}
                  width={300}
                  alt="Pier Drilling Rig performing foundation repair on Commerical Construction Jobsite as the hired Foundation Contractors"
                  quality={80}
                  // priority
                  loading="lazy"
                />
              </div>
            </div>
          </FadeIn>
        </FadeInStagger>
      </Container>
      <Container>
        <FadeInStagger>
          <FadeIn>
            <div className={styles.grid}>
              <div className={styles.card}>
                <Image
                  className={styles.img}
                  src="Images/public/galleryImages/gal17.webp"
                  height={300}
                  width={300}
                  alt="Pier Drilling Rig basking in the sunset after finishing it's foundation repair"
                  quality={80}
                  // priority
                  loading="lazy"
                />
              </div>

              <div className={styles.card}>
                <Image
                  className={styles.img}
                  src="Images/public/galleryImages/gal18.webp"
                  height={300}
                  width={300}
                  alt="Pier Drilling Rig pushing through the elements to get the job done"
                  quality={80}
                  // priority
                  loading="lazy"
                />
              </div>
              <div className={styles.card}>
                <Image
                  className={styles.img}
                  src="Images/public/galleryImages/gal19.webp"
                  height={300}
                  width={300}
                  alt="Overhead view of a Commercial Construction Jobsite where S&amp;W are working as Foundation Contractors"
                  quality={80}
                  // priority
                  loading="lazy"
                />
              </div>
              <div className={styles.card}>
                <Image
                  className={styles.img}
                  src="Images/public/galleryImages/gal20.webp"
                  height={300}
                  width={300}
                  alt="S&amp;W Crew posing in front of the Pier Drilling Rig on a jobsite where they are working as Foundation Contractors"
                  quality={80}
                  // priority
                  loading="lazy"
                />
              </div>
            </div>
            <div className={styles.grid}>
              <div className={styles.card}>
                <Image
                  className={styles.img}
                  src="Images/public/galleryImages/gal21.webp"
                  height={300}
                  width={300}
                  alt="S&amp;W Crew posing in front of the Pier Drilling Rig on a jobsite where they are working as Foundation Contractors"
                  quality={80}
                  // priority
                  loading="lazy"
                />
              </div>

              <div className={styles.card}>
                <Image
                  className={styles.img}
                  src="Images/public/galleryImages/gal22.webp"
                  height={300}
                  width={300}
                  alt="Pier Drilling Rig drilling Limited-Access holes"
                  quality={80}
                  // priority
                  loading="lazy"
                />
              </div>
              <div className={styles.card}>
                <Image
                  className={styles.img}
                  src="Images/public/galleryImages/gal23.webp"
                  height={300}
                  width={300}
                  alt="Crew working as Foundation Contractors"
                  quality={80}
                  // priority
                  loading="lazy"
                />
              </div>
              <div className={styles.card}>
                <Image
                  className={styles.img}
                  src="Images/public/galleryImages/gal24.webp"
                  height={300}
                  width={300}
                  alt="Two Pier Drilling Rigs posing on a jobsite for Foundation repair, working as Foundation Contractors"
                  quality={80}
                  // priority
                  loading="lazy"
                />
              </div>
            </div>
          </FadeIn>
        </FadeInStagger>
      </Container>
      <Container>
        <FadeInStagger>
          <FadeIn>
            <div className={styles.grid}>
              <div className={styles.card}>
                <Image
                  className={styles.img}
                  src="Images/public/galleryImages/gal25.webp"
                  height={300}
                  width={300}
                  alt="Pier Drilling Rig shaking dirt of its auger while working as Foundation Contractors"
                  quality={80}
                  // priority
                  loading="lazy"
                />
              </div>

              <div className={styles.card}>
                <Image
                  className={styles.img}
                  src="Images/public/galleryImages/gal26.webp"
                  height={300}
                  width={300}
                  alt="S&amp;W Crane showing it's new graphics"
                  quality={80}
                  // priority
                  loading="lazy"
                />
              </div>
              <div className={styles.card}>
                <Image
                  className={styles.img}
                  src="Images/public/galleryImages/gal27.webp"
                  height={300}
                  width={300}
                  alt="Pier Drilling Rig being fueled up at a jobsite working as Commercial Foundation Contractors"
                  quality={80}
                  // priority
                  loading="lazy"
                />
              </div>
              <div className={styles.card}>
                <Image
                  className={styles.img}
                  src="Images/public/galleryImages/gal28.webp"
                  height={300}
                  width={300}
                  alt="Pier Drilling rig before a day of work doing Foundation repair on a commercial jobsite as the Foundation contractors"
                  quality={80}
                  // priority
                  loading="lazy"
                />
              </div>
            </div>
            <div className={styles.grid}>
              <div className={styles.card}>
                <Image
                  className={styles.img}
                  src="Images/public/galleryImages/gal29.webp"
                  height={300}
                  width={300}
                  alt="Crane being fueled in Downtown Dallas where S&amp;W worked as Foundation contractors"
                  quality={80}
                  // priority
                  loading="lazy"
                />
              </div>

              <div className={styles.card}>
                <Image
                  className={styles.img}
                  src="Images/public/galleryImages/gal30.webp"
                  height={300}
                  width={300}
                  alt="Pier Drilling Rig and Crane working together to get the job done."
                  quality={80}
                  // priority
                  loading="lazy"
                />
              </div>
              <div className={styles.card}>
                <Image
                  className={styles.img}
                  src="Images/public/galleryImages/gal31.webp"
                  height={300}
                  width={300}
                  alt="S&amp;W Crew measuring their work on a site doing Foundation repairs as the Foundation Contractors"
                  quality={80}
                  // priority
                  loading="lazy"
                />
              </div>
              <div className={styles.card}>
                <Image
                  className={styles.img}
                  src="Images/public/galleryImages/gal32.webp"
                  height={300}
                  width={300}
                  alt="Pier Drilling Rig"
                  quality={80}
                  // priority
                  loading="lazy"
                />
              </div>
            </div>
          </FadeIn>
        </FadeInStagger>
      </Container>
      <Container>
        <FadeInStagger>
          <FadeIn>
            <div className={styles.grid}>
              <div className={styles.card}>
                <Image
                  className={styles.img}
                  src="Images/public/galleryImages/gal33.webp"
                  height={300}
                  width={300}
                  alt="Pier Drilling Rig drilling Limited-Access holes as the Foundation contractors for the jobsite"
                  quality={80}
                  // priority
                  loading="lazy"
                />
              </div>

              <div className={styles.card}>
                <Image
                  className={styles.img}
                  src="Images/public/galleryImages/gal34.webp"
                  height={300}
                  width={300}
                  alt="Pier Drilling Rig drilling Limited-Access holes as the Foundation contractors for the jobsite"
                  quality={80}
                  // priority
                  loading="lazy"
                />
              </div>
              <div className={styles.card}>
                <Image
                  className={styles.img}
                  src="Images/public/galleryImages/gal35.webp"
                  height={300}
                  width={300}
                  alt="Pier Drilling Rig drilling Limited-Access holes as the Foundation contractors for the jobsite"
                  quality={80}
                  // priority
                  loading="lazy"
                />
              </div>
              <div className={styles.card}>
                <Image
                  className={styles.img}
                  src="Images/public/galleryImages/gal36.webp"
                  height={300}
                  width={300}
                  alt="Pier Drilling Rig drilling Limited-Access holes as the Foundation contractors for the jobsite"
                  quality={80}
                  // priority
                  loading="lazy"
                />
              </div>
            </div>
            <div className={styles.grid}>
              <div className={styles.card}>
                <Image
                  className={styles.img}
                  src="Images/public/galleryImages/gal42.webp"
                  height={300}
                  width={300}
                  alt="Pier Drilling Rig and Crane working together as the Foundation contractors for Foundation repairs"
                  quality={80}
                  // priority
                  loading="lazy"
                />
              </div>

              <div className={styles.card}>
                <Image
                  className={styles.img}
                  src="Images/public/galleryImages/gal38.webp"
                  height={300}
                  width={300}
                  alt="Pier Drilling Rig and Crane working together as the Foundation contractors for Foundation repairs"
                  quality={80}
                  // priority
                  loading="lazy"
                />
              </div>
              <div className={styles.card}>
                <Image
                  className={styles.img}
                  src="Images/public/galleryImages/gal39.webp"
                  height={300}
                  width={300}
                  alt="Pier Drilling Rig drilling Belled Holes on a Commercial Construction Jobsite, as the Foundation Contractors"
                  quality={80}
                  // priority
                  loading="lazy"
                />
              </div>
              <div className={styles.card}>
                <Image
                  className={styles.img}
                  src="Images/public/galleryImages/gal40.webp"
                  height={300}
                  width={300}
                  alt="Pier Drilling Rig drilling Holes on a Commercial Construction Jobsite, as the Foundation Contractors, with the groundhand safely checking the operators work"
                  quality={80}
                  // priority
                  loading="lazy"
                />
              </div>
            </div>
          </FadeIn>
        </FadeInStagger>
      </Container>
    </>
  );
};

export default GalleryGrid;
