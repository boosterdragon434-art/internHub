import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
  FiSearch,
  FiFileText,
  FiCreditCard,
  FiCheckCircle,
  FiArrowRight,
  FiChevronDown,
  FiChevronUp,
  FiBriefcase,
  FiUsers,
  FiTrendingUp,
  FiActivity,
  FiAward,
  FiCalendar,
  FiFolder,
} from 'react-icons/fi';
import { getInternshipsList } from '../../api/internshipApi';
import { formatDisplayAmount } from '../../utils/formatters';

// ─────────────────────────────────────────────────────────────
// Framer Motion Animation Presets
// ─────────────────────────────────────────────────────────────
const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 85, damping: 15 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, type: 'spring', stiffness: 60 } },
};

// ─────────────────────────────────────────────────────────────
// Ambient Technical Background Component
// ─────────────────────────────────────────────────────────────
/**
 * Renders a highly clean background based on gold and slate tones.
 * Features an absolute solid-friendly layout to protect readability.
 */
const AmbientBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none">
    {/* Technical dotted blueprint coordinates grid */}
    <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] dark:bg-[radial-gradient(#1e293b_1.5px,transparent_1.5px)] bg-[size:36px_36px] opacity-80" />
    
    {/* Soft subtle glowing gold mesh in corners for dark/light ambiance */}
    <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] max-w-[600px] bg-amber-500/5 rounded-full blur-[120px]" />
    <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[600px] bg-yellow-600/5 rounded-full blur-[120px]" />

    {/* Dynamic bottom section cover gradient */}
    <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_60%,#ffffff_98%)] dark:bg-[linear-gradient(to_bottom,transparent_60%,#020617_98%)]" />
  </div>
);

// ─────────────────────────────────────────────────────────────
// Generative Abstract SVG Placeholder Component
// ─────────────────────────────────────────────────────────────
/**
 * Generates an elegant vector illustration with gold/amber gradient tones.
 */
