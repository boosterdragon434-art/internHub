import React from 'react';
import FloatingParticles from './effects/FloatingParticles';
import ConnectionLines from './effects/ConnectionLines';

/**
 * Premium hero background — 100% CSS animations for glow movement.
 * Zero Framer Motion instances = zero JS animation overhead.
 * All layers use transform/opacity only for compositor-thread rendering.
 */
const HeroBackground = ({ reducedMotion = false }) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* ── Base: animated gradient mesh (CSS keyframes) ── */}
      <div
        className={`absolute inset-0 ${reducedMotion ? '' : 'hero-gradient-mesh'}`}
        style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 25%, #fff7ed 50%, #f0f9ff 75%, #ffffff 100%)',
          backgroundSize: '400% 400%',
        }}
      />

      {/* ── Large radial blue glow (CSS animation, no JS) ── */}
      <div
        className={`absolute -top-[15%] -right-[10%] w-[55vw] h-[55vw] max-w-[800px] max-h-[800px] rounded-full ${reducedMotion ? '' : 'hero-glow-drift-1'}`}
        style={{
          background: 'radial-gradient(circle, rgba(37,99,235,0.10) 0%, rgba(37,99,235,0.03) 45%, transparent 70%)',
          filter: 'blur(40px)',
          willChange: reducedMotion ? 'auto' : 'transform',
        }}
      />

      {/* ── Large radial orange glow (CSS animation, no JS) ── */}
      <div
        className={`absolute -bottom-[10%] -left-[8%] w-[45vw] h-[45vw] max-w-[650px] max-h-[650px] rounded-full ${reducedMotion ? '' : 'hero-glow-drift-2'}`}
        style={{
          background: 'radial-gradient(circle, rgba(249,115,22,0.08) 0%, rgba(249,115,22,0.02) 45%, transparent 70%)',
          filter: 'blur(40px)',
          willChange: reducedMotion ? 'auto' : 'transform',
        }}
      />

      {/* ── White center illumination (static — no animation needed) ── */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[40vh] max-w-[900px] rounded-full"
        style={{
          background: 'radial-gradient(ellipse, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.15) 45%, transparent 70%)',
        }}
      />

      {/* ── Noise texture (static SVG, negligible perf cost) ── */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── Dot grid (static CSS) ── */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, #2563EB 0.5px, transparent 0.5px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* ── Floating particles (optimized Canvas) ── */}
      <FloatingParticles reducedMotion={reducedMotion} />

      {/* ── AI connection lines (CSS-only animation) ── */}
      <ConnectionLines reducedMotion={reducedMotion} />

      {/* ── Glass reflection (CSS pulse, no JS) ── */}
      <div
        className={`absolute top-0 left-0 w-full h-[35%] ${reducedMotion ? 'opacity-15' : 'hero-glass-reflection'}`}
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 100%)',
        }}
      />

      {/* ── Bottom fade ── */}
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white via-white/80 to-transparent" />
    </div>
  );
};

export default React.memo(HeroBackground);
