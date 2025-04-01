import { create } from 'zustand'
import Taro from '@tarojs/taro'
import { format } from 'date-fns'

// 签到记录类型定义
export interface CheckinRecord {
  id: string;
  reservationId: string;
  userId: string;
  userName: string;
  userStudentId: string;
  roomId: string;
  roomName: string;
  seatName: string;
  checkInTime: string;
  status: 'normal' | 'late' | 'rejected' | 'pending';
  location?: { latitude: number; longitude: number };
  verifiedBy?: string; // 管理员验证
  verifiedAt?: string;
  reservationDate: string;
  timeSlot: string;
}

// 签到记录状态定义
interface CheckinState {
  records: CheckinRecord[];
  currentRecord: CheckinRecord | null;
  isLoading: boolean;
  error: string | null;
  
  // 方法
  fetchCheckinRecords: () => Promise<void>;
  getCheckinById: (id: string) => Promise<CheckinRecord | null>;
  updateCheckinStatus: (id: string, status: 'normal' | 'late' | 'rejected') => Promise<boolean>;
  verifyCheckin: (id: string, status: 'normal' | 'late' | 'rejected') => Promise<boolean>;
  searchCheckins: (query: string) => Promise<CheckinRecord[]>;
  filterCheckinsByDate: (date: string) => CheckinRecord[];
  filterCheckinsByStatus: (status: 'normal' | 'late' | 'rejected' | 'pending') => CheckinRecord[];
}

// 模拟签到记录数据
const mockCheckins: CheckinRecord[] = [
  {
    id: '1',
    reservationId: '101',
    userId: '1',
    userName: '张三',
    userStudentId: 'S20210001',
    roomId: '1',
    roomName: '中心图书馆自习室',
    seatName: 'A1',
    checkInTime: '2023-05-10T08:05:00Z',
    status: 'normal',
    location: { latitude: 30.5728, longitude: 114.2894 },
    verifiedBy: 'system',
    verifiedAt: '2023-05-10T08:05:10Z',
    reservationDate: '2023-05-10',
    timeSlot: '08:00-12:00'
  },
  {
    id: '2',
    reservationId: '102',
    userId: '2',
    userName: '李四',
    userStudentId: 'S20210002',
    roomId: '1',
    roomName: '中心图书馆自习室',
    seatName: 'B3',
    checkInTime: '2023-05-10T08:25:00Z',
    status: 'late',
    location: { latitude: 30.5730, longitude: 114.2896 },
    verifiedBy: 'system',
    verifiedAt: '2023-05-10T08:25:10Z',
    reservationDate: '2023-05-10',
    timeSlot: '08:00-12:00'
  },
  {
    id: '3',
    reservationId: '103',
    userId: '3',
    userName: '王五',
    userStudentId: 'S20210003',
    roomId: '2',
    roomName: '工学院自习室',
    seatName: 'C5',
    checkInTime: '2023-05-10T14:05:00Z',
    status: 'rejected',
    location: { latitude: 30.5800, longitude: 114.3000 },
    verifiedBy: '4', // 管理员ID
    verifiedAt: '2023-05-10T14:10:00Z',
    reservationDate: '2023-05-10',
    timeSlot: '14:00-18:00'
  },
  {
    id: '4',
    reservationId: '104',
    userId: '1',
    userName: '张三',
    userStudentId: 'S20210001',
    roomId: '2',
    roomName: '工学院自习室',
    seatName: 'D2',
    checkInTime: '2023-05-11T09:00:00Z',
    status: 'normal',
    location: { latitude: 30.5802, longitude: 114.3002 },
    verifiedBy: 'system',
    verifiedAt: '2023-05-11T09:00:10Z',
    reservationDate: '2023-05-11',
    timeSlot: '09:00-13:00'
  },
  {
    id: '5',
    reservationId: '105',
    userId: '2',
    userName: '李四',
    userStudentId: 'S20210002',
    roomId: '1',
    roomName: '中心图书馆自习室',
    seatName: 'A4',
    checkInTime: '2023-05-11T14:10:00Z',
    status: 'pending',
    location: { latitude: 30.5728, longitude: 114.2895 },
    reservationDate: '2023-05-11',
    timeSlot: '14:00-18:00'
  }
];

