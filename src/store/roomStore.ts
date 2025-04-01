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
  currentRoom: Room & { seats?: any[] } | null;
  availableSeats: string[] | null;
  selectedRoom: Room | null;
  roomSeats: Map<string, Seat[]>;
  fetchRooms: () => Promise<void>;
  forceRefreshRooms: () => Promise<void>;
  getRoomById: (id: string) => Room | undefined;
  fetchRoomById: (id: string) => Promise<void>;
  checkAvailability: (roomId: string, startTime: string, endTime: string) => Promise<void>;
  lastFetchTime: number | null;
  resetSeatSelection: () => void;
  getSeatById: (seatId: string) => Seat | undefined;
  getSeatsForRoom: (roomId: string) => Seat[] | undefined;
}

// API地址
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
console.log('使用API地址:', API_URL);

// 创建自习室状态管理
const useRoomStore = create<RoomState>((set, get) => ({
  rooms: [],
  loading: false,
  error: null,
  currentRoom: null,
  availableSeats: null,
  selectedRoom: null,
  roomSeats: new Map(),
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

  // 获取单个自习室详情
  fetchRoomById: async (id: string) => {
    if (!id) {
      console.error('fetchRoomById: 缺少ID参数');
      set({ 
        error: '请求参数错误：缺少自习室ID', 
        loading: false 
      });
      return Promise.reject(new Error('缺少ID参数'));
    }

    console.log(`fetchRoomById: 开始获取自习室 (ID: ${id})`);
    set({ loading: true, error: null });
    
    try {
      console.log(`fetchRoomById: 尝试通过代理请求 /api/rooms/${id}`);
      
      // 尝试通过代理请求
      try {
        const response = await axios.get(`/api/rooms/${id}`, {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          }
        });
        
        console.log(`fetchRoomById: 代理请求成功，响应状态码: ${response.status}`);
        console.log('fetchRoomById: 响应数据结构:', {
          hasData: !!response.data,
          dataType: typeof response.data,
          keys: response.data ? Object.keys(response.data) : [],
          hasSeats: response.data && response.data.seats ? '是' : '否',
          seatsType: response.data && response.data.seats ? typeof response.data.seats : 'N/A',
          seatsLength: response.data && response.data.seats && Array.isArray(response.data.seats) 
            ? response.data.seats.length 
            : 'N/A'
        });
        
        if (!response.data) {
          throw new Error('API返回空数据');
        }
        
        // 检查座位数据
        if (!response.data.seats || !Array.isArray(response.data.seats)) {
          console.log('fetchRoomById: 警告：返回的自习室数据中没有座位信息或座位不是数组格式');
          
          // 如果没有seats字段，尝试再次请求专门的座位API
          try {
            console.log(`fetchRoomById: 尝试专门获取座位数据: /api/rooms/${id}/seats`);
            const seatsResponse = await axios.get(`/api/rooms/${id}/seats`, {
              timeout: 30000
            });
            
            console.log('fetchRoomById: 座位API响应:', {
              status: seatsResponse.status,
              hasData: !!seatsResponse.data,
              dataType: typeof seatsResponse.data,
              isArray: Array.isArray(seatsResponse.data),
              length: Array.isArray(seatsResponse.data) ? seatsResponse.data.length : 'N/A'
            });
            
            if (seatsResponse.data && Array.isArray(seatsResponse.data)) {
              console.log(`fetchRoomById: 座位API返回了 ${seatsResponse.data.length} 个座位数据`);
              // 将座位数据添加到自习室数据中
              response.data.seats = seatsResponse.data;
              
              // 打印前几个座位作为示例
              if (seatsResponse.data.length > 0) {
                console.log('fetchRoomById: 座位数据示例:', 
                  seatsResponse.data.slice(0, 3).map(s => ({
                    id: s.id,
                    seat_number: s.seat_number,
                    is_available: s.is_available
                  }))
                );
              }
            } else {
              console.error('fetchRoomById: 座位API返回的数据格式不正确');
              // 确保seats是一个空数组而不是undefined
              response.data.seats = [];
            }
          } catch (seatsError) {
            console.error('fetchRoomById: 获取座位数据失败:', seatsError);
            // 确保seats是一个空数组而不是undefined
            response.data.seats = [];
          }
        } else {
          console.log(`fetchRoomById: 自习室API直接返回了 ${response.data.seats.length} 个座位数据`);
          
          // 打印前几个座位作为示例
          if (response.data.seats.length > 0) {
            console.log('fetchRoomById: 座位数据示例:', 
              response.data.seats.slice(0, 3).map(s => ({
                id: s.id,
                seat_number: s.seat_number,
                is_available: s.is_available
              }))
            );
          }
        }
        
        // 缓存座位数据
        if (response.data.seats && Array.isArray(response.data.seats)) {
          const { roomSeats } = get();
          roomSeats.set(id, response.data.seats);
        }
        
        console.log('fetchRoomById: 更新store中的currentRoom数据');
        set({ 
          currentRoom: response.data, 
          loading: false,
          error: null
        });
        
        return response.data;
      } catch (proxyError: any) {
        console.error('fetchRoomById: 通过代理请求失败:', proxyError);
        console.log('fetchRoomById: 错误详情:', {
          status: proxyError.response?.status,
          statusText: proxyError.response?.statusText,
          message: proxyError.message,
          responseData: proxyError.response?.data
        });
        
        // 尝试直接请求
        console.log(`fetchRoomById: 尝试直接请求 ${API_URL}/rooms/${id}`);
        const directResponse = await axios.get(`${API_URL}/rooms/${id}`, {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          }
        });
        
        console.log(`fetchRoomById: 直接请求成功，响应状态码: ${directResponse.status}`);
        console.log('fetchRoomById: 响应数据结构:', {
          hasData: !!directResponse.data,
          dataType: typeof directResponse.data,
          keys: directResponse.data ? Object.keys(directResponse.data) : [],
          hasSeats: directResponse.data && directResponse.data.seats ? '是' : '否',
          seatsType: directResponse.data && directResponse.data.seats ? typeof directResponse.data.seats : 'N/A',
          seatsLength: directResponse.data && directResponse.data.seats && Array.isArray(directResponse.data.seats) 
            ? directResponse.data.seats.length 
            : 'N/A'
        });
        
        if (!directResponse.data) {
          throw new Error('API返回空数据');
        }
        
        // 检查座位数据
        if (!directResponse.data.seats || !Array.isArray(directResponse.data.seats)) {
          console.log('fetchRoomById: 警告：直接请求返回的自习室数据中没有座位信息或座位不是数组格式');
          
          // 如果没有seats字段，尝试再次请求专门的座位API
          try {
            console.log(`fetchRoomById: 尝试专门获取座位数据: ${API_URL}/rooms/${id}/seats`);
            const seatsResponse = await axios.get(`${API_URL}/rooms/${id}/seats`, {
              timeout: 30000
            });
            
            console.log('fetchRoomById: 座位API响应:', {
              status: seatsResponse.status,
              hasData: !!seatsResponse.data,
              dataType: typeof seatsResponse.data,
              isArray: Array.isArray(seatsResponse.data),
              length: Array.isArray(seatsResponse.data) ? seatsResponse.data.length : 'N/A'
            });
            
            if (seatsResponse.data && Array.isArray(seatsResponse.data)) {
              console.log(`fetchRoomById: 座位API返回了 ${seatsResponse.data.length} 个座位数据`);
              // 将座位数据添加到自习室数据中
              directResponse.data.seats = seatsResponse.data;
              
              // 打印前几个座位作为示例
              if (seatsResponse.data.length > 0) {
                console.log('fetchRoomById: 座位数据示例:', 
                  seatsResponse.data.slice(0, 3).map(s => ({
                    id: s.id,
                    seat_number: s.seat_number,
                    is_available: s.is_available
                  }))
                );
              }
            } else {
              console.error('fetchRoomById: 座位API返回的数据格式不正确');
              // 确保seats是一个空数组而不是undefined
              directResponse.data.seats = [];
            }
          } catch (seatsError) {
            console.error('fetchRoomById: 获取座位数据失败:', seatsError);
            // 确保seats是一个空数组而不是undefined
            directResponse.data.seats = [];
          }
        } else {
          console.log(`fetchRoomById: 自习室API直接返回了 ${directResponse.data.seats.length} 个座位数据`);
          
          // 打印前几个座位作为示例
          if (directResponse.data.seats.length > 0) {
            console.log('fetchRoomById: 座位数据示例:', 
              directResponse.data.seats.slice(0, 3).map(s => ({
                id: s.id,
                seat_number: s.seat_number,
                is_available: s.is_available
              }))
            );
          }
        }
        
        // 缓存座位数据
        if (directResponse.data.seats && Array.isArray(directResponse.data.seats)) {
          const { roomSeats } = get();
          roomSeats.set(id, directResponse.data.seats);
        }
        
        console.log('fetchRoomById: 更新store中的currentRoom数据（通过直接请求）');
        set({ 
          currentRoom: directResponse.data, 
          loading: false,
          error: null
        });
        
        return directResponse.data;
      }
    } catch (error: any) {
      console.error(`fetchRoomById: 获取自习室详情失败: ID = ${id}`, error);
      
      let errorDetails = '';
      if (error.response) {
        errorDetails = `HTTP状态码: ${error.response.status}, 响应: ${JSON.stringify(error.response.data)}`;
      } else if (error.request) {
        errorDetails = '未收到响应，请检查网络连接';
      } else {
        errorDetails = `错误信息: ${error.message}`;
      }
      
      console.error('fetchRoomById: 详细错误信息:', errorDetails);
      
      const errorMessage = 
        error.response?.data?.message || 
        error.message || 
        '无法连接到服务器，请检查网络连接';
      
      console.log(`fetchRoomById: 设置错误信息: "${errorMessage}"`);
      set({ 
        error: errorMessage, 
        loading: false 
      });
      
      toast.error('无法获取自习室详情，请检查后端服务');
      throw error;
    }
  },

  // 检查座位可用性
  checkAvailability: async (roomId: string, startTime: string, endTime: string) => {
    set({ loading: true, error: null });
    
    try {
      console.log(`检查座位可用性: roomId = ${roomId}, 时间段 = ${startTime} 至 ${endTime}`);
      
      // 尝试通过代理请求
      const response = await axios.post(`/api/rooms/${roomId}/check-availability`, {
        start_time: startTime,
        end_time: endTime
      }, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        }
      });
      
      console.log('座位可用性检查成功:', response.data);
      
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('服务器返回的数据格式不正确');
      }
      
      // 过滤出可用的座位ID
      const availableSeats = response.data
        .filter(seat => seat.is_available)
        .map(seat => seat.id);
      
      set({ 
        availableSeats, 
        loading: false,
        error: null
      });
      
      return availableSeats;
    } catch (error: any) {
      console.error(`检查座位可用性失败: roomId = ${roomId}`, error);
      
      // 尝试直接请求
      try {
        console.log('通过代理请求失败，尝试直接请求API地址');
        const directResponse = await axios.post(`${API_URL}/rooms/${roomId}/check-availability`, {
          start_time: startTime,
          end_time: endTime
        }, {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          }
        });
        
        console.log('直接请求座位可用性成功:', directResponse.data);
        
        if (!directResponse.data || !Array.isArray(directResponse.data)) {
          throw new Error('服务器返回的数据格式不正确');
        }
        
        // 过滤出可用的座位ID
        const availableSeats = directResponse.data
          .filter(seat => seat.is_available)
          .map(seat => seat.id);
        
        set({ 
          availableSeats, 
          loading: false,
          error: null
        });
        
        return availableSeats;
      } catch (directError: any) {
        console.error(`直接请求座位可用性也失败: roomId = ${roomId}`, directError);
        
        const errorMessage = 
          directError.response?.data?.message || 
          directError.message || 
          '无法连接到服务器，请检查网络连接';
        
        set({ 
          error: errorMessage, 
          loading: false 
        });
        
        toast.error('无法检查座位可用性，请检查后端服务');
      }
    }
  },

  // 重置座位选择
  resetSeatSelection: () => {
    set({
      availableSeats: null
    });
  },
  
  // 根据ID获取座位
  getSeatById: (seatId: string) => {
    const { currentRoom } = get();
    if (!currentRoom || !currentRoom.seats) return undefined;
    
    return currentRoom.seats.find(seat => seat.id === seatId);
  },
  
  // 获取指定自习室的座位数据
  getSeatsForRoom: (roomId: string) => {
    const { roomSeats, fetchRoomById } = get();
    
    // 如果缓存中有数据，直接返回
    if (roomSeats.has(roomId)) {
      return roomSeats.get(roomId);
    }
    
    // 否则触发请求获取数据
    fetchRoomById(roomId);
    return undefined;
  }
}));

export default useRoomStore;