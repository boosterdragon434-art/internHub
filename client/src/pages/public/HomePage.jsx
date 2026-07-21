import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
  FiArrowRight,
  FiChevronDown,
  FiBriefcase,
  FiUsers,
  FiAward,
  FiTerminal,
  FiCpu,
  FiClock,
  FiCheckCircle,
  FiUserPlus,
  FiSearch,
  FiZap,
  FiShield,
} from 'react-icons/fi';
import { getInternshipsList } from '../../api/internshipApi';
import { formatDisplayAmount } from '../../utils/formatters';
import { InternshipSkeleton } from '../../components/ui/SkeletonCard';
import HeroSection from '../../components/hero/HeroSection';

// ─────────────────────────────────────────────────────────────
// Motion presets
// ─────────────────────────────────────────────────────────────
const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 70, damping: 15 } },
};

// ─────────────────────────────────────────────────────────────
// Ambient background — dark-first "engineering console" backdrop
// ─────────────────────────────────────────────────────────────
const AmbientBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    <div className="absolute inset-0 bg-slate-50 dark:bg-ink-950 transition-colors duration-500" />
    <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(139,92,246,0.15)_1px,transparent_1px)] [background-size:28px_28px] opacity-70 dark:opacity-50" />
    <div className="absolute top-0 right-[-10%] w-[55vw] h-[55vw] max-w-[850px] bg-violet-200/40 dark:bg-violet-600/20 rounded-full blur-[110px] sm:blur-[150px]" />
    <div className="absolute top-[25%] left-[-12%] w-[42vw] h-[42vw] max-w-[600px] bg-amber-100/40 dark:bg-amber-500/[0.07] rounded-full blur-[100px] sm:blur-[130px]" />
    <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-slate-50 dark:from-ink-950 to-transparent" />
  </div>
);

// ─────────────────────────────────────────────────────────────
// Bento cell
// ─────────────────────────────────────────────────────────────
const BentoCell = ({ colSpan, rowSpan, title, desc, icon: Icon, color, delay, children, highlight }) => {
  const colorMap = {
    violet: 'text-violet-600 bg-violet-50 border-violet-200 dark:text-violet-400 dark:bg-violet-500/10 dark:border-violet-500/20',
    gold: 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20',
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-200 dark:text-indigo-400 dark:bg-indigo-500/10 dark:border-indigo-500/20',
  };
  const styleClass = colorMap[color] || colorMap.violet;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ delay, duration: 0.5, type: 'spring' }}
      className={`group bg-white dark:bg-ink-900 border ${highlight ? 'border-violet-200 dark:border-violet-500/30 shadow-xl shadow-violet-500/5 dark:shadow-glow-iris-sm' : 'border-slate-200 dark:border-ink-800 shadow-sm'} rounded-[2rem] p-8 hover:shadow-lg dark:hover:border-violet-500/30 transition-all duration-300 flex flex-col ${colSpan} ${rowSpan} overflow-hidden relative`}
    >
      <div className="relative z-10 flex-1 flex flex-col h-full">
        {Icon && (
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border transition-transform duration-500 group-hover:scale-110 ${styleClass}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
        <h3 className="font-heading text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">{title}</h3>
        {desc && <p className="text-sm font-body text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm">{desc}</p>}
        <div className="mt-auto pt-8 flex-1 flex flex-col justify-end">{children}</div>
      </div>
    </motion.div>
  );
};

const GenerativePlaceholder = () => (
  <div className="w-full h-full bg-gradient-to-br from-violet-50 to-slate-100 dark:from-ink-800 dark:to-ink-900 relative flex items-center justify-center overflow-hidden">
    <FiCpu className="h-10 w-10 text-violet-200 dark:text-ink-700 z-10" />
  </div>
);

