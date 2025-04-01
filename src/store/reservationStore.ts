import { create } from 'zustand';
import { toast } from 'react-hot-toast';
import reservationService from '../api/services/reservationService';
import { Reservation as ReservationType, CreateReservationRequest } from '../types';

// 别名导出
type Reservation = ReservationType;

interface ReservationStore {
  userReservations: Reservation[];
  currentReservation: Reservation | null;
  loading: boolean;
  error: string | null;
  message: string | null; // 成功消息
  lastFetch: number | null; // 记录上次获取数据的时间戳
  
  // 获取用户的所有预约
  fetchUserReservations: () => Promise<void>;
  
  // 创建新预约
  createReservation: (data: CreateReservationRequest) => Promise<boolean>;
  
  // 取消预约
  cancelReservation: (reservationId: string) => Promise<boolean>;
  
  // 获取单个预约详情
  fetchReservationById: (reservationId: string) => Promise<void>;
  
  // 重置消息和错误状态
  resetMessages: () => void;
}

const useReservationStore = create<ReservationStore>((set, get) => ({
  userReservations: [],
  currentReservation: null,
  loading: false,
  error: null,
  message: null,
  lastFetch: null,
  
  // 获取用户的所有预约
  fetchUserReservations: async () => {
    const { lastFetch } = get();
    const now = Date.now();
    
    // 如果数据足够新，不再请求
    if (lastFetch && now - lastFetch < 30000) {
      return;
    }
    
    set({ loading: true, error: null });
    
    try {
      const reservations = await reservationService.getUserReservations();
      set({ 
        userReservations: reservations,
        loading: false,
        lastFetch: Date.now()
      });
    } catch (error: any) {
      console.error('获取用户预约失败:', error);
      set({ 
        error: error.message || '获取预约数据失败',
        loading: false
      });
    }
  },
  
  // 创建新预约
  createReservation: async (data: CreateReservationRequest) => {
    set({ loading: true, error: null, message: null });
    
    try {
      console.log('创建预约:', data);
      const newReservation = await reservationService.createReservation(data);
      
      set(state => ({ 
        userReservations: [...state.userReservations, newReservation],
        loading: false,
        message: '预约成功！您已成功预约座位。'
      }));
      
      toast.success('预约成功！');
      return true;
    } catch (error: any) {
      console.error('创建预约失败:', error);
      
      const errorMessage = error.response?.data?.message || error.message || '创建预约失败';
      set({ 
        error: errorMessage, 
        loading: false 
      });
      
      toast.error(`预约失败: ${errorMessage}`);
      return false;
    }
  },
  
  // 取消预约
  cancelReservation: async (reservationId: string) => {
    set({ loading: true, error: null, message: null });
    
    try {
      const result = await reservationService.cancelReservation(reservationId);
      
      // 更新本地预约数据
      set(state => ({
        userReservations: state.userReservations.map(res => 
          res.id === reservationId 
            ? { ...res, status: 'canceled' } 
            : res
        ),
        loading: false,
        message: result.message || '预约已成功取消'
      }));
      
      toast.success('预约已取消');
      return true;
    } catch (error: any) {
      console.error('取消预约失败:', error);
      
      const errorMessage = error.response?.data?.message || error.message || '取消预约失败';
      set({ 
        error: errorMessage, 
        loading: false 
      });
      
      toast.error(`取消失败: ${errorMessage}`);
      return false;
    }
  },
  
  // 获取单个预约详情
  fetchReservationById: async (reservationId: string) => {
    set({ loading: true, error: null });
    
    try {
      // 先从本地查找
      const localReservation = get().userReservations.find(r => r.id === reservationId);
      if (localReservation) {
        set({ currentReservation: localReservation, loading: false });
        return;
      }
      
      // TODO: 实现从API获取单个预约的详情
      // 目前暂时只从本地获取
      set({ 
        error: '找不到预约记录',
        loading: false
      });
    } catch (error: any) {
      console.error('获取预约详情失败:', error);
      set({ 
        error: error.message || '获取预约详情失败',
        loading: false
      });
    }
  },
  
  // 重置消息和错误状态
  resetMessages: () => {
    set({ error: null, message: null });
  }
}));

export default useReservationStore; 