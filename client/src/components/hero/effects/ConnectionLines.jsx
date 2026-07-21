import React from 'react';

/**
 * Pure CSS/SVG connection lines — zero JavaScript animation overhead.
 * Uses CSS keyframes instead of Framer Motion for each line/node,
 * eliminating ~20 concurrent JS animation loops.
 */
const ConnectionLines = ({ reducedMotion = false }) => {
  if (reducedMotion) return null;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none hero-connection-lines"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ zIndex: 1 }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="lcg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#F97316" stopOpacity="0.10" />
        </linearGradient>
      </defs>

      {/* Connection lines — CSS animated dash offset */}
      <line x1="10%" y1="20%" x2="40%" y2="15%" stroke="url(#lcg)" strokeWidth="0.12" strokeDasharray="2 3" className="hero-net-line" style={{ animationDelay: '0s' }} />
      <line x1="40%" y1="15%" x2="70%" y2="30%" stroke="url(#lcg)" strokeWidth="0.12" strokeDasharray="2 3" className="hero-net-line" style={{ animationDelay: '1s' }} />
      <line x1="25%" y1="65%" x2="55%" y2="75%" stroke="url(#lcg)" strokeWidth="0.12" strokeDasharray="2 3" className="hero-net-line" style={{ animationDelay: '2s' }} />
      <line x1="70%" y1="30%" x2="85%" y2="60%" stroke="url(#lcg)" strokeWidth="0.12" strokeDasharray="2 3" className="hero-net-line" style={{ animationDelay: '0.5s' }} />
      <line x1="35%" y1="50%" x2="60%" y2="45%" stroke="url(#lcg)" strokeWidth="0.12" strokeDasharray="2 3" className="hero-net-line" style={{ animationDelay: '1.5s' }} />
      <line x1="10%" y1="20%" x2="25%" y2="65%" stroke="url(#lcg)" strokeWidth="0.12" strokeDasharray="2 3" className="hero-net-line" style={{ animationDelay: '3s' }} />
      <line x1="60%" y1="45%" x2="90%" y2="15%" stroke="url(#lcg)" strokeWidth="0.12" strokeDasharray="2 3" className="hero-net-line" style={{ animationDelay: '2.5s' }} />
      <line x1="55%" y1="75%" x2="15%" y2="85%" stroke="url(#lcg)" strokeWidth="0.12" strokeDasharray="2 3" className="hero-net-line" style={{ animationDelay: '1.8s' }} />

      {/* Node dots — CSS pulsing */}
      {[
        { cx: 10, cy: 20, c: '#2563EB' }, { cx: 25, cy: 65, c: '#F97316' },
        { cx: 40, cy: 15, c: '#2563EB' }, { cx: 55, cy: 75, c: '#2563EB' },
        { cx: 70, cy: 30, c: '#F97316' }, { cx: 85, cy: 60, c: '#2563EB' },
        { cx: 15, cy: 85, c: '#F97316' }, { cx: 60, cy: 45, c: '#2563EB' },
        { cx: 90, cy: 15, c: '#2563EB' }, { cx: 35, cy: 50, c: '#F97316' },
      ].map((n, i) => (
        <circle
          key={i}
          cx={`${n.cx}%`} cy={`${n.cy}%`} r="0.35"
          fill={n.c}
          className="hero-net-dot"
          style={{ animationDelay: `${i * 0.4}s` }}
        />
      ))}
    </svg>
  );
};

export default React.memo(ConnectionLines);
