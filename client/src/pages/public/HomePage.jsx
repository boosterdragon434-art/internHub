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
  FiBriefcase,
  FiUsers,
  FiTrendingUp,
  FiAward,
  FiTerminal,
  FiCpu,
  FiClock,
  FiStar,
  FiDownloadCloud
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
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 70, damping: 15 } },
};

// ─────────────────────────────────────────────────────────────
// Modern Clean Background (Responsive Light/Dark)
// ─────────────────────────────────────────────────────────────
const AmbientBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    <div className="absolute inset-0 bg-slate-50 dark:bg-slate-950 transition-colors duration-500" />
    
    {/* Clean dot grid */}
    <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-60 dark:opacity-40" />
    
    {/* Subtle Blue & Orange Gradients */}
    <div className="absolute top-0 right-[-10%] w-[50vw] h-[50vw] max-w-[800px] bg-primary-100/50 dark:bg-primary-900/20 rounded-full blur-[100px] sm:blur-[140px]" />
    <div className="absolute top-[20%] left-[-10%] w-[40vw] h-[40vw] max-w-[600px] bg-accent-100/40 dark:bg-accent-900/10 rounded-full blur-[100px] sm:blur-[120px]" />

    {/* Fade out bottom */}
    <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-slate-50 dark:from-slate-950 to-transparent" />
  </div>
);

