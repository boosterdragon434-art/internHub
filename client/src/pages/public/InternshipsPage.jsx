import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FiBriefcase, FiMapPin, FiClock } from 'react-icons/fi';
import { getInternshipsList } from '../../api/internshipApi';
import { formatDisplayAmount } from '../../utils/formatters';
import { useDebounce } from '../../hooks/useDebounce';
import SearchFilter from '../../components/common/SearchFilter';
import Pagination from '../../components/common/Pagination';
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

  const debouncedSearch = useDebounce(search, 400);

  const categoryOptions = [
    { value: 'Web Development', label: 'Web Development' },
    { value: 'Mobile Development', label: 'Mobile Development' },
    { value: 'Data Science', label: 'Data Science' },
    { value: 'Machine Learning', label: 'Machine Learning' },
    { value: 'UI/UX Design', label: 'UI/UX Design' },
    { value: 'Cloud Computing', label: 'Cloud Computing' },
    { value: 'Cybersecurity', label: 'Cybersecurity' },
    { value: 'DevOps', label: 'DevOps' },
    { value: 'Digital Marketing', label: 'Digital Marketing' },
    { value: 'Content Writing', label: 'Content Writing' },
    { value: 'Graphic Design', label: 'Graphic Design' },
    { value: 'Video Editing', label: 'Video Editing' },
    { value: 'Other', label: 'Other' },
  ];

  const modeOptions = [
    { value: 'Remote', label: 'Remote' },
    { value: 'Hybrid', label: 'Hybrid' },
    { value: 'Offline', label: 'Offline' },
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

  return (
    <>
      <Helmet>
        <title>Browse Internships — InternHub</title>
        <meta name="description" content="Explore top internship opportunities in web development, data science, design, and more. Filter by category, mode, and keywords." />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">
            Browse Internships
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Discover and apply to the best internship programs tailored for you.
          </p>
        </div>

        {/* Filters */}
        <SearchFilter
          searchPlaceholder="Search by title, description, category..."
          searchValue={search}
          onSearchChange={setSearch}
          filters={[
            {
              name: 'category',
              value: category,
              onChange: setCategory,
              options: categoryOptions,
              placeholder: 'All Categories',
            },
            {
              name: 'mode',
              value: mode,
              onChange: setMode,
              options: modeOptions,
              placeholder: 'All Modes',
            },
          ]}
          className="mb-6"
        />

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <InternshipSkeleton key={idx} />
            ))}
          </div>
        ) : internships.length === 0 ? (
          <EmptyState
            title="No internships found"
            description="Try adjusting your search or filter criteria to find more results."
            icon={FiBriefcase}
            actionText="Clear Filters"
            onActionClick={() => {
              setSearch('');
              setCategory('');
              setMode('');
            }}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {internships.map((internship, idx) => (
                <motion.div
                  key={internship._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link
                    to={`/internships/${internship._id}`}
                    className="block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-accent-200 dark:hover:border-accent-800 transition-all duration-300 group h-full"
                  >
                    <div className="h-44 bg-gradient-to-br from-accent-100 to-secondary-100 dark:from-accent-950/30 dark:to-secondary-950/30 flex items-center justify-center overflow-hidden">
                      {internship.imageUrl ? (
                        <img src={internship.imageUrl} alt={internship.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <FiBriefcase className="h-12 w-12 text-accent-300 dark:text-accent-700" />
                      )}
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-accent-50 dark:bg-accent-950/30 text-accent-700 dark:text-accent-400 border border-accent-100 dark:border-accent-900/30">
                          {internship.category}
                        </span>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {internship.mode}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors line-clamp-1">
                        {internship.title}
                      </h3>
                      <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 flex-1">
                        {internship.shortDescription || internship.description}
                      </p>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1"><FiClock className="h-3 w-3" /> {internship.duration}</span>
                          <span className="flex items-center gap-1"><FiMapPin className="h-3 w-3" /> {internship.mode}</span>
                        </div>
                        <span className="text-sm font-bold text-accent-600 dark:text-accent-400">
                          {formatDisplayAmount(internship.fees, 'Free')}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              className="mt-8"
            />
          </>
        )}
      </div>
    </>
  );
};

export default InternshipsPage;
