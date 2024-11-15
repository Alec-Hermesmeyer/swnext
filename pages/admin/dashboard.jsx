import React from "react";
import Link from "next/link";
import Tooltip from "@/components/Tooltip";
import {
  CalendarIcon,
  CheckIcon,
  LayoutGridIcon,
  ClipboardIcon,
  StickyNoteIcon,
  SettingsIcon,
  MenuIcon,
  SearchIcon,
} from "@/components/Icons";
import Logout from "@/components/Logout";
import withAuth from "@/components/withAuth";
import styles from "@/styles/Dashboard.module.css";
import TaskManager from "@/components/TaskManager";
import EnhancedContent from "@/components/EnhancedContent";
import Sales from "./sales";
import SalesChart from "@/components/SalesChart";

// Check to see if any components are undefined

function Dashboard() {
  return (
    <div className={styles.dashboard}>
      <aside className={styles.aside}>
        <nav className={styles.nav}>
          <Tooltip.Provider>
            <Link href="/" className={styles.tooltipProvider} prefetch={false}>
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
                  href="/admin/job-openings"
                  className={styles.tooltipProvider}
                  prefetch={false}
                >
                  <SettingsIcon className={styles.icon} />
                  <span className={styles.iconSpan}>Job Openings</span>
                </Link>
              </Tooltip.Trigger>
              <Tooltip.Content side="right">Job Openings</Tooltip.Content>
            </Tooltip>
          </Tooltip.Provider>
          <Logout />
        </nav>
      </aside>
      <div className={styles.header}>
        <EnhancedContent />
      </div>
      <div className={styles.main}>
      <section className={styles.section}>
        
        <TaskManager />
        <SalesChart />
      </section>
      </div>
    </div>
  );
}

export default withAuth(Dashboard);
