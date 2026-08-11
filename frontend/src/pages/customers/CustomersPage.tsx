import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Eye, Edit2, Phone, Building2, Users, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { customerService } from '../../services/customerService';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { TableSkeleton, EmptyState } from '../../components/ui/Spinner';
import { useAppToast } from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { formatDate, getApiErrorMessage } from '../../utils/formatters';
import type { Customer, CustomerStatus, CustomerType } from '../../types';

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  mobile: z.string().min(10, 'Valid mobile required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  businessName: z.string().min(1, 'Business name required'),
  gstNumber: z.string().optional(),
  customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']),
  address: z.string().min(1, 'Address required'),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']),
  notes: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

const CustomersPage: React.FC = () => {
  const { hasRole } = useAuth();
  const toast = useAppToast();
  const queryClient = useQueryClient();
  const canWrite = hasRole('ADMIN', 'SALES');

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, search, statusFilter, typeFilter],
    queryFn: () =>
      customerService.getAll({
        page,
        limit: 10,
        search: search || undefined,
        status: (statusFilter as CustomerStatus) || undefined,
        type: (typeFilter as CustomerType) || undefined,
      }),
    placeholderData: (prev) => prev,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: { status: 'LEAD', customerType: 'RETAIL' },
  });

  const createMutation = useMutation({
    mutationFn: (d: CustomerFormData) => customerService.create(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer created successfully');
      setIsModalOpen(false);
      reset();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CustomerFormData }) =>
      customerService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer updated successfully');
      setIsModalOpen(false);
      setEditingId(null);
      reset();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const onSubmit = (d: CustomerFormData) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: d });
    } else {
      createMutation.mutate(d);
    }
  };

  const openEdit = (customer: NonNullable<typeof data>['data'][0]) => {
    setEditingId(customer.id);
    reset({
      name: customer.name,
      mobile: customer.mobile,
      email: customer.email || '',
      businessName: customer.businessName,
      gstNumber: customer.gstNumber || '',
      customerType: customer.customerType,
      address: customer.address,
      status: customer.status,
      notes: customer.notes || '',
    });
    setIsModalOpen(true);
  };

  const openCreate = () => {
    setEditingId(null);
    reset({ status: 'LEAD', customerType: 'RETAIL' });
    setIsModalOpen(true);
  };

  const customers = data?.data ?? [];
  const pagination = data?.pagination;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Customers"
        subtitle={`${pagination?.total ?? '—'} customers registered`}
        actions={
          canWrite && (
            <Button variant="primary" leftIcon={<Plus size={16} />} onClick={openCreate}>
              Add Customer
            </Button>
          )
        }
      />

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48">
            <Input
              placeholder="Search by name, mobile, email…"
              leftIcon={<Search size={14} />}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Select
            options={[
              { value: 'LEAD', label: 'Lead' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
            ]}
            placeholder="All Statuses"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-36"
          />
          <Select
            options={[
              { value: 'RETAIL', label: 'Retail' },
              { value: 'WHOLESALE', label: 'Wholesale' },
              { value: 'DISTRIBUTOR', label: 'Distributor' },
            ]}
            placeholder="All Types"
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="w-36"
          />
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="table-header text-left">Customer</th>
                <th className="table-header text-left">Contact</th>
                <th className="table-header text-left">Type</th>
                <th className="table-header text-left">Status</th>
                <th className="table-header text-left">Follow-up</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6}><TableSkeleton rows={8} cols={6} /></td></tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      title="No customers found"
                      message={search ? 'Try adjusting your search or filters.' : 'Add your first customer to get started.'}
                      icon={<Users size={40} />}
                      action={canWrite ? <Button variant="primary" leftIcon={<Plus size={14} />} onClick={openCreate}>Add Customer</Button> : undefined}
                    />
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="table-row">
                    <td className="table-cell">
                      <div>
                        <p className="font-semibold text-slate-900">{customer.name}</p>
                        <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                          <Building2 size={10} />
                          <span>{customer.businessName}</span>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1 text-slate-600">
                        <Phone size={12} />
                        <span>{customer.mobile}</span>
                      </div>
                      {customer.email && <p className="text-xs text-slate-400 mt-0.5">{customer.email}</p>}
                    </td>
                    <td className="table-cell"><StatusBadge status={customer.customerType} /></td>
                    <td className="table-cell"><StatusBadge status={customer.status} /></td>
                    <td className="table-cell text-xs text-slate-500">
                      {customer.followUpDate ? (
                        <span className="text-amber-600 font-medium">{formatDate(customer.followUpDate)}</span>
                      ) : '—'}
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" leftIcon={<Eye size={13} />} onClick={() => setViewingCustomer(customer)}>
                          View
                        </Button>
                        {canWrite && (
                          <Button variant="ghost" size="sm" leftIcon={<Edit2 size={13} />} onClick={() => openEdit(customer)}>
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
          <div className="border-t border-slate-200 px-4">
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={pagination.limit}
              onPageChange={setPage}
            />
          </div>
        )}
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); reset(); setEditingId(null); }}
        title={editingId ? 'Edit Customer' : 'Add New Customer'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setIsModalOpen(false); reset(); setEditingId(null); }}>Cancel</Button>
            <Button variant="primary" isLoading={isSubmitting} onClick={handleSubmit(onSubmit)}>
              {editingId ? 'Save Changes' : 'Create Customer'}
            </Button>
          </>
        }
      >
        <form className="grid grid-cols-2 gap-4" noValidate>
          <Input label="Full Name" required error={errors.name?.message} {...register('name')} />
          <Input label="Mobile" required error={errors.mobile?.message} {...register('mobile')} />
          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
          <Input label="Business Name" required error={errors.businessName?.message} {...register('businessName')} />
          <Input label="GST Number" error={errors.gstNumber?.message} {...register('gstNumber')} />
          <Select
            label="Customer Type"
            required
            options={[
              { value: 'RETAIL', label: 'Retail' },
              { value: 'WHOLESALE', label: 'Wholesale' },
              { value: 'DISTRIBUTOR', label: 'Distributor' },
            ]}
            error={errors.customerType?.message}
            {...register('customerType')}
          />
          <Select
            label="Status"
            required
            options={[
              { value: 'LEAD', label: 'Lead' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
            ]}
            error={errors.status?.message}
            {...register('status')}
          />
          <div className="col-span-2">
            <Input label="Address" required error={errors.address?.message} {...register('address')} />
          </div>
          <div className="col-span-2">
            <Textarea label="Notes" error={errors.notes?.message} rows={3} {...register('notes')} />
          </div>
        </form>
      </Modal>

      {/* View Customer Modal */}
      <Modal
        isOpen={!!viewingCustomer}
        onClose={() => setViewingCustomer(null)}
        title="View Customer Details"
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Link
              to={viewingCustomer ? `/customers/${viewingCustomer.id}` : '#'}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              Open Full Detail Page →
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => setViewingCustomer(null)}>
                Close
              </Button>
              {canWrite && viewingCustomer && (
                <Button
                  variant="primary"
                  leftIcon={<Edit2 size={13} />}
                  onClick={() => {
                    const c = viewingCustomer;
                    setViewingCustomer(null);
                    openEdit(c);
                  }}
                >
                  Edit Customer
                </Button>
              )}
            </div>
          </div>
        }
      >
        {viewingCustomer && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 mb-1">Full Name</label>
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-md text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {viewingCustomer.name}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 mb-1">Mobile</label>
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-md text-sm font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Phone size={14} className="text-zinc-400 dark:text-zinc-500" />
                  {viewingCustomer.mobile}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 mb-1">Email</label>
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-md text-sm font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Mail size={14} className="text-zinc-400 dark:text-zinc-500" />
                  {viewingCustomer.email || '—'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 mb-1">Business Name</label>
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-md text-sm font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Building2 size={14} className="text-zinc-400 dark:text-zinc-500" />
                  {viewingCustomer.businessName}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 mb-1">GST Number</label>
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-md text-sm font-mono text-zinc-800 dark:text-zinc-200">
                  {viewingCustomer.gstNumber || '—'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 mb-1">Customer Type</label>
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-md flex items-center">
                  <StatusBadge status={viewingCustomer.customerType} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 mb-1">Status</label>
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-md flex items-center">
                  <StatusBadge status={viewingCustomer.status} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 mb-1">Follow-up Date</label>
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-md text-sm font-medium text-amber-600 dark:text-amber-400">
                  {viewingCustomer.followUpDate ? formatDate(viewingCustomer.followUpDate) : '—'}
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 mb-1">Address</label>
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-md text-sm text-zinc-800 dark:text-zinc-200">
                  {viewingCustomer.address}
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 mb-1">Notes</label>
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-md text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap min-h-[60px]">
                  {viewingCustomer.notes || 'No notes added'}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CustomersPage;
