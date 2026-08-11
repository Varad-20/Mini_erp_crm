import api from './api';
import type { Customer, FollowUp, CustomerQueryParams, PaginatedResponse, ApiResponse } from '../types';

export const customerService = {
  getAll: async (params: CustomerQueryParams = {}): Promise<PaginatedResponse<Customer>> => {
    const res = await api.get('/api/customers', { params });
    return res.data;
  },

  getById: async (id: string): Promise<ApiResponse<Customer>> => {
    const res = await api.get(`/api/customers/${id}`);
    return res.data;
  },

  create: async (data: Partial<Customer>): Promise<ApiResponse<Customer>> => {
    const res = await api.post('/api/customers', data);
    return res.data;
  },

  update: async (id: string, data: Partial<Customer>): Promise<ApiResponse<Customer>> => {
    const res = await api.put(`/api/customers/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<ApiResponse> => {
    const res = await api.delete(`/api/customers/${id}`);
    return res.data;
  },

  createFollowUp: async (customerId: string, data: { followUpDate: string; notes: string }): Promise<ApiResponse<FollowUp>> => {
    const res = await api.post(`/api/customers/${customerId}/follow-ups`, data);
    return res.data;
  },
};

