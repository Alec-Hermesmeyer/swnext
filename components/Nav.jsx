import React, { useState } from "react";
import Link from "next/link";
import { FaLinkedin, FaFacebookSquare } from "react-icons/fa";
import styles from "../styles/Nav.module.css";
import Image from "next/image";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900"], subsets: ["latin"] });

const data = [
  {
    name: "Home",
    link: "/",
  },
  {
    name: "About",
    link: "/about",
  },
  {
    name: "Services",
    link: "/services",
  },
  {
    name: "Pier Drilling",
    link: "/pier-drilling",
  },
  {
    name: "Limited Access Pier Drilling",
    link: "/limited-access",
  },
  {
    name: "Turn Key Drilling Solutions",
    link: "/turn-key",
  },
  {
    name: "Crane Services",
    link: "/crane",
  },
  {
    name: "Helical Piles",
    link: "/helical-piles",
  },
  {
    name: "Contact",
    link: "/contact",
  },
  {
    name: "Careers",
    link: "/careers",
  },
  {
    name: "Gallery",
    link: "/gallery",
  },
  
  {
    name: "Safety",
    link: "/safety",
  },
  {
    name: "Core Values",
    link: "/core-values",
  },
  {
    name: "Blog",
    link: "/blog",
  },
  
];

export default function Nav() {
  const [active, setIsActive] = useState(false);
  const closeMenu = () => {
    setIsActive(false);
  };
  const [isAboutHovered, setIsAboutHovered] = useState(false);
  const [isServicesHovered, setIsServicesHovered] = useState(false);

  return (
    <>
      <nav className={styles.nav}>
        <div className={styles.container}>
          <div className={styles.wrapper}>
            <div className={styles.left}>
              <Link href="/">
                <Image
                  src="Images/public/att.webp"
                  alt="logo"
                  width={100}
                  height={100}
                  priority
                />
              </Link>
            </div>
            <div className={styles.center}>
              <ul>
                <li
                  onMouseEnter={() => setIsAboutHovered(true)}
                  onMouseLeave={() => setIsAboutHovered(false)}
                  className={`${lato.className} ${styles.dropdown}`}
                >
                  <Link className={styles.about} href="/about">
                    About
                  </Link>
                  <ul
                    className={`${styles.dropdownMenu} ${styles.aboutMenu} ${
                      isAboutHovered ? styles.show : ""
                    }`}
                  >
                    <li>
                      <Link href="/safety">
                        Safety
                      </Link>
                    </li>
                    <li>
                      <Link href="/core-values">
                        Core Values
                      </Link>
                    </li>
                    <li>
                      <Link href="/blog">
                        Blog
                      </Link>
                    </li>
                  </ul>
                </li>
                <li
                  onMouseEnter={() => setIsServicesHovered(true)}
                  onMouseLeave={() => setIsServicesHovered(false)}
                  className={`${lato.className} ${styles.dropdown}`}
                >
                  <Link id={styles.services} href="/services">
                    Services
                  </Link>
                  <ul
                    className={`${styles.dropdownMenu} ${styles.servicesMenu} ${
                      isServicesHovered ? styles.show : ""
                    }`}
                  >
                    <li>
                      <Link href="/pier-drilling">Pier Drilling</Link>
                    </li>
                    <li>
                      <Link href="/limited-access">
                        Limited Access Pier Drilling
                      </Link>
                    </li>
                    <li>
                      <Link href="/turn-key">Turn Key Drilling Solutions</Link>
                    </li>
                    <li>
                      <Link href="/crane">Crane Services</Link>
                    </li>
                    <li>
                      <Link href="/helical-piles">Helical Piles</Link>
                    </li>
                  </ul>
                </li>
                <li className={lato.className}>
                  <Link href="/contact">Contact</Link>
                </li>
                <li className={lato.className}>
                  <Link href="/careers">Careers</Link>
                </li>
                <li className={lato.className}>
                  <Link href="/gallery">Gallery</Link>
                </li>
              </ul>
            </div>
            <div className={styles.right}>
              <div className={styles.socialIcons}>
                <Link
                  href="https://www.facebook.com/SWFoundationContractors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaFacebookSquare />
                </Link>
                <Link
                  href="https://www.linkedin.com/company/s-w-foundation-contractors-inc"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaLinkedin />
                </Link>
                <div onClick={() => setIsActive(!active)}>
                  <div
                    className={
                      active ? styles.activeHamburger : styles.hamburger
                    }
                  ></div>
                </div>
              </div>
            </div>

            <div className={active ? styles.activeMobile : styles.mobile}>
              <ul>
                {data.map((item, i) => (
                  <li key={i}>
                    <Link
                      onClick={closeMenu}
                      className={styles.mobileLink}
                      href={item.link}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
