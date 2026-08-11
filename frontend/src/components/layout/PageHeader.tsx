import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => (
  <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-200 dark:border-zinc-800 transition-colors duration-150">
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">{title}</h1>
      {subtitle && <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-1">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-3">{actions}</div>}
  </div>
);
