import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiLock, FiArrowRight, FiCheckCircle, FiClock, FiCreditCard } from 'react-icons/fi';
import useEnrollment from '../../hooks/useEnrollment';
import { DashboardSkeleton } from '../ui/SkeletonCard';

/**
 * EnrollmentGate — Wrapper component that gates enrollment-required features.
 *
 * If the student is enrolled → renders children.
 * If not enrolled → renders a premium "Not Enrolled" placeholder with status guidance.
 *
 * @param {React.ReactNode} children - The actual page content
 * @param {string} featureName - Human-readable feature name (e.g. "Attendance")
 */
const EnrollmentGate = ({ children, featureName = 'this feature' }) => {
  const { isEnrolled, loading, activeEnrollment } = useEnrollment();

  if (loading) return <DashboardSkeleton />;

  if (isEnrolled) return <>{children}</>;

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-lg"
      >
        {/* Main Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 text-center relative overflow-hidden">
          {/* Decorative gradient orb */}
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-br from-amber-400/20 to-orange-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-gradient-to-tr from-brand-400/15 to-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Lock Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="relative z-10 mx-auto w-20 h-20 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-2 border-amber-200/60 dark:border-amber-800/40 rounded-3xl flex items-center justify-center mb-6"
          >
            <FiLock className="h-9 w-9 text-amber-500 dark:text-amber-400" />
          </motion.div>

          {/* Title */}
          <h2 className="relative z-10 text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight mb-2">
            Enrollment Required
          </h2>
          <p className="relative z-10 text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto mb-8">
            You need an active internship enrollment to access <strong className="text-slate-700 dark:text-slate-300">{featureName}</strong>. Complete the steps below to unlock all features.
          </p>

          {/* Steps Guide */}
          <div className="relative z-10 space-y-3 text-left mb-8">
            {[
              { icon: FiCheckCircle, label: 'Apply for an internship', color: 'emerald', done: true },
              { icon: FiClock, label: 'Wait for admin approval', color: 'amber', done: false },
              { icon: FiCreditCard, label: 'Complete payment verification', color: 'indigo', done: false },
              { icon: FiCheckCircle, label: 'Get enrolled & access all features', color: 'brand', done: false },
            ].map((step, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl border transition-all ${
                  step.done
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/15 border-emerald-200/60 dark:border-emerald-800/30'
                    : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800/40'
                }`}
              >
                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  step.done
                    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}>
                  {step.done ? <FiCheckCircle className="h-4 w-4" /> : idx + 1}
                </div>
                <span className={`text-sm font-medium ${
                  step.done
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-slate-600 dark:text-slate-400'
                }`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3">
            <Link
              to="/internships"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-brand-600/20 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
            >
              Browse Internships
              <FiArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/student/applications"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-xl border border-slate-200 dark:border-slate-700 transition-all duration-300"
            >
              My Applications
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EnrollmentGate;
