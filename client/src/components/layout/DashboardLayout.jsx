import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { FiMenu } from 'react-icons/fi';

/**
 * Dashboard layout wrapper with sticky Navbar + collapsible Sidebar + main content area.
 * Supports mobile drawer sidebar via hamburger toggle.
 */
const DashboardLayout = ({ role = 'admin' }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-ink-950">
      <Navbar />
      <div className="flex">
        <Sidebar
          role={role}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />

        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          {/* Mobile menu button */}
          <div className="md:hidden mb-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-ink-900 border border-slate-200 dark:border-ink-800 hover:bg-slate-50 dark:hover:bg-ink-800 transition-colors shadow-sm"
              aria-label="Open menu"
            >
              <FiMenu className="h-5 w-5" />
              <span>Menu</span>
            </button>
          </div>

          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
