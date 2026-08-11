import api from './api';
import type { Product, ProductQueryParams, PaginatedResponse, ApiResponse } from '../types';

export const productService = {
  getAll: async (params: ProductQueryParams = {}): Promise<PaginatedResponse<Product>> => {
    const res = await api.get('/api/products', { params });
    return res.data;
  },

  getById: async (id: number): Promise<ApiResponse<Product>> => {
    const res = await api.get(`/api/products/${id}`);
    return res.data;
  },

  create: async (data: Partial<Product>): Promise<ApiResponse<Product>> => {
    const res = await api.post('/api/products', data);
    return res.data;
  },

  update: async (id: number, data: Partial<Product>): Promise<ApiResponse<Product>> => {
    const res = await api.put(`/api/products/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<ApiResponse> => {
    const res = await api.delete(`/api/products/${id}`);
    return res.data;
  },

  getCategories: async (): Promise<ApiResponse<string[]>> => {
    const res = await api.get('/api/products/categories');
    return res.data;
  },
};
