import React from 'react';

/**
 * Reusable animated skeleton loading card.
 * Resembles the structure of an internship listing card.
 */
export const InternshipSkeleton = () => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Image Skeleton */}
      <div className="w-full h-44 rounded-xl bg-slate-200 dark:bg-slate-800 animate-shimmer" />

      {/* Header Info */}
      <div className="space-y-2">
        <div className="w-1/3 h-4 rounded bg-slate-200 dark:bg-slate-800 animate-shimmer" />
        <div className="w-3/4 h-6 rounded-md bg-slate-200 dark:bg-slate-800 animate-shimmer" />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <div className="w-full h-3 rounded bg-slate-200 dark:bg-slate-800 animate-shimmer" />
        <div className="w-full h-3 rounded bg-slate-200 dark:bg-slate-800 animate-shimmer" />
        <div className="w-5/6 h-3 rounded bg-slate-200 dark:bg-slate-800 animate-shimmer" />
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-850 pt-4 mt-2">
        <div className="w-1/4 h-4 rounded bg-slate-200 dark:bg-slate-800 animate-shimmer" />
        <div className="w-1/3 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 animate-shimmer" />
      </div>
    </div>
  );
};

/**
 * Skeleton loader representing a dashboard grid or list item.
 */
export const DashboardSkeleton = () => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="h-28 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex items-center justify-between">
            <div className="space-y-2 w-2/3">
              <div className="w-1/2 h-3 rounded bg-slate-200 dark:bg-slate-800 animate-shimmer" />
              <div className="w-3/4 h-6 rounded bg-slate-200 dark:bg-slate-800 animate-shimmer" />
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 animate-shimmer" />
          </div>
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 animate-shimmer" />
    </div>
  );
};

export default InternshipSkeleton;
