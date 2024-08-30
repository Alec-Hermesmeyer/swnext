// Sidebar.jsx
import React from 'react';
import styles from '../styles/AdminLayout.module.css';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Logout from './Logout';
import { Lato } from "next/font/google";


const lato = Lato({ weight: ["900"], subsets: ["latin"] });

function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarContainer}>
        <div className={styles.sidebarWrapper}>
          <div className={styles.sidebarTop}>
          
          </div>
          <div className={styles.sidebarCenter}>
            <nav className={styles.nav}>
              <ul className={styles.navMenu}>
                <li className={styles.navItem}>
                  <Link className={lato.className} href="/admin/dashboard">Dashboard</Link>
                </li>
                <li className={styles.navItem}>
                  <Link className={lato.className} href="/admin/contact">Contact Forms</Link>
                </li>
                <li className={styles.navItem}>
                  <Link className={lato.className} href="/admin/company-contacts">Company Contacts</Link>
                </li>
                <li className={styles.navItem}>
                  <Link className={lato.className} href="/admin/job-openings">Job Openings</Link>
                </li>
                <li className={styles.navItem}>
                  <Link className={lato.className} href="/admin/sales">Sales</Link>
                </li>
              </ul>
            </nav>
          </div>
          <div className={styles.sidebarBottom}>
          <Logout />
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
