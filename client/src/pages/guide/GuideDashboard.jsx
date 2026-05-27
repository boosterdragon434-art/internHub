import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiUsers, FiFileText, FiCheckCircle, FiTrendingUp, FiArrowRight } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { getGuideDashboard } from '../../api/guideApi';
import StatsCard from '../../components/ui/StatsCard';
import { FullPageLoader } from '../../components/common/Loader';

/**
 * Guide Dashboard — overview of assigned students, task stats, and quick actions.
 */
const GuideDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await getGuideDashboard();
        if (res.data?.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <FullPageLoader message="Loading dashboard..." />;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-rose-500 text-lg font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-accent-500 text-white rounded-xl hover:bg-accent-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Total Students',
      value: stats?.totalStudents || 0,
      icon: FiUsers,
      color: 'accent',
    },
    {
      title: 'Active Students',
      value: stats?.activeStudents || 0,
      icon: FiCheckCircle,
      color: 'emerald',
    },
    {
      title: 'Total Applications',
      value: stats?.totalApplications || 0,
      icon: FiFileText,
      color: 'blue',
    },
    {
      title: 'Completion Rate',
      value: `${stats?.applicationStats?.find((s) => s._id === 'Joined')?.count || 0}`,
      icon: FiTrendingUp,
      color: 'violet',
      suffix: ' joined',
    },
  ];

  return (
    <>
      <Helmet>
        <title>Guide Dashboard — InternHub</title>
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        {/* Welcome Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent-500 via-accent-600 to-secondary-600 p-8 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
          <div className="relative z-10">
            <h1 className="text-2xl md:text-3xl font-bold">
              Welcome back, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="mt-2 text-white/80 text-sm md:text-base max-w-xl">
              Here&apos;s an overview of your assigned students and their progress.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((card, idx) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
            >
              <StatsCard {...card} />
            </motion.div>
          ))}
        </div>

        {/* Recent Students */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Recent Students
            </h2>
            <Link
              to="/guide/students"
              className="text-sm font-medium text-accent-600 dark:text-accent-400 hover:underline flex items-center gap-1"
            >
              View All <FiArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {stats?.recentStudents?.length > 0 ? (
            <div className="space-y-3">
              {stats.recentStudents.map((student) => (
                <Link
                  key={student._id}
                  to={`/guide/students/${student._id}`}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                >
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-accent-400 to-secondary-500 flex items-center justify-center text-white font-bold text-sm">
                    {student.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                      {student.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {student.email}
                    </p>
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">
                    {student.college || 'N/A'}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FiUsers className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No students assigned yet. The admin will assign students to you.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default GuideDashboard;
