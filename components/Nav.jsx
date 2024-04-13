import React, { useState } from 'react';
import Link from 'next/link';
import { FaLinkedin, FaFacebookSquare } from 'react-icons/fa'
import styles from '../styles/Nav.module.css'
import Image from 'next/image';
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900"], subsets: ["latin"] });


const data = [
    {
        name: "Home",
        link: "/",
    },
    {
        name: "About",
        link: '/about',
    },
    {
        name: "Services",
        link: '/services',
    },
    {
        name: "Contact",
        link: '/contact',
    },
    {
        name: "Careers",
        link: '/careers',
    },
    {
        name: "Gallery",
        link: '/gallery',
    },
    
    
];


export default function Nav () {
    const [active, setIsActive] = useState(false);
    const closeMenu = () => {
        setIsActive(false);
    }
    return (
 <>
  <nav className={styles.nav}>
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.left}>
        <Link
        href='/'
        >
        <Image
        src='Images/public/att.webp'
        alt='logo'
        width={100}
        height={100}
        priority />
        </Link>
        </div>
        <div className={styles.center}>
          <ul>
            <li className={lato.className}>
              <Link href='/about'>About</Link>
            </li>
            <li className={lato.className}>
              <Link href='/services'>Services</Link>
            </li>
            <li className={lato.className}>
              <Link href='/contact'>Contact</Link>
            </li>
            <li className={lato.className}>
              <Link href='/careers'>Careers</Link>
            </li>
            <li className={lato.className}>
              <Link href='/gallery'>Gallery</Link>
            </li> 
            
          </ul>
        </div>
        <div className={styles.right}>
          <div className={styles.socialIcons}>
            <Link href='https://www.facebook.com/SWFoundationContractors' target="_blank" rel="noopener noreferrer" ><FaFacebookSquare /></Link>
            <Link href='https://www.linkedin.com/company/s-w-foundation-contractors-inc' target="_blank" rel="noopener noreferrer" ><FaLinkedin /></Link>
            <div onClick={() => setIsActive(!active)}>
            <div className={ active ? styles.activeHamburger : styles.hamburger}></div>
            </div>
        </div>
          </div> 
          
        <div className={active ? styles.activeMobile : styles.mobile}>
            <ul>
                {
                    data.map((item, i) => <li key={i}>
                        <Link onClick={closeMenu} className={styles.mobileLink}href={item.link}>{item.name}</Link>
                    </li>)
                }
            </ul>

        </div>
      </div>
    </div>

  </nav>
 </>
);

 }
