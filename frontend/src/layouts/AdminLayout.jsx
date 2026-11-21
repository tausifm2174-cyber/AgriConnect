import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content-wrapper" style={{ marginLeft: 0 }}>
        <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} title="Admin Command Center" />
        <main className="page-container">
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .main-content-wrapper {
            margin-left: var(--sidebar-width) !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;
