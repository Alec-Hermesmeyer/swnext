import React from 'react'
import Image from 'next/image'
import styles from '../styles/AboutHero.module.css'
import Link from 'next/link'
import { Inter } from "next/font/google"


const inter = Inter({ subsets: ['latin'] })

const AboutHero = () => {
  return (
    <>
           <div className={styles.hero}>
            <div className={styles.container}>
                <div className={styles.wrapper}>
                    <div className={styles.left}>
                        <div className={styles.leftContent}>
                            <h1 className={inter.className}>About Us</h1>
                            <span className={styles.contact}><Link href='/contact'><button>Get A Free Quote</button></Link>
                                 </span>
                        </div>
                        <Image
                            className={styles.heroImg}
                            src='/home.jpeg'
                            height={520}
                            width={520}
                            quality={80}
                            alt="Commercial Drilling Rig" 
                            loading='eager'
                            priority/>


                    </div>
                    <div className={styles.right}>
                        <div className={styles.rightContainer}>
                        <div className={styles.grid}>
                            <div

                                className={styles.card}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <h2 className={inter.className}>
                                <span>-&gt;</span> Where Family Comes First
                                </h2>
                                <p className={inter.className}>
                                We prioritize creating a positive and inclusive company culture.&nbsp;
                                </p>
                            </div>

                            <div
                                className={styles.card}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <h2 className={inter.className}>
                                    <span>-&gt;</span> People Over Profit
                                </h2>
                                <p className={inter.className}>
                                 S&W&apos;s top priority is Safety and we dedicate ourselves to educating all employees.&nbsp;
                                </p>
                            </div>

                            <div
                                className={styles.card}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <h2 className={inter.className}>
                                    <span>-&gt;</span> Safe and secure, every project
                                </h2>
                                <p className={inter.className}>
                                Safety is at the core of everything we do and remains our top priority!&nbsp;
                                </p>
                            </div>

                            <div
                                className={styles.card}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <h2 className={inter.className}>
                                    <span>-&gt;</span> Customer Satisfaction
                                </h2>
                                <p className={inter.className}>
                                We are dedicated to delivering quality work and exceptional customer service, ensuring your satisfaction with every project.&nbsp;
                                </p>
                            </div>
                        </div>
                           
                           
                        </div>

                    </div>
                </div>
            </div>
        </div>
          </>
  )
}

export default AboutHero