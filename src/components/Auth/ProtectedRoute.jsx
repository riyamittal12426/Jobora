import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Route Guard for Authenticated Users.
 * If the user is authenticated, render children.
 * If authentication is loading, render a sleek loading state.
 * If not authenticated, redirect to /auth and remember original location.
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#0a0a0c] text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-600 border-t-indigo-500"></div>
        <p className="mt-4 text-sm font-medium tracking-wide text-gray-400">Verifying session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to /auth, saving the location they tried to go to
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute;
