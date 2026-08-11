import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Warehouse, ArrowUpCircle, ArrowDownCircle, Eye } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { stockService } from '../../services/stockService';
import { productService } from '../../services/productService';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { PageLoader, EmptyState } from '../../components/ui/Spinner';
import { useAppToast } from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime, formatCurrency, getApiErrorMessage } from '../../utils/formatters';
import type { Product } from '../../types';

const StockPage: React.FC = () => {
  const { hasRole } = useAuth();
  const toast = useAppToast();
  const queryClient = useQueryClient();
  const canWrite = hasRole('ADMIN', 'WAREHOUSE');
  const [tab, setTab] = useState<'overview' | 'movements'>('overview');
  const [movPage, setMovPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingStockItem, setViewingStockItem] = useState<Product | null>(null);

  const { data: stockData, isLoading: stockLoading } = useQuery({
    queryKey: ['stock-overview'],
    queryFn: () => stockService.getOverview(),
  });

  const { data: movData, isLoading: movLoading } = useQuery({
    queryKey: ['stock-movements', movPage],
    queryFn: () => stockService.getMovements({ page: movPage, limit: 10 }),
    enabled: tab === 'movements',
  });

  const { data: productsData } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => productService.getAll({ limit: 100 }),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<{
    productId: string;
    quantity: string;
    movementType: 'IN' | 'OUT';
    reason: string;
  }>({ defaultValues: { movementType: 'IN' } });

  const moveMutation = useMutation({
    mutationFn: (d: { productId: string; quantity: string; movementType: 'IN' | 'OUT'; reason: string }) =>
      stockService.createMovement({
        productId: Number(d.productId),
        quantity: Number(d.quantity),
        movementType: d.movementType,
        reason: d.reason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-overview'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Stock movement recorded successfully');
      setIsModalOpen(false);
      reset({ movementType: 'IN' });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const stock = stockData?.data ?? [];
  const movements = movData?.data ?? [];
  const pagination = movData?.pagination;
  const products = productsData?.data ?? [];

  if (stockLoading) return <PageLoader />;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Stock Management"
        subtitle={`${stock.length} products tracked`}
        actions={
          canWrite && (
            <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => setIsModalOpen(true)}>
              Add Movement
            </Button>
          )
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-lg w-fit transition-colors duration-150">
        {(['overview', 'movements'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              tab === t ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            {t === 'overview' ? 'Stock Overview' : 'Movement Log'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="table-header text-left">Product</th>
                  <th className="table-header text-left">SKU</th>
                  <th className="table-header text-left">Category</th>
                  <th className="table-header text-right">Current Stock</th>
                  <th className="table-header text-right">Min Stock</th>
                  <th className="table-header text-left">Location</th>
                  <th className="table-header text-left">Status</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stock.length === 0 ? (
                  <tr><td colSpan={8}>
                    <EmptyState title="No products" message="Add products to track stock." icon={<Warehouse size={40} />} />
                  </td></tr>
                ) : (
                  stock.map((p) => (
                    <tr key={p.id} className="table-row">
                      <td className="table-cell font-semibold text-zinc-900 dark:text-zinc-100">{p.name}</td>
                      <td className="table-cell"><code className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-1.5 py-0.5 rounded">{p.sku}</code></td>
                      <td className="table-cell"><Badge variant="default">{p.category}</Badge></td>
                      <td className={`table-cell text-right font-bold text-lg ${p.isLowStock ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {p.currentStock}
                      </td>
                      <td className="table-cell text-right text-zinc-500 dark:text-zinc-400">{p.minimumStock}</td>
                      <td className="table-cell"><code className="text-xs text-zinc-600 dark:text-zinc-300">{p.warehouseLocation}</code></td>
                      <td className="table-cell">
                        {p.isLowStock ? <Badge variant="danger" dot>Low Stock</Badge> : <Badge variant="success" dot>In Stock</Badge>}
                      </td>
                      <td className="table-cell text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Eye size={13} />}
                          onClick={() => setViewingStockItem(p)}
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
        </Card>
      )}

      {/* View Stock Item Modal */}
      <Modal
        isOpen={!!viewingStockItem}
        onClose={() => setViewingStockItem(null)}
        title="View Stock Details"
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => setViewingStockItem(null)}>
            Close
          </Button>
        }
      >
        {viewingStockItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 mb-1">Product Name</label>
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-md text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {viewingStockItem.name}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 mb-1">SKU</label>
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-md text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  {viewingStockItem.sku}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 mb-1">Category</label>
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-md flex items-center">
                  <Badge variant="default">{viewingStockItem.category}</Badge>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 mb-1">Unit Price</label>
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-md text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {formatCurrency(viewingStockItem.unitPrice)}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 mb-1">Current Stock</label>
                <div className={`p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-md text-sm font-bold ${viewingStockItem.isLowStock ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {viewingStockItem.currentStock} units
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 mb-1">Minimum Stock Threshold</label>
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-md text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {viewingStockItem.minimumStock} units
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 mb-1">Warehouse Location</label>
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-md text-sm font-mono text-zinc-900 dark:text-zinc-100">
                  {viewingStockItem.warehouseLocation || '—'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 mb-1">Stock Status</label>
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-md flex items-center">
                  {viewingStockItem.isLowStock ? (
                    <Badge variant="danger" dot>Low Stock</Badge>
                  ) : (
                    <Badge variant="success" dot>In Stock</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {tab === 'movements' && (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="table-header text-left">Product</th>
                  <th className="table-header text-left">Type</th>
                  <th className="table-header text-right">Quantity</th>
                  <th className="table-header text-left">Reason</th>
                  <th className="table-header text-left">Created By</th>
                  <th className="table-header text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {movLoading ? (
                  <tr><td colSpan={6} className="py-4 text-center text-zinc-400 dark:text-zinc-500 text-sm">Loading movements...</td></tr>
                ) : movements.length === 0 ? (
                  <tr><td colSpan={6}>
                    <EmptyState title="No stock movements" message="Movements will appear here after stock changes." />
                  </td></tr>
                ) : (
                  movements.map((m) => (
                    <tr key={m.id} className="table-row">
                      <td className="table-cell">
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">{m.product?.name}</p>
                        <code className="text-xs text-zinc-400 dark:text-zinc-500">{m.product?.sku}</code>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          {m.movementType === 'IN'
                            ? <ArrowUpCircle size={16} className="text-emerald-600 dark:text-emerald-400" />
                            : <ArrowDownCircle size={16} className="text-red-600 dark:text-red-400" />
                          }
                          <StatusBadge status={m.movementType} />
                        </div>
                      </td>
                      <td className="table-cell text-right font-bold text-zinc-800 dark:text-zinc-200">{m.quantity}</td>
                      <td className="table-cell text-zinc-600 dark:text-zinc-300 max-w-xs truncate">{m.reason}</td>
                      <td className="table-cell text-zinc-500 dark:text-zinc-400">{m.createdBy?.name}</td>
                      <td className="table-cell text-xs text-zinc-500 dark:text-zinc-400">{formatDateTime(m.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {pagination && pagination.totalPages > 1 && (
            <div className="border-t border-zinc-200 dark:border-zinc-800 px-4">
              <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} limit={pagination.limit} onPageChange={setMovPage} />
            </div>
          )}
        </Card>
      )}

      {/* Add Movement Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); reset({ movementType: 'IN' }); }}
        title="Record Stock Movement"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setIsModalOpen(false); reset({ movementType: 'IN' }); }}>Cancel</Button>
            <Button variant="primary" isLoading={moveMutation.isPending} onClick={handleSubmit((d) => moveMutation.mutate(d))}>
              Record Movement
            </Button>
          </>
        }
      >
        <form className="space-y-4" noValidate>
          <Select
            label="Product"
            required
            options={products.map((p) => ({ value: String(p.id), label: `${p.name} (${p.sku}) — Stock: ${p.currentStock}` }))}
            placeholder="Select a product"
            error={errors.productId?.message}
            {...register('productId', { required: 'Product is required' })}
          />
          <Select
            label="Movement Type"
            required
            options={[
              { value: 'IN', label: 'Stock IN (Receiving)' },
              { value: 'OUT', label: 'Stock OUT (Dispatching)' },
            ]}
            error={errors.movementType?.message}
            {...register('movementType', { required: 'Type is required' })}
          />
          <Input
            label="Quantity"
            type="number"
            min={1}
            required
            error={errors.quantity?.message}
            {...register('quantity', { required: 'Quantity is required', min: { value: 1, message: 'Must be at least 1' } })}
          />
          <Textarea
            label="Reason"
            required
            rows={3}
            placeholder="e.g. Received from supplier, Damaged goods, etc."
            error={errors.reason?.message}
            {...register('reason', { required: 'Reason is required' })}
          />
        </form>
      </Modal>
    </div>
  );
};

export default StockPage;
