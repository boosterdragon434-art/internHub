import { useState, useEffect, useCallback } from 'react';
import { getMyEnrollments } from '../api/enrollmentApi';
import { useAuth } from '../context/AuthContext';

/**
 * useEnrollment — Custom hook providing enrollment state for the current student.
 */
const useEnrollment = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEnrollments = useCallback(async () => {
    // Only fetch if user exists and is a student
    if (!user || user.role !== 'student') {
      setLoading(false);
      return;
    }
    
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
