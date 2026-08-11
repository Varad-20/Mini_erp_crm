import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Users, Plus, Shield, Mail, Lock, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { TableSkeleton, EmptyState, Spinner } from '../../components/ui/Spinner';
import { PageHeader } from '../../components/layout/PageHeader';
import { StatusBadge } from '../../components/ui/Badge';
import { userService } from '../../services/userService';
import { formatDate } from '../../utils/formatters';
import { useAppToast } from '../../components/layout/Layout';

const createUserSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']),
});

const updateUserSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().optional().refine(val => !val || val.length >= 6, {
    message: 'Password must be at least 6 characters',
  }),
  role: z.enum(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']),
});

type CreateUserForm = z.infer<typeof createUserSchema>;
type UpdateUserForm = z.infer<typeof updateUserSchema>;

const UsersPage: React.FC = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const queryClient = useQueryClient();
  const toast = useAppToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateUserForm) => userService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created successfully');
      setIsCreateOpen(false);
      reset();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create user');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; data: UpdateUserForm }) => userService.updateUser(data.id, data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated successfully');
      setIsEditOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update user');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully');
      setIsDeleteOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete user');
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: 'SALES' },
  });

  const { register: registerEdit, handleSubmit: handleEditSubmit, reset: resetEdit, formState: { errors: editErrors } } = useForm<UpdateUserForm>({
    resolver: zodResolver(updateUserSchema),
  });

  const onSubmit = (data: CreateUserForm) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: UpdateUserForm) => {
    if (selectedUser) {
      updateMutation.mutate({ id: selectedUser.id, data });
    }
  };

  const openEditModal = (user: any) => {
    setSelectedUser(user);
    resetEdit({
      name: user.name,
      email: user.email,
      role: user.role,
      password: '',
    });
    setIsEditOpen(true);
  };

  const openDeleteModal = (user: any) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  const users = data?.data || [];

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Manage system users and access roles"
        actions={
          <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => setIsCreateOpen(true)}>
            Add User
          </Button>
        }
      />

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-md text-sm text-red-700 dark:text-red-300 font-medium">
          Failed to load users. Please refresh.
        </div>
      )}

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="table-header text-left">User</th>
                <th className="table-header text-left">Email</th>
                <th className="table-header text-left">Role</th>
                <th className="table-header text-left">Created</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5}><TableSkeleton rows={5} cols={5} /></td></tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      title="No users found"
                      message="Add your first user to get started."
                      icon={<Users size={40} />}
                    />
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">{user.name}</p>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                        <Mail size={14} />
                        <span>{user.email}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={user.role as any} />
                    </td>
                    <td className="table-cell text-sm text-zinc-500 dark:text-zinc-400">
                      {user.createdAt ? formatDate(user.createdAt) : '—'}
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openEditModal(user)}
                          title="Edit User"
                          className="px-2"
                        >
                          <Edit2 size={14} />
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => openDeleteModal(user)}
                          title="Delete User"
                          className="px-2"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New User"
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="John Doe"
            error={errors.name?.message}
            {...register('name')}
            required
            leftIcon={<Users size={16} className="text-zinc-400" />}
          />
          
          <Input
            label="Email Address"
            type="email"
            placeholder="john@example.com"
            error={errors.email?.message}
            {...register('email')}
            required
            leftIcon={<Mail size={16} className="text-zinc-400" />}
          />
          
          <Input
            label="Password"
            type="password"
            placeholder="Min 6 characters"
            error={errors.password?.message}
            {...register('password')}
            required
            leftIcon={<Lock size={16} className="text-zinc-400" />}
          />

          <Select
            label="Role"
            error={errors.role?.message}
            {...register('role')}
            required
            options={[
              { value: 'ADMIN', label: 'Admin (Full Access)' },
              { value: 'SALES', label: 'Sales' },
              { value: 'WAREHOUSE', label: 'Warehouse' },
              { value: 'ACCOUNTS', label: 'Accounts' },
            ]}
          />

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800">
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={createMutation.isPending} leftIcon={createMutation.isPending ? <Spinner size="sm" /> : <Shield size={16} />}>
              Create User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit User"
        size="md"
      >
        <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4">
          <Input
            label="Full Name"
            error={editErrors.name?.message}
            {...registerEdit('name')}
            required
            leftIcon={<Users size={16} className="text-zinc-400" />}
          />
          
          <Input
            label="Email Address"
            type="email"
            error={editErrors.email?.message}
            {...registerEdit('email')}
            required
            leftIcon={<Mail size={16} className="text-zinc-400" />}
          />
          
          <Input
            label="Password"
            type="password"
            placeholder="Leave blank to keep current"
            error={editErrors.password?.message}
            {...registerEdit('password')}
            leftIcon={<Lock size={16} className="text-zinc-400" />}
          />

          <Select
            label="Role"
            error={editErrors.role?.message}
            {...registerEdit('role')}
            required
            options={[
              { value: 'ADMIN', label: 'Admin (Full Access)' },
              { value: 'SALES', label: 'Sales' },
              { value: 'WAREHOUSE', label: 'Warehouse' },
              { value: 'ACCOUNTS', label: 'Accounts' },
            ]}
          />

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800">
            <Button type="button" variant="secondary" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={updateMutation.isPending} leftIcon={updateMutation.isPending ? <Spinner size="sm" /> : <Edit2 size={16} />}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete User"
        size="sm"
      >
        <div className="p-1">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center mb-4 mx-auto">
            <AlertTriangle className="text-red-600 dark:text-red-400" size={24} />
          </div>
          <h3 className="text-lg font-bold text-center text-zinc-900 dark:text-white mb-2">Delete User?</h3>
          <p className="text-zinc-500 dark:text-zinc-400 text-center text-sm mb-6">
            Are you sure you want to delete <span className="font-semibold text-zinc-700 dark:text-zinc-300">{selectedUser?.name}</span>? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="danger" 
              className="flex-1" 
              onClick={() => {
                if (selectedUser) deleteMutation.mutate(selectedUser.id);
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Spinner size="sm" /> : 'Yes, Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UsersPage;

