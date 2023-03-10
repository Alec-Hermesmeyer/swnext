import React from 'react'
import Form from '../components/Form'
import Image from 'next/image'
import logo from '../public/form.png'
import Head from 'next/head'
import styles from '../styles/Contact.module.css'


export default function Contact() {

  return (
    <>
    <Head>
        <title>Contact S&amp;W Foundation | Industrial Foundation Repair Experts </title>
        <meta name="description" content="S&amp;W Foundation provides high-quality commercial pier drilling services in the United States. Contact us today for a quote! Trust S&amp;W for and unmatched combo of expierience, equipment and safety" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Contact S&amp;W Foundation | Industrial Foundation Repair Experts" />
        <meta property="og:description" content="Contact S&amp;W Foundation provides high-quality commercial pier drilling services in the United States. Contact us today for a quote!" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.swfoundation.com/contact/" />
        <meta property="og:image" content="https://www.swfoundation.com/images/form.png" />
        <meta property='og:site_name' content='S&amp;W Foundation Repair Contractors' />
      </Head>
    <div className={styles.contact}>
      <div className={styles.container}>
        <div className={styles.wrapper}>
          <div className={styles.left}>
            <Image
              src={logo}
              className={styles.logo}
              alt='form logo'
              width={380}
              height={380}
              priority
            />
          </div>
          <div className={styles.right}>
            <Form />
          </div>

        </div>
      </div>
      
    </div>
    </>
  )
}
