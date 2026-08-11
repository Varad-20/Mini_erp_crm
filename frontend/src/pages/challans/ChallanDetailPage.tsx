import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle, XCircle, Printer } from 'lucide-react';
import { challanService } from '../../services/challanService';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Spinner';
import { useAppToast } from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatDateTime, formatCurrency, getApiErrorMessage } from '../../utils/formatters';

const ChallanDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { hasRole } = useAuth();
  const toast = useAppToast();
  const queryClient = useQueryClient();
  const canConfirm = hasRole('ADMIN', 'SALES');
  const canCancel = hasRole('ADMIN', 'SALES');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['challan', id],
    queryFn: () => challanService.getById(id!),
    enabled: !!id,
  });

  const confirmMutation = useMutation({
    mutationFn: () => challanService.confirm(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challan', id] });
      queryClient.invalidateQueries({ queryKey: ['challans'] });
      queryClient.invalidateQueries({ queryKey: ['stock-overview'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Challan confirmed and stock deducted successfully');
      setConfirmOpen(false);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err));
      setConfirmOpen(false);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => challanService.cancel(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challan', id] });
      queryClient.invalidateQueries({ queryKey: ['challans'] });
      toast.success('Challan cancelled successfully');
      setCancelOpen(false);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err));
      setCancelOpen(false);
    },
  });

  if (isLoading) return <PageLoader />;
  if (error || !data?.data) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">Failed to load challan details.</p>
        <Link to="/challans" className="text-indigo-600 hover:underline mt-2 inline-block">← Back</Link>
      </div>
    );
  }

  const challan = data.data;
  const items = challan.items ?? [];
  const isDraft = challan.status === 'DRAFT';
  const isConfirmed = challan.status === 'CONFIRMED';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link to="/challans" className="inline-flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Challans
      </Link>

      {/* Challan Header */}
      <Card className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">{challan.challanNumber}</h1>
              <StatusBadge status={challan.status} />
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Created {formatDateTime(challan.createdAt)} by {challan.createdBy?.name}</p>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Printer size={14} />}
              onClick={() => window.print()}
            >
              Print
            </Button>
            {isDraft && canCancel && (
              <Button
                variant="danger"
                size="sm"
                leftIcon={<XCircle size={14} />}
                onClick={() => setCancelOpen(true)}
              >
                Cancel Challan
              </Button>
            )}
            {isDraft && canConfirm && (
              <Button
                variant="success"
                size="sm"
                leftIcon={<CheckCircle size={14} />}
                onClick={() => setConfirmOpen(true)}
              >
                Confirm & Deduct Stock
              </Button>
            )}
          </div>
        </div>

        {isDraft && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Draft Challan:</strong> Stock will only be deducted when this challan is confirmed. 
              Confirming is permanent and cannot be undone.
            </p>
          </div>
        )}
        {isConfirmed && (
          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-lg">
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              <strong>Confirmed:</strong> Stock has been deducted for all items in this challan.
            </p>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2">
          <Card padding="none">
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Challan Items</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="table-header text-left">#</th>
                    <th className="table-header text-left">Product</th>
                    <th className="table-header text-left">SKU</th>
                    <th className="table-header text-right">Unit Price</th>
                    <th className="table-header text-right">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={item.id} className="table-row">
                      <td className="table-cell text-zinc-400 dark:text-zinc-500 font-mono">{i + 1}</td>
                      <td className="table-cell font-semibold text-zinc-900 dark:text-zinc-100">{item.productName}</td>
                      <td className="table-cell">
                        <code className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-1.5 py-0.5 rounded">{item.sku}</code>
                      </td>
                      <td className="table-cell text-right text-zinc-700 dark:text-zinc-300">{formatCurrency(item.unitPrice)}</td>
                      <td className="table-cell text-right font-bold text-zinc-900 dark:text-zinc-100">{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60">
                  <tr>
                    <td colSpan={4} className="table-cell text-right font-semibold text-zinc-700 dark:text-zinc-300">Total Quantity:</td>
                    <td className="table-cell text-right font-bold text-zinc-900 dark:text-zinc-100 text-lg">{challan.totalQuantity}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer */}
          <Card>
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">Customer</h3>
            <div className="space-y-2">
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">{challan.customer?.name}</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{challan.customer?.businessName}</p>
              <Link to={`/customers/${challan.customer?.id}`} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                View customer profile →
              </Link>
            </div>
          </Card>

          {/* Challan Info */}
          <Card>
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">Challan Info</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">Status</p>
                <StatusBadge status={challan.status} />
              </div>
              <div>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">Total Items</p>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{items.length} product line(s)</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">Total Quantity</p>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{challan.totalQuantity} units</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">Created</p>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{formatDate(challan.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">Created By</p>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{challan.createdBy?.name}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => confirmMutation.mutate()}
        title="Confirm Challan"
        message={`Confirming challan ${challan.challanNumber} will permanently deduct stock for ${items.length} product(s). This cannot be undone. Proceed?`}
        confirmLabel="Confirm & Deduct Stock"
        variant="success"
        isLoading={confirmMutation.isPending}
      />

      {/* Cancel Dialog */}
      <ConfirmDialog
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={() => cancelMutation.mutate()}
        title="Cancel Challan"
        message={`Are you sure you want to cancel challan ${challan.challanNumber}? This will void the challan.`}
        confirmLabel="Yes, Cancel Challan"
        variant="danger"
        isLoading={cancelMutation.isPending}
      />
    </div>
  );
};

export default ChallanDetailPage;

