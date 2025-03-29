import { create } from 'zustand';

interface Room {
  id: string;
  room_number: string;
  location: string;
  capacity: number;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface RoomStore {
  rooms: Room[];
  currentRoom: Room | null;
  loading: boolean;
  error: string | null;
  
  // 获取所有自习室列表
  fetchRooms: () => Promise<void>;
  
  // 获取单个自习室详情
  fetchRoomById: (roomId: string) => Promise<void>;
  
  // 重置错误状态
  resetError: () => void;
}

const useRoomStore = create<RoomStore>((set) => ({
  rooms: [],
  currentRoom: null,
  loading: false,
  error: null,
  
  fetchRooms: async () => {
    try {
      set({ loading: true, error: null });
      
      const response = await fetch('http://localhost:3000/api/rooms');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '获取自习室列表失败');
      }
      
      set({ rooms: data, loading: false });
    } catch (error) {
      console.error('获取自习室列表失败:', error);
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : '获取自习室列表失败' 
      });
    }
  },
  
  fetchRoomById: async (roomId) => {
    try {
      set({ loading: true, error: null });
      
      const response = await fetch(`http://localhost:3000/api/rooms/${roomId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '获取自习室详情失败');
      }
      
      set({ currentRoom: data, loading: false });
    } catch (error) {
      console.error('获取自习室详情失败:', error);
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : '获取自习室详情失败' 
      });
    }
  },
  
  resetError: () => {
    set({ error: null });
  }
}));

export default useRoomStore; 