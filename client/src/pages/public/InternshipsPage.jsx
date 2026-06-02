import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FiClock, FiMapPin, FiBriefcase, FiArrowRight } from 'react-icons/fi';
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
        // If not in current page, you'd typically fetch it directly.
        // For simplicity, we just clear it if not found in current list to avoid complex state.
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
      case 'Remote': return 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'Hybrid': return 'text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400';
      default: return 'text-violet-700 bg-violet-50 dark:bg-violet-900/30 dark:text-violet-400';
    }
  };

  return (
    <>
      <Helmet>
        <title>Careers & Internships — FWT iZON</title>
        <meta name="description" content="Discover premium internship opportunities at FWT iZON." />
      </Helmet>

      <div className="min-h-screen bg-white dark:bg-[#0a0a11]">
        {/* Header */}
        <div className="bg-brand-50/50 dark:bg-brand-900/10 border-b border-brand-100 dark:border-brand-800/50 pt-16 pb-12 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 dark:bg-brand-800 text-[10px] font-bold uppercase tracking-widest text-brand-700 dark:text-brand-300">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                Join the Team
              </div>
              <h1 className="text-4xl md:text-5xl font-serif tracking-tight text-brand-900 dark:text-white leading-tight">
                Discover your next career-defining role.
              </h1>
              <p className="text-sm md:text-base text-slate-600 dark:text-slate-400">
                Explore our open internship positions and apply to join our growing engineering, design, and product teams.
              </p>
            </div>
          </div>
        </div>

        {/* Main Layout */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 flex flex-col lg:flex-row gap-10">
          {/* Left: Filter Sidebar */}
          <FilterSidebar
            search={search}
            onSearchChange={setSearch}
            category={category}
            onCategoryChange={setCategory}
            mode={mode}
            onModeChange={setMode}
            categoryOptions={categoryOptions}
            modeOptions={modeOptions}
            onClearAll={handleClearAll}
            isMobileOpen={isMobileFilterOpen}
            onMobileToggle={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
          />

          {/* Right: Internship Listings */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <div key={idx} className="h-24 bg-slate-50 dark:bg-slate-800/50 animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : internships.length === 0 ? (
              <div className="py-12 border border-slate-100 dark:border-slate-800 rounded-3xl text-center bg-slate-50/50 dark:bg-slate-900/20">
                <EmptyState
                  title="No roles match your criteria"
                  description="Try adjusting your filters or checking back later for new opportunities."
                  icon={FiBriefcase}
                  actionText="Clear Filters"
                  onActionClick={handleClearAll}
                />
              </div>
            ) : (
              <div className="space-y-2">
                {internships.map((internship, idx) => (
                  <motion.div
                    key={internship._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    layoutId={`internship-${internship._id}`}
                  >
                    <button
                      onClick={() => handleRowClick(internship)}
                      className="w-full text-left group block p-5 md:p-6 rounded-2xl hover:bg-brand-50/60 dark:hover:bg-brand-900/20 border border-transparent hover:border-brand-100 dark:hover:border-brand-800/50 transition-all duration-300"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Title & Domain */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              FWT iZON
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                              {internship.category}
                            </span>
                          </div>
                          <h3 className="text-xl md:text-2xl font-serif font-medium text-slate-900 dark:text-slate-50 group-hover:text-brand-700 dark:group-hover:text-brand-300 transition-colors truncate">
                            {internship.title}
                          </h3>
                        </div>

                        {/* Badges & CTA */}
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="hidden sm:flex items-center gap-3">
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold">
                              <FiClock className="w-3 h-3" /> {internship.duration}
                            </div>
                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${getModeStyles(internship.mode)}`}>
                              <FiMapPin className="w-3 h-3" /> {internship.mode}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 ml-auto">
                            <div className="text-right hidden md:block">
                              <span className="block text-[10px] font-bold uppercase text-slate-400">Stipend / Fee</span>
                              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                {formatDisplayAmount(internship.fees, 'Paid / Free')}
                              </span>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center group-hover:bg-brand-600 group-hover:border-brand-600 group-hover:text-white text-slate-400 transition-all duration-300 shadow-sm">
                              <FiArrowRight className="w-4 h-4 group-hover:-rotate-45 transition-transform duration-300" />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Mobile Badges */}
                      <div className="flex sm:hidden items-center gap-2 mt-4">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-semibold">
                          {internship.duration}
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${getModeStyles(internship.mode)}`}>
                          {internship.mode}
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-semibold ml-auto">
                          {formatDisplayAmount(internship.fees, 'Paid / Free')}
                        </span>
                      </div>
                    </button>
                    {/* Minimal Separator */}
                    {idx < internships.length - 1 && (
                      <div className="h-px bg-slate-100 dark:bg-slate-800/60 mx-6" />
                    )}
                  </motion.div>
                ))}
              </div>
            )}
            
            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center mt-12">
                <div className="flex items-center gap-2">
                  {Array.from({ length: pagination.totalPages }).map((_, idx) => (
                    <button
                      key={idx + 1}
                      onClick={() => setPagination((prev) => ({ ...prev, page: idx + 1 }))}
                      className={`w-8 h-8 rounded-full text-xs font-bold transition-colors ${
                        pagination.page === idx + 1
                          ? 'bg-brand-600 text-white'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail & Application Drawer */}
      <InternshipDrawer
        internship={selectedInternship}
        isOpen={!!selectedInternship}
        onClose={handleCloseDrawer}
      />
    </>
  );
};

export default InternshipsPage;
