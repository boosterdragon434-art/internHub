import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useClickOutside } from '../../hooks/useClickOutside';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../../api/notificationApi';
import {
  FiBell,
  FiUser,
  FiLogOut,
  FiMenu,
  FiX,
  FiSun,
  FiMoon,
  FiChevronDown,
  FiBriefcase,
  FiFileText,
  FiCreditCard,
  FiUsers,
  FiSettings,
} from 'react-icons/fi';
import { formatDate } from '../../utils/formatters';

/**
 * Next-Generation Professional Responsive Glassmorphic Navbar.
 * Features layout-preserving sliding link indicators, smooth bell dropdowns,
 * full-height slide-out mobile drawers, and perfect socket-synchronized notifications.
 */
const Navbar = () => {
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notiDropdownOpen, setNotiDropdownOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const userDropdownRef = useRef(null);
  const notiDropdownRef = useRef(null);

  useClickOutside(userDropdownRef, () => setUserDropdownOpen(false));
  useClickOutside(notiDropdownRef, () => setNotiDropdownOpen(false));

  // Initialize Dark Mode
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setDarkMode(true);
      document.body.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    if (darkMode) {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    setDarkMode(!darkMode);
  };

  // Fetch Notifications
  useEffect(() => {
    let interval;
    if (isAuthenticated) {
      const fetchNotis = async () => {
        try {
          const res = await getNotifications();
          if (res.success) {
            setNotifications(res.data.notifications);
            setUnreadCount(res.data.unreadCount);
          }
        } catch (error) {
          console.error('Error fetching notifications:', error);
        }
      };

      fetchNotis();
      // Poll notifications every 45 seconds
      interval = setInterval(fetchNotis, 45000);
    }
    return () => clearInterval(interval);
  }, [isAuthenticated, location.pathname]);

  // Synchronise live notifications via WebSockets
  useEffect(() => {
    if (!socket) return;

    const handleSocketNotif = (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((c) => c + 1);
    };

    socket.on('notification', handleSocketNotif);
    return () => {
      socket.off('notification', handleSocketNotif);
    };
  }, [socket]);

  const handleMarkAllRead = async () => {
    try {
      const res = await markAllNotificationsAsRead();
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (noti) => {
    try {
      if (!noti.isRead) {
        await markNotificationAsRead(noti._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === noti._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      setNotiDropdownOpen(false);
      if (noti.link) {
        let targetLink = noti.link;
        if (targetLink.startsWith('/dashboard/')) {
          targetLink = targetLink.replace('/dashboard/', '/student/');
        }
        navigate(targetLink);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleDashboardRedirect = () => {
    if (isAdmin) {
      navigate('/admin/dashboard');
    } else {
      navigate('/student/dashboard');
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-900/50 select-none transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo Mark and Brand Title */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/25 group-hover:scale-105 transition-transform duration-300 border border-white/10">
              <span className="text-white font-black text-xs sm:text-sm tracking-tighter">IH</span>
            </div>
            <span className="text-lg sm:text-xl font-black tracking-tight bg-gradient-to-r from-slate-900 to-slate-750 dark:from-white dark:to-slate-350 bg-clip-text text-transparent group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-all duration-300">
              InternHub
            </span>
          </Link>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center space-x-6 sm:space-x-8">
            <div className="flex items-center space-x-6 relative">
              {isAuthenticated && (
                <Link
                  to={isAdmin ? '/admin/dashboard' : '/student/dashboard'}
                  className={`text-xs font-extrabold uppercase tracking-widest relative py-1.5 transition-colors ${
                    location.pathname.includes('/dashboard')
                      ? 'text-violet-600 dark:text-violet-400'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-250'
                  }`}
                >
                  Dashboard
                  {location.pathname.includes('/dashboard') && (
                    <motion.span
                      layoutId="activeIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 rounded-full"
                    />
                  )}
                </Link>
              )}
              <Link
                to="/internships"
                className={`text-xs font-extrabold uppercase tracking-widest relative py-1.5 transition-colors ${
                  location.pathname === '/internships'
                    ? 'text-violet-600 dark:text-violet-400'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-250'
                }`}
              >
                Browse Internships
                {location.pathname === '/internships' && (
                  <motion.span
                    layoutId="activeIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 rounded-full"
                  />
                )}
              </Link>
              <Link
                to="/about"
                className={`text-xs font-extrabold uppercase tracking-widest relative py-1.5 transition-colors ${
                  location.pathname === '/about'
                    ? 'text-violet-600 dark:text-violet-400'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-250'
                }`}
              >
                About
                {location.pathname === '/about' && (
                  <motion.span
                    layoutId="activeIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 rounded-full"
                  />
                )}
              </Link>
              <Link
                to="/contact"
                className={`text-xs font-extrabold uppercase tracking-widest relative py-1.5 transition-colors ${
                  location.pathname === '/contact'
                    ? 'text-violet-600 dark:text-violet-400'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-250'
                }`}
              >
                Contact
                {location.pathname === '/contact' && (
                  <motion.span
                    layoutId="activeIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 rounded-full"
                  />
                )}
              </Link>
            </div>

            {/* Visual Separator */}
            <span className="w-px h-5 bg-slate-200 dark:bg-slate-800" />

            {/* Dark Mode toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleDarkMode}
              className="p-2.5 rounded-xl text-slate-500 dark:text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-900 border border-transparent hover:border-slate-200/50 dark:hover:border-slate-800 transition-all duration-300"
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? <FiSun className="h-4.5 w-4.5 text-amber-500" /> : <FiMoon className="h-4.5 w-4.5 text-indigo-500" />}
            </motion.button>

            {/* Authenticated Controls */}
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                {/* Notification Bell Dropdown */}
                <div className="relative" ref={notiDropdownRef}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setNotiDropdownOpen(!notiDropdownOpen)}
                    className="p-2.5 rounded-xl text-slate-500 dark:text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-900 border border-transparent hover:border-slate-200/50 dark:hover:border-slate-800 transition-all duration-300 relative"
                  >
                    <FiBell className="h-4.5 w-4.5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white ring-2 ring-white dark:ring-slate-950 shadow-[0_0_8px_rgba(239,68,68,0.4)]">
                        {unreadCount}
                      </span>
                    )}
                  </motion.button>

                  <AnimatePresence>
                    {notiDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                        className="absolute right-0 mt-3.5 w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-2xl z-50 overflow-hidden"
                      >
                        <div className="flex items-center justify-between px-4.5 py-3 border-b border-slate-100 dark:border-slate-800">
                          <span className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-slate-200">
                            Notifications
                          </span>
                          {unreadCount > 0 && (
                            <button
                              onClick={handleMarkAllRead}
                              className="text-[10px] font-extrabold uppercase tracking-widest text-violet-600 dark:text-violet-400 hover:text-violet-500 transition-colors"
                            >
                              Mark all read
                            </button>
                          )}
                        </div>
                        <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 scrollbar-thin">
                          {notifications.length === 0 ? (
                            <div className="py-8 px-4 text-center text-xs text-slate-400 font-medium">
                              No notifications yet.
                            </div>
                          ) : (
                            notifications.map((noti) => (
                              <div
                                key={noti._id}
                                onClick={() => handleNotificationClick(noti)}
                                className={`p-4 text-left hover:bg-slate-50/80 dark:hover:bg-slate-850/50 cursor-pointer transition-colors relative flex items-start gap-3 ${
                                  !noti.isRead ? 'bg-slate-50/40 dark:bg-slate-950/20' : ''
                                }`}
                              >
                                {!noti.isRead && (
                                  <span className="w-2 h-2 rounded-full bg-violet-600 dark:bg-violet-400 mt-1 shrink-0 shadow-[0_0_8px_rgba(124,58,237,0.4)]" />
                                )}
                                <div className="min-w-0 flex-1">
                                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                    {noti.title}
                                  </h4>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                                    {noti.message}
                                  </p>
                                  <span className="text-[8px] text-slate-400 dark:text-slate-500 mt-1.5 block font-bold uppercase">
                                    {formatDate(noti.createdAt)}
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* User Settings Dropdown */}
                <div className="relative" ref={userDropdownRef}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1 rounded-2xl hover:bg-slate-100/60 dark:hover:bg-slate-900 border border-slate-200/40 dark:border-slate-800 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-650 text-white font-black flex items-center justify-center text-sm shadow-[0_2px_8px_rgba(124,58,237,0.2)]">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <FiChevronDown className="h-4 w-4 text-slate-455 mr-1" />
                  </motion.button>

                  <AnimatePresence>
                    {userDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                        className="absolute right-0 mt-3.5 w-52 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/60 dark:border-slate-800/85 rounded-2xl shadow-2xl z-50 overflow-hidden p-1.5"
                      >
                        <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800/60 text-left">
                          <p className="text-xs font-extrabold text-slate-800 dark:text-slate-150 truncate">
                            {user?.name || 'User'}
                          </p>
                          <p className="text-[9px] font-medium text-slate-450 dark:text-slate-450 truncate mt-0.5">
                            {user?.email || ''}
                          </p>
                        </div>
                        <div className="mt-1.5 space-y-0.5">
                          <button
                            onClick={handleDashboardRedirect}
                            className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl transition-colors text-left font-bold"
                          >
                            <FiUser className="h-4 w-4 text-slate-400" />
                            My Dashboard
                          </button>
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-colors text-left font-bold"
                          >
                            <FiLogOut className="h-4 w-4" />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              // Sign In / Sign Up buttons
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-xs font-extrabold uppercase tracking-widest text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 px-4 py-2.5 rounded-xl hover:bg-slate-100/50 dark:hover:bg-slate-900 transition-all duration-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-xs font-black uppercase tracking-widest bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-550 text-white px-5 py-3 rounded-xl shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 hover:-translate-y-0.5 transition-all duration-200"
                >
                  Join Now
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburg Drawer triggers */}
          <div className="flex md:hidden items-center gap-3">
            <button
              onClick={toggleDarkMode}
              className="p-2.5 rounded-xl text-slate-500 dark:text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200/10 transition-colors"
            >
              {darkMode ? <FiSun className="h-4.5 w-4.5 text-amber-500" /> : <FiMoon className="h-4.5 w-4.5 text-indigo-500" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200/10 transition-colors"
            >
              {mobileMenuOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu using Framer Motion AnimatePresence */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="md:hidden border-t border-slate-200/80 dark:border-slate-900 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="px-5 py-4 space-y-4">
              <div className="space-y-3 pb-3 text-left">
                <Link
                  to="/internships"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block text-xs font-black uppercase tracking-widest transition-colors py-2 ${
                    location.pathname === '/internships'
                      ? 'text-violet-600 dark:text-violet-400'
                      : 'text-slate-600 dark:text-slate-350 hover:text-violet-500'
                  }`}
                >
                  Browse Internships
                </Link>
                <Link
                  to="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block text-xs font-black uppercase tracking-widest transition-colors py-2 ${
                    location.pathname === '/about'
                      ? 'text-violet-600 dark:text-violet-400'
                      : 'text-slate-600 dark:text-slate-350 hover:text-violet-500'
                  }`}
                >
                  About
                </Link>
                <Link
                  to="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block text-xs font-black uppercase tracking-widest transition-colors py-2 ${
                    location.pathname === '/contact'
                      ? 'text-violet-600 dark:text-violet-400'
                      : 'text-slate-600 dark:text-slate-350 hover:text-violet-500'
                  }`}
                >
                  Contact
                </Link>
              </div>

              {isAuthenticated ? (
                <div className="border-t border-slate-100 dark:border-slate-900 pt-4 space-y-4 text-left">
                  {/* User Profile summary card */}
                  <div className="flex items-center gap-3 px-1 py-0.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-650 text-white font-black flex items-center justify-center text-base border border-slate-200/10">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="truncate min-w-0">
                      <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate">
                        {user?.name || 'User'}
                      </p>
                      <p className="text-[10px] text-slate-450 dark:text-slate-450 truncate mt-0.5">
                        {user?.email || ''}
                      </p>
                    </div>
                  </div>

                  {/* Dashboard contextual submenu link blocks */}
                  <div className="space-y-1 bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded-2xl border border-slate-200/40 dark:border-slate-900/60">
                    <p className="text-[9px] font-extrabold text-slate-450 dark:text-slate-500 px-3 py-1.5 uppercase tracking-widest">
                      Dashboard Navigation
                    </p>

                    {/* Main Dashboard Home Redirect */}
                    <Link
                      to={isAdmin ? '/admin/dashboard' : '/student/dashboard'}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                        location.pathname.endsWith('/dashboard')
                          ? 'bg-violet-650/10 text-violet-600 dark:text-violet-400'
                          : 'text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                      }`}
                    >
                      <FiUser className="h-4 w-4" />
                      Dashboard Home
                    </Link>

                    {isAdmin ? (
                      <>
                        <Link
                          to="/admin/internships"
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                            location.pathname.startsWith('/admin/internships')
                              ? 'bg-violet-650/10 text-violet-600 dark:text-violet-400'
                              : 'text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                          }`}
                        >
                          <FiBriefcase className="h-4 w-4" />
                          Internships Catalog
                        </Link>
                        <Link
                          to="/admin/applications"
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                            location.pathname.startsWith('/admin/applications')
                              ? 'bg-violet-650/10 text-violet-600 dark:text-violet-400'
                              : 'text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                          }`}
                        >
                          <FiFileText className="h-4 w-4" />
                          Applications Tracker
                        </Link>
                        <Link
                          to="/admin/payments"
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                            location.pathname.startsWith('/admin/payments')
                              ? 'bg-violet-650/10 text-violet-600 dark:text-violet-400'
                              : 'text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                          }`}
                        >
                          <FiCreditCard className="h-4 w-4" />
                          Payments Audit
                        </Link>
                        <Link
                          to="/admin/users"
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                            location.pathname.startsWith('/admin/users')
                              ? 'bg-violet-650/10 text-violet-600 dark:text-violet-400'
                              : 'text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                          }`}
                        >
                          <FiUsers className="h-4 w-4" />
                          User Database
                        </Link>
                        <Link
                          to="/admin/settings"
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                            location.pathname.startsWith('/admin/settings')
                              ? 'bg-violet-650/10 text-violet-600 dark:text-violet-400'
                              : 'text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                          }`}
                        >
                          <FiSettings className="h-4 w-4" />
                          Control Settings
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/student/applications"
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                            location.pathname.startsWith('/student/applications')
                              ? 'bg-violet-650/10 text-violet-600 dark:text-violet-400'
                              : 'text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                          }`}
                        >
                          <FiFileText className="h-4 w-4" />
                          My Applications
                        </Link>
                        <Link
                          to="/student/payments"
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                            location.pathname.startsWith('/student/payments')
                              ? 'bg-violet-650/10 text-violet-600 dark:text-violet-400'
                              : 'text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                          }`}
                        >
                          <FiCreditCard className="h-4 w-4" />
                          My Payments
                        </Link>
                        <Link
                          to="/student/profile"
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                            location.pathname.startsWith('/student/profile')
                              ? 'bg-violet-650/10 text-violet-600 dark:text-violet-400'
                              : 'text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                          }`}
                        >
                          <FiUsers className="h-4 w-4" />
                          My Profile
                        </Link>
                      </>
                    )}
                  </div>

                  {/* Sign Out button */}
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center justify-center gap-3 w-full px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all border border-rose-100 dark:border-rose-900/20"
                  >
                    <FiLogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 border-t border-slate-100 dark:border-slate-900 pt-4">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 py-3.5 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center text-xs font-black uppercase tracking-widest bg-gradient-to-r from-violet-600 to-indigo-650 text-white py-3.5 rounded-2xl shadow-lg"
                  >
                    Join Now
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
