import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiGrid,
  FiBriefcase,
  FiFileText,
  FiCreditCard,
  FiUsers,
  FiSettings,
  FiChevronLeft,
  FiChevronRight,
  FiLogOut,
  FiUser,
  FiX,
  FiCheckSquare,
  FiCalendar,
  FiAward,
  FiMessageSquare,
  FiClock,
} from 'react-icons/fi';

/**
 * Collapsible admin/student/guide sidebar with active route highlighting.
 * Includes a mobile drawer overlay triggered externally via prop.
 */
const Sidebar = ({ role = 'admin', mobileOpen = false, onMobileClose }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const adminLinks = [
    { icon: FiGrid, label: 'Dashboard', to: '/admin/dashboard' },
    { icon: FiBriefcase, label: 'Internships', to: '/admin/internships' },
    { icon: FiFileText, label: 'Applications', to: '/admin/applications' },
    { icon: FiCreditCard, label: 'Payments', to: '/admin/payments' },
    { icon: FiUsers, label: 'Users', to: '/admin/users' },
    { icon: FiCheckSquare, label: 'Workspace Tasks', to: '/admin/tasks' },
    { icon: FiClock, label: 'Attendance', to: '/admin/attendance' },
    { icon: FiUsers, label: 'Teams', to: '/admin/teams' },
    { icon: FiCalendar, label: 'Calendar Planner', to: '/admin/calendar' },
    { icon: FiAward, label: 'Issue Credentials', to: '/admin/certificates' },
    { icon: FiMessageSquare, label: 'Discussions', to: '/admin/chat' },
    { icon: FiSettings, label: 'Settings', to: '/admin/settings' },
  ];

  const guideLinks = [
    { icon: FiGrid, label: 'Dashboard', to: '/guide/dashboard' },
    { icon: FiUsers, label: 'My Students', to: '/guide/students' },
    { icon: FiCheckSquare, label: 'Workspace Tasks', to: '/guide/tasks' },
    { icon: FiClock, label: 'Attendance', to: '/guide/attendance' },
    { icon: FiCalendar, label: 'Cohort Planner', to: '/guide/calendar' },
    { icon: FiMessageSquare, label: 'Discussions', to: '/guide/chat' },
    { icon: FiUser, label: 'Profile', to: '/guide/profile' },
  ];

  const studentLinks = [
    { icon: FiGrid, label: 'Dashboard', to: '/student/dashboard' },
    { icon: FiBriefcase, label: 'Browse Internships', to: '/internships' },
    { icon: FiFileText, label: 'My Applications', to: '/student/applications' },
    { icon: FiCheckSquare, label: 'My Tasks', to: '/student/tasks' },
    { icon: FiClock, label: 'Attendance', to: '/student/attendance' },
    { icon: FiCalendar, label: 'My Calendar', to: '/student/calendar' },
    { icon: FiAward, label: 'My Certificates', to: '/student/certificates' },
    { icon: FiMessageSquare, label: 'Discussions', to: '/student/chat' },
    { icon: FiCreditCard, label: 'Payments', to: '/student/payments' },
    { icon: FiUser, label: 'Profile', to: '/student/profile' },
  ];

  const links =
    role === 'admin'
      ? adminLinks
      : role === 'guide'
        ? guideLinks
        : studentLinks;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleNavClick = () => {
    // Close mobile drawer on navigation
    if (onMobileClose) onMobileClose();
  };

  const sidebarContent = (
    <>
      {/* Nav Links */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto mt-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to.endsWith('dashboard')}
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-accent-50 dark:bg-accent-950/30 text-accent-700 dark:text-accent-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'
              }`
            }
          >
            <link.icon className={`h-5 w-5 flex-shrink-0 ${collapsed && !mobileOpen ? 'mx-auto' : ''}`} />
            {(!collapsed || mobileOpen) && <span className="truncate">{link.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer Controls */}
      <div className="p-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors ${
            collapsed && !mobileOpen ? 'justify-center' : ''
          }`}
        >
          <FiLogOut className="h-5 w-5 flex-shrink-0" />
          {(!collapsed || mobileOpen) && <span>Sign Out</span>}
        </button>

        {/* Collapse toggle — desktop only */}
        {!mobileOpen && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full px-3 py-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <FiChevronRight className="h-4 w-4" />
            ) : (
              <FiChevronLeft className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex sticky top-16 h-[calc(100vh-4rem)] bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex-col transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-56'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={onMobileClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col md:hidden animate-slide-in-left">
            {/* Close button */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Menu
              </span>
              <button
                onClick={onMobileClose}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                aria-label="Close menu"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
};

export default Sidebar;
