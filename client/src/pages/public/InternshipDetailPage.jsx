import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FiClock, FiMapPin, FiUsers, FiCalendar, FiArrowLeft, FiBriefcase } from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import { getInternshipDetail } from '../../api/internshipApi';
import { getMyApplications } from '../../api/applicationApi';
import { getCooldownSetting } from '../../api/settingsApi';
import { formatDate, formatCurrency, formatDisplayAmount } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import { FullPageLoader } from '../../components/common/Loader';

const InternshipDetailPage = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [internship, setInternship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getInternshipDetail(id);
        if (res.success) setInternship(res.data);
      } catch (err) {
        console.error('Error fetching internship:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  useEffect(() => {
    if (isAuthenticated) {
      const checkApplied = async () => {
        try {
          const [appsRes, cooldownRes] = await Promise.all([
            getMyApplications(),
            getCooldownSetting(),
          ]);

          if (appsRes.success && cooldownRes.success) {
            const cooldownHours = parseInt(cooldownRes.data.cooldown, 10) || 0;
            const relevantApps = appsRes.data.filter(
              (app) => app.internship?._id === id || app.internship === id
            );

            if (relevantApps.length > 0) {
              // Sort to get the latest application first
              relevantApps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
              const latestApp = relevantApps[0];

              if (cooldownHours === 0) {
                // 0 means infinite cooldown
                setHasApplied(true);
              } else {
                const timeElapsed = (Date.now() - new Date(latestApp.createdAt).getTime()) / (1000 * 60 * 60);
                if (timeElapsed < cooldownHours) {
                  setHasApplied(true);
                } else {
                  setHasApplied(false);
                }
              }
            } else {
              setHasApplied(false);
            }
          }
        } catch (err) {
          console.error('Error checking application status:', err);
        }
      };
      checkApplied();
    } else {
      setHasApplied(false);
    }
  }, [id, isAuthenticated]);

  if (loading) return <FullPageLoader message="Loading internship details..." />;

  if (!internship) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Internship Not Found</h2>
        <p className="mt-2 text-sm text-slate-500">The internship you're looking for doesn't exist or has been removed.</p>
        <Link to="/internships" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-600">
          <FiArrowLeft /> Back to Internships
        </Link>
      </div>
    );
  }

  const handleApply = () => {
    if (hasApplied) return;
    if (!isAuthenticated) {
      navigate(`/login?redirect=/internships/${id}/apply`);
    } else {
      navigate(`/internships/${id}/apply`);
    }
  };

  const detailItems = [
    { icon: FiClock, label: 'Duration', value: internship.duration },
    { icon: FiMapPin, label: 'Mode', value: internship.mode },
    { icon: FiUsers, label: 'Openings', value: `${internship.openings - (internship.filledPositions || 0)} remaining` },
    { icon: FiCalendar, label: 'Start Date', value: formatDate(internship.startDate) },
    { icon: FiCalendar, label: 'End Date', value: formatDate(internship.endDate) },
    { icon: FaRupeeSign, label: 'Fees', value: formatDisplayAmount(internship.fees, 'Free') },
  ];

  return (
    <>
      <Helmet>
        <title>{internship.title} — InternHub</title>
        <meta name="description" content={internship.shortDescription || internship.description?.substring(0, 160)} />
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <Link to="/internships" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-accent-500 mb-6">
          <FiArrowLeft className="h-3 w-3" /> Back to Internships
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Hero Image */}
            <div className="h-60 md:h-72 rounded-2xl overflow-hidden bg-gradient-to-br from-accent-100 to-secondary-100 dark:from-accent-950/30 dark:to-secondary-950/30 flex items-center justify-center">
              {internship.imageUrl ? (
                <img src={internship.imageUrl} alt={internship.title} className="w-full h-full object-cover" />
              ) : (
                <FiBriefcase className="h-16 w-16 text-accent-300 dark:text-accent-700" />
              )}
            </div>

            {/* Title and Tags */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-accent-50 dark:bg-accent-950/30 text-accent-700 dark:text-accent-400 border border-accent-100 dark:border-accent-900/30">
                  {internship.category}
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {internship.mode}
                </span>
                {internship.applicationCount !== undefined && (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400">
                    {internship.applicationCount} Applied
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-50">
                {internship.title}
              </h1>
            </div>

            {/* Description */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50 mb-3">Description</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                {internship.description}
              </p>
            </div>

            {/* Skills */}
            {internship.skills?.length > 0 && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50 mb-3">Skills Required</h2>
                <div className="flex flex-wrap gap-2">
                  {internship.skills.map((skill, idx) => (
                    <span key={idx} className="text-xs font-medium px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Requirements */}
            {internship.requirements?.length > 0 && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50 mb-3">Requirements</h2>
                <ul className="space-y-2">
                  {internship.requirements.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-500 mt-1.5 flex-shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Responsibilities */}
            {internship.responsibilities?.length > 0 && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50 mb-3">What You'll Do</h2>
                <ul className="space-y-2">
                  {internship.responsibilities.map((resp, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary-500 mt-1.5 flex-shrink-0" />
                      {resp}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {/* Apply Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sticky top-20">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-1">
                {formatDisplayAmount(internship.fees, 'Free')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                {String(internship.fees).toLowerCase().includes('discuss') 
                  ? 'Fee discussed after application'
                  : (internship.fees && parseInt(internship.fees, 10) > 0) || (String(internship.fees).includes('-'))
                    ? 'Joining fee required'
                    : 'No joining fee required'}
              </p>
              <Button
                variant={hasApplied ? 'outline' : 'primary'}
                size="lg"
                className="w-full"
                onClick={handleApply}
                disabled={hasApplied}
              >
                {hasApplied ? 'Applied' : 'Apply Now'}
              </Button>

              {/* Details Grid */}
              <div className="mt-6 space-y-3 pt-5 border-t border-slate-100 dark:border-slate-800">
                {detailItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 text-slate-400" />
                    <div className="flex-1">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{item.label}</span>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default InternshipDetailPage;
