import React from 'react'
import Image from 'next/image'
import styles from '../styles/ServiceHero.module.css'
import Link from 'next/link'
import { Inter } from '@next/font/google'


const inter = Inter({ subsets: ['latin'] })
export default function ServiceHero() {
    return (
          <>
           <div className={styles.hero}>
            <div className={styles.container}>
                <div className={styles.wrapper}>
                    <div className={styles.left}>
                        <div className={styles.leftContent}>
                            <h1 className={inter.className}>Services</h1>
                            <span className={styles.contact}><Link href='/contact'><button>Get A Free Quote</button></Link>
                                 </span>
                        </div>
                        <Image
                            className={styles.heroImg}
                            src='/galleryImages/gal18.jpeg'
                            height={520}
                            width={520}
                            quality={100}
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
                                <span>-&gt;</span> Pier Driling Experts 
                                </h2>
                                <p className={inter.className}>
                                    S&W offers more knowledge and better equipment than your average driller&nbsp;.
                                </p>
                            </div>

                            <div
                                className={styles.card}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <h2 className={inter.className}>
                                    <span>-&gt;</span> Safe and Professional 
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
                                    <span>-&gt;</span> Top Of The Line Equipment
                                </h2>
                                <p className={inter.className}>
                                  We are proudly able to offer the best equipment on the market to our clients&nbsp; 
                                </p>
                            </div>

                            <div
                                className={styles.card}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <h2 className={inter.className}>
                                    <span>-&gt;</span> We Aim To Please
                                </h2>
                                <p className={inter.className}>
                                    Here at&nbsp;S&W Foundation Contractors Inc. we pride ourselves on doing quality work and keeping our clients projects on schedule!
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