import { apiClient } from '../client';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../../types';

export const authService = {
  // 用户登录
  login: (data: LoginRequest): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/auth/login', data);
  },

  // 用户注册
  register: (data: RegisterRequest): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/auth/register', data);
  },

  // 获取当前用户信息
  getCurrentUser: (): Promise<User> => {
    return apiClient.get<User>('/auth/me');
  },

  // 检查用户是否已认证
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('token');
    return !!token;
  },

  // 用户登出
  logout: (): void => {
    localStorage.removeItem('token');
  }
};

export default authService; 