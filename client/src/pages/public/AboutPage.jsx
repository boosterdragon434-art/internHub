import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FiTarget, FiHeart, FiAward, FiUsers, FiCompass } from 'react-icons/fi';

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 15 } },
};

const AboutPage = () => {
  const values = [
    { icon: FiTarget, title: 'Our Mission', desc: 'To bridge the gap between ambitious students and quality internship opportunities that build real-world skills.', color: 'from-violet-650 to-indigo-600' },
    { icon: FiHeart, title: 'Student-First', desc: 'Every feature we build starts with one question: does this make the student experience better?', color: 'from-rose-500 to-pink-500' },
    { icon: FiAward, title: 'Quality Focus', desc: 'We curate internships carefully to ensure each opportunity provides genuine learning and growth.', color: 'from-amber-500 to-orange-500' },
    { icon: FiUsers, title: 'Community Driven', desc: 'We\'re building a community of future professionals who support and inspire each other.', color: 'from-emerald-500 to-teal-500' },
  ];

  return (
    <>
      <Helmet>
        <title>About Us — InternHub</title>
        <meta name="description" content="Learn about InternHub's mission to connect students with quality internship opportunities." />
      </Helmet>

      {/* Floating lights */}
      <div className="absolute inset-x-0 top-0 h-[400px] overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-36 left-1/3 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[120px]" />
        <div className="absolute top-20 right-1/4 w-[450px] h-[450px] bg-indigo-600/5 rounded-full blur-[120px]" />
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pt-24 pb-16 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-950/20 border border-violet-100/40 dark:border-violet-900/30 text-[9px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
            <FiCompass className="w-3.5 h-3.5" /> Our Story
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring' }} className="text-3xl md:text-5xl font-black tracking-tight leading-none">
            About{' '}
            <span className="bg-gradient-to-r from-violet-600 to-indigo-500 dark:from-violet-400 dark:to-indigo-300 bg-clip-text text-transparent">
              InternHub
            </span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, type: 'spring' }} className="mt-4 text-xs md:text-sm text-slate-500 dark:text-slate-350 max-w-xl mx-auto leading-relaxed">
            We are dedicated to building accessible, professional internship tracks for students globally. Our unified workspace brings students, organization guides, and verifiers together.
          </motion.p>
        </div>
      </section>

      {/* Values */}
      <section className="bg-white dark:bg-slate-900 py-16 relative z-10 border-t border-slate-100 dark:border-slate-850/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((val, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08, type: 'spring' }}
                className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col items-start text-left relative overflow-hidden group"
              >
                {/* Visual Category border */}
                <span className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${val.color}`} />
                <div className="p-3 bg-violet-50 dark:bg-violet-950/30 rounded-xl text-violet-600 dark:text-violet-400 mb-4 group-hover:scale-108 transition-transform duration-300">
                  <val.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">{val.title}</h3>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{val.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="bg-slate-50 dark:bg-slate-950 py-16 relative z-10 border-t border-slate-100 dark:border-slate-850/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-50">Our Journey</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl mx-auto select-text">
            InternHub was born from a simple observation: talented students struggle to acquire curated, structured industry experience. The search is fragmented, milestones are opaque, and credential issuing lacks quick validation keys. We engineered a platform integrating ClickUp-like agile task pipelines, instant cohort chat channels, calendar alarms, Google Drive file cabinets, and dynamic landscape PDF issuers. Today, InternHub empowers students with verifiably secure foundations for the professional environment.
          </p>
        </div>
      </section>
    </>
  );
};

export default AboutPage;
