import React from 'react'
import styles from '../styles/Serve.module.css'
import ServicesGrid from '@/components/ServiceGrid'
import { Inter } from '@next/font/google'
import Head from 'next/head'
import SocialGrid from '@/components/SocialGrid'
import ServiceHero from '@/components/ServiceHero'


const inter = Inter({ subsets: ['latin'] })

export default function Services() {
  return (
    <>
    
    <Head>
    <title>Services | S&amp;W Foundation - Comprehensive Pier Drilling &amp; Construction Support in Dallas, TX</title>
    <meta name="description" content="S&amp;W Foundation offers a suite of specialized services in Dallas, TX: pier drilling, limited-access pier drilling, turnkey solutions, crane, and trucking services. Leveraging years of experience and cutting-edge equipment, we&apos;re your trusted partner in commercial construction support." />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="keywords" content="pier drilling, limited-access pier drilling, crane services, trucking services, turnkey solutions, caisson, slurry" />
    <meta property="og:title" content="Services | S&amp;W Foundation - Your Partner in Commercial Construction in Dallas, TX" />
    <meta property="og:description" content="Discover S&amp;W Foundation&apos;s range of services: from expert pier drilling to crane and trucking solutions, we cater to all your commercial construction needs in the US." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://www.swfoundation.com/services/" />
    <meta property="og:image" content="https://www.swfoundation.com/images/galleryImages/gal18.jpeg" />
    <meta property='og:site_name' content='S&amp;W Commercial Construction Support' />
    <link rel="icon" href="/android-chrome-512x512.png" type='image/x-icon'/>
</Head>

     
    <div className={styles.service}>
      <section >
        <ServiceHero />
      
          </section>
      <section className={styles.banner}>
               <h1 className={inter.className}>
               We Don&apos;t Just Drill, We Pier Pressure Our Competitors!
               </h1>
           </section>
      <section style={{marginBottom: 5}}><ServicesGrid/></section>
      <section className={styles.banner}>
               <h1 className={inter.className}>Check Us Out On Social Media!</h1>
           </section>
           <section style={{marginTop: 5}}>
               <SocialGrid />
           </section>
    </div>
    </>
  )
}
