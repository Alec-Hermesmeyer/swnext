import React from 'react'
import styles from '@/styles/Gallery.module.css'
import Head from 'next/head'
import GalleryGrid from '@/components/GalleryGrid'


export default function Gallery() {
    return (
        <>
<Head>
    
    <title>Project Gallery | S&amp;W Foundation - Dallas, TX&apos;s Premier Pier Drilling Specialists</title>
    <meta name="description" content="Explore S&amp;W Foundation&apos;s project gallery to witness our expertise in commercial pier drilling. From warehouses to hospitals, our Dallas, TX-based team delivers precision, safety, and excellence in every project." />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta property="og:title" content="Project Gallery | S&amp;W Foundation - Leading Pier Drilling Projects in Dallas, TX" />
    <meta property="og:description" content="Dive into S&amp;W Foundation&apos;s gallery, showcasing top-tier pier drilling projects across Dallas, TX and the wider US. Experience our dedication to quality firsthand." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://www.swfoundation.com/gallery" />
    <meta name="keywords" content="project gallery, S&amp;W Foundation, pier drilling specialists, Dallas, TX, commercial pier drilling, precision, safety, excellence, warehouses, hospitals, pier drilling projects, quality, dedication" />
    <meta property='og:site_name' content='S&amp;W Commercial Pier Drilling' />
    <meta name="twitter:card" content="summary" />
        <meta
          name="twitter:title"
          content="S&amp;W Foundation | Dallas, TX's Premier Commercial Construction Partner"
        />
        <meta
          name="twitter:description"
          content="Expertise in commercial pier drilling, crane &amp; trucking services, and more. See why businesses trust S&amp;W Foundation for their construction needs."
        />
        <meta
          name="twitter:image"
          content="https://edycymyofrowahspzzpg.supabase.co/storage/v1/object/public/Images/public/att.webp?t=2024-04-16T20%3A11%3A20.126Z"
        />
    <link rel="icon" href="/android-chrome-512x512.png" type='image/x-icon'/>
    <link rel="canonical" href="https://www.swfoundation.com/gallery" />
    
</Head>


      <div className={styles.main}>
        <GalleryGrid />
       
      </div>
    </>
  )
}
   
