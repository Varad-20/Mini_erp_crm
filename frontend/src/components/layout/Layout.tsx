import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Navbar } from './Navbar';
import { useAuth } from '../../context/AuthContext';
import { PageLoader } from '../ui/Spinner';
import { ToastContainer } from '../ui/Toast';
import { useToast } from '../../hooks/useToast';

// Layout context for toast access
export const ToastContext = React.createContext<ReturnType<typeof useToast> | undefined>(undefined);

export const useAppToast = () => {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useAppToast must be used inside Layout');
  return ctx;
};

export const Layout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const toast = useToast();

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <ToastContext.Provider value={toast}>
      <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-200">
        <Navbar />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Outlet />
        </main>
      </div>
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </ToastContext.Provider>
  );
};

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { isAuthenticated, isLoading, hasRole } = useAuth();

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !hasRole(...(roles as Parameters<typeof hasRole>))) {
    return <Navigate to="/access-denied" replace />;
  }
  return <>{children}</>;
};
