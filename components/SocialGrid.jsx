import React from 'react';
import Link from 'next/link';
import { Inter } from "next/font/google"
import { FaLinkedin, FaFacebookSquare, FaLocationArrow } from 'react-icons/fa'
import {BsFillTelephoneFill} from 'react-icons/bs'
import styles from '../styles/Grid.module.css'

const inter = Inter({ subsets: ['latin'] })

const SocialGrid = () => {
  return (
    <>
    <div className={styles.grid}>
        <Link
          href="https://www.facebook.com/SWFoundationContractors"
          className={styles.card}
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2 className={inter.className}>
            Facebook <span><FaFacebookSquare /></span>
          </h2>
          <p className={inter.className}>
            Give us a follow&nbsp;!
          </p>
        </Link>

        <Link
          href='https://www.linkedin.com/company/81499019'
          className={styles.card}
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2 className={inter.className}>
            LinkedIn <span><FaLinkedin /></span>
          </h2>
          <p className={inter.className}>
            Give us a follow&nbsp;!
          </p>
        </Link>
        <Link
          href='tel: +2147030484'
          className={styles.card}
          // target="_blank"
          // rel="noopener noreferrer"
        >
          <h2 className={inter.className}>
            Give Us A Call <span><BsFillTelephoneFill /> </span>
          </h2>
          <p className={inter.className}>
            214-703-0484&nbsp;
          </p>
        </Link>

        <Link
          href="https://www.google.com/maps/place/2806+Singleton+St,+Rowlett,+TX+75088/@32.901181,-96.5781154,17.01z/data=!4m5!3m4!1s0x864ea800d0cccb39:0x3140a4ce8b0e4e7!8m2!3d32.9011741!4d-96.5759197"
          className={styles.card}
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2 className={inter.className}>
            Address <span><FaLocationArrow /></span>
          </h2>
          <p className={inter.className}>
            2806 Singleton St., Rowlett, Texas 75088&nbsp;
          </p>
        </Link>

      </div>
    </>

  )
}

export default SocialGrid