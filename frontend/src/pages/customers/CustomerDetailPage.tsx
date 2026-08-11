import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Phone, Mail, MapPin, Building2, Calendar, MessageSquare, Clock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { customerService } from '../../services/customerService';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { PageLoader, EmptyState } from '../../components/ui/Spinner';
import { useAppToast } from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatDateTime, getApiErrorMessage } from '../../utils/formatters';

const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { hasRole } = useAuth();
  const toast = useAppToast();
  const queryClient = useQueryClient();
  const canWrite = hasRole('ADMIN', 'SALES');
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customerService.getById(id!),
    enabled: !!id,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<{ followUpDate: string; notes: string }>();

  const followUpMutation = useMutation({
    mutationFn: (d: { followUpDate: string; notes: string }) =>
      customerService.createFollowUp(id!, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Follow-up added successfully');
      setIsFollowUpOpen(false);
      reset();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  if (isLoading) return <PageLoader />;
  if (error || !data?.data) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">Failed to load customer details.</p>
        <Link to="/customers" className="text-indigo-600 hover:underline mt-2 inline-block">← Back to Customers</Link>
      </div>
    );
  }

  const customer = data.data;
  const followUps = customer.followUps ?? [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Back */}
      <Link to="/customers" className="inline-flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Customers
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-950/80 rounded-2xl flex items-center justify-center">
                  <span className="text-xl font-bold text-indigo-700 dark:text-indigo-300">
                    {customer.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{customer.name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={customer.status} />
                    <StatusBadge status={customer.customerType} />
                  </div>
                </div>
              </div>
              {canWrite && (
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Plus size={14} />}
                  onClick={() => setIsFollowUpOpen(true)}
                >
                  Add Follow-up
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl">
                <Phone size={16} className="text-zinc-400 dark:text-zinc-500" />
                <div>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">Mobile</p>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{customer.mobile}</p>
                </div>
              </div>
              {customer.email && (
                <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl">
                  <Mail size={16} className="text-zinc-400 dark:text-zinc-500" />
                  <div>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">Email</p>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{customer.email}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl">
                <Building2 size={16} className="text-zinc-400 dark:text-zinc-500" />
                <div>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">Business</p>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{customer.businessName}</p>
                </div>
              </div>
              {customer.gstNumber && (
                <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl">
                  <Building2 size={16} className="text-zinc-400 dark:text-zinc-500" />
                  <div>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">GST Number</p>
                    <p className="text-sm font-mono font-medium text-zinc-800 dark:text-zinc-200">{customer.gstNumber}</p>
                  </div>
                </div>
              )}
              <div className="col-span-2 flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl">
                <MapPin size={16} className="text-zinc-400 dark:text-zinc-500 mt-0.5" />
                <div>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">Address</p>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{customer.address}</p>
                </div>
              </div>
              {customer.notes && (
                <div className="col-span-2 flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-100 dark:border-amber-900/50">
                  <MessageSquare size={16} className="text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Notes</p>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-0.5">{customer.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Follow-up History */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Follow-up History</h2>
              <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-1 rounded-full font-medium">
                {followUps.length} records
              </span>
            </div>
            {followUps.length === 0 ? (
              <EmptyState
                title="No follow-ups yet"
                message="Add a follow-up note to track customer interactions."
                icon={<Clock size={36} />}
              />
            ) : (
              <div className="space-y-3">
                {followUps.map((fu) => (
                  <div key={fu.id} className="flex gap-3">
                    <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-950/80 rounded-full flex items-center justify-center flex-shrink-0">
                      <Calendar size={14} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{formatDate(fu.followUpDate)}</p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">{fu.createdBy?.name} · {formatDateTime(fu.createdAt)}</p>
                      </div>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300">{fu.notes}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card>
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">Customer Details</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">Added on</p>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{formatDate(customer.createdAt)}</p>
              </div>
              {customer.createdBy && (
                <div>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">Created by</p>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{customer.createdBy.name}</p>
                </div>
              )}
              {customer.followUpDate && (
                <div>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">Next follow-up</p>
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">{formatDate(customer.followUpDate)}</p>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link to="/challans/create" state={{ customerId: customer.id }}>
                <Button variant="primary" size="sm" className="w-full" leftIcon={<Plus size={14} />}>
                  Create Challan
                </Button>
              </Link>
              <Link to={`/challans?customerId=${customer.id}`}>
                <Button variant="secondary" size="sm" className="w-full">
                  View Challans
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Follow-up Modal */}
      <Modal
        isOpen={isFollowUpOpen}
        onClose={() => { setIsFollowUpOpen(false); reset(); }}
        title="Add Follow-up"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setIsFollowUpOpen(false); reset(); }}>Cancel</Button>
            <Button
              variant="primary"
              isLoading={followUpMutation.isPending}
              onClick={handleSubmit((d) => followUpMutation.mutate(d))}
            >
              Add Follow-up
            </Button>
          </>
        }
      >
        <form className="space-y-4" noValidate>
          <Input
            label="Follow-up Date"
            type="datetime-local"
            required
            error={errors.followUpDate?.message}
            {...register('followUpDate', { required: 'Date is required' })}
          />
          <Textarea
            label="Notes"
            required
            rows={4}
            placeholder="Describe the follow-up action or outcome…"
            error={errors.notes?.message}
            {...register('notes', { required: 'Notes are required' })}
          />
        </form>
      </Modal>
    </div>
  );
};

export default CustomerDetailPage;


