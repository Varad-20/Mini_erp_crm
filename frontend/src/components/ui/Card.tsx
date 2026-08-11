import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({ children, className, padding = 'md' }) => {
  const paddings = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' };
  return (
    <div className={cn('card', paddings[padding], className)}>
      {children}
    </div>
  );
};

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ title, subtitle, action, icon }) => (
  <div className="flex items-start justify-between mb-4">
    <div className="flex items-center gap-3">
      {icon && (
        <div className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded-md">
          {icon}
        </div>
      )}
      <div>
        <h3 className="text-base font-semibold text-zinc-900 dark:text-white tracking-tight">{title}</h3>
        {subtitle && <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action && <div>{action}</div>}
  </div>
);

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'indigo' | 'emerald' | 'amber' | 'red';
  subtitle?: string;
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, subtitle }) => {
  return (
    <Card className="flex items-center gap-4">
      <div className="p-3 rounded-md bg-zinc-900 dark:bg-zinc-800 text-white dark:text-zinc-100 border border-transparent dark:border-zinc-700 flex-shrink-0 shadow-sm">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 truncate">{title}</p>
        <p className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight mt-0.5">{value}</p>
        {subtitle && <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{subtitle}</p>}
      </div>
    </Card>
  );
};
