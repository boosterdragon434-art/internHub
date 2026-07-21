import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCountUp } from 'react-countup';
import { useInView } from 'react-intersection-observer';
import { GraduationCap, Building, Award, TrendingUp } from 'lucide-react';

/**
 * Animated statistics bar with CountUp numbers.
 * Triggers counting animation when scrolled into view.
 */
const STATS = [
  {
    icon: GraduationCap,
    value: 250,
    suffix: '+',
    label: 'Students',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-500',
  },
  {
    icon: Building,
    value: 99,
    suffix: '%',
    label: 'Satisfaction',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    iconColor: 'text-orange-500',
  },
  {
    icon: Award,
    value: 250,
    suffix: '+',
    label: 'Certificates',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-500',
  },
  {
    icon: TrendingUp,
    value: 98,
    suffix: '%',
    label: 'Completion Rate',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    iconColor: 'text-orange-500',
  },
];

const StatItem = ({ stat, index, inView, reducedMotion }) => {
  const Icon = stat.icon;
  const countUpRef = useRef(null);

  const { start } = useCountUp({
    ref: countUpRef,
    start: 0,
    end: stat.value,
    duration: 2.5,
    separator: ',',
    suffix: stat.suffix,
    startOnMount: false,
  });

  useEffect(() => {
    if (inView) {
      start();
    }
  }, [inView, start]);

  return (
    <motion.div
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={reducedMotion ? {} : { delay: 0.1 + index * 0.1, duration: 0.5, type: 'spring' }}
      className="flex flex-col items-center gap-2 px-4 sm:px-6 py-4"
    >
      <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center mb-1`}>
        <Icon className={`w-5 h-5 ${stat.iconColor}`} />
      </div>
      <div className={`text-2xl sm:text-3xl font-bold ${stat.color} font-hero-heading tabular-nums`}>
        <span ref={countUpRef}>0{stat.suffix}</span>
      </div>
      <span className="text-xs sm:text-sm text-slate-500 font-medium font-hero-body">
        {stat.label}
      </span>
    </motion.div>
  );
};

const HeroStats = ({ reducedMotion = false }) => {
  const { ref, inView } = useInView({
    threshold: 0.3,
    triggerOnce: true,
  });

  return (
    <motion.div
      ref={ref}
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={reducedMotion ? {} : { duration: 0.6, type: 'spring', stiffness: 60 }}
      className="relative mt-16 sm:mt-20 mx-auto max-w-4xl"
    >
      {/* Glassmorphic container */}
      <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl sm:rounded-3xl shadow-lg shadow-slate-200/30 overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100/60">
          {STATS.map((stat, index) => (
            <StatItem
              key={stat.label}
              stat={stat}
              index={index}
              inView={inView}
              reducedMotion={reducedMotion}
            />
          ))}
        </div>
      </div>

      {/* Subtle ambient glow under stats */}
      <div
        className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 rounded-full pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, rgba(37, 99, 235, 0.06), rgba(249, 115, 22, 0.06))',
          filter: 'blur(20px)',
        }}
        aria-hidden="true"
      />
    </motion.div>
  );
};

export default React.memo(HeroStats);
