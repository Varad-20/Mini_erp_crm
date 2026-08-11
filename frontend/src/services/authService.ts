import api from './api';
import type { ApiResponse, AuthResponse } from '../types';

export const authService = {
  login: async (email: string, password: string): Promise<ApiResponse<AuthResponse>> => {
    const res = await api.post('/api/auth/login', { email, password });
    return res.data;
  },

  getMe: async (): Promise<ApiResponse> => {
    const res = await api.get('/api/auth/me');
    return res.data;
  },
};
