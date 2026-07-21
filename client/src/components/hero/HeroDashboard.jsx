import React from 'react';
import { motion } from 'framer-motion';

// Card imports
import StudentCard from './cards/StudentCard';
import CompanyCard from './cards/CompanyCard';
import AttendanceCard from './cards/AttendanceCard';
import CertificateCard from './cards/CertificateCard';
import AIAssistantCard from './cards/AIAssistantCard';
import AnalyticsCard from './cards/AnalyticsCard';
import CalendarCard from './cards/CalendarCard';
import TasksCard from './cards/TasksCard';

/**
 * Right-side hero illustration: layered glassmorphic dashboard.
 *
 * Performance optimizations:
 * - 3D tilt reads CSS custom properties (--mouse-nx, --mouse-ny) set by
 *   MouseTracker — zero React re-renders on mouse move.
 * - Floating card bob uses CSS keyframes, not Framer Motion loops.
 * - Only entrance animations use Framer Motion (runs once, then stops).
 */
const HeroDashboard = ({ reducedMotion = false }) => {
  return (
    <motion.div
      className="relative w-full max-w-lg xl:max-w-xl mx-auto lg:mx-0"
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.92, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={reducedMotion ? { duration: 0 } : { delay: 0.3, duration: 0.7, type: 'spring', stiffness: 60, damping: 15 }}
      style={{ perspective: '1200px' }}
    >
      {/* Ambient glow (static, no animation) */}
      <div
        className="absolute -inset-8 rounded-[3rem] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 40% 50%, rgba(37,99,235,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(249,115,22,0.04) 0%, transparent 50%)',
          filter: 'blur(25px)',
        }}
        aria-hidden="true"
      />

      {/* 3D tilting container — reads CSS vars from MouseTracker, zero re-renders */}
      <div
        className="relative hero-dashboard-tilt"
        style={{
          transformStyle: 'preserve-3d',
          /* Tilt via CSS custom properties set by MouseTracker */
          transform: reducedMotion
            ? 'rotateX(0deg) rotateY(0deg)'
            : 'rotateX(calc(var(--mouse-ny, 0) * -3deg)) rotateY(calc(var(--mouse-nx, 0) * 3deg))',
          transition: 'transform 0.15s ease-out',
          willChange: 'transform',
        }}
      >
        {/* ── Main Dashboard Shell ── */}
        <div className="relative bg-white/45 backdrop-blur-2xl border border-white/50 rounded-[1.75rem] p-4 sm:p-5 shadow-2xl shadow-slate-200/40">
          {/* Dashboard top bar */}
          <div className="flex items-center gap-2 mb-3 sm:mb-4 pb-2.5 sm:pb-3 border-b border-slate-100/60">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
            <div className="flex-1 mx-2 sm:mx-3">
              <div className="h-5 bg-slate-100/80 rounded-lg flex items-center px-3">
                <span className="text-[10px] text-slate-400 font-hero-body truncate">internhub.app/dashboard</span>
              </div>
            </div>
          </div>

          {/* ── Cards Grid ── */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <StudentCard delay={0.5} reducedMotion={reducedMotion} />
            <CompanyCard delay={0.6} reducedMotion={reducedMotion} />

            <div className="col-span-2">
              <AnalyticsCard delay={0.7} reducedMotion={reducedMotion} />
            </div>

            <AttendanceCard delay={0.8} reducedMotion={reducedMotion} />
            <AIAssistantCard delay={0.9} reducedMotion={reducedMotion} />

            <CertificateCard delay={1.0} reducedMotion={reducedMotion} />
            <CalendarCard delay={1.1} reducedMotion={reducedMotion} />
          </div>
        </div>

        {/* ── Floating Tasks Card (CSS bob animation) ── */}
        <div
          className={`absolute -bottom-3 -right-3 sm:-right-5 w-40 sm:w-44 z-10 ${reducedMotion ? '' : 'hero-float-bob'}`}
          style={{ transform: 'translateZ(30px)' }}
        >
          <TasksCard delay={1.2} reducedMotion={reducedMotion} />
        </div>

        {/* Decorative dots (CSS animation) */}
        <div
          className={`absolute -top-2.5 -left-2.5 w-5 h-5 rounded-full bg-blue-500/15 border border-blue-300/25 backdrop-blur-sm ${reducedMotion ? '' : 'hero-float-bob'}`}
          aria-hidden="true"
        />
        <div
          className={`absolute top-1/3 -right-2.5 w-3.5 h-3.5 rounded-full bg-orange-500/20 border border-orange-300/25 backdrop-blur-sm ${reducedMotion ? '' : 'hero-float-bob-reverse'}`}
          aria-hidden="true"
        />
      </div>
    </motion.div>
  );
};

export default React.memo(HeroDashboard);
