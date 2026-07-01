import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiClock,
  FiPlay,
  FiPause,
  FiSquare,
  FiCoffee,
  FiCheckCircle,
  FiAlertCircle,
  FiCalendar,
  FiTrendingUp,
  FiAward,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import StatsCard from '../../components/ui/StatsCard';
import Spinner from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';
import {
  checkIn as apiCheckIn,
  breakStart as apiBreakStart,
  breakEnd as apiBreakEnd,
  checkOut as apiCheckOut,
  getMyStatus,
  getMyHistory,
  getMyStats,
  getMyMonthlyHours,
} from '../../api/attendanceApi';

/**
 * Format minutes into "Xh Ym" display string.
 */
const formatDuration = (minutes) => {
  if (!minutes || minutes <= 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

/**
 * Format a date/time value to IST display string.
 */
const formatTime = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });
};

const statusConfig = {
  'checked-in': {
    label: 'Online',
    color: 'bg-emerald-500',
    ring: 'ring-emerald-400/30',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
    icon: FiPlay,
    pulse: true,
  },
  'on-break': {
    label: 'On Break',
    color: 'bg-amber-500',
    ring: 'ring-amber-400/30',
    textColor: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/20',
    icon: FiCoffee,
    pulse: true,
  },
  'checked-out': {
    label: 'Checked Out',
    color: 'bg-slate-400',
    ring: 'ring-slate-300/30',
    textColor: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-50 dark:bg-slate-900/30',
    icon: FiCheckCircle,
    pulse: false,
  },
  absent: {
    label: 'Not Checked In',
    color: 'bg-rose-400',
    ring: 'ring-rose-300/30',
    textColor: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-50 dark:bg-rose-950/20',
    icon: FiAlertCircle,
    pulse: false,
  },
  'missed-checkout': {
    label: 'Missed Checkout',
    color: 'bg-red-500',
    ring: 'ring-red-400/30',
    textColor: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    icon: FiAlertCircle,
    pulse: false,
  },
};

