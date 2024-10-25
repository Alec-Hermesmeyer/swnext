import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import styles from '../styles/AdminLayout.module.css';
import Link from 'next/link';
import Sidebar from './Sidebar';

const AdminLayout = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleResize = () => {
    if (window.innerWidth <= 768) { // Adjust the breakpoint as needed
      setIsSidebarCollapsed(true);
    } else {
      setIsSidebarCollapsed(false);
    }
  };

  useEffect(() => {
    handleResize(); // Set the initial state based on the current viewport size
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);


  return (
    <div className={styles.container}>
      <Head>
        <title>Admin Dashboard</title>
        <meta name="description" content="Admin Dashboard" />
      </Head>
      
     
      <div className={`${styles.content} ${isSidebarCollapsed ? styles.fullWidth : ''}`}>
        {/* {!isSidebarCollapsed && (
          <aside className={styles.sidebar}>
            <Sidebar />

        
          </aside>
          
        )} */}
        <main className={styles.main}>{children}</main>
      </div>
      
    </div>
  );
};
export default AdminLayout;
