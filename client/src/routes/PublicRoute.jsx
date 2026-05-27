import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FullPageLoader } from '../components/common/Loader';

/**
 * Restricts access for already-logged-in users.
 * Redirects to the appropriate role-based dashboard.
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, getDashboardPath } = useAuth();

  if (loading) return <FullPageLoader message="Checking session..." />;

  if (isAuthenticated) {
    return <Navigate to={getDashboardPath()} replace />;
  }

  return children;
};

export default PublicRoute;
