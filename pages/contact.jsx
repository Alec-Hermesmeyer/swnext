import React from 'react'
import Form from '../components/Form'
import Image from 'next/image'
import logo from '../public/slider1.jpeg'
import Head from 'next/head'
import styles from '../styles/Contact.module.css'
import JobForm from '@/components/JobForm'


export default function Contact() {

  return (
    <>
      <Head>
    <title>Contact S&W Foundation | Commercial Pier Drilling Specialists in Dallas, TX</title>
    <meta name="description" content="Reach out to S&W Foundation, the leading specialists in commercial pier drilling across Dallas, TX and the wider US. Let's discuss how our expertise, advanced equipment, and commitment to safety can serve your project." />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="keywords" content="contact, commercial pier drilling, Dallas, TX, S&W Foundation, quote, project consultation, advanced equipment, safety, leading specialists, US"/>
    <meta property="og:title" content="Contact S&W Foundation | Commercial Pier Drilling Specialists in Dallas, TX" />
    <meta property="og:description" content="Looking for top-tier commercial pier drilling services in the US? Get in touch with S&W Foundation today for a comprehensive quote and experience our commitment to excellence." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://www.swfoundation.com/contact/" />
    <meta property="og:image" content="https://www.swfoundation.com/images/form.png" />
    <meta property='og:site_name' content='S&W Commercial Pier Drilling' />
    <link rel="canonical" href="https://www.swfoundation.com/contact" />
    <link rel="icon" href="/android-chrome-512x512.png" type='image/x-icon'/>
</Head>
      <div className={styles.contact}>
        <div className={styles.container}>
          <div className={styles.wrapper}>
            <div className={styles.left}>
              <div className={styles.leftContainer}>
                <div className={styles.leftWrapper}>
                  <Image
                    src={logo}
                    className={styles.logo}
                    alt='form logo'
                    width={500}
                    height={771}
                    priority
                  />
                </div>
              </div>
            </div>
            <div className={styles.right}>
              <section className={styles.rightContainer}>
                <section className={styles.top}>
                  <Form />
                </section>
                <section className={styles.bottom}>
                  <JobForm />
                </section>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
