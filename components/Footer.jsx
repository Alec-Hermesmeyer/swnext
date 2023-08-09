import React from 'react'
import Link from 'next/link'
import { FaLinkedin, FaFacebookSquare, FaLocationArrow } from 'react-icons/fa'
import { BsFillTelephoneFill } from 'react-icons/bs'
import styles from '../styles/Footers.module.css'

const Footer = () => {
  return (
    <>
      <div className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.wrapper}>
            <div className={styles.top}>
              <div className={styles.left}>
                <div className={styles.leftIcons} style={{ color: 'white' }}>
                  
                </div>
              </div>
              <div className={styles.center}>
                <ul>
                  <li>
                    <Link href='/'>
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link style={{ color: 'white' }} href='/about'>About</Link>
                  </li>
                  <li>
                    <Link style={{ color: 'white' }} href='/contact'>Contact</Link>
                  </li>
                  <li>
                    <Link style={{ color: 'white' }} href='/services'>Services</Link>
                  </li>
                  <li>
                    <Link style={{ color: 'white' }} href='/gallery'>Gallery</Link>
                  </li>
                  
                </ul>
              </div>
              <div className={styles.right}>
                <div className={styles.socialIcons}>
                  <a href='https://www.facebook.com/SWFoundationContractors' target="_blank" rel="noopener noreferrer"><FaFacebookSquare /></a>
                  <a href='https://www.linkedin.com/company/81499019' target="_blank" rel="noopener noreferrer"><FaLinkedin /></a>
                </div>
              </div>

            </div>
            <div className={styles.bottom}>
              <div className={styles.bottomLeft}>
              &#169;2023 S&amp;W Foundation. All Rights Reserved | <Link href='/'>Site Map</Link> |  <Link href='/'>Privacy Policy</Link> |  <Link href='/'>Terms of Use</Link> 
              <br></br>
               <Link href='https://www.google.com/maps/place/S%26W+Foundation+Contractors,+Inc/@32.9011454,-96.5784943,17z/data=!3m1!4b1!4m5!3m4!1s0x864c1f00ef50672f:0xdd234fc753135183!8m2!3d32.9011454!4d-96.5759194' target="_blank" rel="noopener noreferrer">2806 Singleton St, Rowlett, TX 75088</Link><br></br>
                   214-703-0484
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Footer