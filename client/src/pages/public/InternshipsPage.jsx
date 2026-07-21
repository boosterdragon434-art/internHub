import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  FiClock,
  FiBriefcase,
  FiArrowRight,
  FiSearch,
  FiFilter,
  FiCheckCircle,
  FiBookmark,
  FiChevronLeft,
  FiChevronRight,
  FiCpu,
  FiX,
} from 'react-icons/fi';
import { getInternshipsList } from '../../api/internshipApi';
import { formatDisplayAmount } from '../../utils/formatters';
import { useDebounce } from '../../hooks/useDebounce';
import EmptyState from '../../components/common/EmptyState';
import { InternshipSkeleton } from '../../components/ui/SkeletonCard';
import FilterSidebar from '../../components/common/FilterSidebar';
import InternshipDrawer from '../../components/common/InternshipDrawer';

const SAVED_KEY = 'internhub_saved_internships';

const MODE_BADGE_STYLES = {
  Remote: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  Hybrid: 'text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  Offline: 'text-sky-700 bg-sky-50 dark:bg-sky-900/30 dark:text-sky-400 border-sky-200 dark:border-sky-800',
};

const CATEGORY_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'Web Development', label: 'Web Dev' },
  { value: 'Mobile Development', label: 'Mobile' },
  { value: 'Data Science', label: 'Data Science' },
  { value: 'Machine Learning', label: 'ML' },
  { value: 'UI/UX Design', label: 'UI/UX' },
  { value: 'Cloud Computing', label: 'Cloud' },
  { value: 'Cybersecurity', label: 'Security' },
  { value: 'DevOps', label: 'DevOps' },
];

// NOTE: the Internship schema's `mode` enum is Remote / Hybrid / Offline —
// there is no "On-site" value server-side. The previous version sent the
// literal string "On-site" as the filter value, which could never match
// anything and silently returned zero results. Value stays 'Offline'; only
// the label shown to the user says "On-site".
const MODE_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'Remote', label: 'Remote' },
  { value: 'Hybrid', label: 'Hybrid' },
  { value: 'Offline', label: 'On-site' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'closing', label: 'Closing Soon' },
  { value: 'popular', label: 'Most Popular' },
];

const InternshipsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [mode, setMode] = useState(searchParams.get('mode') || '');
  const [sort, setSort] = useState('newest');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [savedIds, setSavedIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(SAVED_KEY) || '[]'));
    } catch {
      return new Set();
    }
  });

  const selectedId = searchParams.get('selected');
  const [selectedInternship, setSelectedInternship] = useState(null);

  const debouncedSearch = useDebounce(search, 350);

  // Sync filters to URL (shareable/bookmarkable search state)
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    if (mode) params.set('mode', mode);
    if (selectedId) params.set('selected', selectedId);
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, mode, selectedId]);

  // Reset to page 1 whenever the query itself changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, mode]);

  useEffect(() => {
    const fetchInternships = async () => {
      setLoading(true);
      try {
        const params = { page, limit: 12, status: 'active' };
        if (debouncedSearch) params.search = debouncedSearch;
        if (category) params.category = category;
        if (mode) params.mode = mode;

        const res = await getInternshipsList(params);
        if (res.success) {
          setInternships(res.data);
          // Fix: the API returns pagination.pages (confirmed against
          // ApiResponse.paginate on the server), not pagination.totalPages.
          // Reading the wrong key meant totalPages was always undefined and
          // pagination controls never rendered past page 1.
          setTotalPages(res.pagination?.pages || 1);
          setTotalResults(res.pagination?.total ?? res.data.length);
        }
      } catch (err) {
        console.error('Error fetching internships:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInternships();
  }, [debouncedSearch, category, mode, page]);

  useEffect(() => {
    if (selectedId && internships.length > 0) {
      const found = internships.find((i) => i._id === selectedId);
      if (found) {
        setSelectedInternship(found);
      } else {
        setSelectedInternship(null);
      }
    } else {
      setSelectedInternship(null);
    }
  }, [selectedId, internships]);

  const persistSaved = useCallback((next) => {
    setSavedIds(next);
    localStorage.setItem(SAVED_KEY, JSON.stringify([...next]));
  }, []);

  const toggleSaved = useCallback((e, id) => {
    e.preventDefault();
    e.stopPropagation();
    const next = new Set(savedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    persistSaved(next);
  }, [savedIds, persistSaved]);

  const handleClearAll = () => {
    setSearch('');
    setCategory('');
    setMode('');
  };

  const handleSelect = (internship) => {
    searchParams.set('selected', internship._id);
    setSearchParams(searchParams);
  };

  const handleCloseDrawer = () => {
    searchParams.delete('selected');
    setSearchParams(searchParams);
  };

  // Client-side sort of the current page. Scoped intentionally to the
  // fetched page rather than assuming unverified server-side sort support.
  const visibleInternships = useMemo(() => {
    let list = internships;
    if (showSavedOnly) list = list.filter((i) => savedIds.has(i._id));
    const sorted = [...list];
    if (sort === 'closing') {
      sorted.sort((a, b) => new Date(a.endDate || '2999-12-31') - new Date(b.endDate || '2999-12-31'));
    } else if (sort === 'popular') {
      sorted.sort((a, b) => {
        const ratioA = a.openings > 0 ? (a.filledPositions || 0) / a.openings : 0;
        const ratioB = b.openings > 0 ? (b.filledPositions || 0) / b.openings : 0;
        return ratioB - ratioA;
      });
    } else {
      sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
    return sorted;
  }, [internships, sort, showSavedOnly, savedIds]);

  const activeFilterCount = (category ? 1 : 0) + (mode ? 1 : 0);

  return (
    <>
      <Helmet>
        <title>Browse Internships — InternHub</title>
        <meta name="description" content="Discover active tech internship tracks. Filter by category, mode, and apply directly." />
      </Helmet>

      <div className="min-h-screen bg-slate-50 dark:bg-ink-950 font-body selection:bg-violet-200 selection:text-violet-900 dark:selection:bg-violet-500/30 dark:selection:text-violet-50 relative">
        <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-violet-50 to-slate-50 dark:from-violet-950/10 dark:to-ink-950 pointer-events-none" />

        {/* Header */}
        <div className="relative pt-24 pb-12 px-4 sm:px-6 z-10 border-b border-slate-200 dark:border-ink-800 bg-white/50 dark:bg-ink-900/40 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-ink-800 border border-slate-200 dark:border-ink-700 text-[10px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400 shadow-sm">
                <FiCheckCircle className="w-3 h-3" />
                Enrollment Open
              </div>
              <h1 className="text-4xl md:text-5xl font-heading font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                Find your next <span className="text-violet-600 dark:text-violet-400">career-defining</span> role.
              </h1>
              <p className="text-base text-slate-600 dark:text-slate-400 font-medium">
                Browse active tech tracks, filter by what matters to you, and apply in minutes.
              </p>
            </div>

            <div className="w-full md:w-96 relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search tracks, skills, or roles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-10 py-4 bg-white dark:bg-ink-900 border-2 border-slate-200 dark:border-ink-700 rounded-2xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all shadow-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label="Clear search"
                >
                  <FiX className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 relative z-10">
          <div className="flex flex-col lg:flex-row gap-8">
            <FilterSidebar
              category={category}
              onCategoryChange={setCategory}
              mode={mode}
              onModeChange={setMode}
              sort={sort}
              onSortChange={setSort}
              categoryOptions={CATEGORY_OPTIONS}
              modeOptions={MODE_OPTIONS}
              sortOptions={SORT_OPTIONS}
              onClearAll={handleClearAll}
              isMobileOpen={isMobileFilterOpen}
              onMobileToggle={() => setIsMobileFilterOpen((v) => !v)}
            />

            <div className="flex-1 min-w-0">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white">Available Tracks</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-tabular">
                    {loading ? 'Loading…' : `${totalResults} result${totalResults !== 1 ? 's' : ''} found`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSavedOnly((v) => !v)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                      showSavedOnly
                        ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                        : 'bg-white dark:bg-ink-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-ink-700 hover:border-violet-400'
                    }`}
                  >
                    <FiBookmark className={`h-3.5 w-3.5 ${showSavedOnly ? 'fill-current' : ''}`} />
                    Saved{savedIds.size > 0 ? ` (${savedIds.size})` : ''}
                  </button>
                  <button
                    onClick={() => setIsMobileFilterOpen(true)}
                    className="lg:hidden relative inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-ink-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-ink-700"
                  >
                    <FiFilter className="h-3.5 w-3.5" />
                    Filters
                    {activeFilterCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-400 text-ink-950 text-[9px] font-bold flex items-center justify-center">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((n) => <InternshipSkeleton key={n} />)}
                </div>
              ) : visibleInternships.length === 0 ? (
                <div className="bg-white dark:bg-ink-900 border border-slate-200 dark:border-ink-800 rounded-3xl p-12 text-center shadow-sm">
                  <EmptyState
                    icon={FiBriefcase}
                    title={showSavedOnly ? 'No saved tracks yet' : 'No tracks found'}
                    message={
                      showSavedOnly
                        ? 'Tap the bookmark icon on any track to save it for later.'
                        : "We couldn't find any internships matching your current filters. Try adjusting your search criteria."
                    }
                    action={
                      showSavedOnly
                        ? { label: 'Show All Tracks', onClick: () => setShowSavedOnly(false) }
                        : { label: 'Clear Filters', onClick: handleClearAll }
                    }
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-fr">
                  {visibleInternships.map((internship, idx) => {
                    const isSaved = savedIds.has(internship._id);
                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        key={internship._id}
                      >
                        <div
                          onClick={() => handleSelect(internship)}
                          className={`h-full bg-white dark:bg-ink-900 border rounded-3xl overflow-hidden cursor-pointer flex flex-col group transition-all duration-300 ${
                            selectedId === internship._id
                              ? 'border-violet-500 ring-4 ring-violet-500/10 shadow-lg'
                              : 'border-slate-200 dark:border-ink-800 shadow-sm hover:shadow-xl hover:shadow-violet-500/5 hover:border-violet-300 dark:hover:border-violet-500/40'
                          }`}
                        >
                          <div className="h-40 bg-slate-100 dark:bg-ink-950 relative overflow-hidden">
                            {internship.imageUrl ? (
                              <img src={internship.imageUrl} alt={internship.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-violet-50 to-amber-50 dark:from-ink-800 dark:to-ink-900 flex items-center justify-center">
                                <FiCpu className="h-10 w-10 text-violet-200 dark:text-ink-700" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                            <button
                              onClick={(e) => toggleSaved(e, internship._id)}
                              aria-label={isSaved ? 'Remove from saved' : 'Save for later'}
                              className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-colors ${
                                isSaved ? 'bg-amber-400 text-ink-950' : 'bg-white/80 dark:bg-ink-900/80 text-slate-600 dark:text-slate-300 hover:text-amber-500'
                              }`}
                            >
                              <FiBookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                            </button>

                            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                              <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border shadow-sm backdrop-blur-md ${MODE_BADGE_STYLES[internship.mode] || MODE_BADGE_STYLES.Offline}`}>
                                {internship.mode === 'Offline' ? 'On-site' : internship.mode}
                              </span>
                              <span className="text-white font-bold drop-shadow-md">
                                {formatDisplayAmount(internship.fees, 'Free')}
                              </span>
                            </div>
                          </div>

                          <div className="p-6 flex-1 flex flex-col">
                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                              {internship.category}
                            </span>
                            <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white mb-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors line-clamp-2">
                              {internship.title}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
                              {internship.shortDescription || internship.description}
                            </p>

                            {internship.skills?.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-4">
                                {internship.skills.slice(0, 3).map((skill) => (
                                  <span key={skill} className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-ink-800 text-slate-600 dark:text-slate-400">
                                    {skill}
                                  </span>
                                ))}
                                {internship.skills.length > 3 && (
                                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-ink-800 text-slate-400 dark:text-slate-500">
                                    +{internship.skills.length - 3}
                                  </span>
                                )}
                              </div>
                            )}

                            <div className="mt-auto pt-4 border-t border-slate-100 dark:border-ink-800 flex items-center justify-between text-sm">
                              <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                                View Track Details <FiArrowRight className="w-3.5 h-3.5" />
                              </span>
                              <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-ink-800 flex items-center justify-center text-violet-600 dark:text-violet-400 group-hover:bg-amber-400 group-hover:text-ink-950 transition-colors">
                                <FiArrowRight className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Pagination — bespoke, violet-themed, fixed to use the correct pages field */}
              {!loading && !showSavedOnly && totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-slate-500 dark:text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed hover:border-violet-400 transition-colors"
                    aria-label="Previous page"
                  >
                    <FiChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => totalPages <= 5 || p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce((acc, p, i, arr) => {
                      if (i > 0 && p - arr[i - 1] > 1) acc.push('ellipsis-' + p);
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p) =>
                      typeof p === 'string' ? (
                        <span key={p} className="w-9 h-9 flex items-center justify-center text-xs font-bold text-slate-400">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-9 h-9 rounded-xl text-sm font-bold transition-colors ${
                            page === p
                              ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/30'
                              : 'bg-white dark:bg-ink-900 border border-slate-200 dark:border-ink-700 text-slate-600 dark:text-slate-400 hover:border-violet-400'
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-slate-500 dark:text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed hover:border-violet-400 transition-colors"
                    aria-label="Next page"
                  >
                    <FiChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <InternshipDrawer internship={selectedInternship} isOpen={!!selectedId} onClose={handleCloseDrawer} />
    </>
  );
};

export default InternshipsPage;
