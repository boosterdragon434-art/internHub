import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  FiUsers,
  FiClock,
  FiAlertTriangle,
  FiCoffee,
  FiDownload,
  FiFilter,
  FiSearch,
  FiRefreshCw,
  FiXCircle,
  FiTrendingUp,
  FiBarChart2,
  FiCalendar,
  FiCheckCircle,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import StatsCard from '../../components/ui/StatsCard';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/common/Pagination';
import Spinner from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import {
  getAdminAnalytics,
  exportAdminAttendance,
  getLiveStatus,
  getAdminMonthlyHours,
  getAdminAttendance,
} from '../../api/attendanceApi';

const formatDuration = (minutes) => {
  if (!minutes || minutes <= 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const formatTime = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });
};

const statusColors = {
  'checked-in': { bg: 'bg-emerald-50 dark:bg-emerald-950/20', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500', label: 'Online' },
  'on-break': { bg: 'bg-amber-50 dark:bg-amber-950/20', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500', label: 'On Break' },
  'checked-out': { bg: 'bg-slate-50 dark:bg-slate-900/30', text: 'text-slate-600 dark:text-slate-400', dot: 'bg-slate-400', label: 'Checked Out' },
  'missed-checkout': { bg: 'bg-rose-50 dark:bg-rose-950/20', text: 'text-rose-600 dark:text-rose-400', dot: 'bg-rose-500', label: 'Missed' },
  absent: { bg: 'bg-slate-50 dark:bg-slate-900/30', text: 'text-slate-400', dot: 'bg-slate-300', label: 'Absent' },
};

const AdminAttendancePage = () => {
  const [activeTab, setActiveTab] = useState('records'); // records | live | analytics
  const [loading, setLoading] = useState(true);

  // Analytics
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Records
  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    startDate: '',
    endDate: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Live status
  const [liveData, setLiveData] = useState(null);
  const [liveLoading, setLiveLoading] = useState(false);

  // Export
  const [exporting, setExporting] = useState(false);

  // Monthly Hours Tab
  const [monthlyMonth, setMonthlyMonth] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
  const [monthlyData, setMonthlyData] = useState([]);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [monthlyPage, setMonthlyPage] = useState(1);
  const [monthlyPagination, setMonthlyPagination] = useState(null);

  // Fetch analytics
  const fetchAnalytics = useCallback(async () => {
    try {
      setAnalyticsLoading(true);
      const res = await getAdminAnalytics();
      setAnalytics(res.data?.data || null);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setAnalyticsLoading(false);
      setLoading(false);
    }
  }, []);

  // Fetch records
  const fetchRecords = useCallback(
    async (pageNum = 1) => {
      try {
        setRecordsLoading(true);
        const params = { page: pageNum, limit: 15, sort: '-date' };
        if (filters.search) params.search = filters.search;
        if (filters.status) params.status = filters.status;
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;

        const res = await getAdminAttendance(params);
        setRecords(res.data?.data || []);
        setPagination(res.data?.pagination || null);
      } catch (error) {
        console.error('Failed to fetch records:', error);
      } finally {
        setRecordsLoading(false);
      }
    },
    [filters]
  );

  // Fetch live status
  const fetchLive = useCallback(async () => {
    try {
      setLiveLoading(true);
      const res = await getLiveStatus();
      setLiveData(res.data?.data || null);
    } catch (error) {
      console.error('Failed to fetch live status:', error);
    } finally {
      setLiveLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
    fetchRecords(1);
  }, [fetchAnalytics, fetchRecords]);

  useEffect(() => {
    if (activeTab === 'live') {
      fetchLive();
    }
  }, [activeTab, fetchLive]);

  // Fetch Monthly Hours
  const fetchMonthly = useCallback(async (pageNum = 1) => {
    try {
      setMonthlyLoading(true);
      const res = await getAdminMonthlyHours({ month: monthlyMonth, page: pageNum, limit: 15 });
      setMonthlyData(res.data?.data || []);
      setMonthlyPagination(res.data?.pagination || null);
    } catch (error) {
      console.error('Failed to fetch monthly hours:', error);
    } finally {
      setMonthlyLoading(false);
    }
  }, [monthlyMonth]);

  useEffect(() => {
    if (activeTab === 'monthly') {
      fetchMonthly(1);
    }
  }, [activeTab, monthlyMonth, fetchMonthly]);

  // Export handler
  const handleExport = async () => {
    try {
      setExporting(true);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const res = await exportAdminAttendance(params);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance_report_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Report exported successfully!');
    } catch (error) {
      toast.error('Failed to export report.');
    } finally {
      setExporting(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchRecords(1);
  };

  const clearFilters = () => {
    setFilters({ search: '', status: '', startDate: '', endDate: '' });
    setPage(1);
    setTimeout(() => fetchRecords(1), 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const tabs = [
    { id: 'records', label: 'Records', icon: FiClock },
    { id: 'live', label: 'Live Status', icon: FiUsers },
    { id: 'monthly', label: 'Monthly Hours', icon: FiCalendar },
    { id: 'analytics', label: 'Analytics', icon: FiBarChart2 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Attendance Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Monitor, analyze, and export intern attendance data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-accent-600 hover:bg-accent-700 text-white shadow-sm transition-colors"
          >
            {exporting ? <Spinner size="sm" /> : <FiDownload className="h-4 w-4" />}
            Export Excel
          </motion.button>
        </div>
      </div>

      {/* Stats Cards */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatsCard
            title="Total Students"
            value={analytics.totalStudents}
            icon={FiUsers}
            color="indigo"
          />
          <StatsCard
            title="Present Today"
            value={analytics.todayPresent}
            icon={FiCheckCircle}
            color="teal"
          />
          <StatsCard
            title="Absent Today"
            value={analytics.todayAbsent}
            icon={FiXCircle}
            color="rose"
          />
          <StatsCard
            title="Late Today"
            value={analytics.todayLate}
            icon={FiAlertTriangle}
            color="amber"
          />
          <StatsCard
            title="On Break"
            value={analytics.todayOnBreak}
            icon={FiCoffee}
            color="purple"
          />
          <StatsCard
            title="Unchecked Today"
            value={analytics.todayUnchecked || 0}
            icon={FiAlertTriangle}
            color="rose"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Records Tab ──────────────────────────────────────────────── */}
      {activeTab === 'records' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Search & Filters */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by student name or email..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, search: e.target.value }))
                  }
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`inline-flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                    showFilters
                      ? 'border-accent-300 bg-accent-50 dark:bg-accent-950/20 text-accent-700 dark:text-accent-400'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <FiFilter className="h-4 w-4" />
                  Filters
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-accent-600 hover:bg-accent-700 text-white transition-colors"
                >
                  Search
                </button>
              </div>
            </form>

            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800"
              >
                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, status: e.target.value }))
                  }
                  className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-accent-500"
                >
                  <option value="">All Statuses</option>
                  <option value="checked-in">Online</option>
                  <option value="on-break">On Break</option>
                  <option value="checked-out">Checked Out</option>
                  <option value="missed-checkout">Missed Checkout</option>
                </select>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, startDate: e.target.value }))
                  }
                  className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-accent-500"
                  placeholder="Start Date"
                />
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, endDate: e.target.value }))
                  }
                  className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-accent-500"
                  placeholder="End Date"
                />
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                >
                  <FiRefreshCw className="h-3.5 w-3.5" />
                  Clear filters
                </button>
              </motion.div>
            )}
          </div>

          {/* Records Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {recordsLoading ? (
              <div className="py-20 flex items-center justify-center">
                <Spinner size="md" />
              </div>
            ) : records.length === 0 ? (
              <div className="py-12 px-6">
                <EmptyState
                  title="No records found"
                  description="No attendance records match your search criteria."
                  icon={FiClock}
                  className="border-none bg-transparent"
                />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                        <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                        <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                        <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Team</th>
                        <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">In</th>
                        <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Out</th>
                        <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Break</th>
                        <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Worked</th>
                        <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((r) => {
                        const sc = statusColors[r.attendanceStatus] || statusColors.absent;
                        return (
                          <tr key={r._id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center text-xs font-bold text-accent-700 dark:text-accent-400">
                                  {r.user?.name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-slate-900 dark:text-slate-200">{r.user?.name || 'Unknown'}</p>
                                  <p className="text-xs text-slate-400">{r.user?.email || ''}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-400">
                              {new Date(r.date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                            </td>
                            <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-400">{r.team?.name || '—'}</td>
                            <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-400">{formatTime(r.checkInTime)}</td>
                            <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-400">{formatTime(r.checkOutTime)}</td>
                            <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-400">{formatDuration(r.totalBreakDuration)}</td>
                            <td className="px-5 py-3.5 text-sm font-semibold text-slate-900 dark:text-slate-200">{formatDuration(r.totalWorkDuration)}</td>
                            <td className="px-5 py-3.5">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.text}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                                {sc.label}
                                {r.isLate && <span className="text-rose-500 ml-1">• Late</span>}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {pagination && pagination.pages > 1 && (
                  <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800">
                    <Pagination
                      currentPage={page}
                      totalPages={pagination.pages}
                      onPageChange={(p) => {
                        setPage(p);
                        fetchRecords(p);
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* ─── Live Status Tab ──────────────────────────────────────────── */}
      {activeTab === 'live' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Real-time attendance status of all active interns
            </p>
            <button
              onClick={fetchLive}
              disabled={liveLoading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-950/20 transition-colors"
            >
              <FiRefreshCw className={`h-3.5 w-3.5 ${liveLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {liveLoading && !liveData ? (
            <div className="py-20 flex items-center justify-center">
              <Spinner size="md" />
            </div>
          ) : liveData ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {liveData.statuses?.map((s) => {
                const sc = statusColors[s.status] || statusColors.absent;
                return (
                  <motion.div
                    key={s._id}
                    whileHover={{ y: -2 }}
                    className={`p-4 rounded-xl border border-slate-200 dark:border-slate-800 ${sc.bg} transition-all`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-700 dark:text-slate-200 shadow-sm">
                        {s.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{s.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${s.status === 'checked-in' || s.status === 'on-break' ? 'animate-pulse' : ''}`} />
                          <span className={`text-xs font-medium ${sc.text}`}>{sc.label}</span>
                          {s.isLate && (
                            <span className="text-xs text-rose-500 font-medium ml-1">• Late</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {s.checkInTime && (
                      <p className="text-xs text-slate-400 mt-2 pl-13">
                        Checked in at {formatTime(s.checkInTime)}
                      </p>
                    )}
                    {s.team && (
                      <p className="text-xs text-slate-400 mt-0.5 pl-13">
                        Team: {s.team.name}
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No data available"
              description="Unable to load live status data."
              icon={FiUsers}
            />
          )}
        </motion.div>
      )}

      {/* ─── Monthly Hours Tab ────────────────────────────────────────── */}
      {activeTab === 'monthly' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50">
              Monthly Hours Summary
            </h3>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Select Month:</label>
              <input 
                type="month" 
                value={monthlyMonth}
                onChange={(e) => { setMonthlyMonth(e.target.value); setMonthlyPage(1); }}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-accent-500"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {monthlyLoading ? (
              <div className="py-20 flex items-center justify-center">
                <Spinner size="md" />
              </div>
            ) : monthlyData.length === 0 ? (
              <div className="py-12 px-6">
                <EmptyState
                  title="No records found"
                  description="No monthly hours recorded for the selected month."
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
                        <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Student</th>
                        <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Total Hrs</th>
                        <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Present Days</th>
                        <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Late Days</th>
                        <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase text-center" colSpan={4}>Day Classification</th>
                      </tr>
                      <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                        <th colSpan={4}></th>
                        <th className="px-3 py-2 text-[10px] font-semibold text-emerald-600 text-center border-l border-slate-200 dark:border-slate-800">Full</th>
                        <th className="px-3 py-2 text-[10px] font-semibold text-amber-600 text-center">Half</th>
                        <th className="px-3 py-2 text-[10px] font-semibold text-purple-600 text-center">OT</th>
                        <th className="px-3 py-2 text-[10px] font-semibold text-rose-600 text-center">Insufficient</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyData.map((d) => (
                        <tr key={d.user?._id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                          <td className="px-5 py-3.5">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-200">{d.user?.name || 'Unknown'}</p>
                            <p className="text-xs text-slate-400">{d.user?.email || ''}</p>
                          </td>
                          <td className="px-5 py-3.5 text-sm font-bold text-slate-900 dark:text-slate-200">{d.totalWorkHours}</td>
                          <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-400">{d.presentDays}</td>
                          <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-400">{d.lateDays}</td>
                          <td className="px-3 py-3.5 text-sm text-center border-l border-slate-100 dark:border-slate-800/60 font-semibold text-emerald-600">{d.classification?.fullDays || 0}</td>
                          <td className="px-3 py-3.5 text-sm text-center font-semibold text-amber-600">{d.classification?.halfDays || 0}</td>
                          <td className="px-3 py-3.5 text-sm text-center font-semibold text-purple-600">{d.classification?.overtimeDays || 0}</td>
                          <td className="px-3 py-3.5 text-sm text-center font-semibold text-rose-600">{d.classification?.insufficientDays || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {monthlyPagination && monthlyPagination.pages > 1 && (
                  <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800">
                    <Pagination
                      currentPage={monthlyPage}
                      totalPages={monthlyPagination.pages}
                      onPageChange={(p) => { setMonthlyPage(p); fetchMonthly(p); }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* ─── Analytics Tab ────────────────────────────────────────────── */}
      {activeTab === 'analytics' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {analyticsLoading ? (
            <div className="py-20 flex items-center justify-center">
              <Spinner size="md" />
            </div>
          ) : analytics ? (
            <>
              {/* Weekly Trend Chart */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
                  <FiTrendingUp className="h-4 w-4 text-accent-500" />
                  Weekly Attendance Trend
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.weeklyData} barCategoryGap="20%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 12, fill: '#94a3b8' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#94a3b8' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: 'none',
                          borderRadius: '12px',
                          color: '#f8fafc',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="present" fill="#10b981" name="Present" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="late" fill="#f59e0b" name="Late" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="absent" fill="#ef4444" name="Absent" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly Summary */}
              {analytics.monthSummary && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <StatsCard
                    title="Month Total Sessions"
                    value={analytics.monthSummary.totalSessions}
                    icon={FiClock}
                    color="indigo"
                  />
                  <StatsCard
                    title="Month Avg Work/Session"
                    value={formatDuration(analytics.monthSummary.avgWorkMinutes)}
                    icon={FiTrendingUp}
                    color="teal"
                  />
                </div>
              )}
            </>
          ) : (
            <EmptyState
              title="No analytics data"
              description="Analytics will appear once attendance data is available."
              icon={FiBarChart2}
            />
          )}
        </motion.div>
      )}
    </div>
  );
};

export default AdminAttendancePage;
