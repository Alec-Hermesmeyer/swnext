import React from 'react';
import Link from 'next/link';
import { Inter } from '@next/font/google'
import styles from '../styles/ServiceGrid.module.css'
import Image from 'next/image';

const inter = Inter({ subsets: ['latin'] })

const LogoImage = () => (
  <Image
    className={styles.logo}
    src='/att.png'
    height={250}
    width={250}
    alt='S&amp;W Foundations Logo'
    loading='lazy'
    quality={80}
  />
);

const ServicesGrid = () => {
  return (
    <>
    <div className={styles.info}>
    <div className={styles.container}>
        <div className={styles.wrapper}>
            <div className={styles.grid}>
                <div className={styles.card}>
                    <h2 className={inter.className}>Pier Drilling</h2>
                   <p className={inter.className}>
                   S&W Foundations specializes in high-quality pier drilling for commercial and industrial projects. With expert teams and advanced technology, we deliver tailored solutions from planning to installation. Trust us for all your pier drilling needs and rest assured that your project is in good hands.  </p>
                   <Link href='contact'><button>Get A Free Quote</button></Link>

                </div>
               
                <div className={styles.card}>
                <h2 className={inter.className}>Limited-Access Pier Drilling</h2>
                   
                   <p className={inter.className}>
                   S&W Foundations offers specialized limited-access pier drilling services for challenging site conditions. Our experienced team and state-of-the-art equipment provide safe and efficient drilling in hard-to-reach areas. Trust us for quality and safety in all your limited-access pier drilling needs.</p>
                     <Link href='contact'><button>Get A Free Quote</button></Link>
                </div>
                <div className={styles.card}>
                    <h2 className={inter.className}>Turn-Key Drilling Solutions</h2>
                   <p className={inter.className}>
                   S&W Foundations provides turn-key drilling solutions through a versatile, experienced team and state-of-the-art fleet. We offer a wide range of services for all your drilling needs. Choose us for skilled labor and complete solutions.</p>
                     <Link href='contact'><button>Get A Free Quote</button></Link>
                </div>
                <div className={styles.card}>
                    <h2 className={inter.className}>Crane Services</h2>
                   <p className={inter.className}>
                   S&W Foundations offers reliable crane services with a fleet of well-maintained cranes and experienced operators for a variety of lifting and hoisting needs, ensuring safety and efficiency in every project. Trust us for all your crane service needs.  </p>
                   <Link href='contact'><button>Get A Free Quote</button></Link>

                </div>
               
                <div className={styles.card}>
                     <LogoImage />
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
    </>
  )
}

export default ServicesGrid