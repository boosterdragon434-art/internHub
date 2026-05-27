import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiSearch, FiUser, FiMail, FiChevronRight } from 'react-icons/fi';
import { getAssignedStudents } from '../../api/guideApi';
import Pagination from '../../components/common/Pagination';
import { FullPageLoader } from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { useDebounce } from '../../hooks/useDebounce';

/**
 * Guide Students Page — list of assigned students with search and pagination.
 */
const GuideStudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const debouncedSearch = useDebounce(search, 400);

  const fetchStudents = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: 12 };
      if (debouncedSearch) params.search = debouncedSearch;

      const res = await getAssignedStudents(params);
      if (res.data?.success) {
        setStudents(res.data.data);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchStudents(1);
  }, [fetchStudents]);

  const handlePageChange = (page) => {
    fetchStudents(page);
  };

  return (
    <>
      <Helmet>
        <title>My Students — InternHub</title>
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              My Students
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {pagination.total} student{pagination.total !== 1 ? 's' : ''} assigned to you
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-premium w-full pl-10"
              id="search-students"
            />
          </div>
        </div>

        {/* Student Grid */}
        {loading ? (
          <FullPageLoader message="Loading students..." />
        ) : students.length === 0 ? (
          <EmptyState
            icon={FiUser}
            title="No students found"
            description={
              search
                ? 'Try adjusting your search terms.'
                : 'No students have been assigned to you yet.'
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map((student, idx) => (
                <motion.div
                  key={student._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.3 }}
                >
                  <Link
                    to={`/guide/students/${student._id}`}
                    className="glass-card rounded-2xl p-5 block hover-lift group"
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-accent-400 to-secondary-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
                        {student.name?.charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {student.name}
                        </h3>
                        <div className="flex items-center gap-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
                          <FiMail className="h-3 w-3 shrink-0" />
                          <span className="truncate">{student.email}</span>
                        </div>
                        {student.college && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate">
                            {student.college}
                          </p>
                        )}
                        {student.department && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                            {student.department} — {student.yearOfStudy || 'N/A'}
                          </p>
                        )}
                      </div>

                      <FiChevronRight className="h-5 w-5 text-slate-300 dark:text-slate-600 group-hover:text-accent-500 transition-colors shrink-0 mt-1" />
                    </div>

                    {/* Skills */}
                    {student.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {student.skills.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent-50 dark:bg-accent-950/30 text-accent-700 dark:text-accent-400"
                          >
                            {skill}
                          </span>
                        ))}
                        {student.skills.length > 3 && (
                          <span className="text-[10px] text-slate-400">
                            +{student.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                </motion.div>
              ))}
            </div>

            {pagination.pages > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.pages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </motion.div>
    </>
  );
};

export default GuideStudentsPage;
