import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiSliders, FiRotateCcw } from 'react-icons/fi';

/**
 * Shared filter panel for Browse Internships (category / mode / sort).
 *
 * Fix: the previous version destructured onCategoryChange/onModeChange
 * internally but InternshipsPage only ever passed setCategory/setMode —
 * so every chip click threw "onChange is not a function". This version
 * accepts either naming (onXChange preferred, setX as a fallback) so it
 * can't silently break again if some other caller still uses the old
 * names, while InternshipsPage itself now uses the canonical names.
 *
 * The redundant internal search box (a second, uncontrolled search input
 * duplicating the one in the page header) has been removed — search now
 * lives in exactly one place.
 */
const ChipGroup = ({ label, options, value, onChange }) => (
  <div className="mb-7 last:mb-0">
    <h4 className="text-[10px] font-mono font-semibold text-violet-600/80 dark:text-violet-400/70 uppercase tracking-widest mb-3">
      {label}
    </h4>
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 ${
              active
                ? 'bg-violet-600 text-white border-violet-600 shadow-sm shadow-violet-500/30'
                : 'bg-white dark:bg-ink-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-ink-700 hover:border-violet-400 dark:hover:border-violet-500/50 hover:text-violet-700 dark:hover:text-violet-300'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  </div>
);

const FilterContent = ({
  category,
  onCategoryChange,
  mode,
  onModeChange,
  sort,
  onSortChange,
  categoryOptions,
  modeOptions,
  sortOptions,
  onClearAll,
  activeFilterCount,
}) => (
  <div>
    <ChipGroup label="Category" options={categoryOptions} value={category} onChange={onCategoryChange} />
    <div className="h-px bg-slate-100 dark:bg-ink-800 my-1 mb-6" />
    <ChipGroup label="Work Mode" options={modeOptions} value={mode} onChange={onModeChange} />
    {sortOptions?.length > 0 && (
      <>
        <div className="h-px bg-slate-100 dark:bg-ink-800 my-1 mb-6" />
        <ChipGroup label="Sort By" options={sortOptions} value={sort} onChange={onSortChange} />
      </>
    )}
    {activeFilterCount > 0 && (
      <button
        type="button"
        onClick={onClearAll}
        className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 transition-colors"
      >
        <FiRotateCcw className="h-3.5 w-3.5" />
        Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
      </button>
    )}
  </div>
);

const FilterSidebar = ({
  category,
  onCategoryChange,
  setCategory, // legacy fallback
  mode,
  onModeChange,
  setMode, // legacy fallback
  sort,
  onSortChange,
  categoryOptions = [],
  modeOptions = [],
  sortOptions = [],
  onClearAll,
  isMobileOpen,
  onMobileToggle,
}) => {
  const handleCategoryChange = onCategoryChange || setCategory || (() => {});
  const handleModeChange = onModeChange || setMode || (() => {});

  const activeFilterCount =
    (category && category !== 'all' ? 1 : 0) + (mode && mode !== 'all' ? 1 : 0);

  const contentProps = {
    category,
    onCategoryChange: handleCategoryChange,
    mode,
    onModeChange: handleModeChange,
    sort,
    onSortChange,
    categoryOptions,
    modeOptions,
    sortOptions,
    onClearAll,
    activeFilterCount,
  };

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:block w-72 shrink-0">
        <div className="sticky top-24 bg-white dark:bg-ink-900 rounded-2xl border border-slate-200 dark:border-ink-800 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <FiSliders className="h-4 w-4 text-violet-500" />
            <h3 className="text-sm font-heading font-bold text-slate-900 dark:text-white">Refine Results</h3>
          </div>
          <FilterContent {...contentProps} />
        </div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={onMobileToggle}
              aria-hidden="true"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 w-[85%] max-w-xs bg-white dark:bg-ink-950 z-50 lg:hidden overflow-y-auto"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-ink-800 sticky top-0 bg-white dark:bg-ink-950">
                <div className="flex items-center gap-2">
                  <FiSliders className="h-4 w-4 text-violet-500" />
                  <h3 className="text-sm font-heading font-bold text-slate-900 dark:text-white">Refine Results</h3>
                </div>
                <button
                  onClick={onMobileToggle}
                  className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-ink-900 transition-colors"
                  aria-label="Close filters"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>
              <div className="p-5">
                <FilterContent {...contentProps} />
              </div>
              <div className="p-5 pt-0 sticky bottom-0 bg-white dark:bg-ink-950">
                <button
                  onClick={onMobileToggle}
                  className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors"
                >
                  Show Results
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default FilterSidebar;