const StudentAttendancePage = () => {
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState('absent');
  const [liveMinutes, setLiveMinutes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [autoCheckoutHour, setAutoCheckoutHour] = useState(22);

  // Stats
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [monthlySummary, setMonthlySummary] = useState(null);

  // History
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPagination, setHistoryPagination] = useState(null);

  // Calendar
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [calendarDays, setCalendarDays] = useState(new Set());

  const timerRef = useRef(null);

  // ─── Fetch current status on mount ─────────────────────────────────
  const fetchStatus = useCallback(async () => {
    try {
      const res = await getMyStatus();
      const data = res.data?.data;
      if (data) {
        if (data.autoCheckoutHour) {
          setAutoCheckoutHour(data.autoCheckoutHour);
        }
        if (data.session) {
          setSession(data.session);
          setStatus(data.session.attendanceStatus);
          setLiveMinutes(data.liveWorkMinutes || 0);
        } else {
          setSession(null);
          setStatus('absent');
          setLiveMinutes(0);
        }
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const isPastAutoCheckout = () => {
    if (!autoCheckoutHour) return false;
    const now = new Date();
    const istNow = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
    return istNow.getUTCHours() >= autoCheckoutHour;
  };

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const [statsRes, monthlyRes] = await Promise.all([
        getMyStats(),
        getMyMonthlyHours()
      ]);
      setStats(statsRes.data?.data || null);
      setMonthlySummary(monthlyRes.data?.data?.summary || null);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(
    async (page = 1) => {
      try {
        setHistoryLoading(true);
        const res = await getMyHistory({ page, limit: 10, sort: '-date' });
        setHistory(res.data?.data || []);
        setHistoryPagination(res.data?.pagination || null);

        // Build calendar data from history
        const dates = new Set();
        (res.data?.data || []).forEach((r) => dates.add(r.date));
        setCalendarDays((prev) => {
          const merged = new Set([...prev, ...dates]);
          return merged;
        });
      } catch (error) {
        console.error('Failed to fetch history:', error);
      } finally {
        setHistoryLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchStatus();
    fetchStats();
    fetchHistory(1);
    // Also load all calendar data
    (async () => {
      try {
        const res = await getMyHistory({ page: 1, limit: 100 });
        const dates = new Set();
        (res.data?.data || []).forEach((r) => dates.add(r.date));
        setCalendarDays(dates);
      } catch {
        /* non-critical */
      }
    })();
  }, [fetchStatus, fetchStats, fetchHistory]);

  // ─── Live timer ────────────────────────────────────────────────────
  useEffect(() => {
    if (status === 'checked-in' && session) {
      timerRef.current = setInterval(() => {
        const now = new Date();
        const checkIn = new Date(session.checkInTime);
        const grossMs = now - checkIn;
        const grossMin = Math.max(0, Math.round(grossMs / 60000));

        const breakMin = (session.breaks || []).reduce(
          (sum, b) => sum + (b.duration || 0),
          0
        );
        setLiveMinutes(Math.max(0, grossMin - breakMin));
      }, 1000);
    } else if (status === 'on-break' && session) {
      // On break — freeze work timer but show break duration
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, session]);

  // ─── Actions ───────────────────────────────────────────────────────
  const handleCheckIn = async () => {
    try {
      setActionLoading(true);
      const res = await apiCheckIn();
      const newSession = res.data?.data?.session;
      setSession(newSession);
      setStatus('checked-in');
      setLiveMinutes(0);
      toast.success('Checked in successfully!');
      fetchStats();
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to check in.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleBreakStart = async () => {
    try {
      setActionLoading(true);
      const res = await apiBreakStart();
      setSession(res.data?.data?.session);
      setStatus('on-break');
      toast.success('Break started. Take some rest!');
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to start break.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleBreakEnd = async () => {
    try {
      setActionLoading(true);
      const res = await apiBreakEnd();
      const updated = res.data?.data?.session;
      setSession(updated);
      setStatus('checked-in');
      toast.success('Break ended. Welcome back!');
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to end break.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setActionLoading(true);
      const res = await apiCheckOut();
      const updated = res.data?.data?.session;
      setSession(updated);
      setStatus('checked-out');
      if (timerRef.current) clearInterval(timerRef.current);
      setLiveMinutes(updated?.totalWorkDuration || 0);
      toast.success('Checked out successfully!');
      fetchStats();
      fetchHistory(historyPage);
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to check out.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Calendar helpers ──────────────────────────────────────────────
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const calendarCells = () => {
    const { year, month } = calendarMonth;
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const cells = [];

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      cells.push({ day: null, key: `empty-${i}` });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        day: d,
        dateStr,
        present: calendarDays.has(dateStr),
        isToday: dateStr === new Date().toISOString().split('T')[0],
        key: dateStr,
      });
    }

    return cells;
  };

  const navigateMonth = (direction) => {
    setCalendarMonth((prev) => {
      let newMonth = prev.month + direction;
      let newYear = prev.year;
      if (newMonth < 0) {
        newMonth = 11;
        newYear--;
      } else if (newMonth > 11) {
        newMonth = 0;
        newYear++;
      }
      return { year: newYear, month: newMonth };
    });
  };

  const statusInfo = statusConfig[status] || statusConfig.absent;
  const StatusIcon = statusInfo.icon;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            My Attendance
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track your daily attendance and work hours
          </p>
        </div>
        {/* Status Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${statusInfo.bgColor} border border-slate-200/50 dark:border-slate-700/50`}
        >
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`absolute inline-flex h-full w-full rounded-full ${statusInfo.color} ${
                statusInfo.pulse ? 'animate-ping opacity-75' : ''
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${statusInfo.color}`}
            />
          </span>
          <span className={`text-sm font-semibold ${statusInfo.textColor}`}>
            {statusInfo.label}
          </span>
        </motion.div>
      </div>

      {/* ─── Main Action Card ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
      >
        {/* Live Timer */}
        <div className="text-center py-8 px-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800/50">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            {status === 'checked-out'
              ? 'Total Worked Today'
              : status === 'missed-checkout'
                ? 'Session Closed (Unchecked)'
                : status === 'on-break'
                  ? 'Work Duration (Paused)'
                  : status === 'checked-in'
                    ? 'Active Work Duration'
                    : "Today's Session"}
          </p>
          <motion.div
            key={liveMinutes}
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="flex items-center justify-center gap-1"
          >
            <FiClock className="h-8 w-8 text-accent-500 dark:text-accent-400 mr-2" />
            <span className="text-5xl md:text-6xl font-black text-slate-900 dark:text-slate-50 tabular-nums tracking-tight">
              {Math.floor(liveMinutes / 60)}
            </span>
            <span className="text-2xl font-bold text-slate-400 self-end mb-2">h</span>
            <span className="text-5xl md:text-6xl font-black text-slate-900 dark:text-slate-50 tabular-nums tracking-tight">
              {String(Math.round(liveMinutes % 60)).padStart(2, '0')}
            </span>
            <span className="text-2xl font-bold text-slate-400 self-end mb-2">m</span>
          </motion.div>

          {session && (
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-500 dark:text-slate-400">
              <span>
                Check-in: <strong>{formatTime(session.checkInTime)}</strong>
              </span>
              {session.totalBreakDuration > 0 && (
                <span>
                  Breaks: <strong>{formatDuration(session.totalBreakDuration)}</strong>
                </span>
              )}
              {session.checkOutTime && (
                <span>
                  Check-out: <strong>{formatTime(session.checkOutTime)}</strong>
                </span>
              )}
            </div>
          )}

          {session?.isLate && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              <FiAlertCircle className="h-3.5 w-3.5" />
              Late by {session.lateByMinutes} min
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 md:p-6 border-t border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Check In */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCheckIn}
              disabled={status !== 'absent' || actionLoading || isPastAutoCheckout()}
              className={`flex flex-col items-center gap-2 p-4 md:p-5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                status === 'absent' && !isPastAutoCheckout()
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 cursor-pointer'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
            >
              <FiPlay className="h-6 w-6" />
              <span>{isPastAutoCheckout() ? 'Closed (EOD)' : 'Check In'}</span>
            </motion.button>

            {/* Break Start */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleBreakStart}
              disabled={status !== 'checked-in' || actionLoading}
              className={`flex flex-col items-center gap-2 p-4 md:p-5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                status === 'checked-in'
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25 cursor-pointer'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
            >
              <FiCoffee className="h-6 w-6" />
              <span>Start Break</span>
            </motion.button>

            {/* Break End */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleBreakEnd}
              disabled={status !== 'on-break' || actionLoading}
              className={`flex flex-col items-center gap-2 p-4 md:p-5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                status === 'on-break'
                  ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25 cursor-pointer animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
            >
              <FiPause className="h-6 w-6" />
              <span>End Break</span>
            </motion.button>

            {/* Check Out */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCheckOut}
              disabled={
                (status !== 'checked-in' && status !== 'on-break') ||
                actionLoading
              }
              className={`flex flex-col items-center gap-2 p-4 md:p-5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                status === 'checked-in' || status === 'on-break'
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/25 cursor-pointer'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
            >
              <FiSquare className="h-6 w-6" />
              <span>Check Out</span>
            </motion.button>
          </div>

          {actionLoading && (
            <div className="flex items-center justify-center mt-4">
              <Spinner size="sm" />
              <span className="ml-2 text-sm text-slate-400">Processing...</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* ─── Stats Cards ──────────────────────────────────────────────── */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <StatsCard
            title="Total Days"
            value={stats.totalDays}
            icon={FiCalendar}
            color="indigo"
          />
          <StatsCard
            title="Avg Work/Day"
            value={formatDuration(stats.avgWorkMinutes)}
            icon={FiClock}
            color="teal"
          />
          <StatsCard
            title="Late Days"
            value={stats.lateDays}
            icon={FiAlertCircle}
            color="rose"
          />
          <StatsCard
            title="Current Streak"
            value={`${stats.streak} days`}
            icon={FiAward}
            color="purple"
          />
        </motion.div>
      )}

      {/* ─── Calendar & History ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50">
              Attendance Calendar
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
              >
                <FiChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 min-w-[90px] text-center">
                {new Date(calendarMonth.year, calendarMonth.month).toLocaleDateString(
                  'en-US',
                  { month: 'long', year: 'numeric' }
                )}
              </span>
              <button
                onClick={() => navigateMonth(1)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
              >
                <FiChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div
                key={i}
                className="text-center text-[10px] font-bold text-slate-400 uppercase py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day Cells */}
          <div className="grid grid-cols-7 gap-1">
            {calendarCells().map((cell) => (
              <div
                key={cell.key}
                className={`aspect-square flex items-center justify-center text-xs font-medium rounded-lg transition-all ${
                  !cell.day
                    ? ''
                    : cell.isToday
                      ? 'ring-2 ring-accent-500 font-bold text-accent-700 dark:text-accent-400'
                      : cell.present
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                        : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {cell.day}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 mt-4 text-[10px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-100 dark:bg-emerald-900/30" />
              Present
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm ring-2 ring-accent-500" />
              Today
            </div>
          </div>
        </motion.div>

        {/* History Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50">
              Attendance History
            </h3>
          </div>

          {historyLoading ? (
            <div className="py-16 flex items-center justify-center">
              <Spinner size="md" />
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 px-6">
              <EmptyState
                title="No attendance records"
                description="Your attendance history will appear here once you start checking in."
                icon={FiCalendar}
                className="border-none bg-transparent"
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                      <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        In
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Out
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Break
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Worked
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((record) => {
                      const sConf =
                        statusConfig[record.attendanceStatus] ||
                        statusConfig.absent;
                      return (
                        <tr
                          key={record._id}
                          className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                        >
                          <td className="px-5 py-3.5 text-sm font-medium text-slate-900 dark:text-slate-200">
                            {new Date(record.date + 'T00:00:00').toLocaleDateString(
                              'en-IN',
                              {
                                day: '2-digit',
                                month: 'short',
                                weekday: 'short',
                              }
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-400">
                            {formatTime(record.checkInTime)}
                          </td>
                          <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-400">
                            {formatTime(record.checkOutTime)}
                          </td>
                          <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-400">
                            {formatDuration(record.totalBreakDuration)}
                          </td>
                          <td className="px-5 py-3.5 text-sm font-semibold text-slate-900 dark:text-slate-200">
                            {formatDuration(record.totalWorkDuration)}
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${sConf.bgColor} ${sConf.textColor}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${sConf.color}`}
                              />
                              {sConf.label}
                              {record.isLate && (
                                <span className="text-rose-500 ml-1">• Late</span>
                              )}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {historyPagination && historyPagination.pages > 1 && (
                <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800">
                  <Pagination
                    currentPage={historyPage}
                    totalPages={historyPagination.pages}
                    onPageChange={(p) => {
                      setHistoryPage(p);
                      fetchHistory(p);
                    }}
                  />
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>

      {/* Monthly Stats Row */}
      {monthlySummary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50">
              This Month Summary
            </h3>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <StatsCard title="Total Hours" value={monthlySummary.totalWorkHours} icon={FiClock} color="indigo" />
            <StatsCard title="Present Days" value={monthlySummary.presentDays} icon={FiCalendar} color="teal" />
            <StatsCard title="Late Days" value={monthlySummary.lateDays} icon={FiAlertCircle} color="amber" />
            <StatsCard title="Missed Checkout" value={monthlySummary.missedCheckoutDays} icon={FiXCircle} color="rose" />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
              <p className="text-xs text-slate-500 mb-1">Full Days</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{monthlySummary.classification?.fullDays || 0}</p>
            </div>
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
              <p className="text-xs text-slate-500 mb-1">Half Days</p>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{monthlySummary.classification?.halfDays || 0}</p>
            </div>
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
              <p className="text-xs text-slate-500 mb-1">Overtime</p>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{monthlySummary.classification?.overtimeDays || 0}</p>
            </div>
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
              <p className="text-xs text-slate-500 mb-1">Insufficient</p>
              <p className="text-lg font-bold text-rose-600 dark:text-rose-400">{monthlySummary.classification?.insufficientDays || 0}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── Mobile Sticky Action Bar ────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800/50 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.1)]">
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={handleCheckIn}
            disabled={status !== 'absent' || actionLoading || isPastAutoCheckout()}
            className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              status === 'absent' && !isPastAutoCheckout()
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 opacity-80'
            }`}
          >
            <FiPlay className="h-5 w-5" />
            {isPastAutoCheckout() ? 'Closed' : 'In'}
          </button>
          <button
            onClick={handleBreakStart}
            disabled={status !== 'checked-in' || actionLoading}
            className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              status === 'checked-in'
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 opacity-80'
            }`}
          >
            <FiCoffee className="h-5 w-5" />
            Break
          </button>
          <button
            onClick={handleBreakEnd}
            disabled={status !== 'on-break' || actionLoading}
            className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              status === 'on-break'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20 animate-pulse'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 opacity-80'
            }`}
          >
            <FiPause className="h-5 w-5" />
            Resume
          </button>
          <button
            onClick={handleCheckOut}
            disabled={
              (status !== 'checked-in' && status !== 'on-break') || actionLoading
            }
            className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              status === 'checked-in' || status === 'on-break'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 opacity-80'
            }`}
          >
            <FiSquare className="h-5 w-5" />
            Out
          </button>
        </div>
      </div>

      {/* Spacer for mobile fixed bar */}
      <div className="h-20 md:hidden" />
    </div>
  );
};

export default StudentAttendancePage;
