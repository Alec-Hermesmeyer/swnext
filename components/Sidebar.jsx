// Sidebar.jsx
import React from 'react';
import styles from '../styles/AdminLayout.module.css';
import Link from 'next/link';
import Tooltip from "@/components/Tooltip";
import {
  CalendarIcon,
  LayoutGridIcon,
  ClipboardIcon,
  StickyNoteIcon,
  SettingsIcon,
} from "@/components/Icons";
import Logout from "@/components/Logout";
import { useAuth } from '@/context/AuthContext';
import { Lato } from "next/font/google";


const lato = Lato({ weight: ["900"], subsets: ["latin"] });

function Sidebar() {
  
  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
          <Tooltip.Provider>
            <Link href="/admin/dashboard" className={styles.tooltipProvider} prefetch={false}>
              <LayoutGridIcon className={styles.icon} />
              <span className={styles.iconSpan}>S&W Foundation</span>
            </Link>
            <Tooltip>
              <Tooltip.Trigger asChild>
                <Link
                  href="/admin/sales"
                  className={styles.tooltipProvider}
                  prefetch={false}
                >
                  <CalendarIcon className={styles.icon} />
                  <span className={styles.iconSpan}>Calendar</span>
                </Link>
              </Tooltip.Trigger>
              <Tooltip.Content side="right">Sales</Tooltip.Content>
            </Tooltip>
            <Tooltip>
              <Tooltip.Trigger asChild>
                <Link
                  href="/admin/contact"
                  className={styles.tooltipProvider}
                  prefetch={false}
                >
                  <ClipboardIcon className={styles.icon} />
                  <span className={styles.iconSpan}>Contact Form</span>
                </Link>
              </Tooltip.Trigger>
              <Tooltip.Content side="right">Contact Forms</Tooltip.Content>
            </Tooltip>
            <Tooltip>
              <Tooltip.Trigger asChild>
                <Link
                  href="/admin/company-contacts"
                  className={styles.tooltipProvider}
                  prefetch={false}
                >
                  <StickyNoteIcon className={styles.icon} />
                  <span className={styles.iconSpan}>Company Contacts</span>
                </Link>
              </Tooltip.Trigger>
              <Tooltip.Content side="right">Company Contacts</Tooltip.Content>
            </Tooltip>
            <Tooltip>
              <Tooltip.Trigger asChild>
                <Link
                  href="/admin/jobs"
                  className={styles.tooltipProvider}
                  prefetch={false}
                >
                  <SettingsIcon className={styles.icon} />
                  <span className={styles.iconSpan}>Jobs</span>
                </Link>
              </Tooltip.Trigger>
              <Tooltip.Content side="right">Job Openings</Tooltip.Content>
            </Tooltip>
          </Tooltip.Provider>
          <Logout />
        </nav>
      </aside>
  );
}

export default Sidebar;
