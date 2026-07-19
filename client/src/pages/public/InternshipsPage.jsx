import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock, FiMapPin, FiBriefcase, FiArrowRight, FiSearch, FiFilter, FiX, FiCheckCircle } from 'react-icons/fi';
import { getInternshipsList } from '../../api/internshipApi';
import { formatDisplayAmount } from '../../utils/formatters';
import { useDebounce } from '../../hooks/useDebounce';
import EmptyState from '../../components/common/EmptyState';
import { InternshipSkeleton } from '../../components/ui/SkeletonCard';
import FilterSidebar from '../../components/common/FilterSidebar';
import InternshipDrawer from '../../components/common/InternshipDrawer';

const InternshipsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  // Filters state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [mode, setMode] = useState(searchParams.get('mode') || '');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Drawer state
  const selectedId = searchParams.get('selected');
  const [selectedInternship, setSelectedInternship] = useState(null);

  const debouncedSearch = useDebounce(search, 300);

  const categoryOptions = [
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
    { value: 'Remote', label: 'Remote' },
    { value: 'Hybrid', label: 'Hybrid' },
    { value: 'On-site', label: 'On-site' },
  ];

  // Sync state to URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    if (mode) params.set('mode', mode);
    if (selectedId) params.set('selected', selectedId);
    setSearchParams(params, { replace: true });
  }, [search, category, mode, selectedId, setSearchParams]);

  // Fetch Internships
  useEffect(() => {
    const fetchInternships = async () => {
      setLoading(true);
      try {
        const params = {
          page: pagination.page,
          limit: 12,
          status: 'active',
        };
        if (debouncedSearch) params.search = debouncedSearch;
        if (category) params.category = category;
        if (mode) params.mode = mode;

        const res = await getInternshipsList(params);
        if (res.success) {
          setInternships(res.data);
          setPagination((prev) => ({ ...prev, totalPages: res.pagination?.totalPages || 1 }));
        }
      } catch (err) {
        console.error('Error fetching internships:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInternships();
  }, [debouncedSearch, category, mode, pagination.page]);

  // Sync selected internship with drawer
  useEffect(() => {
    if (selectedId && internships.length > 0) {
      const found = internships.find((i) => i._id === selectedId);
      if (found) {
        setSelectedInternship(found);
      } else {
        setSelectedInternship(null);
        searchParams.delete('selected');
        setSearchParams(searchParams, { replace: true });
      }
    } else {
      setSelectedInternship(null);
    }
  }, [selectedId, internships, searchParams, setSearchParams]);

  const handleClearAll = () => {
    setSearch('');
    setCategory('');
    setMode('');
  };

  const handleRowClick = (internship) => {
    searchParams.set('selected', internship._id);
    setSearchParams(searchParams);
  };

  const handleCloseDrawer = () => {
    searchParams.delete('selected');
    setSearchParams(searchParams);
  };

  const getModeStyles = (m) => {
    switch (m) {
      case 'Remote': return 'text-primary-700 bg-primary-50 dark:bg-primary-900/30 dark:text-primary-400 border-primary-200 dark:border-primary-800';
      case 'Hybrid': return 'text-accent-700 bg-accent-50 dark:bg-accent-900/30 dark:text-accent-400 border-accent-200 dark:border-accent-800';
      default: return 'text-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800';
    }
  };

  return (
    <>
      <Helmet>
        <title>Browse Tracks — InternHub</title>
        <meta name="description" content="Discover premium tech internships and launch your career." />
      </Helmet>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-primary-200 selection:text-primary-900 dark:selection:bg-primary-900/50 dark:selection:text-primary-50 relative">
        
        {/* Background Gradients */}
        <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-primary-50 to-slate-50 dark:from-primary-950/20 dark:to-slate-950 pointer-events-none" />
        
        {/* Modern Header */}
        <div className="relative pt-24 pb-16 px-6 z-10 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400 shadow-sm">
                <FiCheckCircle className="w-3 h-3" />
                Enrollment Open
              </div>
              <h1 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                Discover your next <span className="text-primary-600 dark:text-primary-400">career-defining</span> role.
              </h1>
              <p className="text-base text-slate-600 dark:text-slate-400 font-medium">
                Browse our curated selection of high-velocity tech tracks. Find the perfect fit and start your sprint.
              </p>
            </div>
            
            {/* Search Bar - Prominent */}
            <div className="w-full md:w-96 relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search tracks, skills, or roles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-4 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Filter Sidebar (Desktop) */}
            <div className="hidden lg:block w-72 shrink-0">
              <div className="sticky top-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                    <FiFilter className="text-primary-500" /> Filters
                  </h3>
                  {(search || category || mode) && (
                    <button
                      onClick={handleClearAll}
                      className="text-xs font-bold text-accent-500 hover:text-accent-600 transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                
                <FilterSidebar
                  category={category}
                  setCategory={setCategory}
                  mode={mode}
                  setMode={setMode}
                  categoryOptions={categoryOptions}
                  modeOptions={modeOptions}
                />
              </div>
            </div>

            {/* Mobile Filter Toggle */}
            <div className="lg:hidden flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="font-bold text-sm text-slate-900 dark:text-white">Refine Results</span>
              <button
                onClick={() => setIsMobileFilterOpen(true)}
                className="p-2 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
              >
                <FiFilter className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Filter Overlay */}
            <AnimatePresence>
              {isMobileFilterOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsMobileFilterOpen(false)}
                  />
                  <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed inset-y-0 right-0 w-4/5 max-w-sm bg-white dark:bg-slate-900 z-50 p-6 overflow-y-auto border-l border-slate-200 dark:border-slate-800 shadow-2xl"
                  >
                    <div className="flex justify-between items-center mb-8">
                      <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white">Filters</h2>
                      <button
                        onClick={() => setIsMobileFilterOpen(false)}
                        className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      >
                        <FiX className="w-5 h-5" />
                      </button>
                    </div>
                    <FilterSidebar
                      category={category}
                      setCategory={setCategory}
                      mode={mode}
                      setMode={setMode}
                      categoryOptions={categoryOptions}
                      modeOptions={modeOptions}
                    />
                    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                      <button
                        onClick={() => setIsMobileFilterOpen(false)}
                        className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-md transition-colors"
                      >
                        Apply Filters
                      </button>
                      <button
                        onClick={() => { handleClearAll(); setIsMobileFilterOpen(false); }}
                        className="w-full py-3 mt-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        Clear All
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Results Grid */}
            <div className="flex-1">
              <div className="mb-6 flex justify-between items-end">
                <div>
                  <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white">
                    Available Tracks
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {internships.length} result{internships.length !== 1 && 's'} found
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <InternshipSkeleton key={n} />
                  ))}
                </div>
              ) : internships.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center shadow-sm">
                   <EmptyState
                    icon={FiBriefcase}
                    title="No tracks found"
                    message="We couldn't find any internships matching your current filters. Try adjusting your search criteria."
                    action={{ label: 'Clear Filters', onClick: handleClearAll }}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-fr">
                  {internships.map((internship, idx) => (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={internship._id}
                    >
                      <div
                        onClick={() => handleRowClick(internship)}
                        className={`h-full bg-white dark:bg-slate-900 border rounded-3xl overflow-hidden cursor-pointer flex flex-col group transition-all duration-300 ${
                          selectedId === internship._id
                            ? 'border-primary-500 ring-4 ring-primary-500/10 shadow-lg'
                            : 'border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-primary-500/5 hover:border-primary-300 dark:hover:border-primary-700'
                        }`}
                      >
                        {/* Cover Image / Header */}
                        <div className="h-40 bg-slate-100 dark:bg-slate-950 relative overflow-hidden">
                          {internship.imageUrl ? (
                            <img
                              src={internship.imageUrl}
                              alt={internship.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary-50 to-accent-50 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
                               <FiCpu className="h-10 w-10 text-primary-300 dark:text-slate-700" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                            <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border shadow-sm backdrop-blur-md ${getModeStyles(internship.mode)}`}>
                              {internship.mode}
                            </span>
                            <span className="text-white font-bold drop-shadow-md">
                              {formatDisplayAmount(internship.fees, 'Free')}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 flex-1 flex flex-col">
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                            {internship.category}
                          </span>
                          <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
                            {internship.title}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-6">
                            {internship.shortDescription || internship.description}
                          </p>
                          
                          {/* Footer */}
                          <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-sm">
                             <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
                               <FiClock className="w-4 h-4" /> {internship.duration}
                             </div>
                             
                             <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:bg-accent-500 group-hover:text-white transition-colors">
                               <FiArrowRight className="w-4 h-4" />
                             </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
              
              {/* Pagination (Simplified visually) */}
              {pagination.totalPages > 1 && (
                <div className="mt-12 flex justify-center gap-2">
                  {[...Array(pagination.totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPagination(prev => ({ ...prev, page: i + 1 }))}
                      className={`w-10 h-10 rounded-xl font-bold transition-colors ${
                        pagination.page === i + 1
                          ? 'bg-primary-600 text-white shadow-md'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <InternshipDrawer
        internship={selectedInternship}
        isOpen={!!selectedId}
        onClose={handleCloseDrawer}
      />
    </>
  );
};

export default InternshipsPage;
