import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Sidebar from './Sidebar';

const AdminLayout = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleResize = () => {
    if (window.innerWidth <= 768) {
      setIsSidebarCollapsed(true);
    } else {
      setIsSidebarCollapsed(false);
    }
  };

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Admin Dashboard</title>
        <meta name="description" content="Admin Dashboard" />
      </Head>
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-3 flex items-center justify-between">
          <button 
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
            onClick={toggleSidebar}
          >
            {isSidebarCollapsed ? 'Show Menu' : 'Hide Menu'}
          </button>
          <h1 className="text-xl font-semibold text-gray-900">Admin</h1>
        </div>
      </div>
     
      <div className="grid" style={{ gridTemplateColumns: isSidebarCollapsed ? '0 1fr' : '280px 1fr' }}>
        <aside className={`bg-white shadow-sm ${isSidebarCollapsed ? 'hidden' : 'block'}`}>
          <Sidebar />
        </aside>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};
export default AdminLayout;
