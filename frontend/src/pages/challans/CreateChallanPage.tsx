import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, ArrowLeft, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { challanService } from '../../services/challanService';
import { customerService } from '../../services/customerService';
import { productService } from '../../services/productService';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/Modal';
import { useAppToast } from '../../components/layout/Layout';
import { formatCurrency, getApiErrorMessage } from '../../utils/formatters';

interface LineItem {
  productId: string;
  quantity: number;
  productName: string;
  sku: string;
  unitPrice: number;
  currentStock: number;
}

const CreateChallanPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useAppToast();
  const queryClient = useQueryClient();

  const prefillCustomerId = location.state?.customerId as number | undefined;

  const [customerId, setCustomerId] = useState<string>(prefillCustomerId ? String(prefillCustomerId) : '');
  const [items, setItems] = useState<LineItem[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [savingAs, setSavingAs] = useState<'DRAFT' | 'CONFIRMED'>('DRAFT');

  const { data: customersData } = useQuery({
    queryKey: ['customers-all'],
    queryFn: () => customerService.getAll({ limit: 100 }),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => productService.getAll({ limit: 100 }),
  });

  const customers = customersData?.data ?? [];
  const products = productsData?.data ?? [];

  useEffect(() => {
    if (prefillCustomerId) setCustomerId(String(prefillCustomerId));
  }, [prefillCustomerId]);

  const createMutation = useMutation({
    mutationFn: (status: 'DRAFT' | 'CONFIRMED') =>
      challanService.create({
        customerId: customerId,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        status,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['challans'] });
      queryClient.invalidateQueries({ queryKey: ['stock-overview'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      const created = res.data;
      toast.success(`Challan ${created?.challanNumber ?? ''} ${savingAs === 'DRAFT' ? 'saved as draft' : 'confirmed'} successfully`);
      navigate(`/challans/${created?.id}`);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err));
      setConfirmOpen(false);
    },
  });

  const addItem = () => {
    if (products.length === 0) return;
    const firstProduct = products[0];
    setItems((prev) => [
      ...prev,
      {
        productId: firstProduct.id,
        quantity: 1,
        productName: firstProduct.name,
        sku: firstProduct.sku,
        unitPrice: firstProduct.unitPrice,
        currentStock: firstProduct.currentStock,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              productId: product.id,
              quantity: item.quantity,
              productName: product.name,
              sku: product.sku,
              unitPrice: product.unitPrice,
              currentStock: product.currentStock,
            }
          : item
      )
    );
  };

  const updateQty = (index: number, qty: number) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, quantity: Math.max(1, qty) } : item)));
  };

  const totalQuantity = items.reduce((s, i) => s + i.quantity, 0);

  const canSave = customerId && items.length > 0 && items.every((i) => i.quantity > 0);

  const handleSave = (status: 'DRAFT' | 'CONFIRMED') => {
    if (!canSave) { toast.error('Please select a customer and add at least one item.'); return; }
    setSavingAs(status);
    if (status === 'CONFIRMED') {
      setConfirmOpen(true);
    } else {
      createMutation.mutate('DRAFT');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <PageHeader title="Create Challan" subtitle="Select a customer and add products" />

      <div className="space-y-6">
        {/* Customer */}
        <Card>
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">Customer Details</h2>
          <div className="max-w-sm">
            <Select
              label="Select Customer"
              required
              options={customers.map((c) => ({ value: String(c.id), label: `${c.name} — ${c.businessName}` }))}
              placeholder="Choose a customer…"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            />
          </div>
        </Card>

        {/* Products */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Products</h2>
            <Button variant="secondary" size="sm" leftIcon={<Plus size={14} />} onClick={addItem}>
              Add Product
            </Button>
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-400 dark:text-zinc-500">
              <Plus size={32} className="mb-2" />
              <p className="text-sm">No products added yet. Click "Add Product" to start.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="table-header text-left">Product</th>
                    <th className="table-header text-left">SKU</th>
                    <th className="table-header text-right">Available Stock</th>
                    <th className="table-header text-right">Unit Price</th>
                    <th className="table-header text-right">Quantity</th>
                    <th className="table-header text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const isOverstock = item.quantity > item.currentStock;
                    return (
                      <tr key={index} className="border-t border-zinc-100 dark:border-zinc-800">
                        <td className="table-cell min-w-48">
                          <select
                            value={item.productId}
                            onChange={(e) => updateItem(index, e.target.value)}
                            className="input-field text-sm py-1.5"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">{p.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="table-cell">
                          <code className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-1.5 py-0.5 rounded">{item.sku}</code>
                        </td>
                        <td className={`table-cell text-right font-bold ${isOverstock ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {item.currentStock}
                          {isOverstock && (
                            <div className="flex items-center justify-end gap-1 mt-0.5">
                              <AlertCircle size={12} className="text-red-500" />
                              <span className="text-xs text-red-500 dark:text-red-400 font-normal">Insufficient</span>
                            </div>
                          )}
                        </td>
                        <td className="table-cell text-right text-zinc-700 dark:text-zinc-300">{formatCurrency(item.unitPrice)}</td>
                        <td className="table-cell text-right">
                          <input
                            type="number"
                            value={item.quantity}
                            min={1}
                            onChange={(e) => updateQty(index, parseInt(e.target.value) || 1)}
                            className={`w-20 text-right px-2 py-1.5 border rounded-lg text-sm bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-zinc-100 ${
                              isOverstock ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40' : 'border-zinc-300 dark:border-zinc-700'
                            }`}
                          />
                        </td>
                        <td className="table-cell text-right">
                          <button
                            onClick={() => removeItem(index)}
                            className="p-1.5 text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                            aria-label="Remove item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t-2 border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <td colSpan={4} className="table-cell text-right font-semibold text-zinc-700 dark:text-zinc-300">Total Quantity:</td>
                    <td className="table-cell text-right font-bold text-zinc-900 dark:text-zinc-100 text-lg">{totalQuantity}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={() => navigate('/challans')} disabled={createMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            leftIcon={<Save size={16} />}
            isLoading={createMutation.isPending && savingAs === 'DRAFT'}
            onClick={() => handleSave('DRAFT')}
          >
            Save as Draft
          </Button>
          <Button
            variant="success"
            leftIcon={<CheckCircle size={16} />}
            isLoading={createMutation.isPending && savingAs === 'CONFIRMED'}
            onClick={() => handleSave('CONFIRMED')}
          >
            Confirm Challan
          </Button>
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => createMutation.mutate('CONFIRMED')}
        title="Confirm Challan"
        message={`This will confirm the challan and deduct stock for ${items.length} product(s) (total qty: ${totalQuantity}). This action cannot be undone. Proceed?`}
        confirmLabel="Yes, Confirm & Deduct Stock"
        variant="success"
        isLoading={createMutation.isPending}
      />
    </div>
  );
};

export default CreateChallanPage;