const GenerativePlaceholder = ({ category }) => {
  const cat = (category || 'general').toLowerCase();
  let grad = 'from-amber-600/10 to-yellow-550/10';
  let line = 'text-amber-500/20';
  if (cat.includes('web') || cat.includes('eng')) {
    grad = 'from-amber-600/10 to-yellow-500/10';
    line = 'text-amber-500/25';
  } else if (cat.includes('design') || cat.includes('art')) {
    grad = 'from-yellow-600/10 to-orange-500/10';
    line = 'text-yellow-650/20';
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-amber-500/10 to-yellow-500/10 relative flex items-center justify-center overflow-hidden transition-transform duration-500 group-hover:scale-105">
      <svg className={`absolute inset-0 w-full h-full ${line} pointer-events-none`} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="card-gold-grid" width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M 16 0 L 0 0 0 16" fill="none" stroke="currentColor" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#card-gold-grid)" />
        <circle cx="50%" cy="50%" r="36" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" />
        <path d="M 0 0 L 100 100" stroke="currentColor" strokeWidth="0.5" className="opacity-10" />
      </svg>
      <FiBriefcase className="h-10 w-10 text-amber-600 dark:text-amber-450 drop-shadow-md z-10" />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Interactive Mock Workspace Widget (Gold/White/Midnight)
// ─────────────────────────────────────────────────────────────
const MockWorkspaceWidget = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [taskProgress, setTaskProgress] = useState(65);

  useEffect(() => {
    const timer = setInterval(() => {
      setTaskProgress((p) => (p >= 95 ? 60 : p + 5));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const mockTasks = [
    { title: 'Redesign Landing Page Grid', priority: 'urgent', status: 'In Review', color: 'rose' },
    { title: 'Integrate Razorpay Webhooks', priority: 'high', status: 'In Progress', color: 'amber' },
    { title: 'Configure Joi Date Ref Validator', priority: 'medium', status: 'Completed', color: 'emerald' },
  ];

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.3 } }}
      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.25)] relative overflow-hidden select-none text-left"
    >
      {/* Header controls bar */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/90" />
            <span className="w-3 h-3 rounded-full bg-amber-500/90" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/90" />
          </div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-slate-450 dark:text-slate-500 uppercase">
            InternHub Workspace v2.4
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[9px] font-black uppercase tracking-widest border border-amber-550/20">
            System Online
          </span>
        </div>
      </div>

      {/* Tabs list using solid gold gradient */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl mb-4 border border-slate-200/40 dark:border-slate-850/60">
        {['overview', 'tasks', 'metrics'].map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${
              activeTab === t
                ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 font-black shadow-md'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab panel contents */}
      <div className="min-h-[145px] flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              {/* Quick metrics grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-3 rounded-2xl flex flex-col justify-between hover:border-amber-500/20 transition-colors">
                  <span className="text-[9px] font-black tracking-wider uppercase text-slate-400 dark:text-slate-500">
                    Total Hours
                  </span>
                  <span className="text-lg font-black text-slate-800 dark:text-white mt-1">124.5h</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-3 rounded-2xl flex flex-col justify-between hover:border-amber-500/20 transition-colors">
                  <span className="text-[9px] font-black tracking-wider uppercase text-slate-400 dark:text-slate-500">
                    Active Tasks
                  </span>
                  <span className="text-lg font-black text-amber-600 dark:text-amber-400 mt-1">08/12</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-3 rounded-2xl flex flex-col justify-between hover:border-amber-500/20 transition-colors">
                  <span className="text-[9px] font-black tracking-wider uppercase text-slate-400 dark:text-slate-500">
                    Grade Est.
                  </span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">A+</span>
                </div>
              </div>

              {/* Active Cohort card */}
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-4 rounded-2xl flex justify-between items-center gap-3">
                <div className="min-w-0 flex-1">
                  <span className="text-[8px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                    Active Cohort
                  </span>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white truncate mt-0.5">
                    Full Stack Web Engineering
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">Under guidance of Dr. Jane Smith</p>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className="text-[10px] font-black text-slate-700 dark:text-slate-300">{taskProgress}% Done</span>
                  <div className="w-20 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-1.5">
                    <motion.div
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full"
                      animate={{ width: `${taskProgress}%` }}
                      transition={{ type: 'spring', stiffness: 55 }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'tasks' && (
            <motion.div
              key="tasks"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-2.5"
            >
              {mockTasks.map((tk, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl hover:border-amber-500/25 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 shadow-md ${
                      tk.priority === 'urgent'
                        ? 'bg-rose-500'
                        : tk.priority === 'high'
                          ? 'bg-amber-505'
                          : 'bg-emerald-500'
                    }`} />
                    <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200 truncate">{tk.title}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest shrink-0 ${
                    tk.status === 'Completed'
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/15'
                      : tk.status === 'In Progress'
                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/15'
                        : 'bg-amber-600/10 text-amber-700 dark:text-amber-400 border border-amber-600/15'
                  }`}>
                    {tk.status}
                  </span>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'metrics' && (
            <motion.div
              key="metrics"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3.5"
            >
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-3.5 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <span>Code Standards</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">98% Match</span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '98%' }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                  />
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-3.5 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <span>Milestone Compliance</span>
                  <span className="text-amber-600 dark:text-amber-400 font-bold">88% Compliance</span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '88%' }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────
// Main HomePage Component
// ─────────────────────────────────────────────────────────────
const HomePage = () => {
  const [featuredInternships, setFeaturedInternships] = useState([]);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await getInternshipsList({ limit: 6, status: 'active' });
        if (res.success) setFeaturedInternships(res.data);
      } catch (err) {
        console.error('Error fetching featured internships:', err);
      }
    };
    fetchFeatured();
  }, []);

  const howItWorks = [
    { icon: FiSearch, title: 'Browse domain', desc: 'Explore curated internship roles across top modern tech sectors.' },
    { icon: FiFileText, title: 'Apply resume', desc: 'Submit details and resume profile. Our process takes minutes.' },
    { icon: FiCreditCard, title: 'Confirm fee', desc: 'Secure payment requests handled via Razorpay integration.' },
    { icon: FiCheckCircle, title: 'Start learning', desc: 'Unlock workspace boards, calendar reminders, and advisor chats.' },
  ];

  const faqs = [
    { q: 'How do I apply for an internship?', a: 'Create a free student profile, navigate to the internships catalog, select your preferred internship track, and click "Apply" to submit your application details and resume.' },
    { q: 'Is there a program joining fee?', a: 'Some specialized cohorts have an optional or nominal fee assigned by sponsoring guides. We support fully free options too.' },
    { q: 'What payment modes are supported?', a: 'Once accepted, payments are made securely through our integrated Razorpay portal supporting UPI (Google Pay, PhonePe), net banking, and all major debit/credit cards.' },
    { q: 'Will I receive a verifiable certificate?', a: 'Yes! Upon successful completion of your internship tasks and milestone reviews, you will receive a secure credential complete with a dynamic QR validation signature code.' },
    { q: 'Can I apply to multiple cohorts?', a: 'Absolutely. You are encouraged to explore multiple tracks. Each request is evaluated independently by program coordinators.' },
  ];

  const stats = [
    { value: '100+', label: 'Students Completed' },
    { value: '10+', label: 'Sought Programs' },
    { value: '100+', label: 'Certificates Issued' },
    { value: '97%', label: 'Satisfaction Rate' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative overflow-hidden select-none transition-colors duration-500">
      <Helmet>
        <title>InternHub — Next-Gen Student Internships & Careers Hub</title>
        <meta name="description" content="Discover professional internships. Collaborate with mentors, build portfolios, track sprint deliverables, and verify dynamic landscape credentials end-to-end." />
      </Helmet>

      {/* Embedded Ambient dotted coordinates background */}
      <AmbientBackground />

      {/* ==================== HERO SECTION ==================== */}
      <section className="relative overflow-hidden pb-20 pt-28 lg:pt-36 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20 items-center">
            {/* Left Content Info Column */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="lg:col-span-7 text-left space-y-6 md:space-y-8"
            >
              {/* Opaque Gold Badge */}
              <motion.div
                variants={fadeUp}
                className="w-fit inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400 shadow-sm leading-none"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span>🚀 Next-Generation Career Launcher</span>
              </motion.div>

              {/* Master Headline */}
              <motion.h1
                variants={fadeUp}
                className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.05] text-slate-900 dark:text-white"
              >
                Launch Your Career with{' '}
                <span className="text-amber-600 dark:text-amber-400 font-extrabold">
                  Top Internships
                </span>
              </motion.h1>

              {/* Description body */}
              <motion.p
                variants={fadeUp}
                className="text-sm sm:text-base text-slate-650 dark:text-slate-205 leading-relaxed max-w-2xl font-semibold"
              >
                Collaborate in ClickUp-style workspaces, solve cohort task challenges under advisor guides, and earn highly polished, dynamic credentials with embedded validation signatures.
              </motion.p>

              {/* Action Buttons (Solid Opaque, no transparency) */}
              <motion.div
                variants={fadeUp}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2"
              >
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1 sm:flex-initial">
                  <Link
                    to="/internships"
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 text-xs font-black uppercase tracking-widest rounded-2xl shadow-md shadow-amber-500/15 hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2.5 border border-amber-400/20"
                  >
                    Explore Catalog <FiArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1 sm:flex-initial">
                  <Link
                    to="/register"
                    className="w-full sm:w-auto px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-black uppercase tracking-widest rounded-2xl text-center block transition-colors duration-300"
                  >
                    Create Student Account
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Right Widget Showcase Column */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={scaleIn}
              className="lg:col-span-5 w-full flex justify-center z-10"
            >
              <div className="relative w-full max-w-md">
                <div className="absolute -inset-1 rounded-[2.2rem] bg-gradient-to-r from-amber-500 to-yellow-600 opacity-15 blur-xl pointer-events-none" />
                <MockWorkspaceWidget />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ==================== STATS SECTION (Opaque Bento) ==================== */}
      <section className="py-16 z-10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, idx) => {
              const icons = [FiUsers, FiFolder, FiAward, FiTrendingUp];
              const Icon = icons[idx];
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08, type: 'spring', stiffness: 70 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-[2rem] text-left relative overflow-hidden group shadow-md hover:border-amber-500/30 dark:hover:border-amber-500/30 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-amber-500/10 rounded-2xl w-fit text-amber-600 dark:text-amber-450 group-hover:scale-105 transition-transform duration-300 border border-amber-500/10">
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-amber-500 to-yellow-600 dark:from-amber-450 dark:to-yellow-450 bg-clip-text text-transparent tracking-tight">
                    {stat.value}
                  </h3>
                  <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-2.5">
                    {stat.label}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== HOW IT WORKS (ROADMAP BLUEPRINT) ==================== */}
      <section id="how-it-works" className="py-24 relative z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* Sticky Left block */}
            <div className="lg:col-span-4 lg:sticky lg:top-32 space-y-5 text-left z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/45 border border-amber-200/80 dark:border-slate-800/80 text-[10px] font-black uppercase tracking-widest text-amber-750 dark:text-amber-400">
                ⚡ Path To Success
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                Process Blueprint
              </h2>
              <p className="text-sm text-slate-650 dark:text-slate-205 leading-relaxed font-semibold">
                InternHub streamlines your learning path into four distinct, trackable segments. Explore active cohorts, submit your profile, handle Secure Razorpay steps, and unlock advisor guides.
              </p>
            </div>

            {/* Right Stepped Timeline Stack (Opaque Cards) */}
            <div className="lg:col-span-8 relative text-left z-10">
              {/* Gold roadmap rail line */}
              <div className="absolute left-[31px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-amber-500 via-yellow-500 to-slate-200 dark:to-slate-800" />

              <div className="space-y-8">
                {howItWorks.map((step, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: 25 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.08, type: 'spring', stiffness: 80 }}
                    className="relative pl-16 group"
                  >
                    {/* Stepped Opaque Bubble counter */}
                    <div className="absolute left-4 top-1 w-9 h-9 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-black flex items-center justify-center group-hover:bg-gradient-to-r group-hover:from-amber-500 group-hover:to-yellow-600 group-hover:text-slate-950 group-hover:border-transparent group-hover:shadow-[0_0_12px_rgba(245,158,11,0.3)] transition-all duration-300 z-10">
                      {idx + 1}
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="p-2.5 bg-amber-500/10 text-amber-650 dark:text-amber-450 rounded-xl group-hover:scale-105 transition-transform duration-300 border border-amber-500/10">
                          <step.icon className="h-5 w-5" />
                        </div>
                        <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">{step.title}</h3>
                      </div>
                      <p className="text-xs text-slate-655 dark:text-slate-250 leading-relaxed font-semibold pl-1">
                        {step.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FEATURED INTERNSHIPS (ACTIVE TRACKS - OPAQUE CARDS) ==================== */}
      {featuredInternships.length > 0 && (
        <section className="py-24 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-12">
              <div className="text-left space-y-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/45 border border-amber-200/80 dark:border-slate-800/80 text-[10px] font-black uppercase tracking-widest text-amber-750 dark:text-amber-400">
                  📁 Current Cohorts
                </div>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                  Active Tracks
                </h2>
                <p className="text-xs text-slate-505 dark:text-slate-400 font-semibold">
                  Handpicked professional training cohorts launching soon.
                </p>
              </div>
              <Link
                to="/internships"
                className="hidden sm:flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-455 hover:text-amber-500 transition-colors"
              >
                View Catalog <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredInternships.map((internship, idx) => (
                <motion.div
                  key={internship._id}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05, type: 'spring', stiffness: 75 }}
                >
                  <Link
                    to={`/internships/${internship._id}`}
                    className="block bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden shadow-md hover:shadow-lg hover:border-amber-500/25 dark:hover:border-amber-500/20 transition-all duration-300 group"
                  >
                    {/* Image Cover */}
                    <div className="h-48 bg-slate-100 dark:bg-slate-950 flex items-center justify-center overflow-hidden relative">
                      {internship.imageUrl ? (
                        <img
                          src={internship.imageUrl}
                          alt={internship.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <GenerativePlaceholder category={internship.category} />
                      )}
                      <span className="absolute top-4 left-4 text-[9px] font-black uppercase px-3 py-1 rounded-xl bg-white dark:bg-slate-950 text-slate-850 dark:text-slate-205 shadow-md border border-slate-200/10">
                        {internship.mode}
                      </span>
                    </div>

                    {/* Body container */}
                    <div className="p-6 text-left">
                      <span className="inline-block text-[9px] font-black px-3 py-1 rounded-xl bg-amber-500/10 text-amber-750 dark:text-amber-450 border border-amber-500/15 uppercase mb-3.5">
                        {internship.category}
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                        {internship.title}
                      </h3>
                      <p className="mt-2 text-xs text-slate-655 dark:text-slate-250 line-clamp-2 leading-relaxed font-semibold min-h-[32px]">
                        {internship.shortDescription || internship.description}
                      </p>

                      {/* Footer Info */}
                      <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-200 dark:border-slate-800/80">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                          ⏱️ {internship.duration}
                        </span>
                        <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                          {formatDisplayAmount(internship.fees, 'Free')}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Link
                to="/internships"
                className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400"
              >
                View Catalog <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ==================== FAQ SECTION (OPAQUE ACCORDIONS) ==================== */}
      <section className="py-24 relative z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-amber-500/10 dark:bg-amber-905/40 border border-amber-200/80 dark:border-slate-800/80 text-[10px] font-black uppercase tracking-widest text-amber-705 dark:text-amber-400">
              ❓ Support Desk
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              Curriculum FAQs
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              Clear queries regarding program schedules, payments, and credential policies.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:border-amber-500/20 transition-all duration-300"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left focus:outline-none transition group"
                >
                  <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {faq.q}
                  </span>
                  <motion.div
                    animate={{ rotate: openFaq === idx ? 180 : 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className={`p-1.5 rounded-full shrink-0 ml-4 border ${
                      openFaq === idx
                        ? 'bg-amber-500/10 text-amber-605 border-amber-550/20'
                        : 'bg-slate-100 dark:bg-slate-850 text-slate-400 dark:text-slate-550 border-slate-200/10'
                    }`}
                  >
                    <FiChevronDown className="h-4 w-4" />
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: 'easeInOut' }}
                      className="border-t border-slate-150 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40"
                    >
                      <div className="px-6 py-5 text-xs sm:text-sm text-slate-655 dark:text-slate-300 leading-relaxed font-semibold select-text">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== CTA SECTION (OPAQUE SOLID DARK OVERLAY) ==================== */}
      <section className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 py-16 px-8 sm:px-12 md:py-20 rounded-[2.5rem] text-white shadow-2xl border border-slate-800">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.08),transparent_50%)] pointer-events-none" />

            <div className="relative max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight tracking-tight">
                Ready to Accelerate Your Career?
              </h2>
              <p className="text-sm text-slate-200 max-w-lg mx-auto leading-relaxed font-semibold">
                Gain practical developer experience, work on milestones under guidance, and secure dynamic portfolio credentials.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                  <Link
                    to="/register"
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-750 text-slate-950 text-xs font-black uppercase tracking-widest rounded-2xl shadow-md shadow-amber-500/15 hover:shadow-lg transition-all duration-300 text-center block"
                  >
                    Sign Up Free
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                  <Link
                    to="/internships"
                    className="w-full sm:w-auto px-8 py-4 bg-transparent border border-white/20 hover:bg-white/10 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all duration-300 text-center block"
                  >
                    Browse Internships
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
