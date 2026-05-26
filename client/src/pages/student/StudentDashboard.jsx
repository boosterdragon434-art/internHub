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
        className="mb-6 bg-gradient-to-r from-accent-600 to-accent-700 rounded-2xl p-6 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm"
      >
        <div>
          <h1 className="text-2xl font-extrabold">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="text-sm text-accent-105 mt-1">
            Track your applications, manage payments, and stay on top of your internship journey.
          </p>
        </div>
        <Link
          to="/internships"
          className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-accent-700 hover:bg-accent-50 font-bold text-sm rounded-xl shadow-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          <FiBriefcase className="h-4.5 w-4.5 flex-shrink-0" />
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

      {/* Recent Applications */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50">Recent Applications</h2>
          <Link to="/student/applications" className="text-xs font-semibold text-accent-600 dark:text-accent-400 hover:text-accent-700">
            View All
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
                  <tr key={app._id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-3 text-sm font-semibold text-slate-900 dark:text-slate-50 whitespace-nowrap">
                      {app.internship?.title || 'N/A'}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
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
    </>
  );
};

export default StudentDashboard;
