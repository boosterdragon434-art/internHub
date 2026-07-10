import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useEnrollment from '../../hooks/useEnrollment';
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
  FiClock,
  FiLock,
} from 'react-icons/fi';

/**
 * Collapsible admin/student/guide sidebar with active route highlighting.
 * Student links are enrollment-aware: locked features show a lock icon when not enrolled.
 * Includes a mobile drawer overlay triggered externally via prop.
 */
const Sidebar = ({ role = 'admin', mobileOpen = false, onMobileClose }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Only use enrollment hook for students
  const enrollmentData = role === 'student' ? useEnrollment() : { isEnrolled: true, loading: false };
  const { isEnrolled } = enrollmentData;

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
    { icon: FiSettings, label: 'Settings', to: '/admin/settings' },
  ];

  const guideLinks = [
    { icon: FiGrid, label: 'Dashboard', to: '/guide/dashboard' },
    { icon: FiUsers, label: 'My Students', to: '/guide/students' },
    { icon: FiCheckSquare, label: 'Workspace Tasks', to: '/guide/tasks' },
    { icon: FiClock, label: 'Attendance', to: '/guide/attendance' },
    { icon: FiCalendar, label: 'Cohort Planner', to: '/guide/calendar' },
    { icon: FiUser, label: 'Profile', to: '/guide/profile' },
  ];

  const studentLinks = [
    { icon: FiGrid, label: 'Dashboard', to: '/student/dashboard' },
    { icon: FiBriefcase, label: 'Browse Internships', to: '/internships' },
    { icon: FiFileText, label: 'My Applications', to: '/student/applications' },
    { icon: FiCreditCard, label: 'Payments', to: '/student/payments' },
    { icon: FiCheckSquare, label: 'My Tasks', to: '/student/tasks', requiresEnrollment: true },
    { icon: FiUsers, label: 'My Team', to: '/student/team', requiresEnrollment: true },
    { icon: FiClock, label: 'Attendance', to: '/student/attendance', requiresEnrollment: true },
    { icon: FiCalendar, label: 'My Calendar', to: '/student/calendar', requiresEnrollment: true },
    { icon: FiAward, label: 'Certificates', to: '/student/certificates', requiresEnrollment: true },
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
      {/* Enrollment badge for students */}
      {role === 'student' && !enrollmentData.loading && (
        <div className={`mx-2 mt-3 mb-1 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
          isEnrolled
            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/30'
            : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/30'
        }`}>
          {(!collapsed || mobileOpen) ? (
            <>
              {isEnrolled ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                  Enrolled
                </>
              ) : (
                <>
                  <FiLock className="h-3 w-3 flex-shrink-0" />
                  Not Enrolled
                </>
              )}
            </>
          ) : (
            <span className={`w-2.5 h-2.5 rounded-full mx-auto ${isEnrolled ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          )}
        </div>
      )}

      {/* Nav Links */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto mt-1">
        {links.map((link) => {
          const isLocked = link.requiresEnrollment && !isEnrolled;

          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to.endsWith('dashboard')}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isLocked
                    ? 'text-slate-400/60 dark:text-slate-600 cursor-default'
                    : isActive
                      ? 'bg-accent-50 dark:bg-accent-950/30 text-accent-700 dark:text-accent-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'
                }`
              }
            >
              <link.icon className={`h-5 w-5 flex-shrink-0 ${collapsed && !mobileOpen ? 'mx-auto' : ''} ${isLocked ? 'opacity-40' : ''}`} />
              {(!collapsed || mobileOpen) && (
                <span className={`truncate flex-1 ${isLocked ? 'opacity-50' : ''}`}>{link.label}</span>
              )}
              {(!collapsed || mobileOpen) && isLocked && (
                <FiLock className="h-3 w-3 flex-shrink-0 text-slate-400/50 dark:text-slate-600" />
              )}
            </NavLink>
          );
        })}
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
