import React from 'react'
import styles from '../styles/About.module.css'
import Link from 'next/link'
import { Inter } from '@next/font/google'
import Head from 'next/head'
import AboutGrid from '@/components/AboutGrid'
import SocialGrid from '@/components/SocialGrid'
import AboutHero from '@/components/AboutHero'

const inter = Inter({ subsets: ['latin'] })

export default function About() {
    return (
        <>
        <Head>
        <title> About S&amp;W Foundation | Industrial Foundation Repair Experts </title>
        <meta name="description" content="S&amp;W Foundation provides high-quality commercial pier drilling services in the United States. Contact us today for a quote! Trust S&amp;W for and unmatched combo of expierience, equipment and safety" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="About S&amp;W Foundation | Industrial Foundation Repair Experts" />
        <meta property="og:description" content="S&amp;W Foundation provides high-quality commercial pier drilling services in the United States. Contact us today for a quote!" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.swfoundation.com/about/" />
        <meta property="og:image" content="https://www.swfoundation.com/images/home.jpeg" />
        <meta property='og:site_name' content='S&amp;W Foundation Repair Contractors' />
      </Head>
        <div className={styles.about}>
           <section>
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
                            <h2 className={inter.className}>Joshua Mctee</h2>
                           
                           <p className={inter.className}>Project Manager<br></br><br></br>Joshuam@swfoundation.com<br></br><br></br>214-649-2219 </p>
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
           </section>
        </div>
        </>
    )
}

