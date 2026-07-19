import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  FiFileText,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiBriefcase,
  FiPlay,
  FiCalendar,
  FiAward,
  FiArrowRight,
  FiTrendingUp,
  FiCheckSquare,
  FiCpu,
  FiActivity
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { getMyApplications } from '../../api/applicationApi';
import useEnrollment from '../../hooks/useEnrollment';
import StatsCard from '../../components/ui/StatsCard';
import Badge from '../../components/common/Badge';
import { formatDate } from '../../utils/formatters';
import { DashboardSkeleton } from '../../components/ui/SkeletonCard';
import ReminderWidget from '../../components/productivity/ReminderWidget';

/**
 * StudentDashboard — Two-state dashboard:
 * State 1: Not enrolled → Mission Control Tracker
 * State 2: Enrolled → Bento Grid Dashboard
 */
const StudentDashboard = () => {
  const { user } = useAuth();
  const { isEnrolled, activeEnrollment, enrollments, loading: enrollmentLoading } = useEnrollment();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getMyApplications();
        if (res.success) setApplications(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading || enrollmentLoading) return <DashboardSkeleton />;

  const inProgress = applications.filter((a) =>
    ['Approved', 'Payment Pending', 'Payment Verification Pending', 'Payment Completed', 'Joined'].includes(a.status)
  ).length;
  const pending = applications.filter((a) => ['Applied', 'Under Review'].includes(a.status)).length;
  const paymentPending = applications.filter((a) => a.status === 'Payment Pending').length;

  // ── Determine the highest status for progress tracker ────────────
  const statusPriority = ['Applied', 'Under Review', 'Approved', 'Payment Pending', 'Payment Verification Pending', 'Joined'];
  let highestStatusIndex = -1;
  let activeApp = null;
  
  for (const app of applications) {
    const idx = statusPriority.indexOf(app.status);
    if (idx > highestStatusIndex) {
      highestStatusIndex = idx;
      activeApp = app;
    }
  }

  return (
    <div className="bg-brand-950 min-h-screen font-sans text-slate-100 selection:bg-primary-500/30 selection:text-white">
      <Helmet><title>Dashboard — InternHub</title></Helmet>

      {/* OLED Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-8 bg-brand-900 border border-brand-800 rounded-3xl p-8 sm:p-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 shadow-2xl overflow-hidden"
      >
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-primary-600/10 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-accent-500/10 blur-[80px] pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-brand-800/80 border border-brand-700 text-[10px] font-bold uppercase tracking-widest text-brand-300">
            <FiActivity className="w-3 h-3 text-emerald-400" />
            System Status: Online
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">
            Welcome back, {user?.name?.split(' ')[0]} <span className="text-primary-400">_</span>
          </h1>
          <p className="text-brand-300 mt-2 font-medium max-w-lg leading-relaxed text-sm">
            {isEnrolled
              ? `You're currently compiling ${activeEnrollment?.internship?.title}. Track your sprint velocity below.`
              : 'Mission control online. Track your applications, manage authorizations, and initialize your career.'}
          </p>
          
          {isEnrolled && activeEnrollment?.internship && (
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Sprint
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-800 border border-brand-700 text-xs font-bold text-brand-300">
                <FiCpu className="w-3 h-3" />
                {activeEnrollment.internship.category}
              </span>
            </div>
          )}
        </div>
        <Link
          to="/internships"
          className="relative z-10 shrink-0 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.25)] hover:shadow-[0_0_25px_rgba(139,92,246,0.4)] border border-primary-400/50 transition-all duration-300"
        >
          <FiBriefcase className="h-5 w-5 flex-shrink-0" />
          Browse Tracks
        </Link>
      </motion.div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* ENROLLED DASHBOARD STATE (Bento Grid)                          */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {isEnrolled ? (
        <>
          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            
            {/* Active Sprint Overview (Main Bento Cell) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2 bg-brand-900 border border-brand-800 rounded-3xl overflow-hidden shadow-lg flex flex-col"
            >
              <div className="flex items-center justify-between px-7 py-5 border-b border-brand-800 bg-brand-900/50">
                <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
                  <FiTerminal className="text-primary-400" /> Current Sprint Context
                </h2>
                <div className="px-2.5 py-1 rounded-md bg-brand-800 border border-brand-700 text-xs font-mono text-brand-400">
                  v{activeEnrollment?.internship?._id?.slice(-4)}
                </div>
              </div>

              {activeEnrollment && (
                <div className="p-7 flex-1 flex flex-col">
                  <h3 className="text-2xl font-display font-bold text-white mb-2 group-hover:text-primary-400 transition-colors">
                    {activeEnrollment.internship?.title}
                  </h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                    {[
                      { label: 'Start Time', value: formatDate(activeEnrollment.startDate) },
                      { label: 'End Time', value: formatDate(activeEnrollment.endDate) },
                      { label: 'Reviewer', value: activeEnrollment.assignedGuide?.name || 'Pending' },
                      { label: 'State', value: 'Running', highlight: true },
                    ].map((item) => (
                      <div key={item.label} className="bg-brand-950/50 rounded-xl p-4 border border-brand-800">
                        <span className="block text-[10px] font-bold text-brand-500 uppercase tracking-wider">{item.label}</span>
                        <span className={`block text-sm font-bold mt-1 truncate ${item.highlight ? 'text-emerald-400' : 'text-brand-100'}`}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-8 border-t border-brand-800 pt-6">
                     <h4 className="text-xs font-bold text-brand-400 uppercase tracking-wider mb-4">Quick Actions</h4>
                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { to: '/student/attendance', icon: FiPlay, label: 'Run Sync', color: 'emerald' },
                        { to: '/student/tasks', icon: FiCheckSquare, label: 'Tasks', color: 'primary' },
                        { to: '/student/calendar', icon: FiCalendar, label: 'Calendar', color: 'blue' },
                        { to: '/student/certificates', icon: FiAward, label: 'Export Cert', color: 'accent' },
                      ].map((action) => (
                        <Link
                          key={action.to}
                          to={action.to}
                          className={`flex items-center justify-center gap-2 p-3 rounded-xl text-white font-bold text-xs bg-${action.color}-500/10 hover:bg-${action.color}-500/20 border border-${action.color}-500/30 transition-all duration-300`}
                        >
                          <action.icon className={`h-4 w-4 text-${action.color}-400`} />
                          <span className={`text-${action.color}-400`}>{action.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Productivity Alerts (Side Bento Cell) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="lg:col-span-1 h-full"
            >
              {/* Replace standard reminder widget with a dark theme compatible wrapper */}
              <div className="h-full bg-brand-900 border border-brand-800 rounded-3xl overflow-hidden [&>*]:border-0 [&>*]:bg-transparent shadow-lg">
                 <div className="px-7 py-5 border-b border-brand-800 bg-brand-900/50 flex items-center gap-2">
                    <FiClock className="text-accent-400" />
                    <h2 className="text-lg font-display font-bold text-white">System Alerts</h2>
                 </div>
                 <div className="p-4 h-[calc(100%-65px)]">
                    <ReminderWidget />
                 </div>
              </div>
            </motion.div>
          </div>
          
          {/* Sub Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <StatsCard title="Total Applications" value={applications.length} icon={FiFileText} color="indigo" />
            <StatsCard title="Enrolled Courses" value={enrollments.filter((e) => e.status === 'active').length} icon={FiCheckCircle} color="teal" />
            <StatsCard title="In Progress" value={inProgress} icon={FiTrendingUp} color="amber" />
            <StatsCard title="Payment Pending" value={paymentPending} icon={FiCreditCard} color="purple" />
          </div>

          {/* Recent Logs / Applications */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-brand-900 border border-brand-800 rounded-3xl overflow-hidden shadow-lg"
          >
            <div className="flex items-center justify-between px-7 py-5 border-b border-brand-800 bg-brand-900/50">
              <h2 className="text-base font-display font-bold text-white">Application Logs</h2>
              <Link to="/student/applications" className="text-xs font-bold text-primary-400 hover:text-primary-300 transition-colors">
                View All Logs →
              </Link>
            </div>
            <div className="overflow-x-auto">
              {applications.length === 0 ? (
                <div className="p-8 text-center text-sm font-medium text-brand-400">
                  No logs found.
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-brand-950/50 border-b border-brand-800">
                      <th className="px-7 py-4 text-[10px] font-bold text-brand-500 uppercase tracking-wider">Process ID / Track</th>
                      <th className="px-7 py-4 text-[10px] font-bold text-brand-500 uppercase tracking-wider">State</th>
                      <th className="px-7 py-4 text-[10px] font-bold text-brand-500 uppercase tracking-wider hidden sm:table-cell">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.slice(0, 4).map((app) => (
                      <tr key={app._id} className="border-b border-brand-800 hover:bg-brand-800/30 transition-colors cursor-default group">
                        <td className="px-7 py-4">
                          <div className="text-sm font-bold text-brand-100 group-hover:text-primary-400 transition-colors">
                            {app.internship?.title || 'Unknown Track'}
                          </div>
                          <div className="text-[10px] font-mono text-brand-500 mt-1">ID: {app._id}</div>
                        </td>
                        <td className="px-7 py-4 whitespace-nowrap">
                          <Badge status={app.status} />
                        </td>
                        <td className="px-7 py-4 text-xs font-mono text-brand-400 whitespace-nowrap hidden sm:table-cell">
                          {formatDate(app.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        </>
      ) : (
        /* ════════════════════════════════════════════════════════════════ */
        /* NOT ENROLLED DASHBOARD STATE (Mission Control)                  */
        /* ════════════════════════════════════════════════════════════════ */
        <>
          {/* Application Progress Tracker / Mission Control */}
          {applications.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mb-8 bg-brand-900 border border-brand-800 rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden"
            >
              {/* Decorative circuit lines */}
              <div className="absolute top-0 right-0 w-64 h-full bg-[linear-gradient(to_right,#1e1e32_1px,transparent_1px)] bg-[size:20px_20px] opacity-10 pointer-events-none" />

              <h2 className="text-xl font-display font-bold text-white mb-8 tracking-tight flex items-center gap-2">
                <FiActivity className="text-accent-400" /> Mission Control: Track Status
              </h2>
              
              <div className="flex items-center justify-between mb-8 relative z-10">
                {[
                  { label: 'Submit', icon: FiFileText, step: 0 },
                  { label: 'Review', icon: FiClock, step: 1 },
                  { label: 'Approve', icon: FiCheckCircle, step: 2 },
                  { label: 'Auth', icon: FiCreditCard, step: 3 },
                  { label: 'Launch', icon: FiCheckCircle, step: 5 },
                ].map((s, idx, arr) => (
                  <React.Fragment key={s.step}>
                    <div className="flex flex-col items-center gap-2 flex-shrink-0">
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all duration-500 border-2 ${
                        highestStatusIndex >= s.step
                          ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                          : 'border-brand-800 bg-brand-950 text-brand-600'
                      }`}>
                        <s.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <span className={`text-[10px] font-bold text-center uppercase tracking-widest ${
                        highestStatusIndex >= s.step
                          ? 'text-emerald-400'
                          : 'text-brand-600'
                      }`}>
                        {s.label}
                      </span>
                    </div>
                    {idx < arr.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 rounded-full transition-colors duration-500 ${
                        highestStatusIndex > s.step
                          ? 'bg-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                          : 'bg-brand-800'
                      }`} />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Action Required Banner */}
              <div className={`rounded-2xl p-5 flex items-start gap-4 border ${
                highestStatusIndex === 2 
                ? 'bg-accent-500/10 border-accent-500/30' 
                : 'bg-primary-500/10 border-primary-500/30'
              }`}>
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                  highestStatusIndex === 2 ? 'bg-accent-500/20 text-accent-400' : 'bg-primary-500/20 text-primary-400'
                }`}>
                  {highestStatusIndex === 2 ? <FiCreditCard className="h-5 w-5" /> : <FiArrowRight className="h-5 w-5" />}
                </div>
                <div>
                  <h4 className={`text-sm font-bold font-display ${
                    highestStatusIndex === 2 ? 'text-accent-400' : 'text-primary-400'
                  }`}>
                    {highestStatusIndex <= 0 && 'Awaiting Dispatch'}
                    {highestStatusIndex === 1 && 'System Analyzing...'}
                    {highestStatusIndex === 2 && 'ACTION REQUIRED: Authorize Payment'}
                    {highestStatusIndex >= 3 && highestStatusIndex < 5 && 'Verifying Transaction...'}
                    {highestStatusIndex >= 5 && 'Systems Nominal. Preparing Launch.'}
                  </h4>
                  <p className="text-xs text-brand-300 mt-1.5 leading-relaxed font-medium">
                    {highestStatusIndex <= 0 && 'Your application has been logged. Our engineers are reviewing your profile.'}
                    {highestStatusIndex === 1 && 'Your application is currently under review by our admission protocols.'}
                    {highestStatusIndex === 2 && 'Approval granted. Please complete the payment authorization to mount your workspace.'}
                    {highestStatusIndex >= 3 && highestStatusIndex < 5 && 'Your payment is being verified by our financial protocols. Access will be granted shortly.'}
                    {highestStatusIndex >= 5 && 'All protocols green. Head to your active dashboard to begin.'}
                  </p>
                  
                  {highestStatusIndex === 2 && activeApp && (
                    <Link
                      to={`/student/payments?appId=${activeApp._id}`}
                      className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-accent-500 hover:bg-accent-400 text-brand-950 text-xs font-bold rounded-xl transition-colors shadow-[0_0_15px_rgba(251,191,36,0.3)]"
                    >
                      Complete Authorization <FiArrowRight />
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <StatsCard title="Total Logs" value={applications.length} icon={FiFileText} color="indigo" />
            <StatsCard title="Active Checks" value={inProgress} icon={FiCheckCircle} color="teal" />
            <StatsCard title="Pending Review" value={pending} icon={FiClock} color="amber" />
            <StatsCard title="Auth Required" value={paymentPending} icon={FiCreditCard} color="purple" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Recent Applications */}
            <div className="lg:col-span-2 bg-brand-900 border border-brand-800 rounded-3xl overflow-hidden shadow-lg">
              <div className="flex items-center justify-between px-7 py-5 border-b border-brand-800 bg-brand-900/50">
                <h2 className="text-base font-display font-bold text-white">System Logs</h2>
                <Link to="/student/applications" className="text-xs font-bold text-primary-400 hover:text-primary-300 transition-colors">
                  View All →
                </Link>
              </div>
              <div className="overflow-x-auto">
                {applications.length === 0 ? (
                  <div className="p-10 text-center text-xs text-brand-400 font-medium">
                    No logs found.{' '}
                    <Link to="/internships" className="font-bold text-accent-400">Initialize a process</Link>
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-brand-950/50 border-b border-brand-800">
                        <th className="px-7 py-4 text-[10px] font-bold text-brand-500 uppercase tracking-wider">Target</th>
                        <th className="px-7 py-4 text-[10px] font-bold text-brand-500 uppercase tracking-wider">Status</th>
                        <th className="px-7 py-4 text-[10px] font-bold text-brand-500 uppercase tracking-wider hidden sm:table-cell">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.slice(0, 5).map((app) => (
                        <tr key={app._id} className="border-b border-brand-800 hover:bg-brand-800/30 transition-colors cursor-default group">
                          <td className="px-7 py-4">
                            <div className="text-sm font-bold text-brand-100 group-hover:text-primary-400 transition-colors">
                              {app.internship?.title || 'Unknown'}
                            </div>
                            <div className="text-[10px] font-mono text-brand-500 mt-0.5">ID: {app._id}</div>
                          </td>
                          <td className="px-7 py-4 whitespace-nowrap">
                            <Badge status={app.status} />
                          </td>
                          <td className="px-7 py-4 text-xs font-mono text-brand-400 whitespace-nowrap hidden sm:table-cell">
                            {formatDate(app.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* What's Next Panel */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-1 bg-brand-900 border border-brand-800 rounded-3xl p-6 shadow-lg"
            >
              <h3 className="text-sm font-display font-bold text-white mb-4 flex items-center gap-2">
                <FiTerminal className="text-primary-400" /> Available Commands
              </h3>
              <div className="space-y-3">
                {[
                  { to: '/internships', label: 'Explore available tracks', icon: FiBriefcase, color: 'text-primary-400' },
                  { to: '/student/applications', label: 'Track submitted logs', icon: FiFileText, color: 'text-blue-400' },
                  { to: '/student/payments', label: 'Check authorizations', icon: FiCreditCard, color: 'text-accent-400' },
                  { to: '/student/profile', label: 'Configure identity', icon: FiCheckCircle, color: 'text-emerald-400' },
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center gap-3 p-3.5 rounded-xl border border-brand-800 hover:border-brand-700 bg-brand-950/30 hover:bg-brand-800/50 transition-all group"
                  >
                    <item.icon className={`h-4 w-4 flex-shrink-0 ${item.color}`} />
                    <span className="text-xs font-bold text-brand-300 group-hover:text-white transition-colors">{item.label}</span>
                    <FiArrowRight className="h-3 w-3 text-brand-600 ml-auto group-hover:text-primary-400 transition-colors" />
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
};

export default StudentDashboard;