// ─────────────────────────────────────────────────────────────
// App Store Style Bento Cell
// ─────────────────────────────────────────────────────────────
const BentoCell = ({ colSpan, rowSpan, title, desc, icon: Icon, color, delay, children, highlight }) => {
  const colorMap = {
    primary: 'text-primary-600 bg-primary-50 border-primary-200 dark:text-primary-400 dark:bg-primary-500/10 dark:border-primary-500/20',
    accent: 'text-accent-600 bg-accent-50 border-accent-200 dark:text-accent-400 dark:bg-accent-500/10 dark:border-accent-500/20',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20',
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-200 dark:text-indigo-400 dark:bg-indigo-500/10 dark:border-indigo-500/20',
  };

  const styleClass = colorMap[color] || colorMap.primary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay, duration: 0.5, type: 'spring' }}
      className={`group bg-white dark:bg-slate-900 border ${highlight ? 'border-primary-200 dark:border-primary-800 shadow-xl shadow-primary-500/5' : 'border-slate-200 dark:border-slate-800 shadow-sm'} rounded-[2rem] p-8 hover:shadow-lg transition-all duration-300 flex flex-col ${colSpan} ${rowSpan} overflow-hidden relative`}
    >
      <div className="relative z-10 flex-1 flex flex-col h-full">
        {Icon && (
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border transition-transform duration-500 group-hover:scale-110 ${styleClass}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
        <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">{title}</h3>
        {desc && <p className="text-sm font-sans text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm">{desc}</p>}
        
        <div className="mt-auto pt-8 flex-1 flex flex-col justify-end">
          {children}
        </div>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────
// Generative Abstract SVG Placeholder Component
// ─────────────────────────────────────────────────────────────
const GenerativePlaceholder = () => (
  <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 relative flex items-center justify-center overflow-hidden">
    <FiCpu className="h-10 w-10 text-slate-300 dark:text-slate-700 z-10" />
  </div>
);

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

  const faqs = [
    { q: 'How do I apply for an internship?', a: 'Create a free student profile, navigate to the internships catalog, select your preferred internship track, and click "Apply" to submit your application details and resume.' },
    { q: 'Is there a program joining fee?', a: 'Some specialized cohorts have an optional or nominal fee assigned by sponsoring guides. We support fully free options too.' },
    { q: 'What payment modes are supported?', a: 'Once accepted and a fee is assigned, you\'ll pay securely via UPI — scan the QR code with Google Pay (or any UPI app), then submit your transaction ID along with a screenshot for verification. Our team confirms it and activates your enrollment.' },
    { q: 'Will I receive a verifiable certificate?', a: 'Yes! Upon successful completion of your internship tasks and milestone reviews, you will receive a secure credential complete with a dynamic QR validation signature code.' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 relative overflow-hidden font-sans selection:bg-primary-200 selection:text-primary-900 dark:selection:bg-primary-900/50 dark:selection:text-primary-50">
      <Helmet>
        <title>InternHub — Modern Tech Education Platform</title>
        <meta name="description" content="Discover professional tech internships. Collaborate with mentors, build portfolios, track sprint deliverables, and verify dynamic credentials end-to-end." />
      </Helmet>

      <AmbientBackground />

      {/* ==================== HERO SECTION (App Store SaaS Vibe) ==================== */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 z-10 flex flex-col items-center text-center px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="max-w-4xl mx-auto space-y-8 flex flex-col items-center"
        >
          {/* Trust Badge */}
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 shadow-sm"
          >
            <div className="flex gap-0.5 text-accent-500">
              <FiStar className="w-3.5 h-3.5 fill-current" />
              <FiStar className="w-3.5 h-3.5 fill-current" />
              <FiStar className="w-3.5 h-3.5 fill-current" />
              <FiStar className="w-3.5 h-3.5 fill-current" />
              <FiStar className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="w-px h-3 bg-slate-300 dark:bg-slate-700" />
            <span>Trusted by 10,000+ Students</span>
          </motion.div>

          {/* Master Headline */}
          <motion.h1
            variants={fadeUp}
            className="text-5xl sm:text-6xl md:text-7xl font-display font-extrabold tracking-tight leading-[1.1] text-slate-900 dark:text-white"
          >
            Launch Your Career in <br className="hidden sm:block" />
            <span className="text-primary-600 dark:text-primary-400 relative">
              Tech Engineering
              <svg className="absolute w-full h-3 -bottom-1 left-0 text-accent-400/30" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 15 100 5" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round"/></svg>
            </span>
          </motion.h1>

          {/* Description body */}
          <motion.p
            variants={fadeUp}
            className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl"
          >
            Join immersive, real-world tech stacks. Build your portfolio under expert mentorship, conquer agile sprints, and earn cryptographically-secure credentials.
          </motion.p>

          {/* High Conversion CTA Buttons */}
          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row items-center gap-4 pt-4 w-full sm:w-auto"
          >
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 bg-accent-500 hover:bg-accent-600 text-white text-base font-bold rounded-2xl shadow-lg shadow-accent-500/25 hover:shadow-xl hover:shadow-accent-500/40 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
            >
              Start Learning Free <FiArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/internships"
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-base font-bold rounded-2xl transition-all duration-300 flex items-center justify-center shadow-sm hover:shadow-md"
            >
              Browse Internships
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ==================== BENTO GRID SHOWCASE (Clean & Light) ==================== */}
      <section className="py-24 z-10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[280px]">
            
            {/* Large Hero Cell */}
            <BentoCell
              colSpan="md:col-span-2 lg:col-span-2"
              rowSpan="row-span-2"
              title="Real-World Workspaces"
              desc="Experience what it's like to work in a high-velocity startup environment. Clone repos, push code, manage tasks in Kanban boards, and integrate directly with your workflow."
              icon={FiTerminal}
              color="primary"
              highlight={true}
              delay={0.1}
            >
              <div className="w-full flex-1 bg-slate-900 rounded-2xl border border-slate-800 p-5 font-mono text-xs sm:text-sm overflow-hidden relative shadow-2xl">
                <div className="flex gap-2 mb-4 border-b border-slate-800 pb-3">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
                <div className="text-primary-400">$ intern-cli init workspace</div>
                <div className="text-slate-400 mt-2">&gt; Bootstrapping environment...</div>
                <div className="text-slate-400">&gt; Fetching repository...</div>
                <div className="text-accent-400 mt-3 font-bold">[Success] Workspace ready.</div>
                <div className="text-emerald-400 mt-4 animate-pulse">Waiting for your first commit... _</div>
                
                {/* Fade out bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-900 to-transparent" />
              </div>
            </BentoCell>

            {/* Medium Cell 1 */}
            <BentoCell
              colSpan="md:col-span-1 lg:col-span-2"
              rowSpan="row-span-1"
              title="Dynamic Verification"
              desc="Every certificate is securely signed and hosted live for employers to verify."
              icon={FiAward}
              color="accent"
              delay={0.2}
            >
              <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 w-full mt-auto shadow-inner">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <FiCheckCircle className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
                </div>
                <div>
                  <div className="text-slate-900 dark:text-white font-bold font-display">Verified Credential</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">ID: INH-2026-X9F2A</div>
                </div>
              </div>
            </BentoCell>

            {/* Medium Cell 2 */}
            <BentoCell
              colSpan="md:col-span-1 lg:col-span-1"
              rowSpan="row-span-1"
              title="Global Mentorship"
              desc="Learn directly from industry veterans."
              icon={FiUsers}
              color="indigo"
              delay={0.3}
            >
              <div className="flex -space-x-3 mt-auto">
                {[1,2,3,4].map((i) => (
                  <div key={i} className={`w-12 h-12 rounded-full border-4 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-bold shadow-sm ${i===4 ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    {i===4 ? '+50' : `M${i}`}
                  </div>
                ))}
              </div>
            </BentoCell>
            
            {/* Small Cell */}
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
                {['React', 'Next.js', 'Node', 'Docker'].map(tech => (
                  <span key={tech} className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 text-[11px] font-bold uppercase rounded-lg border border-slate-200 dark:border-slate-800">
                    {tech}
                  </span>
                ))}
              </div>
            </BentoCell>

          </div>
        </div>
      </section>

      {/* ==================== ACTIVE COHORTS (Clean Cards) ==================== */}
      {featuredInternships.length > 0 && (
        <section className="py-24 bg-white dark:bg-slate-950 border-y border-slate-100 dark:border-slate-900 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4">
              <div className="text-left space-y-3">
                <h2 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Active Engineering Tracks
                </h2>
                <p className="text-base text-slate-600 dark:text-slate-400 max-w-xl">
                  Handpicked professional training cohorts launching soon. Apply now to secure your spot in our high-velocity learning environment.
                </p>
              </div>
              <Link
                to="/internships"
                className="hidden sm:flex items-center gap-2 text-sm font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
              >
                View Catalog <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>

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
                    to={`/internships/${internship._id}`}
                    className="block h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary-500/10 hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-300 group flex flex-col"
                  >
                    {/* Image Cover */}
                    <div className="h-48 bg-slate-100 dark:bg-slate-950 flex items-center justify-center overflow-hidden relative">
                      {internship.imageUrl ? (
                        <img
                          src={internship.imageUrl}
                          alt={internship.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <GenerativePlaceholder />
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      
                      <span className="absolute top-4 left-4 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-slate-900 dark:text-white shadow-sm">
                        {internship.mode}
                      </span>
                    </div>

                    {/* Body container */}
                    <div className="p-6 text-left flex-1 flex flex-col">
                      <span className="inline-block text-[11px] font-bold px-3 py-1 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 uppercase mb-4 w-fit">
                        {internship.category}
                      </span>
                      <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
                        {internship.title}
                      </h3>
                      <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {internship.shortDescription || internship.description}
                      </p>

                      {/* Footer Info */}
                      <div className="mt-auto pt-6 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 mt-6">
                        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                          <FiClock className="w-4 h-4" /> {internship.duration}
                        </span>
                        <span className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          {formatDisplayAmount(internship.fees, 'Free')}
                          <span className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:bg-primary-600 group-hover:text-white dark:group-hover:bg-primary-500 transition-colors">
                            <FiArrowRight className="w-4 h-4" />
                          </span>
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-12 text-center sm:hidden">
              <Link
                to="/internships"
                className="inline-flex items-center justify-center w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-base font-bold text-slate-900 dark:text-white gap-2 border border-slate-200 dark:border-slate-700"
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
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
              System Operations
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
              Clear queries regarding program architecture, authentication, and pipelines.
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
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left focus:outline-none transition group"
                >
                  <span className="text-base font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {faq.q}
                  </span>
                  <motion.div
                    animate={{ rotate: openFaq === idx ? 180 : 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className={`p-2 rounded-xl shrink-0 ml-4 border transition-colors ${
                      openFaq === idx
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-800'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
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
                      className="border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50"
                    >
                      <div className="px-6 py-5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
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
      <section className="py-24 relative z-10 bg-primary-600 dark:bg-slate-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden py-16 px-8 sm:px-12 md:py-24 rounded-[3rem] text-center">
            <div className="relative z-10 max-w-2xl mx-auto space-y-8">
              <h2 className="text-4xl md:text-5xl font-display font-extrabold text-white leading-tight tracking-tight">
                Ready to compile your <br/>
                <span className="text-accent-300 dark:text-accent-400">career trajectory?</span>
              </h2>
              <p className="text-lg text-primary-100 dark:text-slate-400">
                Connect to our robust educational infrastructure and launch your first sprint today.
              </p>
              
              <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-10 py-4 bg-accent-500 hover:bg-accent-400 text-white text-base font-bold rounded-2xl shadow-lg transition-all duration-300"
                >
                  Create Student Profile
                </Link>
                <Link
                  to="/internships"
                  className="w-full sm:w-auto px-10 py-4 bg-primary-700 dark:bg-slate-800 hover:bg-primary-800 dark:hover:bg-slate-700 text-white border border-primary-500 dark:border-slate-700 text-base font-bold rounded-2xl transition-all duration-300"
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
