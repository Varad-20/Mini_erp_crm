import React from 'react';
import { cn } from '../../utils/cn';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'slate';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 font-mono text-[11px]',
  success: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/70 text-[11px]',
  warning: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/70 text-[11px]',
  danger: 'bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800/70 text-[11px]',
  info: 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800/70 font-mono text-[11px]',
  purple: 'bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800/70 text-[11px]',
  slate: 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 text-[11px]',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-zinc-500',
  success: 'bg-emerald-600',
  warning: 'bg-amber-600',
  danger: 'bg-red-600',
  info: 'bg-zinc-700',
  purple: 'bg-zinc-300',
  slate: 'bg-zinc-400',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className,
  dot,
}) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
      variants[variant],
      className
    )}
  >
    {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
    {children}
  </span>
);

// Convenience Badge variants for common ERP statuses
export const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    LEAD: { variant: 'warning', label: 'Lead' },
    ACTIVE: { variant: 'success', label: 'Active' },
    INACTIVE: { variant: 'slate', label: 'Inactive' },
    DRAFT: { variant: 'info', label: 'Draft' },
    CONFIRMED: { variant: 'success', label: 'Confirmed' },
    CANCELLED: { variant: 'danger', label: 'Cancelled' },
    RETAIL: { variant: 'default', label: 'Retail' },
    WHOLESALE: { variant: 'purple', label: 'Wholesale' },
    DISTRIBUTOR: { variant: 'info', label: 'Distributor' },
    IN: { variant: 'success', label: 'IN' },
    OUT: { variant: 'danger', label: 'OUT' },
  };
  const config = map[status] ?? { variant: 'default' as BadgeVariant, label: status };
  return <Badge variant={config.variant} dot>{config.label}</Badge>;
};
