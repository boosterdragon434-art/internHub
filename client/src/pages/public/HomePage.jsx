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
  FiFolder,
  FiCode,
  FiCpu,
  FiTerminal,
  FiMonitor,
  FiClock
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

// ─────────────────────────────────────────────────────────────
// Ambient Technical Background Component (OLED Dark Mode)
// ─────────────────────────────────────────────────────────────
const AmbientBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none bg-brand-950">
    {/* Minimalist grid for tech vibe */}
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e1e32_1px,transparent_1px),linear-gradient(to_bottom,#1e1e32_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
    
    {/* Subtle Purple & Gold OLED glow patches */}
    <div className="absolute top-[-20%] right-[-10%] w-[50vw] h-[50vw] max-w-[800px] bg-primary-600/10 rounded-full blur-[140px]" />
    <div className="absolute bottom-[20%] left-[-10%] w-[40vw] h-[40vw] max-w-[600px] bg-accent-500/5 rounded-full blur-[120px]" />
    <div className="absolute top-[40%] left-[20%] w-[30vw] h-[30vw] max-w-[400px] bg-primary-500/5 rounded-full blur-[100px]" />

    {/* Vignette fade at the bottom */}
    <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_60%,#0f0f23_98%)]" />
  </div>
);

// ─────────────────────────────────────────────────────────────
// Bento Grid Feature Cell Component
// ─────────────────────────────────────────────────────────────
const BentoCell = ({ colSpan, rowSpan, title, desc, icon: Icon, color, delay, children, image }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ delay, duration: 0.5, type: 'spring' }}
    className={`relative overflow-hidden group bg-brand-900 border border-brand-800 rounded-3xl p-6 hover:border-primary-500/40 transition-colors duration-500 flex flex-col ${colSpan} ${rowSpan}`}
  >
    {image && (
      <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-500 mix-blend-overlay">
        <img src={image} alt="" className="w-full h-full object-cover grayscale" />
      </div>
    )}
    
    {/* Subtle top-left glow */}
    <div className="absolute -top-12 -left-12 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl group-hover:bg-primary-500/20 transition-all duration-500" />
    
    <div className="relative z-10 flex-1 flex flex-col">
      {Icon && (
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 bg-${color}-500/10 border border-${color}-500/20 text-${color}-400 group-hover:scale-110 transition-transform duration-500`}>
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h3 className="font-display text-xl sm:text-2xl font-bold text-white mb-2">{title}</h3>
      {desc && <p className="text-sm font-sans text-brand-300 leading-relaxed max-w-sm">{desc}</p>}
      
      <div className="mt-auto pt-6 flex-1 flex flex-col">
        {children}
      </div>
    </div>
  </motion.div>
);

// ─────────────────────────────────────────────────────────────
// Generative Abstract SVG Placeholder Component
// ─────────────────────────────────────────────────────────────
const GenerativePlaceholder = ({ category }) => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-brand-800 to-brand-900 relative flex items-center justify-center overflow-hidden transition-transform duration-500 group-hover:scale-105">
      <svg className="absolute inset-0 w-full h-full text-primary-500/10 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="card-purple-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#card-purple-grid)" />
      </svg>
      <FiCode className="h-10 w-10 text-primary-400 drop-shadow-[0_0_15px_rgba(139,92,246,0.5)] z-10" />
    </div>
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

  const faqs = [
    { q: 'How do I apply for an internship?', a: 'Create a free student profile, navigate to the internships catalog, select your preferred internship track, and click "Apply" to submit your application details and resume.' },
    { q: 'Is there a program joining fee?', a: 'Some specialized cohorts have an optional or nominal fee assigned by sponsoring guides. We support fully free options too.' },
    { q: 'What payment modes are supported?', a: 'Once accepted and a fee is assigned, you\'ll pay securely via UPI — scan the QR code with Google Pay (or any UPI app), then submit your transaction ID along with a screenshot for verification. Our team confirms it and activates your enrollment.' },
    { q: 'Will I receive a verifiable certificate?', a: 'Yes! Upon successful completion of your internship tasks and milestone reviews, you will receive a secure credential complete with a dynamic QR validation signature code.' },
  ];

  return (
    <div className="min-h-screen bg-brand-950 text-slate-100 relative overflow-hidden select-none font-sans selection:bg-primary-500/30 selection:text-white">
      <Helmet>
        <title>InternHub — Next-Gen Tech Internships</title>
        <meta name="description" content="Discover professional tech internships. Collaborate with mentors, build portfolios, track sprint deliverables, and verify dynamic landscape credentials end-to-end." />
      </Helmet>

      <AmbientBackground />

      {/* ==================== HERO SECTION (OLED High Contrast) ==================== */}
      <section className="relative overflow-hidden pb-24 pt-32 lg:pt-40 z-10 flex flex-col items-center text-center">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="space-y-8 flex flex-col items-center"
          >
            {/* Dark Mode Glowing Badge */}
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-900/30 border border-primary-500/30 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-primary-400 shadow-[0_0_15px_rgba(139,92,246,0.15)] backdrop-blur-sm"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
              <span>Next-Gen Tech Internships</span>
            </motion.div>

            {/* Master Headline */}
            <motion.h1
              variants={fadeUp}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-[5rem] font-display font-bold tracking-tight leading-[1.05] text-white"
            >
              Accelerate your <br className="hidden md:block" />
              <span className="bg-gradient-to-r from-primary-400 via-primary-500 to-accent-400 bg-clip-text text-transparent drop-shadow-sm">
                Engineering Career
              </span>
            </motion.h1>

            {/* Description body */}
            <motion.p
              variants={fadeUp}
              className="text-base sm:text-lg text-brand-300 leading-relaxed max-w-2xl font-medium"
            >
              Immerse yourself in real-world tech stacks. Build portfolios under expert mentorship, conquer agile sprint challenges, and earn dynamic, cryptographically-secure credentials.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row items-center gap-5 pt-4 w-full sm:w-auto"
            >
              <Link
                to="/internships"
                className="w-full sm:w-auto px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white text-sm font-bold tracking-wide rounded-2xl shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] transition-all duration-300 flex items-center justify-center gap-2 border border-primary-400/50"
              >
                Explore Active Cohorts <FiArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-4 bg-brand-800 hover:bg-brand-700 border border-brand-700 text-white text-sm font-bold tracking-wide rounded-2xl transition-all duration-300 flex items-center justify-center"
              >
                Join as Student
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ==================== BENTO GRID SHOWCASE ==================== */}
      <section className="py-20 z-10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[250px] sm:auto-rows-[300px]">
            
            {/* Large Hero Cell */}
            <BentoCell
              colSpan="md:col-span-2 lg:col-span-2"
              rowSpan="row-span-2"
              title="Real-World Engineering Workspaces"
              desc="Experience what it's like to work in a high-velocity startup environment. Clone repos, push code, manage tasks in our Kanban boards, and integrate directly with your workflow."
              icon={FiTerminal}
              color="primary"
              delay={0.1}
            >
              <div className="w-full flex-1 bg-[#151525] rounded-xl border border-brand-700 p-4 font-mono text-xs sm:text-sm overflow-hidden relative shadow-inner">
                <div className="flex gap-2 mb-3 border-b border-brand-700 pb-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-accent-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="text-primary-400">$ intern-cli init workspace</div>
                <div className="text-brand-400 mt-1">&gt; Bootstrapping environment...</div>
                <div className="text-brand-400">&gt; Fetching repository...</div>
                <div className="text-accent-400 mt-2 font-bold">[Success] Workspace ready.</div>
                <div className="text-emerald-400 mt-4 animate-pulse">Waiting for your first commit... _</div>
                
                {/* Fade out bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#151525] to-transparent" />
              </div>
            </BentoCell>

            {/* Medium Cell 1 */}
            <BentoCell
              colSpan="md:col-span-1 lg:col-span-2"
              rowSpan="row-span-1"
              title="Dynamic Verification"
              desc="Every certificate is cryptographically signed and hosted live for employers to verify."
              icon={FiAward}
              color="accent"
              delay={0.2}
            >
              <div className="flex items-center gap-4 bg-brand-800 p-4 rounded-xl border border-brand-700 w-full mt-auto">
                <div className="w-12 h-12 rounded-lg bg-accent-500/20 flex items-center justify-center shrink-0">
                  <FiCheckCircle className="w-6 h-6 text-accent-400" />
                </div>
                <div>
                  <div className="text-white font-bold font-display">Verified Credential</div>
                  <div className="text-xs text-brand-400 font-mono mt-1">ID: INH-2026-X9F2A</div>
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
              color="secondary"
              delay={0.3}
            >
              <div className="flex -space-x-3 mt-auto">
                {[1,2,3,4].map((i) => (
                  <div key={i} className={`w-10 h-10 rounded-full border-2 border-brand-900 bg-brand-700 flex items-center justify-center text-xs font-bold ${i===4 ? 'bg-primary-600 text-white' : 'text-brand-300'}`}>
                    {i===4 ? '+50' : `M${i}`}
                  </div>
                ))}
              </div>
            </BentoCell>
            
            {/* Small Cell */}
            <BentoCell
              colSpan="md:col-span-3 lg:col-span-1"
              rowSpan="row-span-1"
              title="Tech Stacks"
              desc="React, Node, Python, and more."
              icon={FiCpu}
              color="emerald"
              delay={0.4}
            >
              <div className="flex flex-wrap gap-2 mt-auto">
                {['React', 'Next.js', 'Node', 'MongoDB', 'Docker'].map(tech => (
                  <span key={tech} className="px-3 py-1 bg-brand-800 text-brand-200 text-[10px] font-bold uppercase rounded-lg border border-brand-700">
                    {tech}
                  </span>
                ))}
              </div>
            </BentoCell>

          </div>
        </div>
      </section>

      {/* ==================== ACTIVE COHORTS (OLED Glass Cards) ==================== */}
      {featuredInternships.length > 0 && (
        <section className="py-24 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4">
              <div className="text-left space-y-3">
                <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-white">
                  Active Engineering Tracks
                </h2>
                <p className="text-sm text-brand-300 font-medium max-w-xl">
                  Handpicked professional training cohorts launching soon. Apply now to secure your spot in our high-velocity learning environment.
                </p>
              </div>
              <Link
                to="/internships"
                className="hidden sm:flex items-center gap-2 text-sm font-bold text-primary-400 hover:text-primary-300 transition-colors"
              >
                View Catalog <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredInternships.map((internship, idx) => (
                <motion.div
                  key={internship._id}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, type: 'spring', stiffness: 75 }}
                >
                  <Link
                    to={`/internships/${internship._id}`}
                    className="block h-full bg-brand-900/50 backdrop-blur-sm border border-brand-700/50 rounded-[2rem] overflow-hidden shadow-lg hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] hover:border-primary-500/50 transition-all duration-500 group flex flex-col"
                  >
                    {/* Image Cover */}
                    <div className="h-48 bg-brand-950 flex items-center justify-center overflow-hidden relative">
                      {internship.imageUrl ? (
                        <img
                          src={internship.imageUrl}
                          alt={internship.title}
                          className="w-full h-full object-cover group-hover:scale-105 group-hover:brightness-110 transition-all duration-500 opacity-80"
                        />
                      ) : (
                        <GenerativePlaceholder category={internship.category} />
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-900 to-transparent opacity-80" />
                      
                      <span className="absolute top-4 left-4 text-[10px] font-bold uppercase px-3 py-1.5 rounded-full bg-brand-900/80 backdrop-blur-md text-white border border-brand-700 shadow-md">
                        {internship.mode}
                      </span>
                    </div>

                    {/* Body container */}
                    <div className="p-6 text-left flex-1 flex flex-col">
                      <span className="inline-block text-[10px] font-bold px-3 py-1 rounded-full bg-primary-900/40 text-primary-400 border border-primary-500/20 uppercase mb-4 w-fit">
                        {internship.category}
                      </span>
                      <h3 className="text-xl font-display font-bold text-white group-hover:text-primary-400 transition-colors line-clamp-2">
                        {internship.title}
                      </h3>
                      <p className="mt-3 text-sm text-brand-300 line-clamp-2 leading-relaxed font-medium">
                        {internship.shortDescription || internship.description}
                      </p>

                      {/* Footer Info */}
                      <div className="mt-auto pt-6 flex items-center justify-between">
                        <span className="text-xs text-brand-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <FiClock className="w-4 h-4" /> {internship.duration}
                        </span>
                        <span className="text-base font-bold text-accent-400">
                          {formatDisplayAmount(internship.fees, 'Free')}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-10 text-center sm:hidden">
              <Link
                to="/internships"
                className="inline-flex items-center justify-center w-full px-6 py-4 bg-brand-800 rounded-xl text-sm font-bold text-white gap-2 border border-brand-700"
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
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-white">
              System Operations
            </h2>
            <p className="text-sm text-brand-300 font-medium">
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
                className="bg-brand-900 border border-brand-800 rounded-2xl overflow-hidden shadow-sm hover:border-primary-500/30 transition-all duration-300"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left focus:outline-none transition group"
                >
                  <span className="text-sm sm:text-base font-bold text-white group-hover:text-primary-400 transition-colors">
                    {faq.q}
                  </span>
                  <motion.div
                    animate={{ rotate: openFaq === idx ? 180 : 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className={`p-2 rounded-xl shrink-0 ml-4 border transition-colors ${
                      openFaq === idx
                        ? 'bg-primary-900/40 text-primary-400 border-primary-500/30'
                        : 'bg-brand-800 text-brand-400 border-brand-700 group-hover:bg-brand-700'
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
                      className="border-t border-brand-800 bg-brand-950/40"
                    >
                      <div className="px-6 py-5 text-sm text-brand-300 leading-relaxed font-medium">
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden bg-brand-900 border border-brand-800 py-16 px-8 sm:px-12 md:py-24 rounded-[3rem] text-center shadow-2xl">
            {/* Accent Glowing Orb */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-64 bg-primary-600/20 blur-[100px] pointer-events-none rounded-full" />
            
            <div className="relative z-10 max-w-2xl mx-auto space-y-8">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white leading-tight tracking-tight">
                Ready to initialize your <br/>
                <span className="text-primary-400">Next Sprint?</span>
              </h2>
              <p className="text-base text-brand-300 font-medium">
                Connect to our robust educational infrastructure and compile your career trajectory today.
              </p>
              
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-10 py-4 bg-primary-600 hover:bg-primary-500 text-white text-sm font-bold tracking-wide rounded-2xl shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all duration-300 border border-primary-400/50"
                >
                  Sign Up Free
                </Link>
                <Link
                  to="/internships"
                  className="w-full sm:w-auto px-10 py-4 bg-brand-800 hover:bg-brand-700 border border-brand-700 text-white text-sm font-bold tracking-wide rounded-2xl transition-all duration-300"
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
