"use client"
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '@/styles/EnhancedContent.module.css';
import Input from "@/components/Input";
import Button from "@/components/Button";
import DropdownMenu from "@/components/Dropdown-menu";
import Breadcrumb from "@/components/Breadcrumb";
import Sheet from "@/components/Sheet";
import { MenuIcon, LayoutGridIcon, SearchIcon } from '@/components/Icons'; // Assuming you have an icon set
import { Globe } from 'lucide-react';
const EnhancedContent = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  const { pathname } = useRouter();
const paths = pathname.split('/').filter(Boolean);

  return (
    <div className={styles.content}>
      <header className={styles.header}>
        {/* Sidebar Menu Sheet */}
        <Sheet>
          <Sheet.Trigger asChild>
            <Button variant='outline' className={styles.menuButton}>
              <MenuIcon className={styles.icon} />
            </Button>
          </Sheet.Trigger>
          <Sheet.Content side="left" className={styles.sheetContent}>
            <nav className={styles.sheetNav}>
              <Link href="/" className={styles.sheetLink} prefetch={false}>
                <LayoutGridIcon className={styles.icon} />
                <span className="sr-only">Acme Productivity</span>
              </Link>
              {/* Repeat for other links */}
            </nav>
          </Sheet.Content>
        </Sheet>

        {/* Breadcrumb Navigation */}
        <Breadcrumb className={styles.breadcrumb}>
    <Breadcrumb.List>
      
      {paths.map((path, index) => (
        <Breadcrumb.Item  key={index}>
          <Breadcrumb.Link href={`/${paths.slice(0, index + 1).join('/')}`}>
            {path.charAt(0).toUpperCase() + path.slice(1)}
          </Breadcrumb.Link>
          <span className={styles.breadcrumbDivider}>/</span>
        </Breadcrumb.Item>
      ))}
    </Breadcrumb.List>
  </Breadcrumb>

        {/* Search Bar */}
        <div className={styles.searchContainer}>
          <SearchIcon className={styles.searchIcon} />
          <Input
            type="search"
            placeholder="Search..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>

        {/* Account Dropdown */}
        <DropdownMenu>
          <DropdownMenu.Trigger asChild>
            <Button variant="outline" className={styles.avatarButton}>
              <Globe className={styles.icon} />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end">
            <DropdownMenu.Label>My Account</DropdownMenu.Label>
            <DropdownMenu.Item onClick={() => alert('Profile clicked')}>
              Profile
            </DropdownMenu.Item>
            <DropdownMenu.Item onClick={() => alert('Settings clicked')}>
              Settings
            </DropdownMenu.Item>
            <DropdownMenu.Separator />
            <DropdownMenu.Item onClick={() => alert('Logout clicked')}>
              Logout
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      </header>
    </div>
  );
};

export default EnhancedContent;
