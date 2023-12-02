import React from 'react'
import Footer from './Footer'
// import Mobile from './Mobile'
// import Navbar from './Navbar'
import styles from '../styles/Layout.module.css'
import Nav from './Nav'



const Layout = ({ children }) => {
  return (
    <>
    <nav className={styles.nav}>
     <Nav />
    </nav>
    <div className={styles.container}>
      
        <main className={styles.main}>{children}</main>
    </div>
    <footer className={styles.footer}>
      <Footer />
    </footer>
    
    </>
  )
}

export default Layout