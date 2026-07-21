import React, { useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

import { MouseTracker } from './effects/MouseTracker';
import HeroBackground from './HeroBackground';
import HeroContent from './HeroContent';
import HeroDashboard from './HeroDashboard';
import HeroStats from './HeroStats';

/**
 * HeroSection — Main orchestrator for the premium InternHub hero.
 *
 * Architecture:
 * ┌─────────────────────────────────────────────────┐
 * │  HeroBackground (absolute, behind everything)   │
 * │  ┌──────────────────┬──────────────────────────┐ │
 * │  │   HeroContent    │    HeroDashboard         │ │
 * │  │   (left side)    │    (right side)          │ │
 * │  └──────────────────┴──────────────────────────┘ │
 * │  ┌──────────────────────────────────────────────┐ │
 * │  │             HeroStats (bottom)               │ │
 * │  └──────────────────────────────────────────────┘ │
 * └─────────────────────────────────────────────────┘
 *
 * MouseTracker context wraps the entire section for parallax effects.
 * prefers-reduced-motion is detected and propagated to all children.
 */
const HeroSection = () => {
  const containerRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      ref={containerRef}
      className="hero-section relative pt-24 pb-16 sm:pt-28 sm:pb-20 lg:pt-32 lg:pb-24 z-10 overflow-hidden"
      aria-label="InternHub hero section"
    >
      <MouseTracker containerRef={containerRef}>
        {/* ── Animated Background ── */}
        <HeroBackground reducedMotion={prefersReducedMotion} />

        {/* ── Main Content Grid ── */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Content */}
            <HeroContent reducedMotion={prefersReducedMotion} />

            {/* Right: Dashboard Illustration */}
            <HeroDashboard reducedMotion={prefersReducedMotion} />
          </div>

          {/* ── Floating Stats ── */}
          <HeroStats reducedMotion={prefersReducedMotion} />
        </div>
      </MouseTracker>
    </section>
  );
};

export default HeroSection;
