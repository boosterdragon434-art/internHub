import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { FiBriefcase, FiFileText, FiCreditCard, FiUsers } from 'react-icons/fi';
import { getInternshipStats } from '../../api/internshipApi';
import { getApplicationStats } from '../../api/applicationApi';
import { getPaymentStats } from '../../api/paymentApi';
import { getUserStats } from '../../api/userApi';
import StatsCard from '../../components/ui/StatsCard';
import { AnalyticsAreaChart, AnalyticsPieChart } from '../../components/ui/Chart';
import { DashboardSkeleton } from '../../components/ui/SkeletonCard';
import { formatCurrency } from '../../utils/formatters';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [intRes, appRes, payRes, userRes] = await Promise.allSettled([
          getInternshipStats(), getApplicationStats(), getPaymentStats(), getUserStats(),
        ]);
        setStats({
          internships: intRes.status === 'fulfilled' && intRes.value?.success ? intRes.value.data : {},
          applications: appRes.status === 'fulfilled' && appRes.value?.success ? appRes.value.data : {},
          payments: payRes.status === 'fulfilled' && payRes.value?.success ? payRes.value.data : {},
          users: userRes.status === 'fulfilled' && userRes.value?.success ? userRes.value.data : {},
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <DashboardSkeleton />;

  const appStatusData = (stats?.applications?.statusCounts || []).map((s) => ({
    name: s._id, value: s.count,
  }));

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const revenueData = (stats?.payments?.monthlyRevenue || []).map((m) => ({
    name: `${monthNames[(m._id?.month || 1) - 1]} ${m._id?.year}`,
    value: m.revenue,
  }));

  return (
    <>
      <Helmet><title>Admin Dashboard — InternHub</title></Helmet>

      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Overview of your platform metrics and analytics.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard title="Total Students" value={stats?.users?.totalStudents || 0} icon={FiUsers} color="indigo" />
        <StatsCard title="Active Internships" value={stats?.internships?.active || 0} icon={FiBriefcase} color="teal" />
        <StatsCard title="Applications" value={stats?.applications?.total || 0} icon={FiFileText} color="amber" />
        <StatsCard title="Total Revenue" value={formatCurrency(stats?.payments?.totalRevenue || 0)} icon={FiCreditCard} color="purple" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50 mb-4">Revenue Trend</h2>
          {revenueData.length > 0 ? (
            <AnalyticsAreaChart data={revenueData} label="Revenue" color="#6366f1" />
          ) : (
            <p className="text-xs text-slate-500 py-10 text-center">No revenue data available yet.</p>
          )}
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50 mb-4">Applications by Status</h2>
          {appStatusData.length > 0 ? (
            <AnalyticsPieChart data={appStatusData} />
          ) : (
            <p className="text-xs text-slate-500 py-10 text-center">No application data available yet.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
