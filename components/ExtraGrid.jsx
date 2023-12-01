import React from 'react';
import Link from 'next/link';
import { Inter } from "next/font/google"
import styles from '../styles/ServiceGrid.module.css'

const inter = Inter({ subsets: ['latin'] })

const ExtraGrid = () => {
  return (
    <div className={styles.info}>
    <div className={styles.container}>
        <div className={styles.wrapper}>
            <div className={styles.grid}>
                <div className={styles.card}>
                    <h2 className={inter.className}>Crane Services</h2>
                   <p className={inter.className}>
                   S&W Foundations offers reliable crane services with a fleet of well-maintained cranes and experienced operators for a variety of lifting and hoisting needs, ensuring safety and efficiency in every project. Trust us for all your crane service needs.  </p>
                   <Link href='contact'><button>Get A Free Quote</button></Link>

                </div>
               
                <div className={styles.card}>
                    <h2 className={inter.className}>Trucking Services</h2>
                   
                   <p className={inter.className}>
                   S&W Foundations offers reliable and efficient trucking services for your construction project with a modern fleet of trucks and experienced drivers available for hauling a variety of materials, from construction equipment to debris removal, to ensure your project runs smoothly and on schedule. Trust us for all your trucking needs.</p>
                     <Link href='contact'><button>Get A Free Quote</button></Link>
                </div>
                <div className={styles.card}>
                    <h2 className={inter.className}>Soil Retention</h2>
                   <p className={inter.className}>
                   S&W Foundations provides comprehensive soil retention services with advanced technology and techniques for safe and efficient completion of your construction project, offering a wide range of tailored services for temporary shoring. Trust us for quality soil retention solutions.</p>
                     <Link href='contact'><button>Get A Free Quote</button></Link>
                </div>
            </div>

        </div>
    </div>
        
</div>
  )
}

export default ExtraGrid