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
} from 'react-icons/fi';

/**
 * Collapsible admin/student sidebar with active route highlighting.
 */
const Sidebar = ({ role = 'admin' }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const adminLinks = [
    { icon: FiGrid, label: 'Dashboard', to: '/admin/dashboard' },
    { icon: FiBriefcase, label: 'Internships', to: '/admin/internships' },
    { icon: FiFileText, label: 'Applications', to: '/admin/applications' },
    { icon: FiCreditCard, label: 'Payments', to: '/admin/payments' },
    { icon: FiUsers, label: 'Users', to: '/admin/users' },
    { icon: FiSettings, label: 'Settings', to: '/admin/settings' },
  ];

  const studentLinks = [
    { icon: FiGrid, label: 'Dashboard', to: '/student/dashboard' },
    { icon: FiBriefcase, label: 'Browse Internships', to: '/internships' },
    { icon: FiFileText, label: 'My Applications', to: '/student/applications' },
    { icon: FiCreditCard, label: 'Payments', to: '/student/payments' },
    { icon: FiUsers, label: 'Profile', to: '/student/profile' },
  ];

  const links = role === 'admin' ? adminLinks : studentLinks;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside
      className={`hidden md:flex sticky top-16 h-[calc(100vh-4rem)] bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex-col transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Nav Links */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto mt-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to.endsWith('dashboard')}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-accent-50 dark:bg-accent-950/30 text-accent-700 dark:text-accent-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'
              }`
            }
          >
            <link.icon className={`h-5 w-5 flex-shrink-0 ${collapsed ? 'mx-auto' : ''}`} />
            {!collapsed && <span className="truncate">{link.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer Controls */}
      <div className="p-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <FiLogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>

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
      </div>
    </aside>
  );
};

export default Sidebar;
