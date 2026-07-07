import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FiFileText, FiCheckCircle, FiClock, FiCreditCard, FiBriefcase } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { getMyApplications } from '../../api/applicationApi';
import StatsCard from '../../components/ui/StatsCard';
import Badge from '../../components/common/Badge';
import { formatDate } from '../../utils/formatters';
import { DashboardSkeleton } from '../../components/ui/SkeletonCard';

import ReminderWidget from '../../components/productivity/ReminderWidget';

const StudentDashboard = () => {
  const { user } = useAuth();
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

  if (loading) return <DashboardSkeleton />;

  const approved = applications.filter((a) => ['Approved', 'Payment Pending', 'Payment Completed', 'Joined'].includes(a.status)).length;
  const pending = applications.filter((a) => ['Applied', 'Under Review'].includes(a.status)).length;
  const paymentPending = applications.filter((a) => a.status === 'Payment Pending').length;

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
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-[0.07] blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-brand-400 opacity-20 blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="text-brand-100/90 mt-2.5 font-medium max-w-lg leading-relaxed text-sm sm:text-base">
            Track your applications, manage payments, and stay on top of your internship journey.
          </p>
        </div>
        <Link
          to="/internships"
          className="relative z-10 shrink-0 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-white text-brand-700 hover:bg-brand-50 hover:text-brand-800 font-bold text-sm rounded-xl shadow-xl shadow-brand-900/20 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
        >
          <FiBriefcase className="h-5 w-5 flex-shrink-0" />
          Browse Internships
        </Link>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard title="Total Applications" value={applications.length} icon={FiFileText} color="indigo" />
        <StatsCard title="Approved" value={approved} icon={FiCheckCircle} color="teal" />
        <StatsCard title="Pending" value={pending} icon={FiClock} color="amber" />
        <StatsCard title="Payment Pending" value={paymentPending} icon={FiCreditCard} color="purple" />
      </div>

      {/* Split Grid for Applications & Alerts */}
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
                    <th className="px-6 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Applied On</th>
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
                      <td className="px-6 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(app.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Productivity Alerts */}
        <div className="lg:col-span-1">
          <ReminderWidget />
        </div>
      </div>
    </>
  );
};

export default StudentDashboard;
