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
  visible: { transition: { staggerChildren: 0.12 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 70, damping: 14 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, type: 'spring', stiffness: 50 } },
};

// ─────────────────────────────────────────────────────────────
// Ambient Technical Background Component
// ─────────────────────────────────────────────────────────────
/**
 * Renders an immersive tech background consisting of moving gradient meshes,
 * a tech grid system, and spinning orbital rings to establish a high-end SaaS feel.
 */
const AmbientBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none">
    {/* Dynamic Concentric Rings */}
    <div className="absolute -top-[15%] -left-[10%] w-[70vw] h-[70vw] max-w-[900px] max-h-[900px] rounded-full border border-violet-500/[0.04] flex items-center justify-center animate-[spin_160s_linear_infinite]">
      <div className="w-[85%] h-[85%] rounded-full border border-indigo-500/[0.03] flex items-center justify-center">
        <div className="w-[80%] h-[80%] rounded-full border border-cyan-500/[0.015]" />
      </div>
    </div>

    {/* Immersive Floating Mesh Lights */}
    <motion.div
      animate={{
        scale: [1, 1.15, 1],
        x: [0, 50, 0],
        y: [0, -40, 0],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className="absolute -top-48 -right-48 w-[600px] h-[600px] bg-gradient-to-br from-violet-600/10 via-fuchsia-500/5 to-transparent rounded-full blur-[130px] dark:from-violet-600/5 dark:via-fuchsia-500/2.5"
    />
    <motion.div
      animate={{
        scale: [1, 1.2, 1],
        x: [0, -60, 0],
        y: [0, 50, 0],
      }}
      transition={{
        duration: 26,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 2,
      }}
      className="absolute top-1/3 -left-48 w-[700px] h-[700px] bg-gradient-to-tr from-indigo-600/10 via-cyan-500/5 to-transparent rounded-full blur-[150px] dark:from-indigo-600/5 dark:via-cyan-500/2.5"
    />
    <motion.div
      animate={{
        scale: [1, 1.1, 1],
        x: [0, 40, 0],
        y: [0, 60, 0],
      }}
      transition={{
        duration: 22,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 4,
      }}
      className="absolute bottom-12 right-12 w-[500px] h-[500px] bg-gradient-to-tr from-cyan-600/8 via-violet-600/6 to-transparent rounded-full blur-[110px] dark:from-cyan-600/3 dark:via-violet-600/3"
    />

    {/* Technical Blueprint Dotted Grid */}
    <div className="absolute inset-0 bg-[radial-gradient(#00000003_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#ffffff03_1.2px,transparent_1.2px)] bg-[size:32px_32px] opacity-80" />
    <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_45%,#020617_95%)] dark:bg-[linear-gradient(to_bottom,transparent_45%,#020617_95%)]" />
  </div>
);

// ─────────────────────────────────────────────────────────────
// Generative Abstract SVG Placeholder Component
// ─────────────────────────────────────────────────────────────
/**
 * Generates a clean, futuristic, abstract vector mesh based on the category name
 * to serve as an ultra-premium placeholder card illustration.
 */
const GenerativePlaceholder = ({ category }) => {
  const cat = (category || 'general').toLowerCase();
  let grad = 'from-violet-600/20 to-indigo-600/20';
  if (cat.includes('web') || cat.includes('eng')) grad = 'from-indigo-600/20 to-cyan-500/20';
  else if (cat.includes('design') || cat.includes('art')) grad = 'from-pink-500/20 to-rose-500/20';
  else if (cat.includes('data') || cat.includes('anal')) grad = 'from-blue-600/20 to-teal-500/20';

  return (
    <div className={`w-full h-full bg-gradient-to-br ${grad} relative flex items-center justify-center overflow-hidden transition-transform duration-500 group-hover:scale-105`}>
      <svg className="absolute inset-0 w-full h-full opacity-[0.08] dark:opacity-[0.14] pointer-events-none text-slate-800 dark:text-white" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="placeholder-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="currentColor" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#placeholder-grid)" />
        <circle cx="50%" cy="50%" r="48" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="50%" cy="50%" r="76" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="5 5" />
      </svg>
      <FiBriefcase className="h-10 w-10 text-violet-600 dark:text-violet-300 drop-shadow-[0_4px_12px_rgba(124,58,237,0.15)] z-10" />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Interactive Mock Workspace Widget (Redesigned)
// ─────────────────────────────────────────────────────────────
/**
 * Renders an ultra-premium, interactive dashboard widget to wow visitors.
 * Features state transitions, fluid progress rings, and spring metrics.
 */
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
      whileHover={{ y: -6, transition: { duration: 0.3 } }}
      className="w-full bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.04)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden select-none text-left"
    >
      {/* Internal Floating Decorative Meshes */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-violet-600/10 dark:bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-indigo-600/10 dark:bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Widget Header Controls */}
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/60 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 shadow-[0_0_8px_rgba(239,68,68,0.4)] animate-pulse" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.3)]" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
          </div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">
            InternHub Workspace v2.4
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-extrabold uppercase tracking-widest border border-emerald-500/15">
            System Online
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100/80 dark:bg-slate-950/50 rounded-2xl mb-5 border border-slate-200/40 dark:border-slate-800/30">
        {['overview', 'tasks', 'metrics'].map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex-1 py-2 text-[10px] font-extrabold uppercase tracking-widest rounded-xl transition-all duration-350 ${
              activeTab === t
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Panel contents with Framer Motion transitions */}
      <div className="min-h-[145px] flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-850 p-3 rounded-2xl flex flex-col justify-between hover:border-violet-500/20 transition-all duration-300">
                  <span className="text-[9px] font-extrabold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                    Total Hours
                  </span>
                  <span className="text-lg font-black text-slate-800 dark:text-white mt-1">124.5h</span>
                </div>
                <div className="bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-850 p-3 rounded-2xl flex flex-col justify-between hover:border-violet-500/20 transition-all duration-300">
                  <span className="text-[9px] font-extrabold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                    Active Tasks
                  </span>
                  <span className="text-lg font-black text-violet-600 dark:text-violet-400 mt-1">08/12</span>
                </div>
                <div className="bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-850 p-3 rounded-2xl flex flex-col justify-between hover:border-violet-500/20 transition-all duration-300">
                  <span className="text-[9px] font-extrabold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                    Grade Est.
                  </span>
                  <span className="text-lg font-black text-emerald-500 dark:text-emerald-400 mt-1">A+</span>
                </div>
              </div>

              {/* Current Internship Card Mock */}
              <div className="bg-gradient-to-r from-violet-500/5 to-indigo-500/5 dark:from-violet-950/15 dark:to-indigo-950/15 border border-violet-500/10 dark:border-violet-900/30 p-4 rounded-2xl flex justify-between items-center gap-3">
                <div className="min-w-0 flex-1">
                  <span className="text-[8px] font-extrabold uppercase tracking-widest text-violet-600 dark:text-violet-400">
                    Active Cohort
                  </span>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white truncate mt-0.5">
                    Full Stack Web Engineering
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Under guidance of Dr. Jane Smith</p>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className="text-[10px] font-extrabold text-slate-700 dark:text-slate-350">{taskProgress}% Done</span>
                  <div className="w-20 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-1.5">
                    <motion.div
                      className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                      animate={{ width: `${taskProgress}%` }}
                      transition={{ type: 'spring', stiffness: 50 }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'tasks' && (
            <motion.div
              key="tasks"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-2.5"
            >
              {mockTasks.map((tk, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-slate-50/80 dark:bg-slate-950/30 border border-slate-200/60 dark:border-slate-800/40 rounded-2xl hover:border-violet-500/20 dark:hover:border-violet-500/10 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 shadow-lg ${
                      tk.priority === 'urgent'
                        ? 'bg-rose-500 shadow-rose-500/20 animate-pulse'
                        : tk.priority === 'high'
                          ? 'bg-amber-500 shadow-amber-500/20'
                          : 'bg-emerald-500 shadow-emerald-500/20'
                    }`} />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">{tk.title}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-lg text-[8px] font-extrabold uppercase tracking-widest shrink-0 ${
                    tk.status === 'Completed'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15'
                      : tk.status === 'In Progress'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/15'
                        : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/15'
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-3.5"
            >
              <div className="bg-slate-50/80 dark:bg-slate-950/30 border border-slate-200/60 dark:border-slate-800/40 p-3.5 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <span>Code Standards</span>
                  <span className="text-emerald-600 dark:text-emerald-400">98% Match</span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '98%' }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
                  />
                </div>
              </div>
              <div className="bg-slate-50/80 dark:bg-slate-950/30 border border-slate-200/60 dark:border-slate-800/40 p-3.5 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <span>Milestone Compliance</span>
                  <span className="text-violet-600 dark:text-violet-400">88% Compliance</span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '88%' }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-violet-400 to-indigo-500 rounded-full"
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
/**
 * Renders the next-generation premium landing page for InternHub.
 * Strictly preserves all original lists, stats, functionality, routes, and API logic,
 * but redesigns the layout to a stunning, modern dark/light-adaptive visual style.
 */
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative overflow-hidden select-none transition-colors duration-500">
      <Helmet>
        <title>InternHub — Next-Gen Student Internships & Careers Hub</title>
        <meta name="description" content="Discover professional internships. Collaborate with mentors, build portfolios, track sprint deliverables, and verify dynamic landscape credentials end-to-end." />
      </Helmet>

      {/* Embedded Ambient technical visual mesh background */}
      <AmbientBackground />

      {/* ==================== HERO SECTION ==================== */}
      <section className="relative overflow-hidden pb-24 pt-28 lg:pt-36 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content Column */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="lg:col-span-7 text-left space-y-6 md:space-y-8"
            >
              {/* Floating micro-badge */}
              <motion.div
                variants={fadeUp}
                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-violet-500/10 dark:bg-violet-950/40 border border-violet-500/20 dark:border-violet-800/60 text-[10px] font-extrabold uppercase tracking-widest text-violet-700 dark:text-violet-400 shadow-[0_4px_12px_rgba(124,58,237,0.03)]"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                🚀 Next-Generation Career Launcher
              </motion.div>

              {/* Master Headline */}
              <motion.h1
                variants={fadeUp}
                className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.05] text-slate-900 dark:text-white"
              >
                Launch Your Career with{' '}
                <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-400 dark:from-violet-400 dark:via-indigo-400 dark:to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(124,58,237,0.1)]">
                  Top Internships
                </span>
              </motion.h1>

              {/* Sub-headline explanation */}
              <motion.p
                variants={fadeUp}
                className="text-sm sm:text-base text-slate-600 dark:text-slate-350 leading-relaxed max-w-2xl font-medium"
              >
                Collaborate in ClickUp-style workspaces, solve cohort task challenges under advisor guides, and earn highly polished, dynamic credentials with embedded validation signatures.
              </motion.p>

              {/* Responsive CTAs */}
              <motion.div
                variants={fadeUp}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
              >
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="flex-1 sm:flex-initial">
                  <Link
                    to="/internships"
                    className="w-full sm:w-auto px-7 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-extrabold uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/35 transition-all duration-300 flex items-center justify-center gap-2.5"
                  >
                    Explore Catalog <FiArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="flex-1 sm:flex-initial">
                  <Link
                    to="/register"
                    className="w-full sm:w-auto px-7 py-4 bg-white/70 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-350 text-xs font-extrabold uppercase tracking-widest rounded-2xl text-center block transition-all duration-300 backdrop-blur-md"
                  >
                    Create Student Account
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Right Interactive Mockup Showcase */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={scaleIn}
              className="lg:col-span-5 w-full flex justify-center z-10"
            >
              <div className="relative w-full max-w-md">
                {/* Glowing border spotlight */}
                <div className="absolute -inset-1 rounded-[2.2rem] bg-gradient-to-r from-violet-600 to-indigo-500 opacity-20 blur-2xl dark:opacity-30 pointer-events-none" />
                <MockWorkspaceWidget />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ==================== STATS SECTION ==================== */}
      <section className="py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, idx) => {
              const icons = [FiUsers, FiFolder, FiAward, FiTrendingUp];
              const Icon = icons[idx];
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08, type: 'spring', stiffness: 60 }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="bg-white/50 dark:bg-slate-900/30 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/60 p-6 md:p-8 rounded-3xl text-left relative overflow-hidden group shadow-[0_8px_30px_rgb(0,0,0,0.01)] hover:shadow-[0_20px_50px_rgba(124,58,237,0.08)] dark:hover:shadow-[0_20px_50px_rgba(124,58,237,0.04)] hover:border-violet-500/25 transition-all duration-300"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/5 dark:bg-violet-600/10 rounded-full blur-xl group-hover:bg-violet-600/15 transition-all duration-300" />
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-violet-50 dark:bg-violet-950/40 rounded-2xl w-fit text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform duration-300 border border-violet-100 dark:border-violet-900/30">
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-violet-600 to-indigo-500 dark:from-violet-400 dark:to-indigo-300 bg-clip-text text-transparent tracking-tight">
                    {stat.value}
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2.5">
                    {stat.label}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== HOW IT WORKS (PROCESS BLUEPRINT) ==================== */}
      <section id="how-it-works" className="py-24 relative z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* Sticky Left Info Panel */}
            <div className="lg:col-span-4 lg:sticky lg:top-32 space-y-5 text-left z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 dark:bg-violet-950/45 border border-violet-500/20 dark:border-violet-800/40 text-[10px] font-extrabold uppercase tracking-widest text-violet-700 dark:text-violet-400 shadow-[0_4px_12px_rgba(124,58,237,0.02)]">
                ⚡ Path To Success
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-slate-50 leading-tight">
                Process Blueprint
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                InternHub streamlines your learning path into four distinct, trackable segments. Explore active cohorts, submit your profile, handle Secure Razorpay steps, and unlock advisor guides.
              </p>
            </div>

            {/* Right Timeline Roadmap Stack */}
            <div className="lg:col-span-8 relative text-left z-10">
              {/* Dynamic flowing rail timeline */}
              <div className="absolute left-[31px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-violet-500 via-indigo-500 to-slate-200 dark:to-slate-800" />

              <div className="space-y-8">
                {howItWorks.map((step, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1, type: 'spring', stiffness: 70 }}
                    className="relative pl-16 group"
                  >
                    {/* Step indicator balloon */}
                    <div className="absolute left-4 top-1 w-9 h-9 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-400 text-xs font-black flex items-center justify-center group-hover:border-violet-500 group-hover:bg-gradient-to-r group-hover:from-violet-600 group-hover:to-indigo-600 group-hover:text-white group-hover:shadow-[0_0_15px_rgba(124,58,237,0.3)] transition-all duration-300 z-10">
                      {idx + 1}
                    </div>

                    <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/80 dark:border-slate-850 shadow-[0_8px_30px_rgb(0,0,0,0.01)] hover:shadow-[0_20px_40px_rgba(124,58,237,0.03)] hover:border-violet-500/20 transition-all duration-300">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="p-2.5 bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 rounded-xl group-hover:scale-110 transition-transform duration-300 border border-violet-100 dark:border-violet-900/20">
                          <step.icon className="h-5 w-5" />
                        </div>
                        <h3 className="text-base font-black text-slate-800 dark:text-slate-100">{step.title}</h3>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium pl-1">
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

      {/* ==================== FEATURED INTERNSHIPS (ACTIVE TRACKS) ==================== */}
      {featuredInternships.length > 0 && (
        <section className="py-24 bg-white/30 dark:bg-transparent relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header section with responsive visual rhythm */}
            <div className="flex items-end justify-between mb-12">
              <div className="text-left space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 dark:bg-violet-950/45 border border-violet-500/20 dark:border-violet-800/40 text-[10px] font-extrabold uppercase tracking-widest text-violet-700 dark:text-violet-400 shadow-[0_4px_12px_rgba(124,58,237,0.02)]">
                  📁 Current Cohorts
                </div>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-50">
                  Active Tracks
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Handpicked professional training cohorts launching soon.
                </p>
              </div>
              <Link
                to="/internships"
                className="hidden sm:flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-violet-600 dark:text-violet-400 hover:text-violet-500 transition-colors"
              >
                View Catalog <FiArrowRight className="w-4 h-4 animate-[bounceHorizontal_2s_infinite]" />
              </Link>
            </div>

            {/* Dynamic Grid Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredInternships.map((internship, idx) => (
                <motion.div
                  key={internship._id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05, type: 'spring', stiffness: 70 }}
                >
                  <Link
                    to={`/internships/${internship._id}`}
                    className="block bg-white/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-850/80 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.01)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.25)] hover:border-violet-500/25 dark:hover:border-violet-500/20 transition-all duration-300 group"
                  >
                    {/* Header Image or Custom Generative Placeholder */}
                    <div className="h-48 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-slate-950 dark:to-slate-950 flex items-center justify-center overflow-hidden relative">
                      {internship.imageUrl ? (
                        <img
                          src={internship.imageUrl}
                          alt={internship.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <GenerativePlaceholder category={internship.category} />
                      )}
                      {/* Mode badge overlay */}
                      <span className="absolute top-4 left-4 text-[9px] font-extrabold uppercase px-3 py-1 rounded-xl bg-white/90 dark:bg-slate-950/90 text-slate-800 dark:text-slate-200 shadow-md backdrop-blur-sm border border-slate-200/10">
                        {internship.mode}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className="p-6 text-left">
                      <span className="inline-block text-[9px] font-extrabold px-3 py-1 rounded-xl bg-violet-50 dark:bg-violet-950/45 text-violet-750 dark:text-violet-400 border border-violet-100 dark:border-violet-900/30 uppercase mb-3.5">
                        {internship.category}
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-50 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors truncate">
                        {internship.title}
                      </h3>
                      <p className="mt-2 text-xs text-slate-555 dark:text-slate-400 line-clamp-2 leading-relaxed font-medium min-h-[32px]">
                        {internship.shortDescription || internship.description}
                      </p>

                      {/* Info Footer */}
                      <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                          ⏱️ {internship.duration}
                        </span>
                        <span className="text-sm font-black text-violet-600 dark:text-violet-400">
                          {formatDisplayAmount(internship.fees, 'Free')}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Mobile Bottom Navigation Catalog Link */}
            <div className="mt-8 text-center sm:hidden">
              <Link
                to="/internships"
                className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-violet-600 dark:text-violet-400"
              >
                View Catalog <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ==================== FAQ SECTION ==================== */}
      <section className="py-24 relative z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 dark:bg-violet-950/45 border border-violet-500/20 dark:border-violet-800/40 text-[10px] font-extrabold uppercase tracking-widest text-violet-700 dark:text-violet-400 shadow-[0_4px_12px_rgba(124,58,237,0.02)]">
              ❓ Support Desk
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-50">
              Curriculum FAQs
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Clear queries regarding program schedules, payments, and credential policies.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left focus:outline-none transition group"
                >
                  <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    {faq.q}
                  </span>
                  <motion.div
                    animate={{ rotate: openFaq === idx ? 180 : 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className={`p-1.5 rounded-full shrink-0 ml-4 ${
                      openFaq === idx
                        ? 'bg-violet-500/10 text-violet-600 dark:text-violet-450 border border-violet-500/20'
                        : 'bg-slate-100 dark:bg-slate-850 text-slate-400 dark:text-slate-500'
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
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="border-t border-slate-150 dark:border-slate-800/60"
                    >
                      <div className="px-6 py-5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium select-text">
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

      {/* ==================== CTA SECTION ==================== */}
      <section className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 py-16 px-8 sm:px-12 md:py-20 rounded-[2.5rem] text-white shadow-2xl border border-white/10 dark:border-slate-800">
            {/* Ambient visual background rings inside CTA */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_50%)] pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight tracking-tight">
                Ready to Accelerate Your Career?
              </h2>
              <p className="text-sm text-slate-100 dark:text-slate-300 max-w-lg mx-auto leading-relaxed font-medium">
                Gain practical developer experience, work on milestones under guidance, and secure dynamic portfolio credentials.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                  <Link
                    to="/register"
                    className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 text-xs font-extrabold uppercase tracking-widest rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-center block"
                  >
                    Sign Up Free
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                  <Link
                    to="/internships"
                    className="w-full sm:w-auto px-8 py-4 bg-white/10 dark:bg-slate-950/40 hover:bg-white/20 dark:hover:bg-slate-800/80 text-white text-xs font-extrabold uppercase tracking-widest rounded-2xl border border-white/20 dark:border-slate-800 transition-all duration-300 text-center block backdrop-blur-sm"
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
