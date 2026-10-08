import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { ShieldSlash, ArrowRight, House } from '@phosphor-icons/react';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  children: React.ReactNode;
}

export const getRoleDashboardPath = (role?: UserRole): string => {
  switch (role) {
    case 'STUDENT':
      return '/student/dashboard';
    case 'HOSTEL_OFFICE':
      return '/staff/dashboard';
    case 'ELECTRICIAN':
    case 'CLEANING_WORKER':
    case 'MASTER':
    case 'WATCHMAN':
      return '/worker/dashboard';
    case 'DEPUTY_WARDEN':
      return '/deputy/dashboard';
    case 'WARDEN':
      return '/warden/dashboard';
    default:
      return '/login';
  }
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { currentUser, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-red-600 border-t-transparent animate-spin" />
          <span className="text-xs text-zinc-500 font-mono">Authenticating session...</span>
        </div>
      </div>
    );
  }

  // Not logged in -> redirect to /login
  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific roles are required and user doesn't have it -> 403 Forbidden
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    const authorizedPath = getRoleDashboardPath(currentUser.role);

    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 animate-fade-in">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 text-center shadow-xl space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 dark:bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-600 dark:text-red-400">
            <ShieldSlash size={30} weight="duotone" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-mono font-bold uppercase text-red-600 dark:text-red-400 tracking-wider">
              403 Forbidden
            </span>
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white">
              Access Denied
            </h2>
            <p className="text-xs text-zinc-500 leading-relaxed">
              You are signed in as <strong className="text-zinc-800 dark:text-zinc-200">{currentUser.name || currentUser.fullName}</strong> ({currentUser.role}). Your role does not have authorization to access this portal route.
            </p>
          </div>

          <div className="pt-2">
            <Link
              to={authorizedPath}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/20 transition-all cursor-pointer"
            >
              <House size={15} weight="bold" />
              <span>Go to your {currentUser.role.replace('_', ' ')} Dashboard</span>
              <ArrowRight size={14} weight="bold" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
