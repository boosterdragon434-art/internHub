import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FullPageLoader } from '../components/common/Loader';

/**
 * Protects guide-only routes.
 * Redirects non-guides to their appropriate dashboard.
 */
const GuideRoute = ({ children }) => {
  const { isAuthenticated, isGuide, loading, getDashboardPath } = useAuth();

  if (loading) return <FullPageLoader message="Verifying permissions..." />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isGuide) {
    return <Navigate to={getDashboardPath()} replace />;
  }

  return children;
};

export default GuideRoute;
