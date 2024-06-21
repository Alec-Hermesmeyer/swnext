import React from 'react';
import Head from 'next/head';
import styles from '../styles/AdminLayout.module.css';
import Link from 'next/link';
import Sidebar from './Sidebar';



// function Sidebar() {
//   return (
//     <aside className={styles.sidebar}>
//       <div className={styles.sidebarContainer}>
//         <div className={styles.sidebarWrapper}>
//         <div className={styles.sidebarTop}>
//             {/* <Logout /> */}
//         </div>
//         <div className={styles.sidebarCenter}>
//           <nav className={styles.nav}>
//             <ul className={styles.navMenu}>
//               <li className={styles.navItem}>
//               <Link href="/admin">Dashboard</Link>
//               </li>
//               <li className={styles.navItem}>
//                 <Link href="/admin/contact">Contact Submissions</Link>
//               </li>
//               {/* <li className={styles.navItem}>
//                 <Link href="/admin/careers">
//                   <a className={styles.navLink}>Careers</a>
//                 </Link>
//               </li>
//               <li className={styles.navItem}>
//                 <Link href="/admin/logout">
//                   <a className={styles.navLink}>Logout</a>
//                 </Link>
//               </li> */}
//             </ul>
//           </nav>
//           </div>
//         </div>
//       </div>
//     </aside>
//   );
// }
// function Logout() {
//     const { logout } = useAuth();
//     return (
//       <button className={styles.logoutBtn} onClick={logout}>
//         Logout
//       </button>
//     );
//   }


const AdminLayout = ({ children }) => {
  return (
    <div className={styles.container}>
      <Head>
        <title>Admin Dashboard</title>
        <meta name="description" content="Admin Dashboard" />
      </Head>
      <header className={styles.header}>Admin Header</header>
      {/* <aside className={styles.sidebar}>Admin Sidebar</aside> */}
      
      <main className={styles.main}>
        <div className={styles.left}><Sidebar /></div>
        <div className= {styles.right}>{children}</div>
      
      </main>
      <footer className={styles.footer}>Admin Footer</footer>
    </div>
  );
};

export default AdminLayout;