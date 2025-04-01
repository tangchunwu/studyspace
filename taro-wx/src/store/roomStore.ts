import { create } from 'zustand'

// 自习室类型定义
export interface StudyRoom {
  id: number;
  name: string;
  location: string;
  available: number;
  total: number;
  status: string;
  imageUrl: string;
}

// 座位类型定义
export interface Seat {
  id: number;
  row: number;
  col: number;
  name: string;
  status: 'available' | 'occupied' | 'selected';
}

interface RoomState {
  rooms: StudyRoom[];
  currentRoom: StudyRoom | null;
  isLoading: boolean;
  seatMap: Seat[][];
  
  // 方法
  fetchRooms: () => Promise<void>;
  fetchRoomDetail: (roomId: number) => Promise<void>;
  fetchSeatMap: (roomId: number, date: string, timeSlot: number) => Promise<void>;
}

// 创建自习室状态管理
const useRoomStore = create<RoomState>((set, get) => ({
  rooms: [],
  currentRoom: null,
  isLoading: false,
  seatMap: [],
  
  // 获取自习室列表
  fetchRooms: async () => {
    set({ isLoading: true })
    
    try {
      // 模拟网络请求
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 模拟自习室数据
      const mockRooms: StudyRoom[] = [
        { 
          id: 1, 
          name: '中心图书馆自习室', 
          location: '图书馆一楼',
          available: 35, 
          total: 50, 
          status: '可预约',
          imageUrl: 'https://placehold.co/600x400/4F46E5/FFFFFF?text=图书馆'
        },
        { 
          id: 2, 
          name: '工学院自习室', 
          location: '工学院三号楼',
          available: 12, 
          total: 40, 
          status: '可预约',
          imageUrl: 'https://placehold.co/600x400/10B981/FFFFFF?text=工学院'
        },
        { 
          id: 3, 
          name: '文学院自习室', 
          location: '文学院主楼',
          available: 0, 
          total: 30, 
          status: '已满',
          imageUrl: 'https://placehold.co/600x400/EF4444/FFFFFF?text=文学院'
        },
        { 
          id: 4, 
          name: '理学院自习室', 
          location: '理学院实验楼',
          available: 18, 
          total: 45, 
          status: '可预约',
          imageUrl: 'https://placehold.co/600x400/F59E0B/FFFFFF?text=理学院'
        },
        { 
          id: 5, 
          name: '医学院自习室', 
          location: '医学院图书馆',
          available: 5, 
          total: 25, 
          status: '可预约',
          imageUrl: 'https://placehold.co/600x400/818CF8/FFFFFF?text=医学院'
        }
      ]
      
      set({ rooms: mockRooms, isLoading: false })
    } catch (error) {
      console.error('获取自习室列表失败', error)
      set({ isLoading: false })
    }
  },
  
  // 获取自习室详情
  fetchRoomDetail: async (roomId: number) => {
    set({ isLoading: true })
    
    try {
      // 模拟网络请求
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 模拟自习室详情数据
      const room = get().rooms.find(r => r.id === roomId) || 
        { 
          id: roomId, 
          name: roomId === 1 ? '中心图书馆自习室' : '工学院自习室', 
          location: roomId === 1 ? '图书馆一楼' : '工学院三号楼',
          available: 35, 
          total: 50, 
          status: '可预约',
          imageUrl: 'https://placehold.co/600x400/4F46E5/FFFFFF?text=自习室图片'
        }
      
      set({ currentRoom: room, isLoading: false })
    } catch (error) {
      console.error('获取自习室详情失败', error)
      set({ isLoading: false })
    }
  },
  
  // 获取座位图
  fetchSeatMap: async (roomId: number, date: string, timeSlot: number) => {
    set({ isLoading: true })
    
    try {
      // 模拟网络请求
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 生成模拟座位图
      const rows = 5 // 5行
      const cols = 10 // 每行10个座位
      const seatMap: Seat[][] = []
      
      for (let i = 0; i < rows; i++) {
        const row: Seat[] = []
        for (let j = 0; j < cols; j++) {
          // 随机设置一些座位为不可用
          const isAvailable = Math.random() > 0.3
          row.push({
            id: i * cols + j + 1,
            row: i + 1,
            col: j + 1,
            name: `${String.fromCharCode(65 + i)}${j + 1}`, // A1, A2, ... E10
            status: isAvailable ? 'available' : 'occupied'
          })
        }
        seatMap.push(row)
      }
      
      set({ seatMap, isLoading: false })
    } catch (error) {
      console.error('获取座位图失败', error)
      set({ isLoading: false })
    }
  }
}))

export default useRoomStore