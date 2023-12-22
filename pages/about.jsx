import React from 'react'
import styles from '../styles/About.module.css'
import Link from 'next/link'
import Image from 'next/image'
import Head from 'next/head'
import { Inter } from "next/font/google";
import { Oswald } from "next/font/google";
import { Montserrat } from "next/font/google";
import { Lato } from "next/font/google";
// import { Container } from '@/components/Container';

const inter = Inter({ subsets: ["latin"] });
const oswald = Oswald({ subsets: ["latin"] });
const montserrat = Montserrat({ subsets: ["latin"] });
const lato = Lato({  weight:['900'] ,subsets: ["latin"] });

function Hero() {
    return(
        <div className={styles.heroSection}>
            
            <div className={styles.heroContainer}>
                <div className={styles.heroWrapper}>
                <h1 className={lato.className}>About Us</h1>
                </div>
            </div>
        </div>
    )
}

export default function About() {
    return (
        <>
        <Head>
    <title>About S&W Foundation | Commercial Pier Drilling Specialists in Dallas, TX</title>
    <meta name="description" content="S&W Foundation specializes in commercial pier drilling for new construction projects across Dallas, TX and beyond. Rely on S&W for unmatched expertise, top-tier equipment, and paramount safety." />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
     <meta name="keywords" content="commercial pier drilling, Dallas, TX, construction projects, top-tier equipment, safety, S&W Foundation, new construction, expertise, commitment to excellence" />
    <meta property="og:title" content="About S&W Foundation | Commercial Pier Drilling Specialists in Dallas, TX" />
    <meta property="og:description" content="S&W Foundation offers premier commercial pier drilling services for various projects across the US. Discover our commitment to excellence and safety!" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://www.swfoundation.com/about/" />
    <meta property="og:image" content="https://www.swfoundation.com/images/home.jpeg" />
    <meta property='og:site_name' content='S&W Commercial Pier Drilling' />
    <link rel="canonical" href="https://www.swfoundation.com/about" />
    <link rel="icon" href="/android-chrome-512x512.png" type='image/x-icon'/>
</Head>
        <div className={styles.about}>
            <section className={styles.hero}>
                <Hero />
            </section>
           
        </div>
        </>
    )
}

