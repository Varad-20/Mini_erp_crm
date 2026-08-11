import api from './api';
import type { ApiResponse, DashboardStats } from '../types';

export const dashboardService = {
  getStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const res = await api.get('/api/dashboard');
    return res.data;
  },
};
