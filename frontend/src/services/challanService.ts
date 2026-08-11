import api from './api';
import type { Challan, ChallanQueryParams, PaginatedResponse, ApiResponse } from '../types';

export interface CreateChallanData {
  customerId: number;
  items: Array<{ productId: number; quantity: number }>;
  status: 'DRAFT' | 'CONFIRMED';
}

export const challanService = {
  getAll: async (params: ChallanQueryParams = {}): Promise<PaginatedResponse<Challan>> => {
    const res = await api.get('/api/challans', { params });
    return res.data;
  },

  getById: async (id: number): Promise<ApiResponse<Challan>> => {
    const res = await api.get(`/api/challans/${id}`);
    return res.data;
  },

  create: async (data: CreateChallanData): Promise<ApiResponse<Challan>> => {
    const res = await api.post('/api/challans', data);
    return res.data;
  },

  update: async (id: number, data: Partial<CreateChallanData>): Promise<ApiResponse<Challan>> => {
    const res = await api.put(`/api/challans/${id}`, data);
    return res.data;
  },

  confirm: async (id: number): Promise<ApiResponse<Challan>> => {
    const res = await api.post(`/api/challans/${id}/confirm`);
    return res.data;
  },

  cancel: async (id: number): Promise<ApiResponse<Challan>> => {
    const res = await api.post(`/api/challans/${id}/cancel`);
    return res.data;
  },
};
