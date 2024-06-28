import React from 'react';
import Head from 'next/head';
import styles from '../styles/AdminLayout.module.css';
import Link from 'next/link';
import Sidebar from './Sidebar';

const AdminLayout = ({ children }) => {
  return (
    <div className={styles.container}>
      <Head>
        <title>Admin Dashboard</title>
        <meta name="description" content="Admin Dashboard" />
      </Head>
      <header className={styles.header}></header>
      <aside className={styles.sidebar}><Sidebar /></aside>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}></footer>
    </div>
  );
};

export default AdminLayout;
