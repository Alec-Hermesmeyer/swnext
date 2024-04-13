import React from 'react';
import Link from 'next/link';
import { Inter } from "next/font/google"
import styles from '../styles/Grid.module.css'
import handler from '@/pages/api/gridData';



const inter = Inter({ subsets: ['latin'] })

const Grid = ({ data }) => {
  return (
    <>
      <div className={styles.grid}>
        {data.map(item => (
          <Link
            key={item.id}
            href={item.url}
            className={styles.card}
          >
            <h2 className={inter.className}>
              {item.title} <span>-&gt;</span>
            </h2>
            <p className={inter.className}>
              {item.description}
            </p>
          </Link>
        ))}
      </div>
    </>
  )
}


export default Grid

