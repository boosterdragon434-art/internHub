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
 * State 1: Not enrolled → application progress tracker + guidance
 * State 2: Enrolled → enrolled internship overview + quick actions + stats
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
  const enrolled = applications.filter((a) => a.status === 'Joined').length;

  // ── Determine the highest status for progress tracker ────────────
  const statusPriority = ['Applied', 'Under Review', 'Approved', 'Payment Pending', 'Payment Verification Pending', 'Joined'];
  let highestStatusIndex = -1;
  for (const app of applications) {
    const idx = statusPriority.indexOf(app.status);
    if (idx > highestStatusIndex) highestStatusIndex = idx;
  }

  return (
    <>
      <Helmet><title>Dashboard — InternHub</title></Helmet>

      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-8 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 rounded-[2rem] p-8 sm:p-10 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 shadow-xl shadow-brand-900/10 overflow-hidden"
      >
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-[0.07] blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-brand-400 opacity-20 blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="text-brand-100/90 mt-2.5 font-medium max-w-lg leading-relaxed text-sm sm:text-base">
            {isEnrolled
              ? `You're enrolled in ${activeEnrollment?.internship?.title}. Track your progress and make the most of your internship.`
              : 'Track your applications, manage payments, and start your internship journey.'}
          </p>
          {isEnrolled && activeEnrollment?.internship && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-bold text-white/90 backdrop-blur-sm">
                <FiCheckCircle className="h-3 w-3" /> Enrolled
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-medium text-white/80">
                {activeEnrollment.internship.category}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-medium text-white/80">
                {activeEnrollment.internship.mode}
              </span>
            </div>
          )}
        </div>
        <Link
          to="/internships"
          className="relative z-10 shrink-0 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-white text-brand-700 hover:bg-brand-50 hover:text-brand-800 font-bold text-sm rounded-xl shadow-xl shadow-brand-900/20 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
        >
          <FiBriefcase className="h-5 w-5 flex-shrink-0" />
          Browse Internships
        </Link>
      </motion.div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* ENROLLED DASHBOARD STATE                                       */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {isEnrolled ? (
        <>
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
          >
            {[
              { to: '/student/attendance', icon: FiPlay, label: 'Mark Attendance', color: 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' },
              { to: '/student/tasks', icon: FiCheckSquare, label: 'View Tasks', color: 'bg-brand-500 hover:bg-brand-600 shadow-brand-500/20' },
              { to: '/student/calendar', icon: FiCalendar, label: 'My Calendar', color: 'bg-violet-500 hover:bg-violet-600 shadow-violet-500/20' },
              { to: '/student/certificates', icon: FiAward, label: 'Certificates', color: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' },
            ].map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className={`flex flex-col items-center gap-2 p-4 sm:p-5 rounded-2xl text-white font-semibold text-xs sm:text-sm shadow-lg transition-all duration-300 hover:-translate-y-1 active:translate-y-0 ${action.color}`}
              >
                <action.icon className="h-6 w-6" />
                <span className="text-center leading-tight">{action.label}</span>
              </Link>
            ))}
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard title="Total Applications" value={applications.length} icon={FiFileText} color="indigo" />
            <StatsCard title="Enrolled Courses" value={enrollments.filter((e) => e.status === 'active').length} icon={FiCheckCircle} color="teal" />
            <StatsCard title="In Progress" value={inProgress} icon={FiTrendingUp} color="amber" />
            <StatsCard title="Payment Pending" value={paymentPending} icon={FiCreditCard} color="purple" />
          </div>

          {/* Enrolled Course Card + Recent Apps + Reminders */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Active Enrollment Details */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100 dark:border-slate-800/60">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">Active Enrollment</h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-200/60 dark:border-emerald-800/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              </div>

              {activeEnrollment && (
                <div className="p-6 sm:p-7">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-1">{activeEnrollment.internship?.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-5">
                    <span>{activeEnrollment.internship?.category}</span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span>{activeEnrollment.internship?.mode}</span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span>{activeEnrollment.internship?.duration}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Start Date', value: formatDate(activeEnrollment.startDate) },
                      { label: 'End Date', value: formatDate(activeEnrollment.endDate) },
                      { label: 'Guide', value: activeEnrollment.assignedGuide?.name || 'Not assigned' },
                      { label: 'Status', value: activeEnrollment.status === 'active' ? '✅ Active' : activeEnrollment.status },
                    ].map((item) => (
                      <div key={item.label} className="bg-slate-50 dark:bg-slate-950/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800/60">
                        <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{item.label}</span>
                        <span className="block text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5 truncate">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Applications Table */}
              <div className="border-t border-slate-100 dark:border-slate-800/60">
                <div className="flex items-center justify-between px-7 py-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50">Recent Applications</h3>
                  <Link to="/student/applications" className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 hover:underline">
                    View All →
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  {applications.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500">
                      No applications yet.{' '}
                      <Link to="/internships" className="font-semibold text-accent-600 dark:text-accent-400">Browse internships</Link>
                    </div>
                  ) : (
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                          <th className="px-6 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Internship</th>
                          <th className="px-6 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Applied On</th>
                        </tr>
                      </thead>
                      <tbody>
                        {applications.slice(0, 4).map((app) => (
                          <tr key={app._id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors cursor-default group">
                            <td className="px-6 py-4 text-sm font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                              {app.internship?.title || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge status={app.status} />
                            </td>
                            <td className="px-6 py-3 text-xs text-slate-500 whitespace-nowrap hidden sm:table-cell">
                              {formatDate(app.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Productivity Alerts */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="lg:col-span-1"
            >
              <ReminderWidget />
            </motion.div>
          </div>
        </>
      ) : (
        /* ════════════════════════════════════════════════════════════════ */
        /* NOT ENROLLED DASHBOARD STATE                                    */
        /* ════════════════════════════════════════════════════════════════ */
        <>
          {/* Application Progress Tracker */}
          {applications.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mb-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 sm:p-8 shadow-sm"
            >
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-50 mb-5 tracking-tight">Your Progress</h2>
              <div className="flex items-center justify-between mb-6">
                {[
                  { label: 'Applied', icon: FiFileText, step: 0 },
                  { label: 'Under Review', icon: FiClock, step: 1 },
                  { label: 'Approved', icon: FiCheckCircle, step: 2 },
                  { label: 'Payment', icon: FiCreditCard, step: 3 },
                  { label: 'Enrolled', icon: FiCheckCircle, step: 5 },
                ].map((s, idx, arr) => (
                  <React.Fragment key={s.step}>
                    <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all border-2 ${
                        highestStatusIndex >= s.step
                          ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-400'
                      }`}>
                        <s.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <span className={`text-[9px] sm:text-[10px] font-bold text-center leading-tight ${
                        highestStatusIndex >= s.step
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-400'
                      }`}>
                        {s.label}
                      </span>
                    </div>
                    {idx < arr.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-1 sm:mx-2 rounded-full transition-colors ${
                        highestStatusIndex > s.step
                          ? 'bg-emerald-400'
                          : 'bg-slate-200 dark:bg-slate-800'
                      }`} />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Next Step Guidance */}
              <div className="bg-brand-50 dark:bg-brand-950/15 border border-brand-100 dark:border-brand-800/30 rounded-xl p-4 flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 rounded-lg flex items-center justify-center">
                  <FiArrowRight className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-brand-800 dark:text-brand-300">
                    {highestStatusIndex <= 0 && 'Application Submitted!'}
                    {highestStatusIndex === 1 && 'Application Under Review'}
                    {highestStatusIndex === 2 && 'Approved — Payment Required'}
                    {highestStatusIndex >= 3 && highestStatusIndex < 5 && 'Payment Processing...'}
                    {highestStatusIndex >= 5 && 'Enrolled! 🎉'}
                  </h4>
                  <p className="text-[11px] text-brand-600 dark:text-brand-400 mt-0.5 leading-relaxed">
                    {highestStatusIndex <= 0 && 'Your application is submitted. Our team will review it soon.'}
                    {highestStatusIndex === 1 && 'Your application is being reviewed by our team. Sit tight!'}
                    {highestStatusIndex === 2 && 'Great news! Complete your payment to secure your enrollment.'}
                    {highestStatusIndex >= 3 && highestStatusIndex < 5 && 'Your payment is being verified. You\'ll be enrolled shortly.'}
                    {highestStatusIndex >= 5 && 'You\'re all set! Head to your dashboard to start your internship.'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard title="Total Applications" value={applications.length} icon={FiFileText} color="indigo" />
            <StatsCard title="In Progress" value={inProgress} icon={FiCheckCircle} color="teal" />
            <StatsCard title="Pending Review" value={pending} icon={FiClock} color="amber" />
            <StatsCard title="Payment Pending" value={paymentPending} icon={FiCreditCard} color="purple" />
          </div>

          {/* Recent Applications + What's Next */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Recent Applications */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100 dark:border-slate-800/60">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">Recent Applications</h2>
                <Link to="/student/applications" className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 hover:underline">
                  View All →
                </Link>
              </div>
              <div className="overflow-x-auto">
                {applications.length === 0 ? (
                  <div className="p-10 text-center text-xs text-slate-500">
                    No applications yet.{' '}
                    <Link to="/internships" className="font-semibold text-accent-600 dark:text-accent-400">Browse internships</Link>
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                        <th className="px-6 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Internship</th>
                        <th className="px-6 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Applied On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.slice(0, 5).map((app) => (
                        <tr key={app._id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors cursor-default group">
                          <td className="px-6 py-4 text-sm font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                            {app.internship?.title || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge status={app.status} />
                          </td>
                          <td className="px-6 py-3 text-xs text-slate-500 whitespace-nowrap hidden sm:table-cell">
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
              className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm"
            >
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-50 mb-4">🚀 Get Started</h3>
              <div className="space-y-3">
                {[
                  { to: '/internships', label: 'Browse available internships', icon: FiBriefcase, color: 'text-brand-500' },
                  { to: '/student/applications', label: 'Track your applications', icon: FiFileText, color: 'text-violet-500' },
                  { to: '/student/payments', label: 'View payment status', icon: FiCreditCard, color: 'text-amber-500' },
                  { to: '/student/profile', label: 'Complete your profile', icon: FiCheckCircle, color: 'text-emerald-500' },
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 hover:border-brand-200 dark:hover:border-brand-800/40 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all group"
                  >
                    <item.icon className={`h-4 w-4 flex-shrink-0 ${item.color}`} />
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">{item.label}</span>
                    <FiArrowRight className="h-3 w-3 text-slate-300 dark:text-slate-600 ml-auto group-hover:text-brand-500 transition-colors" />
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </>
  );
};

export default StudentDashboard;
