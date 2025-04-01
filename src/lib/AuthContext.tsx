import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../api/services/authService';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string, student_id: string) => Promise<boolean>;
  logout: () => void;
  getCurrentUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('token'));

  useEffect(() => {
    async function loadUser() {
      setLoading(true);
      
      // 如果有token但没有用户信息，获取用户信息
      if (token && !user) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('获取用户信息失败', error);
          // 如果获取用户信息失败，清除token
          localStorage.removeItem('token');
          setToken(null);
          setIsAuthenticated(false);
        }
      }
      
      setLoading(false);
    }

    loadUser();
  }, [token, user]);

  // 用户登录
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authService.login({ email, password });
      
      if (response && response.token) {
        localStorage.setItem('token', response.token);
        setToken(response.token);
        setUser(response.user);
        setIsAuthenticated(true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('登录失败', error);
      setError('登录失败，请检查邮箱和密码');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 用户注册
  const register = async (email: string, password: string, name: string, student_id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authService.register({ 
        email, 
        password, 
        name, 
        student_id 
      });
      
      if (response && response.token) {
        localStorage.setItem('token', response.token);
        setToken(response.token);
        setUser(response.user);
        setIsAuthenticated(true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('注册失败', error);
      setError('注册失败，请稍后重试');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 获取当前用户信息
  const getCurrentUser = async () => {
    try {
      setLoading(true);
      
      const userData = await authService.getCurrentUser();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('获取用户信息失败', error);
      setError('获取用户信息失败');
      // 如果获取用户信息失败，清除token
      localStorage.removeItem('token');
      setToken(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // 用户登出
  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    getCurrentUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 