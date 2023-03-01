import React from 'react'
import styles from '@/styles/Gallery.module.css'
import Head from 'next/head'
import GalleryGrid from '@/components/GalleryGrid'


export default function Gallery() {
    return (
        <>
        <Head>
        <title>S&W Foundation</title>
        <meta name="description" content="Commercial Pier Drilling" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <GalleryGrid />
       
      </div>
    </>
  )
}
   
