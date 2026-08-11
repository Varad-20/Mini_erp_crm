import api from './api';
import type { Product, StockMovement, PaginatedResponse, ApiResponse } from '../types';

export const stockService = {
  getOverview: async (): Promise<ApiResponse<Product[]>> => {
    const res = await api.get('/api/stock');
    return res.data;
  },

  getMovements: async (params: { page?: number; limit?: number; productId?: number; type?: string } = {}): Promise<PaginatedResponse<StockMovement>> => {
    const res = await api.get('/api/stock/movements', { params });
    return res.data;
  },

  createMovement: async (data: { productId: string; quantity: number; movementType: 'IN' | 'OUT'; reason: string }): Promise<ApiResponse> => {
    const res = await api.post('/api/stock/movements', data);
    return res.data;
  },
};

