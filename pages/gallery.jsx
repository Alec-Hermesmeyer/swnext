import React from 'react'
import styles from '@/styles/Gallery.module.css'
import Head from 'next/head'
import GalleryGrid from '@/components/GalleryGrid'


export default function Gallery() {
    return (
        <>
        <Head>
    <title>Project Gallery | S&W Foundation - Dallas, TX's Premier Pier Drilling Specialists</title>
    <meta name="description" content="Explore S&W Foundation's project gallery to witness our expertise in commercial pier drilling. From warehouses to hospitals, our Dallas, TX-based team delivers precision, safety, and excellence in every project." />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    
    <meta property="og:title" content="Project Gallery | S&W Foundation - Leading Pier Drilling Projects in Dallas, TX" />
    <meta property="og:description" content="Dive into S&W Foundation's gallery, showcasing top-tier pier drilling projects across Dallas, TX and the wider US. Experience our dedication to quality firsthand." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://www.swfoundation.com/gallery/" />
{/*     <meta property="og:image" content="https://www.swfoundation.com/images/gallery-cover.jpg" /> <!-- This should be a representative image from the gallery --> */}
    <meta property='og:site_name' content='S&W Commercial Pier Drilling' />
    
    <link rel="icon" href="/android-chrome-512x512.png" type='image/x-icon'/>
</Head>

      <div className={styles.main}>
        <GalleryGrid />
       
      </div>
    </>
  )
}
   
