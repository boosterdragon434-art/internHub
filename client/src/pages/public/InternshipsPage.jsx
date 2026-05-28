import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiBriefcase,
  FiMapPin,
  FiClock,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiCompass,
  FiDollarSign,
  FiActivity,
} from 'react-icons/fi';
import { getInternshipsList } from '../../api/internshipApi';
import { formatDisplayAmount } from '../../utils/formatters';
import { useDebounce } from '../../hooks/useDebounce';
import EmptyState from '../../components/common/EmptyState';
import { InternshipSkeleton } from '../../components/ui/SkeletonCard';

const InternshipsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [mode, setMode] = useState(searchParams.get('mode') || '');

  const debouncedSearch = useDebounce(search, 300);
  const categoryScrollRef = useRef(null);

  const categoryOptions = [
    { value: '', label: 'All Fields' },
    { value: 'Web Development', label: 'Web Development' },
    { value: 'Mobile Development', label: 'Mobile Development' },
    { value: 'Data Science', label: 'Data Science' },
    { value: 'Machine Learning', label: 'Machine Learning' },
    { value: 'UI/UX Design', label: 'UI/UX Design' },
    { value: 'Cloud Computing', label: 'Cloud Computing' },
    { value: 'Cybersecurity', label: 'Cybersecurity' },
    { value: 'DevOps', label: 'DevOps' },
  ];

  const modeOptions = [
    { value: '', label: 'All Modes' },
    { value: 'Remote', label: 'Remote Only' },
    { value: 'Hybrid', label: 'Hybrid' },
    { value: 'Offline', label: 'In-Office' },
  ];

  useEffect(() => {
    const fetchInternships = async () => {
      setLoading(true);
      try {
        const params = {
          page: pagination.page,
          limit: 9,
          status: 'active',
        };
        if (debouncedSearch) params.search = debouncedSearch;
        if (category) params.category = category;
        if (mode) params.mode = mode;

        const res = await getInternshipsList(params);
        if (res.success) {
          setInternships(res.data);
          if (res.pagination) {
            setPagination((prev) => ({ ...prev, totalPages: res.pagination.totalPages }));
          }
        }
      } catch (err) {
        console.error('Error fetching internships:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInternships();
  }, [debouncedSearch, category, mode, pagination.page]);

  const handlePageChange = (page) => {
    setPagination((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollCategories = (direction) => {
    if (categoryScrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      categoryScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Maps category to premium color borders
  const getCategoryGradient = (cat) => {
    switch (cat) {
      case 'Web Development': return 'from-violet-600 to-indigo-600';
      case 'Mobile Development': return 'from-blue-600 to-indigo-500';
      case 'Data Science': return 'from-emerald-600 to-teal-500';
      case 'Machine Learning': return 'from-amber-600 to-orange-500';
      case 'UI/UX Design': return 'from-rose-600 to-pink-500';
      default: return 'from-slate-400 to-slate-550';
    }
  };

  const getModeStyles = (m) => {
    switch (m) {
      case 'Remote': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'Hybrid': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      default: return 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20';
    }
  };

  return (
    <>
      <Helmet>
        <title>Discover Programs & Internships — InternHub</title>
        <meta name="description" content="Browse professional student internships. Filter remote, hybrid, or physical roles across development, ML engineering, design, and cybersecurity." />
      </Helmet>

      {/* Floating lights */}
      <div className="absolute inset-x-0 top-0 h-[400px] overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-36 left-1/3 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[120px]" />
        <div className="absolute top-20 right-1/4 w-[450px] h-[450px] bg-indigo-600/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 space-y-8 select-none">
        
        {/* Header Title Section */}
        <div className="text-left space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-950/20 border border-violet-100/40 dark:border-violet-900/30 text-[9px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
            <FiCompass className="w-3.5 h-3.5" /> Program Catalog
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-50">
            Browse Internships
          </h1>
          <p className="text-xs text-slate-505 dark:text-slate-400">
            Apply to professional development cohorts led by organization guides.
          </p>
        </div>

        {/* ========== NEXT-GEN FILTER SYSTEM ========== */}
        <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/70 backdrop-blur-xl space-y-4 shadow-md">
          
          {/* Main Search Input & Dropdowns */}
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input bar */}
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by keywords, title, technology stack..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-violet-500 rounded-xl text-slate-800 dark:text-slate-200 outline-none transition-all duration-200"
              />
            </div>
            {/* Mode Select */}
            <div className="w-full md:w-56 shrink-0">
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-violet-500 rounded-xl text-slate-700 dark:text-slate-350 outline-none cursor-pointer transition-all duration-200"
              >
                {modeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Swipe-friendly Horizontal Category Selector */}
          <div className="relative flex items-center pt-2 border-t border-slate-100 dark:border-slate-850/80">
            <button
              onClick={() => scrollCategories('left')}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-500 shrink-0 mr-1"
            >
              <FiChevronLeft className="w-4 h-4" />
            </button>
            <div
              ref={categoryScrollRef}
              className="flex-1 overflow-x-auto flex gap-2 no-scrollbar scroll-smooth whitespace-nowrap select-none py-1"
            >
              {categoryOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setCategory(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-200 shrink-0 ${
                    category === opt.value
                      ? 'bg-violet-650 text-white shadow shadow-violet-650/15'
                      : 'bg-slate-100/80 dark:bg-slate-900 text-slate-550 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => scrollCategories('right')}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-500 shrink-0 ml-1"
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ========== RESULTS BOARD ========== */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <InternshipSkeleton key={idx} />
            ))}
          </div>
        ) : internships.length === 0 ? (
          <EmptyState
            title="No cohorts active"
            description="We couldn't find matching opportunities. Clear parameters to refresh."
            icon={FiBriefcase}
            actionText="Reset All Filters"
            onActionClick={() => {
              setSearch('');
              setCategory('');
              setMode('');
            }}
          />
        ) : (
          <div className="space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {internships.map((internship, idx) => (
                <motion.div
                  key={internship._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="h-full"
                >
                  <Link
                    to={`/internships/${internship._id}`}
                    className="block bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-violet-200 dark:hover:border-violet-900 transition-all duration-300 group h-full flex flex-col"
                  >
                    {/* Visual Card Header */}
                    <div className="h-40 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-950 flex items-center justify-center overflow-hidden relative">
                      {/* Gradient Category Top Border */}
                      <span className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${getCategoryGradient(internship.category)}`} />
                      
                      {internship.imageUrl ? (
                        <img src={internship.imageUrl} alt={internship.title} className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500" />
                      ) : (
                        <FiBriefcase className="h-10 w-10 text-slate-350 dark:text-slate-700" />
                      )}
                      
                      {/* Mode Badge with Glow */}
                      <span className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${getModeStyles(internship.mode)}`}>
                        {internship.mode}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 flex flex-col flex-1 text-left justify-between space-y-4">
                      <div className="space-y-1.5">
                        <span className="inline-block text-[9px] font-extrabold px-2.5 py-0.5 rounded bg-violet-50 dark:bg-violet-950/45 text-violet-700 dark:text-violet-400 border border-violet-100/50 dark:border-violet-900/35 uppercase">
                          {internship.category}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50 group-hover:text-violet-650 dark:group-hover:text-violet-400 transition-colors line-clamp-1">
                          {internship.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed flex-1">
                          {internship.shortDescription || internship.description}
                        </p>
                      </div>

                      {/* Card Footer Detail Grid */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-auto">
                        <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400">
                          <span className="flex items-center gap-1"><FiClock className="h-3 w-3" /> {internship.duration}</span>
                          <span className="text-slate-300">|</span>
                          <span className="flex items-center gap-1"><FiMapPin className="h-3 w-3" /> {internship.mode}</span>
                        </div>
                        <span className="text-xs font-black text-violet-650 dark:text-violet-400">
                          {formatDisplayAmount(internship.fees, 'Free')}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center pt-4">
                <nav className="flex items-center gap-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-3 py-1.5 rounded-full shadow-sm">
                  <button
                    onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                    disabled={pagination.page === 1}
                    className="p-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 disabled:opacity-30 transition"
                  >
                    <FiChevronLeft size={14} />
                  </button>
                  {Array.from({ length: pagination.totalPages }).map((_, idx) => {
                    const pg = idx + 1;
                    return (
                      <button
                        key={pg}
                        onClick={() => handlePageChange(pg)}
                        className={`w-7 h-7 rounded-full text-xs font-bold transition ${
                          pagination.page === pg
                            ? 'bg-violet-600 text-white shadow-sm'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-650 dark:text-slate-400'
                        }`}
                      >
                        {pg}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.page + 1))}
                    disabled={pagination.page === pagination.totalPages}
                    className="p-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 disabled:opacity-30 transition"
                  >
                    <FiChevronRight size={14} />
                  </button>
                </nav>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default InternshipsPage;
