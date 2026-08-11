import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit2, Eye, Package, AlertTriangle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { productService } from '../../services/productService';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { TableSkeleton, EmptyState } from '../../components/ui/Spinner';
import { useAppToast } from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, getApiErrorMessage } from '../../utils/formatters';
import type { Product } from '../../types';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required').regex(/^[A-Za-z0-9_-]+$/, 'SKU: letters, numbers, hyphens only'),
  category: z.string().min(1, 'Category is required'),
  unitPrice: z.coerce.number().min(0, 'Price cannot be negative'),
  currentStock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
  minimumStock: z.coerce.number().int().min(0, 'Min stock cannot be negative'),
  warehouseLocation: z.string().min(1, 'Warehouse location is required'),
});

type ProductFormData = z.infer<typeof productSchema>;

const ProductsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const toast = useAppToast();
  const queryClient = useQueryClient();
  const canWrite = hasRole('ADMIN', 'WAREHOUSE');

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search, categoryFilter, lowStockOnly],
    queryFn: () =>
      productService.getAll({
        page,
        limit: 10,
        search: search || undefined,
        category: categoryFilter || undefined,
        lowStock: lowStockOnly || undefined,
      }),
    placeholderData: (prev) => prev,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['product-categories'],
    queryFn: () => productService.getCategories(),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { currentStock: 0, minimumStock: 0, unitPrice: 0 },
  });

  const createMutation = useMutation({
    mutationFn: (d: ProductFormData) => productService.create(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-categories'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Product created successfully');
      setIsModalOpen(false);
      reset();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductFormData }) => productService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Product updated successfully');
      setIsModalOpen(false);
      setEditingProduct(null);
      reset();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const onSubmit = (d: ProductFormData) => {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: d });
    } else {
      createMutation.mutate(d);
    }
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    reset({
      name: product.name,
      sku: product.sku,
      category: product.category,
      unitPrice: product.unitPrice,
      currentStock: product.currentStock,
      minimumStock: product.minimumStock,
      warehouseLocation: product.warehouseLocation,
    });
    setIsModalOpen(true);
  };

  const openCreate = () => {
    setEditingProduct(null);
    reset({ currentStock: 0, minimumStock: 0, unitPrice: 0 });
    setIsModalOpen(true);
  };

  const products = data?.data ?? [];
  const pagination = data?.pagination;
  const categories = categoriesData?.data ?? [];
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Products"
        subtitle={`${pagination?.total ?? '—'} products in catalog`}
        actions={
          canWrite && (
            <Button variant="primary" leftIcon={<Plus size={16} />} onClick={openCreate}>
              Add Product
            </Button>
          )
        }
      />

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-48">
            <Input
              placeholder="Search by name, SKU, category…"
              leftIcon={<Search size={14} />}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Select
            options={categories.map((c) => ({ value: c, label: c }))}
            placeholder="All Categories"
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="w-44"
          />
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => { setLowStockOnly(e.target.checked); setPage(1); }}
              className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-zinc-950 dark:focus:ring-zinc-100 bg-white dark:bg-zinc-900"
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300 font-medium flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-amber-500" />
              Low Stock Only
            </span>
          </label>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="table-header text-left">Product</th>
                <th className="table-header text-left">SKU</th>
                <th className="table-header text-left">Category</th>
                <th className="table-header text-right">Unit Price</th>
                <th className="table-header text-right">Stock</th>
                <th className="table-header text-right">Min Stock</th>
                <th className="table-header text-left">Location</th>
                <th className="table-header text-left">Status</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9}><TableSkeleton rows={8} cols={8} /></td></tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <EmptyState
                      title="No products found"
                      message={search ? 'Try adjusting your search or filters.' : 'Add your first product to get started.'}
                      icon={<Package size={40} />}
                      action={canWrite ? <Button variant="primary" leftIcon={<Plus size={14} />} onClick={openCreate}>Add Product</Button> : undefined}
                    />
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="table-row">
                    <td className="table-cell">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{product.name}</p>
                    </td>
                    <td className="table-cell">
                      <code className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-1.5 py-0.5 rounded font-mono">{product.sku}</code>
                    </td>
                    <td className="table-cell">
                      <Badge variant="default">{product.category}</Badge>
                    </td>
                    <td className="table-cell text-right font-medium text-zinc-700 dark:text-zinc-300">{formatCurrency(product.unitPrice)}</td>
                    <td className={`table-cell text-right font-bold ${product.isLowStock ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {product.currentStock}
                    </td>
                    <td className="table-cell text-right text-zinc-500 dark:text-zinc-400">{product.minimumStock}</td>
                    <td className="table-cell text-zinc-600 dark:text-zinc-300">
                      <code className="text-xs">{product.warehouseLocation}</code>
                    </td>
                    <td className="table-cell">
                      {product.isLowStock ? (
                        <Badge variant="danger" dot>Low Stock</Badge>
                      ) : (
                        <Badge variant="success" dot>In Stock</Badge>
                      )}
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Eye size={13} />}
                          onClick={() => setViewingProduct(product)}
                        >
                          View
                        </Button>
                        {canWrite && (
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<Edit2 size={13} />}
                            onClick={() => openEdit(product)}
                          >
                            Edit
                          </Button>
                        )}
                      </div>
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

      {/* View Product Modal */}
      <Modal
        isOpen={!!viewingProduct}
        onClose={() => setViewingProduct(null)}
        title="View Product Details"
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="secondary" onClick={() => setViewingProduct(null)}>
              Close
            </Button>
            {canWrite && viewingProduct && (
              <Button
                variant="primary"
                leftIcon={<Edit2 size={14} />}
                onClick={() => {
                  const p = viewingProduct;
                  setViewingProduct(null);
                  openEdit(p);
                }}
              >
                Edit Product
              </Button>
            )}
          </div>
        }
      >
        {viewingProduct && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 mb-1">Product Name</label>
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-md text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {viewingProduct.name}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 mb-1">SKU</label>
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-md text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  {viewingProduct.sku}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 mb-1">Category</label>
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-md flex items-center">
                  <Badge variant="default">{viewingProduct.category}</Badge>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 mb-1">Unit Price</label>
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-md text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {formatCurrency(viewingProduct.unitPrice)}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 mb-1">Current Stock</label>
                <div className={`p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-md text-sm font-bold ${viewingProduct.isLowStock ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {viewingProduct.currentStock} units
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 mb-1">Minimum Stock Alert</label>
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-md text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {viewingProduct.minimumStock} units
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 mb-1">Warehouse Location</label>
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-md text-sm font-mono text-zinc-900 dark:text-zinc-100">
                  {viewingProduct.warehouseLocation || '—'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 mb-1">Stock Status</label>
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-md flex items-center">
                  {viewingProduct.isLowStock ? (
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

      {/* Edit/Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); reset(); setEditingProduct(null); }}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setIsModalOpen(false); reset(); setEditingProduct(null); }}>Cancel</Button>
            <Button variant="primary" isLoading={isSubmitting} onClick={handleSubmit(onSubmit)}>
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </>
        }
      >
        <form className="grid grid-cols-2 gap-4" noValidate>
          <div className="col-span-2">
            <Input label="Product Name" required error={errors.name?.message} {...register('name')} />
          </div>
          <Input label="SKU" required hint="Letters, numbers, hyphens only" error={errors.sku?.message} {...register('sku')} disabled={!!editingProduct} />
          <Input label="Category" required error={errors.category?.message} {...register('category')} />
          <Input label="Unit Price (₹)" type="number" min={0} step={0.01} required error={errors.unitPrice?.message} {...register('unitPrice')} />
          <Input label="Warehouse Location" required error={errors.warehouseLocation?.message} {...register('warehouseLocation')} />
          <Input label="Current Stock" type="number" min={0} required error={errors.currentStock?.message} {...register('currentStock')} />
          <Input label="Minimum Stock" type="number" min={0} required hint="Alert when stock falls to or below this value" error={errors.minimumStock?.message} {...register('minimumStock')} />
        </form>
      </Modal>
    </div>
  );
};

export default ProductsPage;

