import api from './api';
import type { Customer, FollowUp, CustomerQueryParams, PaginatedResponse, ApiResponse } from '../types';

export const customerService = {
  getAll: async (params: CustomerQueryParams = {}): Promise<PaginatedResponse<Customer>> => {
    const res = await api.get('/api/customers', { params });
    return res.data;
  },

  getById: async (id: number): Promise<ApiResponse<Customer>> => {
    const res = await api.get(`/api/customers/${id}`);
    return res.data;
  },

  create: async (data: Partial<Customer>): Promise<ApiResponse<Customer>> => {
    const res = await api.post('/api/customers', data);
    return res.data;
  },

  update: async (id: number, data: Partial<Customer>): Promise<ApiResponse<Customer>> => {
    const res = await api.put(`/api/customers/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<ApiResponse> => {
    const res = await api.delete(`/api/customers/${id}`);
    return res.data;
  },

  createFollowUp: async (customerId: number, data: { followUpDate: string; notes: string }): Promise<ApiResponse<FollowUp>> => {
    const res = await api.post(`/api/customers/${customerId}/follow-ups`, data);
    return res.data;
  },
};
