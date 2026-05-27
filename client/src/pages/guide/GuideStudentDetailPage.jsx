import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import {
  FiArrowLeft,
  FiMail,
  FiPhone,
  FiBookOpen,
  FiMapPin,
  FiFileText,
  FiCheckCircle,
  FiClock,
  FiTrendingUp,
} from 'react-icons/fi';
import { getStudentProgress } from '../../api/guideApi';
import { FullPageLoader } from '../../components/common/Loader';
import Badge from '../../components/common/Badge';

/**
 * Guide Student Detail Page — full view of a specific student's progress and applications.
 */
const GuideStudentDetailPage = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await getStudentProgress(id);
        if (res.data?.success) {
          setData(res.data.data);
        }
      } catch (err) {
        setError(
          err.response?.status === 403
            ? 'You are not authorized to view this student.'
            : err.response?.data?.message || 'Failed to load student data.'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, [id]);

  if (loading) return <FullPageLoader message="Loading student progress..." />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-rose-500 font-medium">{error}</p>
        <Link
          to="/guide/students"
          className="text-accent-600 hover:underline flex items-center gap-1"
        >
          <FiArrowLeft className="h-4 w-4" /> Back to Students
        </Link>
      </div>
    );
  }

  const { student, applications, metrics } = data;

  const statusColor = {
    Applied: 'blue',
    'Under Review': 'amber',
    Approved: 'emerald',
    Rejected: 'rose',
    'Payment Pending': 'orange',
    'Payment Completed': 'teal',
    Joined: 'violet',
  };

  return (
    <>
      <Helmet>
        <title>{student.name} — Student Progress — InternHub</title>
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Back Link */}
        <Link
          to="/guide/students"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
        >
          <FiArrowLeft className="h-4 w-4" /> Back to Students
        </Link>

        {/* Student Profile Card */}
        <div className="glass-card rounded-2xl p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            {/* Avatar */}
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-accent-400 to-secondary-500 flex items-center justify-center text-white font-bold text-2xl shrink-0">
              {student.name?.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">
                {student.name}
              </h1>

              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <FiMail className="h-4 w-4" /> {student.email}
                </span>
                {student.phone && (
                  <span className="flex items-center gap-1.5">
                    <FiPhone className="h-4 w-4" /> {student.phone}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-slate-400 dark:text-slate-500">
                {student.college && (
                  <span className="flex items-center gap-1.5">
                    <FiMapPin className="h-3.5 w-3.5" /> {student.college}
                  </span>
                )}
                {student.department && (
                  <span className="flex items-center gap-1.5">
                    <FiBookOpen className="h-3.5 w-3.5" /> {student.department}
                  </span>
                )}
              </div>

              {/* Skills */}
              {student.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {student.skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: FiFileText,
              label: 'Applications',
              value: metrics.totalApplications,
              color: 'text-blue-500',
            },
            {
              icon: FiCheckCircle,
              label: 'Approved',
              value: metrics.approvedCount,
              color: 'text-emerald-500',
            },
            {
              icon: FiClock,
              label: 'Joined',
              value: metrics.joinedCount,
              color: 'text-violet-500',
            },
            {
              icon: FiTrendingUp,
              label: 'Completion',
              value: `${metrics.completionRate}%`,
              color: 'text-accent-500',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="glass-card rounded-xl p-4 text-center"
            >
              <stat.icon className={`h-6 w-6 mx-auto mb-2 ${stat.color}`} />
              <p className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {stat.value}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Applications History */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
            Application History
          </h2>

          {applications.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
              No applications submitted yet.
            </p>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div
                  key={app._id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {app.internship?.title || 'Untitled Internship'}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1 text-xs text-slate-400 dark:text-slate-500">
                      {app.internship?.category && (
                        <span>{app.internship.category}</span>
                      )}
                      {app.internship?.mode && <span>• {app.internship.mode}</span>}
                      {app.internship?.duration && (
                        <span>• {app.internship.duration}</span>
                      )}
                    </div>
                  </div>
                  <Badge
                    text={app.status}
                    color={statusColor[app.status] || 'slate'}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default GuideStudentDetailPage;
