import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';

/**
 * Hero left-side content: badge, heading, subtitle, and CTAs.
 * Uses Cormorant Garamond for the main heading and Plus Jakarta Sans for body.
 */

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 70, damping: 15 },
  },
};

const HeroContent = ({ reducedMotion = false }) => {
  const motionProps = reducedMotion
    ? { initial: 'visible', animate: 'visible' }
    : { initial: 'hidden', animate: 'visible' };

  return (
    <motion.div
      variants={staggerContainer}
      {...motionProps}
      className="space-y-7 text-center lg:text-left"
    >
      {/* ── Small Tag / Badge ── */}
      <motion.div variants={fadeUp} className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/80 backdrop-blur-md border border-blue-100 shadow-sm shadow-blue-500/5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
        </span>
        <span className="text-xs font-semibold text-blue-700 tracking-wide font-hero-body">
          Modern Internship Management Platform
        </span>
      </motion.div>

      {/* ── Main Heading ── */}
      <motion.div variants={fadeUp}>
        <h1 className="text-5xl sm:text-6xl lg:text-[4.5rem] xl:text-[5rem] font-bold leading-[1.05] tracking-tight text-slate-900 font-hero-heading">
          Manage Every Internship
          <br />
          <span className="relative inline-block">
            With{' '}
            <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-orange-500 bg-clip-text text-transparent">
              Intelligence
            </span>
            {/* Decorative underline accent */}
            <svg
              className="absolute w-full h-3 -bottom-1 left-0"
              viewBox="0 0 200 12"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <motion.path
                d="M0 8 Q 50 0 100 6 Q 150 12 200 4"
                stroke="url(#hero-underline-grad)"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={reducedMotion ? { duration: 0 } : { delay: 0.8, duration: 1, ease: 'easeOut' }}
              />
              <defs>
                <linearGradient id="hero-underline-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#F97316" stopOpacity="0.5" />
                </linearGradient>
              </defs>
            </svg>
          </span>
        </h1>
      </motion.div>

      {/* ── Second Line ── */}
      <motion.h2
        variants={fadeUp}
        className="text-xl sm:text-2xl lg:text-[1.65rem] font-semibold text-slate-600 font-hero-body leading-relaxed"
      >
        Built for{' '}
        <span className="text-blue-600">Colleges</span>,{' '}
        <span className="text-orange-500">Companies</span>{' '}
        & <span className="text-slate-800">Students</span>
      </motion.h2>

      {/* ── Subtitle / Description ── */}
      <motion.p
        variants={fadeUp}
        className="text-base sm:text-lg text-slate-500 leading-relaxed max-w-xl mx-auto lg:mx-0 font-hero-body"
      >
        Streamline onboarding, attendance, intern approvals, mentor management,
        evaluations, certificates, placements, analytics and communication
        from one intelligent platform.
      </motion.p>

      {/* ── CTA Buttons ── */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col sm:flex-row items-center gap-4 pt-2 justify-center lg:justify-start"
      >
        {/* Primary CTA — Get Started */}
        <Link
          to="/register"
          className="group w-full sm:w-auto relative inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-base font-bold rounded-2xl shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 overflow-hidden font-hero-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          aria-label="Get started with InternHub"
        >
          {/* Shine sweep on hover */}
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" aria-hidden="true" />
          <span className="relative z-10 flex items-center gap-2.5">
            Get Started
            <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </Link>

        {/* Secondary CTA — View Dashboard */}
        <Link
          to="/login"
          className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-white/80 hover:bg-white backdrop-blur-md text-slate-700 border border-slate-200 hover:border-blue-200 text-base font-bold rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 font-hero-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          aria-label="View the InternHub dashboard"
        >
          <Play className="w-4 h-4 text-blue-600" />
          View Dashboard
        </Link>
      </motion.div>

      {/* ── Trust signals ── */}
      <motion.div
        variants={fadeUp}
        className="flex items-center gap-6 pt-4 justify-center lg:justify-start"
      >
        {[
          { label: 'Free to Start', icon: '✦' },
          { label: 'No Credit Card', icon: '✦' },
          { label: 'Setup in 5 mins', icon: '✦' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span className="text-blue-500 text-xs" aria-hidden="true">{item.icon}</span>
            <span className="text-xs text-slate-400 font-medium font-hero-body">{item.label}</span>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default React.memo(HeroContent);
