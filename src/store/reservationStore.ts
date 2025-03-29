import { create } from 'zustand';
import { toast } from 'react-hot-toast';

interface Reservation {
  id: string;
  user_id: string;
  room_id: string;
  seat_id: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

interface ReservationStore {
  userReservations: Reservation[];
  currentReservation: Reservation | null;
  loading: boolean;
  error: string | null;
  
  // 获取用户的所有预约
  fetchUserReservations: () => Promise<void>;
  
  // 创建新预约
  createReservation: (roomId: string, seatId: string, startTime: string, endTime: string) => Promise<boolean>;
  
  // 取消预约
  cancelReservation: (reservationId: string) => Promise<boolean>;
  
  // 获取单个预约详情
  fetchReservationById: (reservationId: string) => Promise<void>;
  
  // 重置错误状态
  resetError: () => void;
}

const useReservationStore = create<ReservationStore>((set, get) => ({
  userReservations: [],
  currentReservation: null,
  loading: false,
  error: null,
  
  fetchUserReservations: async () => {
    try {
      set({ loading: true, error: null });
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('未登录，请先登录');
      }
      
      const response = await fetch('http://localhost:3000/api/reservations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '获取预约列表失败');
      }
      
      set({ userReservations: data, loading: false });
    } catch (error) {
      console.error('获取预约列表失败:', error);
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : '获取预约列表失败' 
      });
    }
  },
  
  createReservation: async (roomId, seatId, startTime, endTime) => {
    try {
      set({ loading: true, error: null });
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('未登录，请先登录');
      }
      
      const response = await fetch('http://localhost:3000/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          room_id: roomId,
          seat_id: seatId,
          start_time: startTime,
          end_time: endTime
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '创建预约失败');
      }
      
      // 添加新预约到列表
      set(state => ({
        userReservations: [...state.userReservations, data],
        currentReservation: data,
        loading: false
      }));
      
      return true;
    } catch (error) {
      console.error('创建预约失败:', error);
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : '创建预约失败' 
      });
      return false;
    }
  },
  
  cancelReservation: async (reservationId) => {
    try {
      set({ loading: true, error: null });
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('未登录，请先登录');
      }
      
      const response = await fetch(`http://localhost:3000/api/reservations/${reservationId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '取消预约失败');
      }
      
      // 更新预约状态
      set(state => ({
        userReservations: state.userReservations.map(res => 
          res.id === reservationId ? { ...res, status: 'cancelled' } : res
        ),
        loading: false
      }));
      
      toast.success('预约已取消');
      return true;
    } catch (error) {
      console.error('取消预约失败:', error);
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : '取消预约失败' 
      });
      return false;
    }
  },
  
  fetchReservationById: async (reservationId) => {
    try {
      set({ loading: true, error: null });
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('未登录，请先登录');
      }
      
      const response = await fetch(`http://localhost:3000/api/reservations/${reservationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '获取预约详情失败');
      }
      
      set({ currentReservation: data, loading: false });
    } catch (error) {
      console.error('获取预约详情失败:', error);
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : '获取预约详情失败' 
      });
    }
  },
  
  resetError: () => {
    set({ error: null });
  }
}));

export default useReservationStore; 