import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('ADMIN' | 'MANAGER' | 'EMPLOYEE')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // Show premium loading spinner while resolving auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-primary-600"></div>
          <span className="text-sm font-medium text-slate-500">Securing environment...</span>
        </div>
      </div>
    );
  }

  // Redirect unauthenticated users to the Login view
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Enforce Role-Based Access Control
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Silently redirect to their primary permitted dashboard
    return <Navigate to="/dashboard" replace />;
  }

  // Render children if all security checks pass
  return <>{children}</>;
};
