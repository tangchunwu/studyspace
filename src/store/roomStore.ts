import { create } from 'zustand';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// 定义自习室类型
export interface Room {
  id: string;
  room_number: string;
  location: string;
  capacity: number;
  available_seats?: number;
  description?: string;
  status: 'available' | 'maintenance' | 'closed';
  created_at: string;
  updated_at?: string;
}

// 定义自习室状态接口
interface RoomState {
  rooms: Room[];
  loading: boolean;
  error: string | null;
  fetchRooms: () => Promise<void>;
  forceRefreshRooms: () => Promise<void>;
  getRoomById: (id: string) => Room | undefined;
  lastFetchTime: number | null;
}

// API地址
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
console.log('使用API地址:', API_URL);

// 创建自习室状态管理
const useRoomStore = create<RoomState>((set, get) => ({
  rooms: [],
  loading: false,
  error: null,
  lastFetchTime: null,

  // 获取所有自习室
  fetchRooms: async () => {
    const { lastFetchTime } = get();
    const now = Date.now();
    
    // 如果数据够新，不再请求
    if (lastFetchTime && now - lastFetchTime < 30000) {
      console.log('使用本地存储的自习室数据');
      return;
    }
    
    set({ loading: true, error: null });
    
    try {
      console.log('开始请求自习室数据...');
      
      // 尝试通过代理请求
      const response = await axios.get(`/api/rooms?_t=${Date.now()}`, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        }
      });
      
      console.log('自习室数据请求成功:', response.data);
      
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('服务器返回的数据格式不正确');
      }
      
      set({ 
        rooms: response.data, 
        loading: false, 
        lastFetchTime: Date.now(),
        error: null
      });
      
      return response.data;
    } catch (error: any) {
      console.error('获取自习室列表失败:', error);
      
      // 尝试直接请求
      try {
        console.log('通过代理请求失败，尝试直接请求API地址');
        const directResponse = await axios.get(`${API_URL}/rooms?_t=${Date.now()}`, {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          }
        });
        
        console.log('直接请求自习室数据成功:', directResponse.data);
        
        if (!directResponse.data || !Array.isArray(directResponse.data)) {
          throw new Error('服务器返回的数据格式不正确');
        }
        
        set({ 
          rooms: directResponse.data, 
          loading: false, 
          lastFetchTime: Date.now(),
          error: null
        });
        
        return directResponse.data;
      } catch (directError: any) {
        console.error('直接请求也失败:', directError);
        
        const errorMessage = 
          directError.response?.data?.message || 
          directError.message || 
          '无法连接到服务器，请检查网络连接';
        
        set({ 
          error: errorMessage, 
          loading: false 
        });
        
        toast.error('无法获取自习室数据，请检查后端服务');
      }
    }
  },
  
  // 强制刷新自习室数据
  forceRefreshRooms: async () => {
    set({ loading: true, error: null });
    
    try {
      console.log('强制刷新自习室数据...');
      
      // 添加随机参数避免缓存
      const timestamp = Date.now();
      const randomParam = Math.random().toString(36).substring(7);
      
      // 尝试通过代理请求
      try {
        const response = await axios.get(`/api/rooms`, {
          params: { 
            _t: timestamp,
            _r: randomParam,
            forceRefresh: true
          },
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        console.log('自习室数据刷新成功:', response.data);
        
        if (!response.data || !Array.isArray(response.data)) {
          throw new Error('服务器返回的数据格式不正确');
        }
        
        set({ 
          rooms: response.data, 
          loading: false,
          lastFetchTime: Date.now(),
          error: null
        });
        
        toast.success('数据刷新成功');
        return response.data;
      } catch (proxyError) {
        console.error('通过代理刷新失败，尝试直接请求:', proxyError);
        
        // 尝试直接请求
        const directResponse = await axios.get(`${API_URL}/rooms`, {
          params: { 
            _t: timestamp,
            _r: randomParam,
            forceRefresh: true
          },
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        console.log('直接请求刷新成功:', directResponse.data);
        
        if (!directResponse.data || !Array.isArray(directResponse.data)) {
          throw new Error('服务器返回的数据格式不正确');
        }
        
        set({ 
          rooms: directResponse.data, 
          loading: false,
          lastFetchTime: Date.now(),
          error: null
        });
        
        toast.success('数据刷新成功');
        return directResponse.data;
      }
    } catch (error: any) {
      console.error('强制刷新自习室数据失败:', error);
      
      const errorMessage = 
        error.response?.data?.message || 
        error.message || 
        '刷新数据失败';
      
      set({ 
        error: errorMessage, 
        loading: false 
      });
      
      toast.error('刷新失败：' + errorMessage);
      
      throw error;
    }
  },

  // 根据ID获取自习室
  getRoomById: (id: string) => {
    return get().rooms.find((room) => room.id === id);
  },
}));

export default useRoomStore;