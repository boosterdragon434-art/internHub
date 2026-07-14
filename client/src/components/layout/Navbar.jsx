import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
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
 * High-Contrast Solid Gold, White, and Midnight Navy Responsive Navbar.
 * Enforces 100% opaque bases (no transparency on card boxes), gleaming gold-yellow highlights,
 * and high-contrast, fully visible dropdown menus.
 */
const Navbar = () => {
  const { user, isAuthenticated, loading: authLoading, logout, isAdmin } = useAuth();
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

  // Fetch Notifications — only after auth verification is complete
  useEffect(() => {
    let interval;
    // Wait for auth loading to finish, confirm user is authenticated,
    // and verify a token is actually present before polling
    const hasValidSession = !authLoading && isAuthenticated && localStorage.getItem('token');

    if (hasValidSession) {
      const fetchNotis = async () => {
        try {
          // Double-check token still exists (may be cleared by interceptor mid-poll)
          if (!localStorage.getItem('token')) return;
          const res = await getNotifications();
          if (res.success) {
            setNotifications(res.data.notifications);
            setUnreadCount(res.data.unreadCount);
          }
        } catch (error) {
          // Suppress 401 errors — the axios response interceptor already handles
          // token expiration by clearing credentials and redirecting to login.
          if (error.response?.status === 401) return;
          console.error('Error fetching notifications:', error);
        }
      };

      fetchNotis();
      // Poll notifications every 45 seconds
      interval = setInterval(fetchNotis, 45000);
    }
    return () => clearInterval(interval);
  }, [authLoading, isAuthenticated, location.pathname]);


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

  // Helper check for active link path
  const isLinkActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname.includes('/dashboard');
    }
    return location.pathname === path;
  };

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-900 select-none transition-colors duration-300 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo Mark and Title */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center border border-white/10 shadow-md transition-transform duration-300 group-hover:scale-105">
              <span className="text-slate-950 font-black text-xs sm:text-sm tracking-tighter">IH</span>
            </div>
            <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white transition-colors duration-300">
              InternHub
            </span>
          </Link>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
            <div className="flex items-center space-x-1 relative">
              {isAuthenticated && (
                <Link
                  to={isAdmin ? '/admin/dashboard' : '/student/dashboard'}
                  className={`text-xs font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all duration-200 ${
                    isLinkActive('/dashboard')
                      ? 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 font-extrabold'
                      : 'text-slate-655 hover:text-slate-950 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-900/60'
                  }`}
                >
                  Dashboard
                </Link>
              )}
              <Link
                to="/internships"
                className={`text-xs font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all duration-200 ${
                  isLinkActive('/internships')
                    ? 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 font-extrabold'
                    : 'text-slate-655 hover:text-slate-950 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-900/60'
                }`}
              >
                Browse Internships
              </Link>
              <Link
                to="/about"
                className={`text-xs font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all duration-200 ${
                  isLinkActive('/about')
                    ? 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 font-extrabold'
                    : 'text-slate-655 hover:text-slate-950 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-900/60'
                }`}
              >
                About
              </Link>
              <Link
                to="/contact"
                className={`text-xs font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all duration-200 ${
                  isLinkActive('/contact')
                    ? 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 font-extrabold'
                    : 'text-slate-655 hover:text-slate-950 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-900/60'
                }`}
              >
                Contact
              </Link>
            </div>

            {/* Visual Divider */}
            <span className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-2" />

            {/* Dark Mode toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleDarkMode}
              className="p-2.5 rounded-xl text-slate-500 dark:text-slate-455 hover:bg-slate-100 dark:hover:bg-slate-900 border border-transparent hover:border-slate-200/50 dark:hover:border-slate-800 transition-all duration-300"
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? <FiSun className="h-4.5 w-4.5 text-amber-500" /> : <FiMoon className="h-4.5 w-4.5 text-indigo-500" />}
            </motion.button>

            {/* Authenticated Controls */}
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                {/* Notification Bell Dropdown (Opaque, solid background) */}
                <div className="relative" ref={notiDropdownRef}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setNotiDropdownOpen(!notiDropdownOpen)}
                    className="p-2.5 rounded-xl text-slate-500 dark:text-slate-455 hover:bg-slate-100 dark:hover:bg-slate-900 relative"
                  >
                    <FiBell className="h-4.5 w-4.5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[8px] font-black text-slate-950 shadow-sm">
                        {unreadCount}
                      </span>
                    )}
                  </motion.button>

                  <AnimatePresence>
                    {notiDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                        className="absolute right-0 mt-3.5 w-80 sm:w-96 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
                      >
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/60">
                          <span className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                            Notifications
                          </span>
                          {unreadCount > 0 && (
                            <button
                              onClick={handleMarkAllRead}
                              className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 hover:text-amber-500 transition-colors"
                            >
                              Mark all read
                            </button>
                          )}
                        </div>
                        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                          {notifications.length === 0 ? (
                            <div className="py-10 px-4 flex flex-col items-center justify-center text-center">
                              <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-3">
                                <FiBell className="w-5 h-5 text-slate-400" />
                              </div>
                              <p className="text-sm text-slate-500 dark:text-slate-300 font-semibold">
                                You're all caught up!
                              </p>
                              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                No new notifications at the moment.
                              </p>
                            </div>
                          ) : (
                            notifications.map((noti) => (
                              <div
                                key={noti._id}
                                onClick={() => handleNotificationClick(noti)}
                                className={`p-4 sm:p-5 text-left hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-all relative flex items-start gap-4 ${
                                  !noti.isRead ? 'bg-slate-50/50 dark:bg-slate-800/20' : ''
                                }`}
                              >
                                {!noti.isRead && (
                                  <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0 shadow-sm shadow-amber-500/30" />
                                )}
                                <div className="min-w-0 flex-1">
                                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate pr-2">
                                    {noti.title}
                                  </h4>
                                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                    {noti.message}
                                  </p>
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 block font-semibold uppercase tracking-wider">
                                    {formatDate(noti.createdAt)}
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        {notifications.length > 0 && (
                          <div className="p-3 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 text-center">
                            <button
                              onClick={() => setNotiDropdownOpen(false)}
                              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                            >
                              Close
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* User preferences dropdown (Opaque, solid background) */}
                <div className="relative" ref={userDropdownRef}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-905 border border-slate-200 dark:border-slate-800 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 text-slate-950 font-black flex items-center justify-center text-sm shadow-md">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <FiChevronDown className="h-4 w-4 text-slate-500 mr-1" />
                  </motion.button>

                  <AnimatePresence>
                    {userDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                        className="absolute right-0 mt-3.5 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden p-1.5"
                      >
                        <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800/80 text-left">
                          <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                            {user?.name || 'User'}
                          </p>
                          <p className="text-[9px] font-bold text-slate-450 dark:text-slate-500 truncate mt-0.5">
                            {user?.email || ''}
                          </p>
                        </div>
                        <div className="mt-1.5 space-y-0.5">
                          <button
                            onClick={handleDashboardRedirect}
                            className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl transition-colors text-left font-extrabold"
                          >
                            <FiUser className="h-4 w-4 text-slate-400" />
                            My Dashboard
                          </button>
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-colors text-left font-extrabold"
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
              // Sign In / Join buttons (No transparency)
              <div className="flex items-center gap-2 lg:gap-3">
                <Link
                  to="/login"
                  className="text-xs font-black uppercase tracking-widest text-slate-655 hover:text-slate-950 px-4 py-2.5 rounded-xl hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-900 transition-all duration-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-xs font-black uppercase tracking-widest bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-600 text-slate-950 px-5 py-3 rounded-xl shadow-md transition-all duration-250"
                >
                  Join Now
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburg menu trigger */}
          <div className="flex md:hidden items-center gap-3">
            <button
              onClick={toggleDarkMode}
              className="p-2.5 rounded-xl text-slate-500 dark:text-slate-455 hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              {darkMode ? <FiSun className="h-4.5 w-4.5 text-amber-500" /> : <FiMoon className="h-4.5 w-4.5 text-indigo-500" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              {mobileMenuOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer (Opaque, solid background) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 overflow-hidden"
          >
            <div className="px-5 py-4 space-y-4 text-left">
              <div className="space-y-3 pb-3">
                <Link
                  to="/internships"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block text-xs font-black uppercase tracking-widest py-2 transition-colors ${
                    isLinkActive('/internships') ? 'text-amber-600 dark:text-amber-400' : 'text-slate-655 dark:text-slate-350 hover:text-amber-500'
                  }`}
                >
                  Browse Internships
                </Link>
                <Link
                  to="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block text-xs font-black uppercase tracking-widest py-2 transition-colors ${
                    isLinkActive('/about') ? 'text-amber-600 dark:text-amber-400' : 'text-slate-655 dark:text-slate-350 hover:text-amber-500'
                  }`}
                >
                  About
                </Link>
                <Link
                  to="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block text-xs font-black uppercase tracking-widest py-2 transition-colors ${
                    isLinkActive('/contact') ? 'text-amber-600 dark:text-amber-400' : 'text-slate-655 dark:text-slate-350 hover:text-amber-500'
                  }`}
                >
                  Contact
                </Link>
              </div>

              {isAuthenticated ? (
                <div className="border-t border-slate-100 dark:border-slate-900 pt-4 space-y-4">
                  {/* Profile Summary */}
                  <div className="flex items-center gap-3 px-1 py-0.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 text-slate-950 font-black flex items-center justify-center text-base border border-slate-200/10">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="truncate min-w-0">
                      <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                        {user?.name || 'User'}
                      </p>
                      <p className="text-[10px] font-semibold text-slate-450 dark:text-slate-500 truncate mt-0.5">
                        {user?.email || ''}
                      </p>
                    </div>
                  </div>

                  {/* Dashboard link boxes */}
                  <div className="space-y-1 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-900">
                    <p className="text-[9px] font-black text-slate-450 dark:text-slate-500 px-3 py-1.5 uppercase tracking-widest">
                      Dashboard Navigation
                    </p>

                    <Link
                      to={isAdmin ? '/admin/dashboard' : '/student/dashboard'}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                        location.pathname.endsWith('/dashboard')
                          ? 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                          : 'text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850'
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
                              ? 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                              : 'text-slate-655 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850'
                          }`}
                        >
                          <FiBriefcase className="h-4 w-4" />
                          Internships
                        </Link>
                        <Link
                          to="/admin/applications"
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                            location.pathname.startsWith('/admin/applications')
                              ? 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                              : 'text-slate-655 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-855'
                          }`}
                        >
                          <FiFileText className="h-4 w-4" />
                          Applications
                        </Link>
                        <Link
                          to="/admin/payments"
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                            location.pathname.startsWith('/admin/payments')
                              ? 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                              : 'text-slate-655 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-855'
                          }`}
                        >
                          <FiCreditCard className="h-4 w-4" />
                          Payments
                        </Link>
                        <Link
                          to="/admin/users"
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                            location.pathname.startsWith('/admin/users')
                              ? 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                              : 'text-slate-655 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-855'
                          }`}
                        >
                          <FiUsers className="h-4 w-4" />
                          Users
                        </Link>
                        <Link
                          to="/admin/settings"
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                            location.pathname.startsWith('/admin/settings')
                              ? 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                              : 'text-slate-655 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-855'
                          }`}
                        >
                          <FiSettings className="h-4 w-4" />
                          Settings
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/student/applications"
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                            location.pathname.startsWith('/student/applications')
                              ? 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                              : 'text-slate-655 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-855'
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
                              ? 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                              : 'text-slate-655 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-855'
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
                              ? 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                              : 'text-slate-655 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-855'
                          }`}
                        >
                          <FiUsers className="h-4 w-4" />
                          My Profile
                        </Link>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center justify-center gap-3 w-full px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest text-rose-600 dark:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all border border-rose-100 dark:border-rose-900/30"
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
                    className="w-full text-center text-xs font-black uppercase tracking-widest bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 py-3.5 rounded-2xl shadow-md"
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
