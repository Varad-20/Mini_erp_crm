import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Package,
  AlertTriangle,
  FileText,
  ArrowRight,
  Clock,
  Eye,
} from 'lucide-react';
import { StatCard, Card, CardHeader } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { TableSkeleton, EmptyState } from '../../components/ui/Spinner';
import { PageHeader } from '../../components/layout/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { dashboardService } from '../../services/dashboardService';
import { formatDate, formatDateTime } from '../../utils/formatters';
import type { Challan } from '../../types';

const DashboardPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [viewingChallan, setViewingChallan] = useState<Challan | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardService.getStats(),
    refetchInterval: 60_000,
  });

  const stats = data?.data?.stats;
  const recentChallans = data?.data?.recentChallans ?? [];
  const lowStockProducts = data?.data?.lowStockProducts ?? [];
  const upcomingFollowUps = data?.data?.upcomingFollowUps ?? [];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back! Here's what's happening today — ${formatDate(new Date().toISOString())}`}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {hasRole('ADMIN', 'SALES', 'ACCOUNTS') && (
          <StatCard
            title="Total Customers"
            value={isLoading ? '—' : (stats?.totalCustomers ?? 0)}
            icon={<Users size={20} />}
            subtitle="All registered customers"
          />
        )}
        {hasRole('ADMIN', 'WAREHOUSE') && (
          <StatCard
            title="Total Products"
            value={isLoading ? '—' : (stats?.totalProducts ?? 0)}
            icon={<Package size={20} />}
            subtitle="In product catalog"
          />
        )}
        {hasRole('ADMIN', 'WAREHOUSE') && (
          <StatCard
            title="Low Stock Alerts"
            value={isLoading ? '—' : (stats?.lowStockCount ?? 0)}
            icon={<AlertTriangle size={20} />}
            subtitle="Products below min. stock"
          />
        )}
        <StatCard
          title="Today's Challans"
          value={isLoading ? '—' : (stats?.todaysChallans ?? 0)}
          icon={<FileText size={20} />}
          subtitle="Challans created today"
        />
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-md text-sm text-red-700 dark:text-red-300 font-medium">
          Failed to load dashboard data. Please refresh.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Challans */}
        <div className={hasRole('ACCOUNTS') ? "lg:col-span-3" : "lg:col-span-2"}>
          <Card padding="none">
            <div className="px-6 pt-5 pb-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <CardHeader title="Recent Challans" subtitle="Latest sales challans" />
              <Link to="/challans" className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            {isLoading ? (
              <TableSkeleton rows={5} cols={4} />
            ) : recentChallans.length === 0 ? (
              <EmptyState title="No challans yet" message="Create your first challan to get started." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/60">
                    <tr>
                      <th className="table-header text-left">Challan #</th>
                      <th className="table-header text-left">Customer</th>
                      <th className="table-header text-left">Date</th>
                      <th className="table-header text-left">Status</th>
                      <th className="table-header text-right">Qty</th>
                      <th className="table-header text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentChallans.map((challan) => (
                      <tr key={challan.id} className="table-row">
                        <td className="table-cell">
                          <Link
                            to={`/challans/${challan.id}`}
                            className="font-mono text-xs text-zinc-950 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline font-semibold"
                          >
                            {challan.challanNumber}
                          </Link>
                        </td>
                        <td className="table-cell">
                          <div>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">{challan.customer?.name}</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">{challan.customer?.businessName}</p>
                          </div>
                        </td>
                        <td className="table-cell text-zinc-500 dark:text-zinc-400 text-xs">{formatDate(challan.createdAt)}</td>
                        <td className="table-cell"><StatusBadge status={challan.status} /></td>
                        <td className="table-cell text-right font-mono font-medium text-zinc-900 dark:text-zinc-100">{challan.totalQuantity}</td>
                        <td className="table-cell text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<Eye size={13} />}
                            onClick={() => setViewingChallan(challan as unknown as Challan)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column */}
        {hasRole('ADMIN', 'SALES', 'WAREHOUSE') && (
          <div className="space-y-6">
            {/* Low Stock */}
            {hasRole('ADMIN', 'WAREHOUSE') && (
              <Card padding="none">
                <div className="px-5 pt-5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                  <CardHeader
                title="Low Stock"
                subtitle="Products needing restock"
                icon={<AlertTriangle size={16} />}
                action={
                  <Link to="/stock" className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline">
                    View all
                  </Link>
                }
              />
            </div>
            {isLoading ? (
              <div className="p-4"><TableSkeleton rows={4} cols={2} /></div>
            ) : lowStockProducts.length === 0 ? (
              <EmptyState title="All products well stocked!" />
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {lowStockProducts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{p.name}</p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">{p.sku}</p>
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <p className="text-sm font-bold text-red-600 dark:text-red-400 font-mono">{p.currentStock}</p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">min {p.minimumStock}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
              </Card>
            )}

            {/* Upcoming Follow-ups */}
            {hasRole('ADMIN', 'SALES') && (
              <Card padding="none">
                <div className="px-5 pt-5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                  <CardHeader
                title="Follow-ups"
                subtitle="Upcoming customer follow-ups"
                icon={<Clock size={16} />}
                action={
                  <Link to="/customers" className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline">
                    View all
                  </Link>
                }
              />
            </div>
            {isLoading ? (
              <div className="p-4"><TableSkeleton rows={3} cols={2} /></div>
            ) : upcomingFollowUps.length === 0 ? (
              <EmptyState title="No upcoming follow-ups" />
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {upcomingFollowUps.map((c) => (
                  <Link
                    key={c.id}
                    to={`/customers/${c.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{c.name}</p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">{c.mobile}</p>
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <p className="text-xs font-medium text-amber-600 dark:text-amber-400 font-mono">{formatDateTime(c.followUpDate)}</p>
                      <StatusBadge status={c.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
              </Card>
            )}
          </div>
        )}
      </div>

      {/* View Challan Modal */}
      <Modal
        isOpen={!!viewingChallan}
        onClose={() => setViewingChallan(null)}
        title="View Challan Details"
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Link
              to={viewingChallan ? `/challans/${viewingChallan.id}` : '#'}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              Open Full Detail Page →
            </Link>
            <Button variant="secondary" onClick={() => setViewingChallan(null)}>
              Close
            </Button>
          </div>
        }
      >
        {viewingChallan && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 mb-1">Challan Number</label>
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-md text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  {viewingChallan.challanNumber}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 mb-1">Status</label>
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-md flex items-center">
                  <StatusBadge status={viewingChallan.status} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 mb-1">Customer Name</label>
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-md text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {viewingChallan.customer?.name || '—'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 mb-1">Business Name</label>
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-md text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {viewingChallan.customer?.businessName || '—'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 mb-1">Total Quantity</label>
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-md text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {viewingChallan.totalQuantity} units
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 mb-1">Total Items</label>
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-md text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {viewingChallan.items?.length ?? '—'} product line(s)
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 mb-1">Created By</label>
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-md text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {viewingChallan.createdBy?.name || '—'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 mb-1">Created Date</label>
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-md text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {formatDate(viewingChallan.createdAt)}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DashboardPage;
