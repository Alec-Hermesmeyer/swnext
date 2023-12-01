import React from 'react'
// import Image from 'next/image'
import { Inter } from "next/font/google"
// import { BsBookHalf, BsFillCompassFill } from 'react-icons/bs'
// import { SiYourtraveldottv } from 'react-icons/si'
// import Link from 'next/link'
import styles from '@/styles/AboutGrid.module.css'


const inter = Inter({ subsets: ['latin'] })
export default function AboutGrid() {
    return (
        <>
        <div className={styles.info}>
            <div className={styles.container}>
                <div className={styles.wrapper}>
                    <div className={styles.grid}>
                        <div className={styles.card}>
                            <h2 className={inter.className}>Trusted by Clients Nationwide</h2>
                           <p className={inter.className}>
Since 1986, S&W Foundation Contractors has been a leading family-owned and operated pier drilling company based in Rowlett, Texas, serving clients throughout the United States. Our commitment to providing reliable and efficient foundation pier drilling solutions has earned us a reputation for excellence in the industry. Our team of experts, equipped with the latest drilling technology and equipment, works closely with our clients to ensure their project requirements are met with precision and efficiency. From limited access pier drilling to soil retention and crane services, we offer a wide range of drilling solutions to meet your specific needs. </p>

                        </div>
                       
                        <div className={styles.card}>
                            <h2 className={inter.className}>Experience Counts</h2>
                           
                           <p className={inter.className}>S&W Foundation Contractors is a name you can trust for all your foundation pier drilling needs. Our team of skilled professionals is equipped with the latest technology and techniques to provide innovative drilling solutions tailored to your specific requirements. We take pride in operating one of the largest fleets of limited access pier drilling equipment in the United States, ensuring that we have the right tools and equipment for any job, no matter how complex. Our commitment to safety and efficiency in every project means you can rely on us to deliver high-quality drilling services that exceed your expectations. </p>

                        </div>
                        <div className={styles.card}>
                            <h2 className={inter.className}>Pier Drilling Services To Fit Your Needs</h2>
                           <p className={inter.className}>At S&W Foundations, we aim to be your one-stop-shop for all your pier drilling needs. With over 30 years of experience in the industry, we offer comprehensive drilling services for commercial and industrial projects across the United States.  Whether you require supplementary labor or a complete product, we offer a wide range of services delivered by our versatile and experienced team, backed by a state-of-the-art fleet. Trust us to provide reliable, efficient, and cost-effective solutions to meet your drilling needs. Your hole is our goal!</p>
                           <br></br>

                        </div>
                    </div>

                </div>
            </div>
                
        </div>
        </>

    )
}