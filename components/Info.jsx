import React, { useState } from 'react'
import { Inter } from "next/font/google"
import { BsBookHalf, BsFillCompassFill } from 'react-icons/bs'
import { SiYourtraveldottv } from 'react-icons/si'

import styles from '@/styles/Info.module.css'
import Image from 'next/image'


const inter = Inter({ subsets: ['latin'] })
export default function Info() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const handleCloseModal = () => {
        setIsModalOpen(false);
    }

    return (
        <>
            <div className={styles.info}>
                <div className={styles.container}>
                    <div className={styles.wrapper}>
                        <div className={styles.grid}>
                            <div className={styles.card}>
                                <h2>Our Story</h2>
                                <span className={styles.cardIcon}><BsBookHalf /></span>
                                <a href='#modal'> <button onClick={() => setIsModalOpen(true)}>Click here to find out!</button></a>
                                {isModalOpen && (
                                    <div className={styles.modal} id="modal">
                                        <div className={styles.modalContent}>
                                            <h2 className={inter.className}>S&amp;W Foundation Contractors offers an unmatched combination of customer service, experience,
                                                equipment and safety.
                                            </h2>
                                            <p className={inter.className}>At S&amp;W Foundation Contractors, our story is one of family, hard work, and dedication. Founded in 1986 in Rowlett, Texas, our business has grown to become a leader in the pier drilling industry, with a reputation for providing reliable, high-quality solutions to clients across the United States. Today, we remain a family-owned and operated business, with a commitment to upholding the values of honesty, integrity, and excellence that have been at the core of our success for over 35 years. From our state-of-the-art equipment to our team of experienced professionals, every aspect of our business is designed to meet the needs of our clients and exceed their expectations. We take pride in our work and in the relationships we have built with our clients, and we look forward to continuing to serve the construction industry for many years to come.
                                            </p>
                                            <button onClick={handleCloseModal}>Close</button>
                                        </div>

                                    </div>
                                )}

                            </div>

                            <div className={styles.card}>
                                <h2>Our Values</h2>
                                <span className={styles.cardIcon}><BsFillCompassFill /></span>
                                <a href='#modal2'> <button onClick={() => setIsModalOpen(true)}>Click here to find out!</button></a>
                                {isModalOpen && (
                                    <div className={styles.modal2} id="modal2">
                                        <div className={styles.modalContent}>
                                            <Image
                                                className={styles.modalImg}
                                                src='/coreValue.jpg'
                                                height={550}
                                                width={700}
                                                quality={80}
                                                alt='Core Values'
                                            />
                                            <button onClick={handleCloseModal}>Close</button>
                                        </div>

                                    </div>

                                )}
                            </div>
                            <div className={styles.card}>
                                <h2>Our Mission</h2>
                                <span className={styles.cardIcon}><SiYourtraveldottv /></span>
                                <a href='#modal3'> <button onClick={() => setIsModalOpen(true)}>Click here to find out!</button></a>
                                {isModalOpen && (
                                    <div className={styles.modal3} id="modal3">
                                        <div className={styles.modalContent}>
                                            <h2 className={inter.className}>S&amp;W Foundation Contractors Mission Statement:
                                            </h2>
                                            <p className={inter.className}>We will provide industry leading foundation drilling services that exceed our clients expectations
                                                by adhering to our core values, promoting a safe work environment, and holding eachother accountable
                                                to the highest standards.
                                            </p>
                                            <button onClick={handleCloseModal}>Close</button>
                                        </div>

                                    </div>
                                )}
                            </div>

                        </div>

                    </div>
                </div>

            </div>
        </>

    )
}