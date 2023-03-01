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
        <title>S&amp;W Foundation | Industrial Foundation Repair Services </title>
        <meta name="description" content="S&amp;W Foundation provides high-quality commercial pier drilling services in the United States. Contact us today for a quote! Trust S&amp;W for and unmatched combo of expierience, equipment and safety" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="S&amp;W Foundation | Industrial Foundation Repair Services" />
        <meta property="og:description" content="S&amp;W Foundation provides high-quality commercial pier drilling services in the United States. Contact us today for a quote!" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.swfoundation.com/services/" />
        <meta property="og:image" content="https://www.swfoundation.com/images/galleryImages/gal18.jpeg" />
        <meta property='og:site_name' content='S&amp;W Foundation Repair Contractors' />
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