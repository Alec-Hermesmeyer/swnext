import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import styles from '../styles/AdminLayout.module.css';
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
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <button className={styles.toggleSidebarBtn} onClick={toggleSidebar}>
            {isSidebarCollapsed ? 'Show Menu' : 'Hide Menu'}
          </button>
          <h1 className={styles.headerTitle}>Admin</h1>
        </div>
      </div>
     
      <div className={styles.content} style={{ gridTemplateColumns: isSidebarCollapsed ? '0 1fr' : '280px 1fr' }}>
        <aside className={styles.sidebar} style={{ display: isSidebarCollapsed ? 'none' : 'block' }}>
          <Sidebar />
        </aside>
        <main className={styles.main}>{children}</main>
      </div>
      
    </div>
  );
};
export default AdminLayout;
