import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
    <nav className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-accent-500 to-secondary-500 bg-clip-text text-transparent">
              InternHub
            </span>
          </Link>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center space-x-6">
            {isAuthenticated && (
              <Link
                to={isAdmin ? '/admin/dashboard' : '/student/dashboard'}
                className={`text-sm font-semibold transition-colors ${
                  location.pathname.includes('/dashboard')
                    ? 'text-accent-600 dark:text-accent-400 font-bold'
                    : 'text-slate-600 hover:text-accent-500 dark:text-slate-300 dark:hover:text-accent-400'
                }`}
              >
                Dashboard
              </Link>
            )}
            <Link
              to="/internships"
              className={`text-sm font-semibold transition-colors ${
                location.pathname === '/internships'
                  ? 'text-accent-600 dark:text-accent-400 font-bold'
                  : 'text-slate-600 hover:text-accent-500 dark:text-slate-300 dark:hover:text-accent-400'
              }`}
            >
              Browse Internships
            </Link>
            <Link
              to="/about"
              className={`text-sm font-semibold transition-colors ${
                location.pathname === '/about'
                  ? 'text-accent-600 dark:text-accent-400 font-bold'
                  : 'text-slate-600 hover:text-accent-500 dark:text-slate-300 dark:hover:text-accent-400'
              }`}
            >
              About
            </Link>
            <Link
              to="/contact"
              className={`text-sm font-semibold transition-colors ${
                location.pathname === '/contact'
                  ? 'text-accent-600 dark:text-accent-400 font-bold'
                  : 'text-slate-650 hover:text-accent-500 dark:text-slate-300 dark:hover:text-accent-400'
              }`}
            >
              Contact
            </Link>

            {/* Dark Mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
            </button>

            {/* Authenticated Controls */}
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                {/* Notification Bell Dropdown */}
                <div className="relative" ref={notiDropdownRef}>
                  <button
                    onClick={() => setNotiDropdownOpen(!notiDropdownOpen)}
                    className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
                  >
                    <FiBell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-950">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {notiDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          Notifications
                        </span>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-[10px] font-semibold text-accent-500 hover:text-accent-600 transition-colors"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-xs text-slate-500">
                            No notifications yet.
                          </div>
                        ) : (
                          notifications.map((noti) => (
                            <div
                              key={noti._id}
                              onClick={() => handleNotificationClick(noti)}
                              className={`p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer transition-colors relative ${
                                !noti.isRead ? 'bg-slate-50/50 dark:bg-slate-900/20' : ''
                              }`}
                            >
                              {!noti.isRead && (
                                <span className="absolute top-4 left-2 w-1.5 h-1.5 rounded-full bg-accent-500" />
                              )}
                              <div className={!noti.isRead ? 'pl-2' : ''}>
                                <h4 className="text-xs font-bold text-slate-950 dark:text-slate-50">
                                  {noti.title}
                                </h4>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                                  {noti.message}
                                </p>
                                <span className="text-[8px] text-slate-400 mt-1 block">
                                  {formatDate(noti.createdAt)}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Dropdown */}
                <div className="relative" ref={userDropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-accent-500/10 text-accent-600 dark:text-accent-400 font-extrabold flex items-center justify-center text-sm border border-accent-500/20">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <FiChevronDown className="h-4 w-4 text-slate-500" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden">
                      <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {user?.name || 'User'}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {user?.email || ''}
                        </p>
                      </div>
                      <div className="p-1">
                        <button
                          onClick={handleDashboardRedirect}
                          className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-left font-semibold"
                        >
                          <FiUser className="h-4 w-4" />
                          My Dashboard
                        </button>
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 w-full px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors text-left font-semibold"
                        >
                          <FiLogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Sign In / Sign Up buttons
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-slate-700 hover:text-accent-500 dark:text-slate-300 dark:hover:text-accent-400 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-xs font-bold bg-accent-600 hover:bg-accent-700 text-white px-4 py-2 rounded-lg shadow-sm shadow-accent-600/10 transition-all duration-200"
                >
                  Join Now
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger toggle */}
          <div className="flex md:hidden items-center gap-3">
            <button
              onClick={toggleDarkMode}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {darkMode ? <FiSun className="h-4.5 w-4.5" /> : <FiMoon className="h-4.5 w-4.5" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {mobileMenuOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 space-y-3 shadow-inner">
          <div className="space-y-2.5 pb-2.5">
            <Link
              to="/internships"
              onClick={() => setMobileMenuOpen(false)}
              className={`block text-sm font-semibold transition-colors ${
                location.pathname === '/internships'
                  ? 'text-accent-600 dark:text-accent-400 font-bold'
                  : 'text-slate-700 dark:text-slate-350 hover:text-accent-500 dark:hover:text-accent-400'
              }`}
            >
              Browse Internships
            </Link>
            <Link
              to="/about"
              onClick={() => setMobileMenuOpen(false)}
              className={`block text-sm font-semibold transition-colors ${
                location.pathname === '/about'
                  ? 'text-accent-600 dark:text-accent-400 font-bold'
                  : 'text-slate-700 dark:text-slate-350 hover:text-accent-500 dark:hover:text-accent-400'
              }`}
            >
              About
            </Link>
            <Link
              to="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className={`block text-sm font-semibold transition-colors ${
                location.pathname === '/contact'
                  ? 'text-accent-600 dark:text-accent-400 font-bold'
                  : 'text-slate-705 hover:text-accent-500 dark:text-slate-350 dark:hover:text-accent-400'
              }`}
            >
              Contact
            </Link>
          </div>

          {isAuthenticated ? (
            <div className="border-t border-slate-200 dark:border-slate-800 pt-3.5 space-y-4">
              {/* User Profile Info Card */}
              <div className="flex items-center gap-3 px-1.5 py-1">
                <div className="w-10 h-10 rounded-full bg-accent-500/10 text-accent-600 dark:text-accent-400 font-extrabold flex items-center justify-center text-base border border-accent-500/20">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {user?.email || ''}
                  </p>
                </div>
              </div>

              {/* Sub-menu items for dashboard since sidebar is hidden on mobile */}
              <div className="space-y-1 bg-slate-50 dark:bg-slate-900/30 p-2 rounded-2xl border border-slate-100/80 dark:border-slate-900/60">
                <p className="text-[9px] font-extrabold text-slate-450 dark:text-slate-500 px-3.5 py-1.5 uppercase tracking-wider">
                  Menu
                </p>

                {/* Dashboard Home Link */}
                <Link
                  to={isAdmin ? '/admin/dashboard' : '/student/dashboard'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    location.pathname.endsWith('/dashboard')
                      ? 'bg-accent-50 dark:bg-accent-950/20 text-accent-700 dark:text-accent-400 shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  <FiUser className="h-4.5 w-4.5 flex-shrink-0" />
                  Dashboard Home
                </Link>

                {isAdmin ? (
                  <>
                    <Link
                      to="/admin/internships"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        location.pathname.startsWith('/admin/internships')
                          ? 'bg-accent-50 dark:bg-accent-950/20 text-accent-700 dark:text-accent-400 shadow-sm'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                      }`}
                    >
                      <FiBriefcase className="h-4.5 w-4.5 flex-shrink-0" />
                      Internships
                    </Link>
                    <Link
                      to="/admin/applications"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        location.pathname.startsWith('/admin/applications')
                          ? 'bg-accent-50 dark:bg-accent-950/20 text-accent-700 dark:text-accent-400 shadow-sm'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                      }`}
                    >
                      <FiFileText className="h-4.5 w-4.5 flex-shrink-0" />
                      Applications
                    </Link>
                    <Link
                      to="/admin/payments"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        location.pathname.startsWith('/admin/payments')
                          ? 'bg-accent-50 dark:bg-accent-950/20 text-accent-700 dark:text-accent-400 shadow-sm'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                      }`}
                    >
                      <FiCreditCard className="h-4.5 w-4.5 flex-shrink-0" />
                      Payments
                    </Link>
                    <Link
                      to="/admin/users"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        location.pathname.startsWith('/admin/users')
                          ? 'bg-accent-50 dark:bg-accent-950/20 text-accent-700 dark:text-accent-400 shadow-sm'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                      }`}
                    >
                      <FiUsers className="h-4.5 w-4.5 flex-shrink-0" />
                      Users
                    </Link>
                    <Link
                      to="/admin/settings"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        location.pathname.startsWith('/admin/settings')
                          ? 'bg-accent-50 dark:bg-accent-950/20 text-accent-700 dark:text-accent-400 shadow-sm'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                      }`}
                    >
                      <FiSettings className="h-4.5 w-4.5 flex-shrink-0" />
                      Settings
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/student/applications"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        location.pathname.startsWith('/student/applications')
                          ? 'bg-accent-50 dark:bg-accent-950/20 text-accent-700 dark:text-accent-400 shadow-sm'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                      }`}
                    >
                      <FiFileText className="h-4.5 w-4.5 flex-shrink-0" />
                      My Applications
                    </Link>
                    <Link
                      to="/student/payments"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        location.pathname.startsWith('/student/payments')
                          ? 'bg-accent-50 dark:bg-accent-950/20 text-accent-700 dark:text-accent-400 shadow-sm'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                      }`}
                    >
                      <FiCreditCard className="h-4.5 w-4.5 flex-shrink-0" />
                      Payments
                    </Link>
                    <Link
                      to="/student/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        location.pathname.startsWith('/student/profile')
                          ? 'bg-accent-50 dark:bg-accent-950/20 text-accent-700 dark:text-accent-400 shadow-sm'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                      }`}
                    >
                      <FiUsers className="h-4.5 w-4.5 flex-shrink-0" />
                      Profile
                    </Link>
                  </>
                )}
              </div>

              {/* Sign Out */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-3 w-full px-3.5 py-3 rounded-xl text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors border border-rose-100 dark:border-rose-955/20"
              >
                <FiLogOut className="h-4.5 w-4.5 flex-shrink-0" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 border-t border-slate-200 dark:border-slate-800 pt-3.5">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center text-sm font-semibold text-slate-700 dark:text-slate-300 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center text-sm font-bold bg-accent-600 hover:bg-accent-700 text-white py-2.5 rounded-xl shadow-sm shadow-accent-600/10 transition-colors"
              >
                Join Now
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
