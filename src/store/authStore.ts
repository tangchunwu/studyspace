import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  student_id: string;
  credit_score: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  
  // 注册新用户
  register: (name: string, email: string, password: string, student_id: string) => Promise<boolean>;
  
  // 用户登录
  login: (email: string, password: string) => Promise<boolean>;
  
  // 获取当前用户信息
  getCurrentUser: () => Promise<void>;
  
  // 用户登出
  logout: () => void;
  
  // 重置错误状态
  resetError: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      
      register: async (name, email, password, student_id) => {
        try {
          set({ loading: true, error: null });
          
          const response = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password, student_id })
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.message || '注册失败');
          }
          
          set({
            user: {
              id: data.id,
              name: data.name,
              email: data.email,
              student_id: data.student_id,
              credit_score: data.credit_score
            },
            token: data.token,
            isAuthenticated: true,
            loading: false
          });
          
          // 存储token到localStorage
          localStorage.setItem('token', data.token);
          
          return true;
        } catch (error) {
          console.error('注册失败:', error);
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : '注册失败' 
          });
          return false;
        }
      },
      
      login: async (email, password) => {
        try {
          set({ loading: true, error: null });
          
          const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.message || '登录失败');
          }
          
          set({
            user: {
              id: data.id,
              name: data.name,
              email: data.email,
              student_id: data.student_id,
              credit_score: data.credit_score
            },
            token: data.token,
            isAuthenticated: true,
            loading: false
          });
          
          // 存储token到localStorage
          localStorage.setItem('token', data.token);
          
          return true;
        } catch (error) {
          console.error('登录失败:', error);
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : '登录失败' 
          });
          return false;
        }
      },
      
      getCurrentUser: async () => {
        try {
          const token = localStorage.getItem('token');
          
          if (!token) {
            throw new Error('未登录');
          }
          
          set({ loading: true, error: null });
          
          const response = await fetch('http://localhost:3000/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.message || '获取用户信息失败');
          }
          
          set({
            user: {
              id: data.id,
              name: data.name,
              email: data.email,
              student_id: data.student_id,
              credit_score: data.credit_score
            },
            token,
            isAuthenticated: true,
            loading: false
          });
        } catch (error) {
          console.error('获取用户信息失败:', error);
          // 如果token无效，清除登录状态
          if (error instanceof Error && (
            error.message.includes('未登录') || 
            error.message.includes('无效') || 
            error.message.includes('过期')
          )) {
            get().logout();
          }
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : '获取用户信息失败' 
          });
        }
      },
      
      logout: () => {
        // 清除localStorage中的token
        localStorage.removeItem('token');
        
        set({
          user: null,
          token: null,
          isAuthenticated: false
        });
      },
      
      resetError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        token: state.token,
        isAuthenticated: state.isAuthenticated 
      })
    }
  )
);

export default useAuthStore; 