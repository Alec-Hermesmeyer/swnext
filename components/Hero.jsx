import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Inter } from '@next/font/google';
import styles from '@/styles/Hero.module.css';

const inter = Inter({ subsets: ['latin'] });


const Hero = () => {

  return (

    <>
           <div className={styles.hero}>
            <div className={styles.container}>
                <div className={styles.wrapper}>
                    <div className={styles.left}>
                        <div className={styles.leftContent}>
                            <h1 className={inter.className}>Drilling Beyond Limits</h1>
                            <span className={styles.contact}><Link href='/contact'><button>Get A Free Quote</button></Link>
                                 </span>
                        </div>
                        <Image
                            className={styles.heroImg}
                            src='/heroImg1.png'
                            height={620}
                            width={720}
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
                                <span>-&gt;</span> 13-Time ADSC Safety Award Winner
                                </h2>
                                <p className={inter.className}>
                                Fully-licensed and insured by the Texas State License Board.&nbsp;
                                </p>
                            </div>

                            <div
                                className={styles.card}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <h2 className={inter.className}>
                                    <span>-&gt;</span> Experienced and Knowledgable
                                </h2>
                                <p className={inter.className}>
                                Privately-owned and locally-operated for more than 30 years.&nbsp;
                                </p>
                            </div>

                            <div
                                className={styles.card}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <h2 className={inter.className}>
                                    <span>-&gt;</span> Limited Access Pier Drilling Specialist
                                </h2>
                                <p className={inter.className}>
                                Working conditions cramped? Not an issue for S&W Foundations Contractors Inc.!&nbsp;
                                </p>
                            </div>

                            <div
                                className={styles.card}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <h2 className={inter.className}>
                                    <span>-&gt;</span> Nation-Wide Service
                                </h2>
                                <p className={inter.className}>
                                Here at S&W Foundation Contractors Inc. we offer our services Nation-Wide!.&nbsp;
                                </p>
                            </div>
                        </div>
                           
                           
                        </div>

                    </div>
                </div>
            </div>
        </div>
          </>
  );
};
export default Hero;