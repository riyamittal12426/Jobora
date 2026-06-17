import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ProtectedRoute from './ProtectedRoute';

/**
 * Route Guard for Admin Role.
 * Wraps ProtectedRoute. Additionally verifies that the user is an admin.
 * Redirects non-admins back to the main dashboard.
 */
export function AdminRoute({ children }) {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#0a0a0c] text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-600 border-t-indigo-500"></div>
        <p className="mt-4 text-sm font-medium tracking-wide text-gray-400">Checking permissions...</p>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      {isAdmin ? children : <Navigate to="/dashboard" replace />}
    </ProtectedRoute>
  );
}

export default AdminRoute;
