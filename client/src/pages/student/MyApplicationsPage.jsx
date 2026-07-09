import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiFileText } from 'react-icons/fi';
import { getMyApplications } from '../../api/applicationApi';
import { getMyPaymentRequests } from '../../api/paymentApi';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Loader';
import { formatDate, formatCurrency } from '../../utils/formatters';

const MyApplicationsPage = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  // Map of applicationId -> pending PaymentRequest, so the "Pay" CTA can show
  // the real assigned amount instead of a field that doesn't exist on Application.
  const [pendingPaymentsByApp, setPendingPaymentsByApp] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [appsRes, requestsRes] = await Promise.all([
        getMyApplications(),
        getMyPaymentRequests(),
      ]);
      if (appsRes.success) setApplications(appsRes.data);
      if (requestsRes.success) {
        const map = {};
        requestsRes.data
          .filter((r) => r.status === 'pending')
          .forEach((r) => {
            const appId = typeof r.application === 'string' ? r.application : r.application?._id;
            if (appId) map[appId] = r;
          });
        setPendingPaymentsByApp(map);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePayClick = (app) => {
    // Passes state so PaymentPage can open the correct payment modal directly
    // instead of leaving the student to find it themselves.
    navigate('/student/payments', { state: { applicationId: app._id } });
  };

  return (
    <>
      <Helmet><title>My Applications — InternHub</title></Helmet>

      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">My Applications</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Track all your internship applications in one place.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
      ) : applications.length === 0 ? (
        <EmptyState
          title="No applications yet"
          description="Start by browsing internships and submitting your first application."
          icon={FiFileText}
          actionText="Browse Internships"
          onActionClick={() => navigate('/internships')}
        />
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const pendingRequest = pendingPaymentsByApp[app._id];
            return (
              <div
                key={app._id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-md transition-shadow"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50 truncate">
                    {app.internship?.title || 'Unknown Internship'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{app.internship?.category}</span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{app.internship?.mode}</span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Applied {formatDate(app.createdAt)}</span>
                  </div>
                  {pendingRequest?.deadline && app.status === 'Payment Pending' && (
                    <p className="text-[10px] text-red-500 mt-1.5 font-medium">
                      Payment due by {formatDate(pendingRequest.deadline)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
                  {app.status === 'Joined' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-200/60 dark:border-emerald-800/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Enrolled
                    </span>
                  ) : (
                    <Badge status={app.status} />
                  )}
                  {app.status === 'Payment Pending' && pendingRequest && (
                    <Button
                      size="sm"
                      variant="primary"
                      className="ml-auto sm:ml-0"
                      onClick={() => handlePayClick(app)}
                    >
                      Pay {formatCurrency(pendingRequest.amount)}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

export default MyApplicationsPage;