// 创建签到记录状态管理
const useCheckinStore = create<CheckinState>((set, get) => ({
  records: [],
  currentRecord: null,
  isLoading: false,
  error: null,
  
  // 获取所有签到记录
  fetchCheckinRecords: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // 模拟API请求延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 实际项目中应该从API获取签到记录列表
      set({ records: mockCheckins, isLoading: false });
    } catch (error) {
      console.error('获取签到记录列表失败', error);
      set({ 
        error: '获取签到记录列表失败，请稍后重试', 
        isLoading: false 
      });
    }
  },
  
  // 根据ID获取签到记录
  getCheckinById: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // 模拟API请求延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 实际项目中应该从API获取签到记录详情
      const record = mockCheckins.find(r => r.id === id) || null;
      set({ currentRecord: record, isLoading: false });
      return record;
    } catch (error) {
      console.error('获取签到记录详情失败', error);
      set({ 
        error: '获取签到记录详情失败，请稍后重试', 
        isLoading: false 
      });
      return null;
    }
  },
  
  // 更新签到记录状态
  updateCheckinStatus: async (id: string, status: 'normal' | 'late' | 'rejected') => {
    set({ isLoading: true, error: null });
    
    try {
      // 模拟API请求延迟
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 实际项目中应该调用API更新签到记录状态
      // 这里只做本地状态更新模拟
      const records = get().records.map(record => 
        record.id === id ? { 
          ...record, 
          status,
          verifiedBy: '5', // 假设当前用户是管理员
          verifiedAt: new Date().toISOString()
        } : record
      );
      
      set({ records, isLoading: false });
      
      // 更新当前查看的签到记录
      const currentRecord = get().currentRecord;
      if (currentRecord && currentRecord.id === id) {
        set({ 
          currentRecord: { 
            ...currentRecord, 
            status,
            verifiedBy: '5', // 假设当前用户是管理员
            verifiedAt: new Date().toISOString()
          } 
        });
      }
      
      return true;
    } catch (error) {
      console.error('更新签到记录状态失败', error);
      set({ 
        error: '更新签到记录状态失败，请稍后重试', 
        isLoading: false 
      });
      return false;
    }
  },
  
  // 管理员验证签到
  verifyCheckin: async (id: string, status: 'normal' | 'late' | 'rejected') => {
    return get().updateCheckinStatus(id, status);
  },
  
  // 搜索签到记录
  searchCheckins: async (query: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // 模拟API请求延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 实际项目中应该调用API搜索签到记录
      // 这里只做本地搜索模拟
      const lowercasedQuery = query.toLowerCase();
      const filteredRecords = mockCheckins.filter(record => 
        record.userName.toLowerCase().includes(lowercasedQuery) ||
        record.userStudentId.toLowerCase().includes(lowercasedQuery) ||
        record.roomName.toLowerCase().includes(lowercasedQuery) ||
        record.seatName.toLowerCase().includes(lowercasedQuery)
      );
      
      set({ isLoading: false });
      return filteredRecords;
    } catch (error) {
      console.error('搜索签到记录失败', error);
      set({ 
        error: '搜索签到记录失败，请稍后重试', 
        isLoading: false 
      });
      return [];
    }
  },
  
  // 按日期筛选签到记录
  filterCheckinsByDate: (date: string) => {
    return get().records.filter(record => record.reservationDate === date);
  },
  
  // 按状态筛选签到记录
  filterCheckinsByStatus: (status: 'normal' | 'late' | 'rejected' | 'pending') => {
    return get().records.filter(record => record.status === status);
  }
}));

export default useCheckinStore; 