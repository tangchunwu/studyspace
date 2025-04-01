import { create } from 'zustand'
import Taro from '@tarojs/taro'

// 用户类型定义
export interface User {
  id: string;
  nickName: string;
  avatarUrl: string;
  studentId: string;
  gender: number;
  role: string;
  status: 'active' | 'disabled';
  createdAt: string;
  lastLoginAt?: string;
}

// 用户状态定义
interface UserState {
  users: User[];
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  
  // 方法
  fetchUsers: () => Promise<void>;
  getUserById: (id: string) => Promise<User | null>;
  updateUserStatus: (id: string, status: 'active' | 'disabled') => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  searchUsers: (query: string) => Promise<User[]>;
}

// 模拟用户数据
const mockUsers: User[] = [
  {
    id: '1',
    nickName: '张三',
    avatarUrl: 'https://placehold.co/100',
    studentId: 'S20210001',
    gender: 1,
    role: 'student',
    status: 'active',
    createdAt: '2023-04-10T08:30:00Z',
    lastLoginAt: '2023-05-10T15:45:00Z'
  },
  {
    id: '2',
    nickName: '李四',
    avatarUrl: 'https://placehold.co/100',
    studentId: 'S20210002',
    gender: 1,
    role: 'student',
    status: 'active',
    createdAt: '2023-04-11T09:20:00Z',
    lastLoginAt: '2023-05-09T14:30:00Z'
  },
  {
    id: '3',
    nickName: '王五',
    avatarUrl: 'https://placehold.co/100',
    studentId: 'S20210003',
    gender: 1,
    role: 'student',
    status: 'disabled',
    createdAt: '2023-04-12T10:15:00Z',
    lastLoginAt: '2023-05-01T11:20:00Z'
  },
  {
    id: '4',
    nickName: '赵六',
    avatarUrl: 'https://placehold.co/100',
    studentId: 'T20210001',
    gender: 1,
    role: 'manager',
    status: 'active',
    createdAt: '2023-04-01T08:00:00Z',
    lastLoginAt: '2023-05-10T16:30:00Z'
  },
  {
    id: '5',
    nickName: '管理员',
    avatarUrl: 'https://placehold.co/100',
    studentId: 'A20210001',
    gender: 1,
    role: 'admin',
    status: 'active',
    createdAt: '2023-03-15T09:00:00Z',
    lastLoginAt: '2023-05-10T17:00:00Z'
  }
];

// 创建用户状态管理
const useUserStore = create<UserState>((set, get) => ({
  users: [],
  currentUser: null,
  isLoading: false,
  error: null,
  
  // 获取所有用户
  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // 模拟API请求延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 实际项目中应该从API获取用户列表
      set({ users: mockUsers, isLoading: false });
    } catch (error) {
      console.error('获取用户列表失败', error);
      set({ 
        error: '获取用户列表失败，请稍后重试', 
        isLoading: false 
      });
    }
  },
  
  // 根据ID获取用户
  getUserById: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // 模拟API请求延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 实际项目中应该从API获取用户详情
      const user = mockUsers.find(u => u.id === id) || null;
      set({ currentUser: user, isLoading: false });
      return user;
    } catch (error) {
      console.error('获取用户详情失败', error);
      set({ 
        error: '获取用户详情失败，请稍后重试', 
        isLoading: false 
      });
      return null;
    }
  },
  
  // 更新用户状态
  updateUserStatus: async (id: string, status: 'active' | 'disabled') => {
    set({ isLoading: true, error: null });
    
    try {
      // 模拟API请求延迟
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 实际项目中应该调用API更新用户状态
      // 这里只做本地状态更新模拟
      const users = get().users.map(user => 
        user.id === id ? { ...user, status } : user
      );
      
      set({ users, isLoading: false });
      
      // 更新当前查看的用户
      const currentUser = get().currentUser;
      if (currentUser && currentUser.id === id) {
        set({ currentUser: { ...currentUser, status } });
      }
      
      return true;
    } catch (error) {
      console.error('更新用户状态失败', error);
      set({ 
        error: '更新用户状态失败，请稍后重试', 
        isLoading: false 
      });
      return false;
    }
  },
  
  // 删除用户
  deleteUser: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // 模拟API请求延迟
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 实际项目中应该调用API删除用户
      // 这里只做本地状态更新模拟
      const users = get().users.filter(user => user.id !== id);
      
      set({ users, isLoading: false });
      
      // 如果当前查看的用户被删除，清空currentUser
      const currentUser = get().currentUser;
      if (currentUser && currentUser.id === id) {
        set({ currentUser: null });
      }
      
      return true;
    } catch (error) {
      console.error('删除用户失败', error);
      set({ 
        error: '删除用户失败，请稍后重试', 
        isLoading: false 
      });
      return false;
    }
  },
  
  // 搜索用户
  searchUsers: async (query: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // 模拟API请求延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 实际项目中应该调用API搜索用户
      // 这里只做本地搜索模拟
      const lowercasedQuery = query.toLowerCase();
      const filteredUsers = mockUsers.filter(user => 
        user.nickName.toLowerCase().includes(lowercasedQuery) ||
        user.studentId.toLowerCase().includes(lowercasedQuery)
      );
      
      set({ isLoading: false });
      return filteredUsers;
    } catch (error) {
      console.error('搜索用户失败', error);
      set({ 
        error: '搜索用户失败，请稍后重试', 
        isLoading: false 
      });
      return [];
    }
  }
}));

export default useUserStore; 