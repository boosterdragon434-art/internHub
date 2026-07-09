import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiClock, FiMapPin, FiUsers, FiCalendar, FiArrowRight, FiChevronDown } from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { getMyApplications } from '../../api/applicationApi';
import { formatDate, formatDisplayAmount } from '../../utils/formatters';
import InternshipApplicationForm from './InternshipApplicationForm';

/**
 * Application statuses that represent an application still "in flight" for this
 * internship — re-applying while one of these is active would just create a
 * confusing duplicate. Rejected and Completed are deliberately excluded: a
 * rejected application should be governed by the server's real Cooldown record
 * (checked authoritatively in createApplication), and a completed one shouldn't
 * block a student from ever applying to the role again.
 */
const ACTIVE_APPLICATION_STATUSES = [
  'Applied',
  'Under Review',
  'Approved',
  'Payment Pending',
  'Payment Verification Pending',
  'Payment Completed',
  'Joined',
];

/**
 * InternshipDrawer — Right-side detail panel with detail + application form modes.
 * Desktop: 480px fixed-width drawer sliding from right.
 * Tablet: Full-screen overlay.
 * Mobile: Bottom sheet (100vw, 90vh, rounded-t-2xl).
 */
const InternshipDrawer = ({ internship, isOpen, onClose }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const drawerRef = useRef(null);
  const [mode, setMode] = useState('detail'); // 'detail' | 'apply'
  const [hasApplied, setHasApplied] = useState(false);
  const [checkingApplied, setCheckingApplied] = useState(false);

  // Reset mode when internship changes
  useEffect(() => {
    setMode('detail');
    setHasApplied(false);
  }, [internship?._id]);

  // Check if the student already has an active application for this internship.
  // The server's createApplication is the real authority on rejection cooldowns
  // (via the Cooldown collection) — this is just a fast, accurate "you already
  // have one in flight" check so the student doesn't fill out the whole form
  // only to be rejected at the very last step.
  useEffect(() => {
    if (!isAuthenticated || !internship?._id || !isOpen) return;
    const checkStatus = async () => {
      setCheckingApplied(true);
      try {
        const appsRes = await getMyApplications();
        if (appsRes.success) {
          const relevant = appsRes.data.filter(
            (app) => app.internship?._id === internship._id || app.internship === internship._id
          );
          if (relevant.length > 0) {
            relevant.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setHasApplied(ACTIVE_APPLICATION_STATUSES.includes(relevant[0].status));
          }
        }
      } catch (err) {
        /* silently fail */
      } finally {
        setCheckingApplied(false);
      }
    };
    checkStatus();
  }, [internship?._id, isOpen, isAuthenticated]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Escape to close
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleApplyClick = useCallback(() => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/internships`);
      return;
    }
    if (hasApplied) return;
    setMode('apply');
  }, [isAuthenticated, hasApplied, navigate]);

  if (!internship) return null;

  const detailItems = [
    { icon: FiClock, label: 'Duration', value: internship.duration },
    { icon: FiMapPin, label: 'Mode', value: internship.mode },
    { icon: FiUsers, label: 'Openings', value: `${Math.max(0, internship.openings - (internship.filledPositions || 0))} remaining` },
    { icon: FiCalendar, label: 'Start Date', value: formatDate(internship.startDate) },
    { icon: FiCalendar, label: 'End Date', value: formatDate(internship.endDate) },
    { icon: FaRupeeSign, label: 'Fees', value: formatDisplayAmount(internship.fees, 'Free') },
  ];

  // ── Desktop Drawer Variants ──
  const drawerVariants = {
    hidden: { x: '100%', opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { type: 'spring', damping: 28, stiffness: 300 } },
    exit: { x: '100%', opacity: 0, transition: { duration: 0.2 } },
  };

  // ── Mobile Bottom Sheet Variants ──
  const sheetVariants = {
    hidden: { y: '100%', opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', damping: 28, stiffness: 300 } },
    exit: { y: '100%', opacity: 0, transition: { duration: 0.2 } },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40"
            onClick={onClose}
          />

          {/* ── Desktop/Tablet: Right-side Drawer ── */}
          <motion.div
            ref={drawerRef}
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="hidden sm:flex fixed right-0 top-0 bottom-0 w-full sm:w-[480px] bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 z-50 flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex-1 min-w-0">
                {mode === 'detail' ? (
                  <>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                      {internship.category}
                    </span>
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-50 truncate mt-0.5">
                      {internship.title}
                    </h2>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                      Application
                    </span>
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-50 truncate mt-0.5">
                      Apply for {internship.title}
                    </h2>
                  </>
                )}
              </div>
              <button
                onClick={mode === 'apply' ? () => setMode('detail') : onClose}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
              >
                {mode === 'apply' ? (
                  <FiChevronDown className="w-5 h-5 rotate-90" />
                ) : (
                  <FiX className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
              {mode === 'detail' ? (
                <motion.div
                  key="detail"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-2">
                      {detailItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                          <item.icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{item.label}</span>
                            <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">{item.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Mode & Fees Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        internship.mode === 'Remote'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                          : internship.mode === 'Hybrid'
                            ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
                            : 'bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800'
                      }`}>
                        {internship.mode}
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        {formatDisplayAmount(internship.fees, 'Free')}
                      </span>
                    </div>

                    {/* Description */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-2">About this Role</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                        {internship.description}
                      </p>
                    </div>

                    {/* Skills */}
                    {internship.skills?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-2">Skills Required</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {internship.skills.map((skill, idx) => (
                            <span key={idx} className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Requirements */}
                    {internship.requirements?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-2">Requirements</h4>
                        <ul className="space-y-1.5">
                          {internship.requirements.map((req, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                              <span className="w-1 h-1 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Responsibilities */}
                    {internship.responsibilities?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-2">What You'll Do</h4>
                        <ul className="space-y-1.5">
                          {internship.responsibilities.map((resp, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                              <span className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                              {resp}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Apply CTA */}
                  <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
                    <button
                      onClick={handleApplyClick}
                      disabled={hasApplied || checkingApplied}
                      className="w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white"
                    >
                      {checkingApplied ? 'Checking...' : hasApplied ? 'Already Applied' : (
                        <>Apply for this Role <FiArrowRight className="w-4 h-4" /></>
                      )}
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="apply"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  <InternshipApplicationForm
                    internship={internship}
                    onClose={onClose}
                    onSuccess={() => setHasApplied(true)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ── Mobile: Bottom Sheet ── */}
          <motion.div
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="sm:hidden fixed inset-x-0 bottom-0 bg-white dark:bg-slate-950 rounded-t-2xl z-50 flex flex-col shadow-2xl"
            style={{ height: '90vh', maxHeight: '90vh' }}
          >
            {/* Handle */}
            <div className="flex justify-center py-2 shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                  {mode === 'detail' ? internship.category : 'Application'}
                </span>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50 truncate mt-0.5">
                  {mode === 'detail' ? internship.title : `Apply for ${internship.title}`}
                </h2>
              </div>
              <button
                onClick={mode === 'apply' ? () => setMode('detail') : onClose}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 shrink-0"
              >
                {mode === 'apply' ? <FiChevronDown className="w-5 h-5 rotate-90" /> : <FiX className="w-5 h-5" />}
              </button>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
              {mode === 'detail' ? (
                <motion.div
                  key="m-detail"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      {detailItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg">
                          <item.icon className="w-3 h-3 text-slate-400 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[8px] font-semibold text-slate-400 uppercase">{item.label}</span>
                            <p className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 truncate">{item.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">Description</h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                        {internship.description}
                      </p>
                    </div>

                    {internship.skills?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">Skills</h4>
                        <div className="flex flex-wrap gap-1">
                          {internship.skills.map((s, i) => (
                            <span key={i} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
                    <button
                      onClick={handleApplyClick}
                      disabled={hasApplied || checkingApplied}
                      className="w-full py-3 rounded-xl text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {checkingApplied ? 'Checking...' : hasApplied ? 'Already Applied' : (
                        <>Apply <FiArrowRight className="w-4 h-4" /></>
                      )}
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="m-apply"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  <InternshipApplicationForm
                    internship={internship}
                    onClose={onClose}
                    onSuccess={() => setHasApplied(true)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default InternshipDrawer;
