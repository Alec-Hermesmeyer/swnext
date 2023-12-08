import React from 'react'
import styles from '../styles/About.module.css'
import Link from 'next/link'
import { Inter } from "next/font/google"
import { GridPattern } from "@/components/GridPattern";
import { Container } from "@/components/Container";
import Head from 'next/head'
import AboutGrid from '@/components/AboutGrid'
import SocialGrid from '@/components/SocialGrid'
import AboutHero from '@/components/AboutHero'

const inter = Inter({ subsets: ['latin'] })

function Hero() {
    return(
        <div className={styles.heroSection}>
            
            <div className={styles.heroContainer}>
                <h1 className={inter.className}>About Us</h1>
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
           {/* <section>
          <AboutHero />
           </section>
           <section className={styles.banner}>
               <h1 className={inter.className}>Pier Drilling Done Right, Without The Drama.</h1>
           </section>
           <section><AboutGrid /></section>
           <section className={styles.banner}>
               <h1 className={inter.className}>Contact Us Today</h1>
           </section>
           <section className={styles.contact}>
           <div className={styles.info}>
            <div className={styles.container}>
                <div className={styles.wrapper}>
                    <div className={styles.grid}>
                        <div className={styles.card}>
                            <h2 className={inter.className}>Luke Wardell</h2>
                           <p className={inter.className}>Vice President of Pre-Construction<br></br><br></br>Lukew@swfoundation.com<br></br><br></br>972-877-0027</p>
                           <Link href='contact'><button>Get A Free Quote</button></Link>

                        </div>
                       
                        <div className={styles.card}>
                            <h2 className={inter.className}>Jason Taylor</h2>
                           
                           <p className={inter.className}>Estimator & Limited-Access Expert<br></br><br></br>Jasont@swfoundation.com<br></br><br></br>214-202-8069 </p>
                           <Link href='contact'><button>Get A Free Quote</button></Link>

                        </div>
                        <div className={styles.card}>
                            <h2 className={inter.className}>James Millhorn</h2>
                           <p className={inter.className}> Chief Operation Officer / Owner<br></br><br></br>Jamesm@swfoundation.com<br></br><br></br>214-202-8443</p>
                           <Link href='contact'><button>Get A Free Quote</button></Link>

                        </div>
                        <div className={styles.card}>
                            <h2 className={inter.className}>Cesar Urrutia</h2>
                           <p className={inter.className}>General Superintendant<br></br><br></br>Cesaru@swfoundation.com<br></br><br></br>214-405-5099</p>
                           <Link href='contact'><button>Get A Free Quote</button></Link>

                        </div>
                        <div className={styles.card}>
                            <h2 className={inter.className}>Jace Giron</h2>
                           
                           <p className={inter.className}>Project Manager<br></br><br></br>Jaceg@swfoundation.com<br></br><br></br>469-649-2975 </p>
                           <Link href='contact'><button>Get A Free Quote</button></Link>

                        </div>
                        <div className={styles.card}>
                            <h2 className={inter.className}>Sean Macalik</h2>
                           <p className={inter.className}> Project Manager<br></br><br></br>Seanm@swfoundation.com<br></br><br></br>940-300-1854</p>
                           <Link href='contact'><button>Get A Free Quote</button></Link>

                        </div>
                    </div>

                </div>
            </div>
                
        </div>
           </section>
          
           <section className={styles.banner}>
               <h1 className={inter.className}>Follow Us On Social Media!</h1>
           </section>
           <section>
               <SocialGrid />
           </section> */}
        </div>
        </>
    )
}

