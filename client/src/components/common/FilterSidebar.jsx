import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiSliders } from 'react-icons/fi';

/**
 * FilterSidebar — Premium toggle-chip filter system.
 * Desktop: Sticky left sidebar (280px).
 * Mobile: Horizontal scrollable chip row at top.
 */
const FilterSidebar = ({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  mode,
  onModeChange,
  categoryOptions = [],
  modeOptions = [],
  onClearAll,
  isMobileOpen,
  onMobileToggle,
}) => {
  const hasFilters = category || mode || search;

  const ChipGroup = ({ label, options, value, onChange }) => (
    <div className="space-y-2.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(value === opt.value ? '' : opt.value)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all duration-200 select-none ${
              value === opt.value
                ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/20'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );

  // ── Mobile: Horizontal chip row ──
  const MobileFilters = () => (
    <div className="lg:hidden">
      {/* Toggle Button */}
      <button
        onClick={onMobileToggle}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3"
      >
        <FiSliders className="w-3.5 h-3.5" />
        Filters
        {hasFilters && (
          <span className="w-2 h-2 rounded-full bg-brand-600 ml-1" />
        )}
      </button>

      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-4 space-y-4">
              {/* Search */}
              <input
                type="text"
                placeholder="Search roles..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none focus:border-brand-500 transition-colors"
              />
              <ChipGroup label="Domain" options={categoryOptions} value={category} onChange={onCategoryChange} />
              <ChipGroup label="Mode" options={modeOptions} value={mode} onChange={onModeChange} />
              {hasFilters && (
                <button
                  onClick={onClearAll}
                  className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // ── Desktop: Sticky sidebar ──
  const DesktopSidebar = () => (
    <aside className="hidden lg:block w-[280px] shrink-0">
      <div className="sticky top-24 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
            <FiSliders className="w-3.5 h-3.5" />
            Filters
          </h3>
          {hasFilters && (
            <button
              onClick={onClearAll}
              className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 hover:underline"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Search */}
        <div>
          <input
            type="text"
            placeholder="Search roles, technologies..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-brand-500 transition-colors placeholder:text-slate-400"
          />
        </div>

        {/* Domain Chips */}
        <ChipGroup label="Domain" options={categoryOptions} value={category} onChange={onCategoryChange} />

        {/* Mode Chips */}
        <ChipGroup label="Work Mode" options={modeOptions} value={mode} onChange={onModeChange} />
      </div>
    </aside>
  );

  return (
    <>
      <MobileFilters />
      <DesktopSidebar />
    </>
  );
};

export default FilterSidebar;