// ─────────────────────────────────────────────────────────────
// Old TerminalHero removed — replaced by premium HeroSection
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// Main HomePage
// ─────────────────────────────────────────────────────────────
const HomePage = () => {
  const [featuredInternships, setFeaturedInternships] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);
  const [platformStats, setPlatformStats] = useState({ activeTracks: null, domains: null });

  useEffect(() => {
    const fetchFeatured = async () => {
      setLoadingFeatured(true);
      try {
        // Fetch a slightly larger pool than we display so the "domains"
        // count below is representative rather than based on just 6 items.
        // pagination.total (confirmed via ApiResponse.paginate on the
        // server) reflects the full matching count regardless of limit,
        // so activeTracks is accurate even though only 6 are shown.
        const res = await getInternshipsList({ limit: 12, status: 'active' });
        if (res.success) {
          setFeaturedInternships(res.data.slice(0, 6));
          const domainCount = new Set(res.data.map((i) => i.category).filter(Boolean)).size;
          setPlatformStats({
            activeTracks: res.pagination?.total ?? res.data.length,
            domains: domainCount,
          });
        }
      } catch (err) {
        console.error('Error fetching featured internships:', err);
      } finally {
        setLoadingFeatured(false);
      }
    };
    fetchFeatured();
  }, []);

  const howItWorks = [
    { icon: FiUserPlus, title: 'Create your profile', desc: 'Sign up free and tell us your stack, interests, and availability.' },
    { icon: FiSearch, title: 'Browse & apply', desc: 'Pick a track that fits your goals and apply in a few minutes.' },
    { icon: FiCheckCircle, title: 'Get matched', desc: 'Approved applicants are paired with a mentor and an active cohort.' },
    { icon: FiAward, title: 'Ship & get certified', desc: 'Complete real sprints and earn a QR-verifiable credential.' },
  ];

  const faqs = [
    { q: 'How do I apply for an internship?', a: 'Create a free student profile, navigate to the internships catalog, select your preferred internship track, and click "Apply" to submit your application details and resume.' },
    { q: 'Is there a program joining fee?', a: 'Some specialized cohorts have an optional or nominal fee assigned by sponsoring guides. We support fully free options too.' },
    { q: 'What payment modes are supported?', a: 'Once accepted and a fee is assigned, you\'ll pay securely via UPI — scan the QR code with Google Pay (or any UPI app), then submit your transaction ID along with a screenshot for verification. Our team confirms it and activates your enrollment.' },
    { q: 'Will I receive a verifiable certificate?', a: 'Yes! Upon successful completion of your internship tasks and milestone reviews, you will receive a secure credential complete with a dynamic QR validation signature code.' },
  ];


  return (
    <div className="min-h-screen bg-slate-50 dark:bg-ink-950 text-slate-900 dark:text-slate-50 relative overflow-hidden font-body selection:bg-violet-200 selection:text-violet-900 dark:selection:bg-violet-500/30 dark:selection:text-violet-50">
      <Helmet>
        <title>InternHub — Manage Every Internship With Intelligence</title>
        <meta name="description" content="All-in-one internship & workforce management platform. Streamline onboarding, attendance, approvals, mentoring, evaluations, certificates, placements, and analytics from one intelligent platform." />
      </Helmet>

      {/* ==================== PREMIUM HERO ==================== */}
      <HeroSection />

      <AmbientBackground />

      {/* ==================== BENTO GRID SHOWCASE ==================== */}
      <section className="py-20 sm:py-24 z-10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[280px]">
            <BentoCell
              colSpan="md:col-span-2 lg:col-span-2"
              rowSpan="row-span-2"
              title="Real-World Workspaces"
              desc="Experience what it's like to work in a high-velocity startup environment. Clone repos, push code, manage tasks on a board, and integrate directly with your workflow."
              icon={FiTerminal}
              color="violet"
              highlight
              delay={0.1}
            >
              <div className="w-full flex-1 bg-ink-950 rounded-2xl border border-white/10 p-5 font-mono text-xs sm:text-sm overflow-hidden relative shadow-2xl">
                <div className="flex gap-2 mb-4 border-b border-white/10 pb-3">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
                <div className="text-violet-400">$ intern-cli init workspace</div>
                <div className="text-slate-400 mt-2">&gt; Bootstrapping environment...</div>
                <div className="text-slate-400">&gt; Fetching repository...</div>
                <div className="text-amber-400 mt-3 font-bold">[Success] Workspace ready.</div>
                <div className="text-emerald-400 mt-4 terminal-cursor">Waiting for your first commit...</div>
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-ink-950 to-transparent" />
              </div>
            </BentoCell>

            <BentoCell
              colSpan="md:col-span-1 lg:col-span-2"
              rowSpan="row-span-1"
              title="Dynamic Verification"
              desc="Every certificate is securely signed and hosted live for employers to verify."
              icon={FiAward}
              color="gold"
              delay={0.2}
            >
              <div className="flex items-center gap-4 bg-slate-50 dark:bg-ink-950/60 p-4 rounded-2xl border border-slate-100 dark:border-ink-800 w-full mt-auto shadow-inner">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <FiCheckCircle className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
                </div>
                <div>
                  <div className="text-slate-900 dark:text-white font-bold font-heading">Verified Credential</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">QR-signed on completion</div>
                </div>
              </div>
            </BentoCell>

            <BentoCell
              colSpan="md:col-span-1 lg:col-span-1"
              rowSpan="row-span-1"
              title="Guided Mentorship"
              desc="A dedicated guide reviews your work at every milestone."
              icon={FiUsers}
              color="indigo"
              delay={0.3}
            >
              <div className="flex -space-x-3 mt-auto">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`w-12 h-12 rounded-full border-4 border-white dark:border-ink-900 flex items-center justify-center text-sm font-bold shadow-sm ${
                      i === 4 ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400' : 'bg-slate-100 dark:bg-ink-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {i === 4 ? '+' : `M${i}`}
                  </div>
                ))}
              </div>
            </BentoCell>

            <BentoCell
              colSpan="md:col-span-3 lg:col-span-1"
              rowSpan="row-span-1"
              title="Modern Stacks"
              desc="React, Node, Python, and more."
              icon={FiCpu}
              color="emerald"
              delay={0.4}
            >
              <div className="flex flex-wrap gap-2 mt-auto">
                {['React', 'Node', 'Python', 'Docker'].map((tech) => (
                  <span key={tech} className="px-3 py-1.5 bg-slate-50 dark:bg-ink-950/60 text-slate-600 dark:text-slate-300 text-[11px] font-bold uppercase rounded-lg border border-slate-200 dark:border-ink-800 font-mono">
                    {tech}
                  </span>
                ))}
              </div>
            </BentoCell>
          </div>
        </div>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section id="how-it-works" className="py-20 sm:py-24 relative z-10 bg-white dark:bg-ink-900/40 border-y border-slate-100 dark:border-ink-800 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">
              &gt; the pipeline
            </span>
            <h2 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight text-slate-900 dark:text-white">
              How It Works
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
              Four steps from "just applied" to "shipped a real sprint."
            </p>
          </div>

          <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
            <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-violet-200 via-violet-300 to-amber-300 dark:from-violet-500/30 dark:via-violet-500/40 dark:to-amber-400/30" />
            {howItWorks.map((step, idx) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.12 }}
                className="relative text-center lg:text-left flex flex-col items-center lg:items-start"
              >
                <div className="relative z-10 w-16 h-16 rounded-2xl bg-white dark:bg-ink-900 border-2 border-violet-200 dark:border-violet-500/30 flex items-center justify-center mb-5 shadow-sm">
                  <step.icon className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-ink-950 dark:bg-amber-400 text-white dark:text-ink-950 text-[10px] font-mono font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                </div>
                <h3 className="font-heading font-bold text-slate-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== ACTIVE TRACKS ==================== */}
      <section className="py-20 sm:py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4">
            <div className="text-left space-y-3">
              <h2 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight text-slate-900 dark:text-white">
                Active Engineering Tracks
              </h2>
              <p className="text-base text-slate-600 dark:text-slate-400 max-w-xl">
                Handpicked cohorts launching soon. Apply now to secure your spot.
              </p>
            </div>
            <Link
              to="/internships"
              className="hidden sm:flex items-center gap-2 text-sm font-bold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 transition-colors"
            >
              View Catalog <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loadingFeatured ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((n) => <InternshipSkeleton key={n} />)}
            </div>
          ) : featuredInternships.length === 0 ? (
            <div className="bg-white dark:bg-ink-900 border border-slate-200 dark:border-ink-800 rounded-3xl p-12 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">No active tracks right now — check back soon, or browse the full catalog.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredInternships.map((internship, idx) => (
                <motion.div
                  key={internship._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, type: 'spring', stiffness: 75 }}
                >
                  <Link
                    to={`/internships?selected=${internship._id}`}
                    className="block h-full bg-white dark:bg-ink-900 border border-slate-200 dark:border-ink-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-violet-500/10 hover:border-violet-200 dark:hover:border-violet-500/30 transition-all duration-300 group flex flex-col"
                  >
                    <div className="h-48 bg-slate-100 dark:bg-ink-950 flex items-center justify-center overflow-hidden relative">
                      {internship.imageUrl ? (
                        <img src={internship.imageUrl} alt={internship.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      ) : (
                        <GenerativePlaceholder />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <span className="absolute top-4 left-4 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-white/90 dark:bg-ink-900/90 backdrop-blur-md text-slate-900 dark:text-white shadow-sm">
                        {internship.mode}
                      </span>

                    </div>

                    <div className="p-6 text-left flex-1 flex flex-col">
                      <span className="inline-block text-[11px] font-bold px-3 py-1 rounded-lg bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 uppercase mb-4 w-fit">
                        {internship.category}
                      </span>
                      <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors line-clamp-2">
                        {internship.title}
                      </h3>
                      <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {internship.shortDescription || internship.description}
                      </p>

                      <div className="mt-auto pt-6 flex items-center justify-between border-t border-slate-100 dark:border-ink-800 mt-6">
                        <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                          View Track <FiArrowRight className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          {formatDisplayAmount(internship.fees, 'Free')}
                          <span className="w-8 h-8 rounded-full bg-slate-50 dark:bg-ink-800 flex items-center justify-center text-violet-600 dark:text-violet-400 group-hover:bg-violet-600 group-hover:text-white dark:group-hover:bg-violet-500 transition-colors">
                            <FiArrowRight className="w-4 h-4" />
                          </span>
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          <div className="mt-12 text-center sm:hidden">
            <Link to="/internships" className="inline-flex items-center justify-center w-full px-6 py-4 bg-slate-100 dark:bg-ink-800 rounded-2xl text-base font-bold text-slate-900 dark:text-white gap-2 border border-slate-200 dark:border-ink-700">
              View Catalog <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Honest, derived stats — no invented numbers */}
          {!loadingFeatured && platformStats.activeTracks > 0 && (
            <div className="mt-16 grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <div className="text-center p-5 rounded-2xl bg-white dark:bg-ink-900 border border-slate-200 dark:border-ink-800">
                <div className="text-2xl sm:text-3xl font-heading font-bold text-violet-600 dark:text-violet-400 font-tabular">{platformStats.activeTracks}+</div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500 mt-1">Active Tracks</div>
              </div>
              <div className="text-center p-5 rounded-2xl bg-white dark:bg-ink-900 border border-slate-200 dark:border-ink-800">
                <div className="text-2xl sm:text-3xl font-heading font-bold text-violet-600 dark:text-violet-400 font-tabular">{platformStats.domains}+</div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500 mt-1">Domains Covered</div>
              </div>
              <div className="text-center p-5 rounded-2xl bg-white dark:bg-ink-900 border border-slate-200 dark:border-ink-800 col-span-2 sm:col-span-1 flex flex-col items-center justify-center">
                <FiShield className="w-5 h-5 text-emerald-500 mb-1" />
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500">QR-Verified Certs</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ==================== FAQ ==================== */}
      <section className="py-20 sm:py-24 relative z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight text-slate-900 dark:text-white">
              Frequently Asked
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
              Questions about applications, payments, and credentials.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white dark:bg-ink-900 border border-slate-200 dark:border-ink-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left focus:outline-none transition group"
                >
                  <span className="text-base font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    {faq.q}
                  </span>
                  <motion.div
                    animate={{ rotate: openFaq === idx ? 180 : 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className={`p-2 rounded-xl shrink-0 ml-4 border transition-colors ${
                      openFaq === idx
                        ? 'bg-violet-50 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-500/30'
                        : 'bg-slate-50 dark:bg-ink-800 text-slate-400 border-slate-200 dark:border-ink-700'
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
                      className="border-t border-slate-100 dark:border-ink-800 bg-slate-50 dark:bg-ink-950/40"
                    >
                      <div className="px-6 py-5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{faq.a}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FINAL CTA ==================== */}
      <section className="py-20 sm:py-24 relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden py-16 px-8 sm:px-12 md:py-24 rounded-[3rem] text-center bg-gradient-to-br from-violet-700 via-violet-600 to-indigo-700 dark:from-ink-900 dark:via-violet-950 dark:to-ink-900 dark:border dark:border-violet-500/20">
            <div className="absolute inset-0 bg-grid-iris opacity-30" />
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-400/20 rounded-full blur-[100px]" />
            <div className="relative z-10 max-w-2xl mx-auto space-y-8">
              <FiZap className="w-8 h-8 text-amber-300 mx-auto" />
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-white leading-tight tracking-tight">
                Ready to ship your <br />
                <span className="text-amber-300">first sprint?</span>
              </h2>
              <p className="text-lg text-violet-100">
                Create a free profile and apply to an active track today — no waitlist.
              </p>
              <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-ink-950 text-base font-bold rounded-2xl shadow-lg transition-all duration-300"
                >
                  Create Student Profile
                </Link>
                <Link
                  to="/internships"
                  className="w-full sm:w-auto px-10 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-base font-bold rounded-2xl transition-all duration-300 backdrop-blur-sm"
                >
                  Browse Catalog
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
