import { useState, useEffect, useCallback } from 'react';
import { getMyEnrollments } from '../api/enrollmentApi';

/**
 * useEnrollment — Custom hook providing enrollment state for the current student.
 *
 * Returns:
 * - enrollments: Full array of enrollment instances
 * - activeEnrollment: The most recent 'active' enrollment (primary context)
 * - isEnrolled: Whether the student has at least one active enrollment
 * - loading: Initial fetch in progress
 * - refetch: Re-fetch enrollment data (e.g. after payment verification)
 */
const useEnrollment = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEnrollments = useCallback(async () => {
    try {
      const res = await getMyEnrollments();
      if (res.success) {
        setEnrollments(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch enrollments:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  const activeEnrollment = enrollments.find((e) => e.status === 'active') || null;
  const isEnrolled = !!activeEnrollment;

  return {
    enrollments,
    activeEnrollment,
    isEnrolled,
    loading,
    refetch: fetchEnrollments,
  };
};

export default useEnrollment;
