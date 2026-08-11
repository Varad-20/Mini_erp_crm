import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Eye, FileText } from 'lucide-react';
import { challanService } from '../../services/challanService';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { TableSkeleton, EmptyState } from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/formatters';
import type { Challan } from '../../types';

const ChallansPage: React.FC = () => {
  const { hasRole } = useAuth();
  const canCreate = hasRole('ADMIN', 'SALES');

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewingChallan, setViewingChallan] = useState<Challan | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['challans', page, search, statusFilter],
    queryFn: () =>
      challanService.getAll({
        page,
        limit: 10,
        search: search || undefined,
        status: (statusFilter as 'DRAFT' | 'CONFIRMED' | 'CANCELLED') || undefined,
      }),
    placeholderData: (prev) => prev,
  });

  const challans = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Sales Challans"
        subtitle={`${pagination?.total ?? '—'} challans total`}
        actions={
          canCreate && (
            <Link to="/challans/create">
              <Button variant="primary" leftIcon={<Plus size={16} />}>Create Challan</Button>
            </Link>
          )
        }
      />

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48">
            <Input
              placeholder="Search by challan number or customer…"
              leftIcon={<Search size={14} />}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Select
            options={[
              { value: 'DRAFT', label: 'Draft' },
              { value: 'CONFIRMED', label: 'Confirmed' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
            placeholder="All Statuses"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-36"
          />
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="table-header text-left">Challan #</th>
                <th className="table-header text-left">Customer</th>
                <th className="table-header text-right">Total Qty</th>
                <th className="table-header text-right">Items</th>
                <th className="table-header text-left">Status</th>
                <th className="table-header text-left">Created By</th>
                <th className="table-header text-left">Date</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8}><TableSkeleton rows={8} cols={8} /></td></tr>
              ) : challans.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      title="No challans found"
                      message={search ? 'Try adjusting your search.' : 'Create your first challan.'}
                      icon={<FileText size={40} />}
                      action={canCreate ? (
                        <Link to="/challans/create">
                          <Button variant="primary" leftIcon={<Plus size={14} />}>Create Challan</Button>
                        </Link>
                      ) : undefined}
                    />
                  </td>
                </tr>
              ) : (
                challans.map((challan) => (
                  <tr key={challan.id} className="table-row">
                    <td className="table-cell">
                      <Link to={`/challans/${challan.id}`} className="font-mono text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
                        {challan.challanNumber}
                      </Link>
                    </td>
                    <td className="table-cell">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{challan.customer?.name}</p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">{challan.customer?.businessName}</p>
                    </td>
                    <td className="table-cell text-right font-bold text-zinc-700 dark:text-zinc-300">{challan.totalQuantity}</td>
                    <td className="table-cell text-right text-zinc-500 dark:text-zinc-400">{challan.items?.length ?? '—'}</td>
                    <td className="table-cell"><StatusBadge status={challan.status} /></td>
                    <td className="table-cell text-zinc-500 dark:text-zinc-400">{challan.createdBy?.name}</td>
                    <td className="table-cell text-xs text-zinc-500 dark:text-zinc-400">{formatDate(challan.createdAt)}</td>
                    <td className="table-cell text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Eye size={13} />}
                        onClick={() => setViewingChallan(challan)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pagination && pagination.totalPages > 1 && (
          <div className="border-t border-zinc-200 dark:border-zinc-800 px-4">
            <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} limit={pagination.limit} onPageChange={setPage} />
          </div>
        )}
      </Card>

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

export default ChallansPage;
