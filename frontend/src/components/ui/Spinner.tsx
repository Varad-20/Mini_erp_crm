import React from 'react';
import { Loader2 } from 'lucide-react';

export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className,
}) => {
  const sizes = { sm: 16, md: 24, lg: 40 };
  return (
    <Loader2
      size={sizes[size]}
      className={`animate-spin text-indigo-600 ${className || ''}`}
    />
  );
};

export const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-64">
    <div className="flex flex-col items-center gap-3">
      <Spinner size="lg" />
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>
    </div>
  </div>
);

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`animate-pulse bg-zinc-200 dark:bg-zinc-800 rounded-lg ${className || ''}`} />
);

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 5,
}) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 p-4 border-t border-zinc-100 dark:border-zinc-800">
        {Array.from({ length: cols }).map((_, j) => (
          <Skeleton key={j} className="h-4 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export const EmptyState: React.FC<{
  title: string;
  message?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}> = ({ title, message, icon, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {icon && (
      <div className="text-zinc-300 dark:text-zinc-600 mb-4">{icon}</div>
    )}
    <h3 className="text-base font-semibold text-zinc-700 dark:text-zinc-300">{title}</h3>
    {message && <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1 max-w-xs">{message}</p>}
    {action && <div className="mt-6">{action}</div>}
  </div>
);
