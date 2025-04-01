import { create } from 'zustand'
import Taro from '@tarojs/taro'

// 权限类型定义
export type Permission = 'view_users' | 'manage_users' | 'view_checkins' | 'manage_checkins' | 'view_reservations' | 'manage_reservations';

// 角色权限映射
export const rolePermissions: Record<string, Permission[]> = {
  admin: ['view_users', 'manage_users', 'view_checkins', 'manage_checkins', 'view_reservations', 'manage_reservations'],
  manager: ['view_users', 'view_checkins', 'view_reservations'],
  student: []
};

type UserInfo = {
  nickName: string;
  avatarUrl: string;
  studentId: string;
  gender: number;
  role: string;
} | null;

interface AuthState {
  isAuthenticated: boolean;
  userInfo: UserInfo;
  token: string | null;
  loading: boolean;
  
  // 方法
  initAuth: () => void;
  login: (code: string, userInfo: any) => Promise<boolean>;
  logout: () => void;
  setUserInfo: (userInfo: UserInfo) => void;
  
  // 权限相关方法
  isAdmin: () => boolean;
  hasPermission: (permission: Permission) => boolean;
  getUserPermissions: () => Permission[];
}

// 创建认证状态管理
const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  userInfo: null,
  token: null,
  loading: true,
  
  // 初始化认证状态（从本地存储恢复）
  initAuth: () => {
    try {
      const token = Taro.getStorageSync('token')
      const userInfoStr = Taro.getStorageSync('userInfo')
      
      if (token && userInfoStr) {
        const userInfo = JSON.parse(userInfoStr)
        set({ 
          isAuthenticated: true, 
          token, 
          userInfo,
          loading: false
        })
      } else {
        set({ 
          isAuthenticated: false, 
          token: null, 
          userInfo: null,
          loading: false
        })
      }
    } catch (e) {
      console.error('初始化认证状态失败', e)
      set({ 
        isAuthenticated: false, 
        token: null, 
        userInfo: null,
        loading: false
      })
    }
  },
  
  // 登录
  login: async (code: string, userInfo: any) => {
    set({ loading: true })
    
    try {
      // 实际项目中这里应调用后端API
      // 这里仅作模拟
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockUserInfo = {
        nickName: userInfo.nickName,
        avatarUrl: userInfo.avatarUrl,
        studentId: 'S12345678',
        gender: userInfo.gender,
        role: 'student'
      }
      
      const mockToken = 'mock-token-' + Date.now()
      
      // 存储登录状态
      Taro.setStorageSync('token', mockToken)
      Taro.setStorageSync('userInfo', JSON.stringify(mockUserInfo))
      
      set({ 
        isAuthenticated: true, 
        token: mockToken, 
        userInfo: mockUserInfo,
        loading: false
      })
      
      return true
    } catch (error) {
      console.error('登录失败', error)
      set({ loading: false })
      return false
    }
  },
  
  // 退出登录
  logout: () => {
    // 清除存储的认证信息
    Taro.removeStorageSync('token')
    Taro.removeStorageSync('userInfo')
    
    set({ 
      isAuthenticated: false, 
      token: null, 
      userInfo: null 
    })
  },
  
  // 设置用户信息
  setUserInfo: (userInfo: UserInfo) => {
    set({ userInfo })
    
    if (userInfo) {
      Taro.setStorageSync('userInfo', JSON.stringify(userInfo))
    }
  },
  
  // 判断是否为管理员
  isAdmin: () => {
    const { userInfo } = get()
    return userInfo?.role === 'admin' || userInfo?.role === 'manager'
  },
  
  // 检查是否具有特定权限
  hasPermission: (permission: Permission) => {
    const { userInfo } = get()
    if (!userInfo) return false
    
    const userRole = userInfo.role
    const permissions = rolePermissions[userRole] || []
    
    return permissions.includes(permission)
  },
  
  // 获取用户所有权限
  getUserPermissions: () => {
    const { userInfo } = get()
    if (!userInfo) return []
    
    return rolePermissions[userInfo.role] || []
  }
}))

export default useAuthStore 