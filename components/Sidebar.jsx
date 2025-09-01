// Sidebar.jsx
import React from 'react';
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
    <aside className="w-full h-full bg-gray-50 border-r border-gray-200">
      <nav className="p-4 space-y-2">
          <Tooltip.Provider>
            <Link href="/admin/dashboard" className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 hover:text-gray-900" prefetch={false}>
              <LayoutGridIcon className="h-5 w-5" />
              <span className="text-sm font-medium">Dashboard</span>
            </Link>
            <Tooltip>
              <Tooltip.Trigger asChild>
                <Link
                  href="/admin/sales"
                  className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 hover:text-gray-900"
                  prefetch={false}
                >
                  <CalendarIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">Sales</span>
                </Link>
              </Tooltip.Trigger>
              <Tooltip.Content side="right">Sales</Tooltip.Content>
            </Tooltip>
            <Tooltip>
              <Tooltip.Trigger asChild>
                <Link
                  href="/admin/contact"
                  className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 hover:text-gray-900"
                  prefetch={false}
                >
                  <ClipboardIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">Contact Form</span>
                </Link>
              </Tooltip.Trigger>
              <Tooltip.Content side="right">Contact Forms</Tooltip.Content>
            </Tooltip>
            <Tooltip>
              <Tooltip.Trigger asChild>
                <Link
                  href="/admin/company-contacts"
                  className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 hover:text-gray-900"
                  prefetch={false}
                >
                  <StickyNoteIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">Company Contacts</span>
                </Link>
              </Tooltip.Trigger>
              <Tooltip.Content side="right">Company Contacts</Tooltip.Content>
            </Tooltip>
            <Tooltip>
              <Tooltip.Trigger asChild>
                <Link
                  href="/admin/careers"
                  className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 hover:text-gray-900"
                  prefetch={false}
                >
                  <StickyNoteIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">Careers</span>
                </Link>
              </Tooltip.Trigger>
              <Tooltip.Content side="right">Careers</Tooltip.Content>
            </Tooltip>
            <Tooltip>
              <Tooltip.Trigger asChild>
                <Link
                  href="/admin/jobs"
                  className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 hover:text-gray-900"
                  prefetch={false}
                >
                  <SettingsIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">Jobs</span>
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
