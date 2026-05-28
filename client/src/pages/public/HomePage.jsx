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

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 15 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, type: 'spring' } },
};

// ─────────────────────────────────────────────────────────────
// Interactive Mock Workspace Widget (Wows the user immediately)
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
    <div className="w-full bg-slate-900/90 dark:bg-slate-950/75 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 md:p-6 shadow-2xl relative overflow-hidden select-none text-left">
      {/* Floating neon mesh background lights */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/20 rounded-full blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-600/20 rounded-full blur-2xl" />

      {/* Widget Header Mock */}
      <div className="flex items-center justify-between border-b border-slate-850 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-[10px] font-mono text-slate-500 tracking-wider uppercase">InternHub Workspace v2.4</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-extrabold uppercase tracking-wide border border-emerald-500/15">System Online</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 p-1 bg-slate-850/50 rounded-xl mb-4 border border-slate-800/40">
        {['overview', 'tasks', 'metrics'].map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === t
              ? 'bg-violet-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-4"
          >
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] font-semibold text-slate-400">Total Hours</span>
                <span className="text-lg font-black text-white mt-1">124.5h</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] font-semibold text-slate-400">Active Tasks</span>
                <span className="text-lg font-black text-violet-400 mt-1">08/12</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] font-semibold text-slate-400">Grade Est.</span>
                <span className="text-lg font-black text-emerald-400 mt-1">A+</span>
              </div>
            </div>

            {/* Current Internship Card Mock */}
            <div className="bg-gradient-to-r from-violet-950/20 to-indigo-950/20 border border-violet-900/30 p-4 rounded-2xl flex justify-between items-center gap-3">
              <div className="min-w-0">
                <span className="text-[8px] font-extrabold uppercase tracking-widest text-violet-400">Active Cohort</span>
                <h4 className="text-xs font-bold text-white truncate mt-0.5">Full Stack Web Engineering</h4>
                <p className="text-[10px] text-slate-400">Under guidance of Dr. Jane Smith</p>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span className="text-[10px] font-extrabold text-slate-350">{taskProgress}% Done</span>
                <div className="w-20 h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-violet-500 rounded-full transition-all duration-500" style={{ width: `${taskProgress}%` }} />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'tasks' && (
          <motion.div
            key="tasks"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-2.5"
          >
            {mockTasks.map((tk, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-750 transition"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${tk.priority === 'urgent' ? 'bg-rose-500 animate-pulse' : tk.priority === 'high' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                  <span className="text-[11px] font-medium text-slate-200 truncate">{tk.title}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${tk.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' : tk.status === 'In Progress' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
                  }`}>{tk.status}</span>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'metrics' && (
          <motion.div
            key="metrics"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-3.5"
          >
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                <span>Code Standards</span>
                <span className="text-emerald-400">98% Match</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '98%' }} />
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                <span>Milestone Compliance</span>
                <span className="text-violet-400">88% Compliance</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-violet-500 rounded-full" style={{ width: '88%' }} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

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
    <>
      <Helmet>
        <title>InternHub — Next-Gen Student Internships & Careers Hub</title>
        <meta name="description" content="Discover professional internships. Collaborate with mentors, build portfolios, track sprint deliverables, and verify dynamic landscape credentials end-to-end." />
      </Helmet>

      {/* ========== HERO SECTION ========== */}
      <section className="relative overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pb-20 pt-28 lg:pt-36">
        {/* Floating immersive background mesh lights */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-36 right-1/10 w-[600px] h-[600px] bg-violet-600/10 dark:bg-violet-600/5 rounded-full blur-[140px]" />
          <div className="absolute top-48 left-1/10 w-[650px] h-[650px] bg-indigo-600/10 dark:bg-indigo-600/5 rounded-full blur-[140px]" />
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:30px_30px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="lg:col-span-7 text-left space-y-6 md:space-y-8"
            >
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-50 dark:bg-violet-950/30 border border-violet-100/50 dark:border-violet-900/35 text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                🚀 Next-Generation Career Launcher
              </motion.div>

              <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl font-black tracking-tight leading-none text-slate-900 dark:text-white">
                Launch Your Career with{' '}
                <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-400 dark:from-violet-400 dark:via-indigo-400 dark:to-indigo-300 bg-clip-text text-transparent">
                  Top Internships
                </span>
              </motion.h1>

              <motion.p variants={fadeUp} className="text-sm md:text-base text-slate-500 dark:text-slate-300 leading-relaxed max-w-2xl">
                Collaborate in ClickUp-style workspaces, solve cohort task challenges under advisor guides, and earn highly polished, dynamic credentials with embedded validation signatures.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Link
                  to="/internships"
                  className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all duration-300 flex items-center justify-center gap-2 hover:-translate-y-0.5"
                >
                  Explore Catalog <FiArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-3 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 text-xs font-extrabold uppercase tracking-wider rounded-xl text-center transition-all duration-300 hover:-translate-y-0.5"
                >
                  Create Student Account
                </Link>
              </motion.div>
            </motion.div>

            {/* Right Widget Showcase */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={scaleIn}
              className="lg:col-span-5 w-full flex justify-center"
            >
              <div className="relative w-full max-w-md">
                {/* Glowing borders ornament */}
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-violet-600 to-indigo-500 opacity-20 blur-lg" />
                <MockWorkspaceWidget />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========== STATS SECTION ========== */}
      <section className="bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08, type: 'spring' }}
                className="text-center space-y-1.5"
              >
                <h3 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-violet-600 to-indigo-500 dark:from-violet-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  {stat.value}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section id="how-it-works" className="bg-slate-50 dark:bg-slate-950 py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16 space-y-2.5"
          >
            <motion.h2 variants={fadeUp} className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50">
              Process Blueprint
            </motion.h2>
            <motion.p variants={fadeUp} className="text-xs text-slate-550 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
              InternHub streamlines your learning path into four distinct, trackable segments.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, type: 'spring' }}
                className="relative bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-xl hover:border-violet-250 dark:hover:border-violet-900 transition-all duration-300 group"
              >
                <div className="absolute -top-3 left-4 w-7 h-7 bg-violet-600 text-white text-xs font-black rounded-xl flex items-center justify-center shadow-md">
                  {idx + 1}
                </div>
                <div className="p-3 bg-violet-50 dark:bg-violet-950/30 rounded-xl w-fit text-violet-600 dark:text-violet-400 mb-5 group-hover:scale-110 transition-transform duration-300">
                  <step.icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{step.title}</h3>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FEATURED INTERNSHIPS ========== */}
      {featuredInternships.length > 0 && (
        <section className="bg-white dark:bg-slate-900 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-12">
              <div className="text-left space-y-1.5">
                <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50">
                  Active Tracks
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Handpicked professional training cohorts launching soon.
                </p>
              </div>
              <Link
                to="/internships"
                className="hidden sm:flex items-center gap-1 text-xs font-extrabold uppercase tracking-wider text-violet-600 dark:text-violet-400 hover:text-violet-500 transition-colors"
              >
                View Catalog <FiArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredInternships.map((internship, idx) => (
                <motion.div
                  key={internship._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link
                    to={`/internships/${internship._id}`}
                    className="block bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl hover:border-violet-200 dark:hover:border-violet-900 transition-all duration-300 group"
                  >
                    {/* Top image placeholder */}
                    <div className="h-44 bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-950/20 dark:to-indigo-950/20 flex items-center justify-center overflow-hidden relative">
                      {internship.imageUrl ? (
                        <img src={internship.imageUrl} alt={internship.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <FiBriefcase className="h-10 w-10 text-violet-300 dark:text-violet-750" />
                      )}
                      <span className="absolute top-3 left-3 text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 shadow-sm">
                        {internship.mode}
                      </span>
                    </div>

                    {/* Body */}
                    <div className="p-5 text-left">
                      <span className="inline-block text-[9px] font-extrabold px-2.5 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950/45 text-violet-700 dark:text-violet-400 border border-violet-100/50 dark:border-violet-900/30 uppercase mb-3">
                        {internship.category}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors truncate">
                        {internship.title}
                      </h3>
                      <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {internship.shortDescription || internship.description}
                      </p>

                      <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                        <span className="text-xs text-slate-400 font-semibold">
                          {internship.duration}
                        </span>
                        <span className="text-sm font-extrabold text-violet-600 dark:text-violet-400">
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
                className="inline-flex items-center gap-1 text-xs font-bold text-violet-600 dark:text-violet-400"
              >
                View Catalog <FiArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ========== FAQ SECTION ========== */}
      <section className="bg-slate-50 dark:bg-slate-950 py-20 relative">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50">
              Curriculum FAQs
            </h2>
            <p className="text-xs text-slate-505 dark:text-slate-400">
              Clear queries regarding program schedules, payments, and credential policies.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left focus:outline-none transition group"
                >
                  <span className="text-xs font-bold text-slate-850 dark:text-slate-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    {faq.q}
                  </span>
                  {openFaq === idx ? (
                    <FiChevronUp className="h-4.5 w-4.5 text-violet-500 shrink-0" />
                  ) : (
                    <FiChevronDown className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                  )}
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-slate-100 dark:border-slate-800/80"
                    >
                      <div className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed select-text">
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

      {/* ========== CTA SECTION ========== */}
      <section className="relative overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 py-20 text-white select-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl font-black text-white leading-tight">
            Ready to Accelerate Your Career?
          </h2>
          <p className="text-xs text-slate-150 max-w-lg mx-auto leading-relaxed">
            Gain practical developer experience, work on milestones under guidance, and secure dynamic portfolio credentials.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="px-6 py-3 bg-white text-slate-900 text-xs font-extrabold uppercase tracking-wider rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
            >
              Sign Up Free
            </Link>
            <Link
              to="/internships"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl border border-white/20 transition-all duration-300 hover:-translate-y-0.5"
            >
              Browse Internships
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default HomePage;
