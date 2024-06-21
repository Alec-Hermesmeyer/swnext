import React from 'react';
import styles from '../styles/AdminLayout.module.css';
import Link from 'next/link';


// function Logout() {
//     const { logout } = useAuth();
//     return (
//       <button className={styles.logoutBtn} onClick={logout}>
//         Logout
//       </button>
//     );
  
// }

function Sidebar() {
    // const { logout } = useAuth();
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
                <Link href="/admin/admin">Dashboard</Link>
                </li>
                <li className={styles.navItem}>
                  <Link href="/admin/contact">Contact Submissions</Link>
                </li>
                <li className={styles.navItem}>
                  <Link href="/admin/company-contacts">Company Contacts</Link>
                </li>
                <li className={styles.navItem}>
                  <Link href="/admin/job-openings">Job Openings</Link>
                </li>
              </ul>
            </nav>
            </div>
            <div className={styles.sidebarBottom}></div>
          </div>
        </div>
      </aside>
    );
  }
  export default Sidebar;