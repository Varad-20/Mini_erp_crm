import api from './api';
import type { User, ApiResponse } from '../types';

export const userService = {
  getUsers: async (): Promise<ApiResponse<User[]>> => {
    const res = await api.get('/api/users');
    return res.data;
  },
  
  createUser: async (data: any): Promise<ApiResponse<User>> => {
    const res = await api.post('/api/users', data);
    return res.data;
  },
  
  updateUser: async (id: string, data: any): Promise<ApiResponse<User>> => {
    const res = await api.put(`/api/users/${id}`, data);
    return res.data;
  },

  deleteUser: async (id: string): Promise<ApiResponse<null>> => {
    const res = await api.delete(`/api/users/${id}`);
    return res.data;
  }
};

