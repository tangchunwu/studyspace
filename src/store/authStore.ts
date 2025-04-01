import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '../api/client';
import { getToken, setToken, removeToken } from '../utils/token';
import type { User, AuthResponse } from '../types';

// 用于跟踪全局的请求状态
const requestState = {
  lastGetUserRequest: 0,
  userRequestInProgress: false
};

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
  
  // 更新用户资料
  updateProfile: (userData: Partial<User>) => Promise<boolean>;
  
  // 重置错误状态
  resetError: () => void;
  
  // 初始化认证状态
  initAuth: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: getToken(), // 初始化时从本地存储获取token
      isAuthenticated: !!getToken(), // 基于token存在性判断认证状态
      loading: false,
      error: null,
      
      // 初始化认证状态
      initAuth: () => {
        const token = getToken();
        if (token) {
          console.log('发现存储的token，恢复认证状态');
          set({ token, isAuthenticated: true });
          
          // 如果用户信息为空且没有正在进行的请求，获取用户信息
          const { user } = get();
          if (!user && !requestState.userRequestInProgress) {
            get().getCurrentUser().catch(err => {
              console.error('初始化认证状态失败:', err);
              removeToken();
              set({ 
                token: null, 
                isAuthenticated: false, 
                user: null 
              });
            });
          }
        } else {
          console.log('未找到存储的token，用户未认证');
          set({ token: null, isAuthenticated: false, user: null });
        }
      },
      
      register: async (name, email, password, student_id) => {
        set({ loading: true, error: null });
        try {
          const response = await apiClient.post('/auth/register', {
            name,
            email, 
            password,
            student_id
          });
          
          // 提取并存储token和用户信息
          const { token, user } = response;
          
          if (token) {
            setToken(token);
            
            set({
              token,
              user,
              isAuthenticated: true,
              loading: false,
              error: null
            });
            
            return true;
          } else {
            throw new Error('注册成功但未返回有效token');
          }
        } catch (error: any) {
          const errorMessage = error.message || '注册失败，请稍后再试';
          console.error('注册错误:', errorMessage);
          
          set({
            loading: false,
            error: errorMessage,
            token: null,
            isAuthenticated: false
          });
          
          return false;
        }
      },
      
      login: async (email, password) => {
        set({ loading: true, error: null });
        
        try {
          console.log(`尝试登录用户: ${email}`);
          const response = await apiClient.post('/auth/login', { 
            email, 
            password 
          });
          
          console.log('登录响应:', response);
          
          // 检查响应中是否包含token和user
          if (!response.token || !response.user) {
            throw new Error('登录成功但服务器响应格式不正确');
          }
          
          const { token, user } = response;
          
          // 保存token到localStorage
          setToken(token);
          
          set({
            token,
            user,
            isAuthenticated: true,
            loading: false,
            error: null
          });
          
          console.log('用户登录成功:', user.name);
          return true;
        } catch (error: any) {
          const errorMessage = error.message || '登录失败，请检查邮箱和密码';
          console.error('登录错误:', errorMessage);
          
          // 清除任何可能存在的无效token
          removeToken();
          
          set({
            loading: false,
            error: errorMessage,
            token: null,
            user: null,
            isAuthenticated: false
          });
          
          return false;
        }
      },
      
      getCurrentUser: async () => {
        const { token, user } = get();
        
        // 如果没有token，不执行请求
        if (!token) {
          console.log('无token，跳过获取用户信息');
          set({ user: null, isAuthenticated: false });
          return;
        }
        
        // 如果已经有用户信息，不执行请求
        if (user) {
          console.log('已有用户信息，跳过获取');
          return;
        }
        
        // 如果已有请求在进行中，不重复请求
        if (requestState.userRequestInProgress) {
          console.log('已有getCurrentUser请求在进行中，跳过');
          return;
        }
        
        // 检查是否频繁请求
        const now = Date.now();
        const timeSinceLastRequest = now - requestState.lastGetUserRequest;
        
        if (timeSinceLastRequest < 5000 && requestState.lastGetUserRequest > 0) {  // 5秒内的重复请求将被跳过
          console.log(`距离上次请求用户信息仅${timeSinceLastRequest}ms，跳过请求`);
          return;
        }
        
        // 更新请求状态
        requestState.lastGetUserRequest = now;
        requestState.userRequestInProgress = true;
        
        set({ loading: true });
        
        try {
          // 获取用户详细信息
          console.log('获取当前用户信息...');
          const userData = await apiClient.get('/auth/me');
          
          if (!userData) {
            throw new Error('获取用户信息失败');
          }
          
          set({
            user: userData,
            isAuthenticated: true,
            loading: false
          });
          
          console.log('获取用户信息成功:', userData.name);
        } catch (error: any) {
          console.error('获取用户信息失败:', error);
          
          // 如果是401错误，清除token并重置认证状态
          if (error.message && (
            error.message.includes('401') || 
            error.message.includes('未授权') || 
            error.message.includes('token')
          )) {
            console.log('Token无效，清除认证状态');
            removeToken();
            
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              loading: false,
              error: '登录已过期，请重新登录'
            });
          } else {
            set({
              loading: false,
              error: error.message || '获取用户信息失败'
            });
          }
        } finally {
          // 请求完成后重置状态
          requestState.userRequestInProgress = false;
        }
      },
      
      updateProfile: async (userData) => {
        set({ loading: true, error: null });
        
        try {
          const updatedUser = await apiClient.put('/auth/profile', userData);
          
          set({
            user: updatedUser,
            loading: false
          });
          
          return true;
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '更新用户资料失败'
          });
          return false;
        }
      },
      
      logout: () => {
        // 清除localStorage中的token
        removeToken();
        
        set({
          user: null,
          token: null,
          isAuthenticated: false
        });
        
        console.log('用户已登出');
      },
      
      resetError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'auth-storage',
      // 持久化token和认证状态
      partialize: (state) => ({ 
        token: state.token,
        isAuthenticated: state.isAuthenticated 
      })
    }
  )
);

export default useAuthStore; 