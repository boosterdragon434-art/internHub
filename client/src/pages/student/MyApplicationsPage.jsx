import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiFileText } from 'react-icons/fi';
import { getMyApplications } from '../../api/applicationApi';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Loader';
import { formatDate, formatCurrency } from '../../utils/formatters';

const MyApplicationsPage = () => {
  const navigate = useNavigate();
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
          {applications.map((app) => (
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
              </div>
              <div className="flex items-center gap-3">
                <Badge status={app.status} />
                {app.status === 'Payment Pending' && app.assignedPaymentAmount && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => navigate('/student/payments', { state: { applicationId: app._id } })}
                  >
                    Pay {formatCurrency(app.assignedPaymentAmount)}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default MyApplicationsPage;
