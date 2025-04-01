import { create } from 'zustand'
import Taro from '@tarojs/taro'

// 预约类型定义
export interface Reservation {
  id: number;
  roomId: number;
  roomName: string;
  seatId: number;
  seatName: string;
  date: string;
  timeSlot: number;
  timeSlotText: string;
  status: '待开始' | '待签到' | '已签到' | '已结束' | '已取消';
  createdAt: string;
  checkInTime?: string;
}

interface ReservationState {
  reservations: Reservation[];
  currentReservation: Reservation | null;
  isLoading: boolean;
  
  // 方法
  fetchReservations: () => Promise<void>;
  makeReservation: (data: {
    roomId: number;
    roomName: string;
    seatId: number;
    seatName: string;
    date: string;
    timeSlot: number;
    timeSlotText: string;
  }) => Promise<boolean>;
  cancelReservation: (id: number) => Promise<boolean>;
  checkIn: (id: number) => Promise<boolean>;
  getReservationById: (id: number) => Reservation | null;
  setupReservationReminders: () => void;
}

// 时间段映射
const timeSlotMap = {
  1: '08:00 - 12:00',
  2: '13:00 - 17:00',
  3: '18:00 - 22:00'
}

// 创建预约状态管理
const useReservationStore = create<ReservationState>((set, get) => ({
  reservations: [],
  currentReservation: null,
  isLoading: false,
  
  // 获取预约列表
  fetchReservations: async () => {
    set({ isLoading: true })
    
    try {
      // 检查登录状态
      const token = Taro.getStorageSync('token')
      if (!token) {
        set({ reservations: [], isLoading: false })
        return
      }
      
      // 模拟网络请求
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 获取当前日期
      const now = new Date()
      const today = now.toISOString().split('T')[0]
      
      // 明天
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = tomorrow.toISOString().split('T')[0]
      
      // 模拟预约数据
      const mockReservations: Reservation[] = [
        {
          id: 1,
          roomId: 1,
          roomName: '中心图书馆自习室',
          seatId: 12,
          seatName: 'A12',
          date: today,
          timeSlot: 2,
          timeSlotText: timeSlotMap[2],
          status: '待签到',
          createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 2,
          roomId: 2,
          roomName: '工学院自习室',
          seatId: 5,
          seatName: 'B05',
          date: tomorrowStr,
          timeSlot: 1,
          timeSlotText: timeSlotMap[1],
          status: '待开始',
          createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString()
        }
      ]
      
      set({ reservations: mockReservations, isLoading: false })
      
      // 设置预约提醒
      setTimeout(() => {
        get().setupReservationReminders();
      }, 500);
    } catch (error) {
      console.error('获取预约列表失败', error)
      set({ isLoading: false })
    }
  },
  
  // 创建预约
  makeReservation: async (data) => {
    set({ isLoading: true })
    
    try {
      // 检查登录状态
      const token = Taro.getStorageSync('token')
      if (!token) {
        set({ isLoading: false })
        return false
      }
      
      // 模拟网络请求
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // 创建新预约
      const newReservation: Reservation = {
        id: Date.now(), // 使用时间戳作为临时ID
        ...data,
        status: '待开始',
        createdAt: new Date().toISOString()
      }
      
      // 更新状态
      const currentReservations = get().reservations
      set({
        reservations: [...currentReservations, newReservation],
        currentReservation: newReservation,
        isLoading: false
      })
      
      return true
    } catch (error) {
      console.error('创建预约失败', error)
      set({ isLoading: false })
      return false
    }
  },
  
  // 取消预约
  cancelReservation: async (id: number) => {
    set({ isLoading: true })
    
    try {
      // 模拟网络请求
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 更新预约状态
      const updatedReservations = get().reservations.map(r => {
        if (r.id === id) {
          return { ...r, status: '已取消' as const }
        }
        return r
      })
      
      set({ reservations: updatedReservations, isLoading: false })
      return true
    } catch (error) {
      console.error('取消预约失败', error)
      set({ isLoading: false })
      return false
    }
  },
  
  // 签到
  checkIn: async (id: number) => {
    set({ isLoading: true })
    
    try {
      // 获取当前位置
      const locationResult = await Taro.getLocation({
        type: 'gcj02',
        isHighAccuracy: true
      }).catch(err => {
        console.error('获取位置失败', err)
        Taro.showToast({
          title: '获取位置失败，请确保已授权位置权限',
          icon: 'none',
          duration: 2000
        })
        throw new Error('获取位置失败')
      })
      
      // 模拟自习室位置范围检查
      // 实际项目中，这里应该与服务器通信验证用户是否在自习室范围内
      const userLocation = {
        latitude: locationResult.latitude,
        longitude: locationResult.longitude
      }
      
      console.log('用户当前位置', userLocation)
      
      // 验证是否可以签到
      const reservation = get().reservations.find(r => r.id === id)
      if (!reservation) {
        throw new Error('找不到预约记录')
      }
      
      // 检查是否是有效的签到时间
      const currentTime = new Date()
      const reservationDate = reservation.date
      // 获取预约的开始时间戳
      let startHour = 8 // 默认8点
      if (reservation.timeSlot === 1) startHour = 8
      else if (reservation.timeSlot === 2) startHour = 13
      else if (reservation.timeSlot === 3) startHour = 18
      
      const reservationTime = new Date(reservationDate)
      reservationTime.setHours(startHour, 0, 0, 0)
      
      // 签到时间提前30分钟
      const checkInStartTime = new Date(reservationTime)
      checkInStartTime.setMinutes(checkInStartTime.getMinutes() - 30)
      
      // 允许迟到的时间是开始后30分钟
      const lateTime = new Date(reservationTime)
      lateTime.setMinutes(lateTime.getMinutes() + 30)
      
      let checkInStatus = ''
      
      // 判断签到状态
      if (currentTime < checkInStartTime) {
        // 尚未到签到时间
        throw new Error('尚未到签到时间，请在预约开始前30分钟内签到')
      } else if (currentTime <= reservationTime) {
        // 正常签到
        checkInStatus = '已签到'
      } else if (currentTime <= lateTime) {
        // 迟到签到
        checkInStatus = '已签到(迟到)'
      } else {
        // 超时签到
        throw new Error('已超过签到时间，签到失败')
      }
      
      // 更新预约状态
      const updatedReservations = get().reservations.map(r => {
        if (r.id === id) {
          return { 
            ...r, 
            status: checkInStatus as any,
            checkInTime: currentTime.toISOString() 
          }
        }
        return r
      })
      
      // 模拟成功签到效果
      await new Promise(resolve => setTimeout(resolve, 1000))
      set({ reservations: updatedReservations, isLoading: false })
      
      return true
    } catch (error) {
      console.error('签到失败', error)
      set({ isLoading: false })
      return false
    }
  },
  
  // 根据ID获取预约
  getReservationById: (id: number) => {
    return get().reservations.find(r => r.id === id) || null
  },
  
  // 设置预约提醒
  setupReservationReminders: () => {
    const reservations = get().reservations;
    
    // 清除所有已有的提醒定时器
    if (global.reminderTimers) {
      global.reminderTimers.forEach(timer => clearTimeout(timer));
    }
    
    global.reminderTimers = [];
    
    const now = new Date();
    
    // 筛选出未开始和未结束的预约
    const activeReservations = reservations.filter(r => 
      r.status === '待开始' || r.status === '待签到' || r.status === '已签到'
    );
    
    activeReservations.forEach(reservation => {
      // 解析预约日期和时间
      const reservationDate = reservation.date;
      let startHour = 8;
      if (reservation.timeSlot === 1) startHour = 8;
      else if (reservation.timeSlot === 2) startHour = 13;
      else if (reservation.timeSlot === 3) startHour = 18;
      
      let endHour = 12;
      if (reservation.timeSlot === 1) endHour = 12;
      else if (reservation.timeSlot === 2) endHour = 17;
      else if (reservation.timeSlot === 3) endHour = 22;
      
      // 开始时间
      const startTime = new Date(reservationDate);
      startTime.setHours(startHour, 0, 0, 0);
      
      // 结束时间
      const endTime = new Date(reservationDate);
      endTime.setHours(endHour, 0, 0, 0);
      
      // 提前30分钟提醒
      const reminderTime = new Date(startTime);
      reminderTime.setMinutes(reminderTime.getMinutes() - 30);
      
      // 结束前15分钟提醒
      const endReminderTime = new Date(endTime);
      endReminderTime.setMinutes(endReminderTime.getMinutes() - 15);
      
      // 如果提醒时间在当前时间之后，设置提醒
      if (reminderTime > now) {
        const timeDiff = reminderTime.getTime() - now.getTime();
        
        // 设置开始提醒
        const startReminder = setTimeout(() => {
          Taro.showModal({
            title: '预约即将开始',
            content: `您在${reservation.roomName}的座位${reservation.seatName}预约将在30分钟后开始，请准时前往。`,
            showCancel: false,
            confirmText: '我知道了'
          });
          
          // 同时申请发送订阅消息提醒（微信小程序特性）
          // 实际项目中需要配置订阅消息模板
          Taro.requestSubscribeMessage({
            tmplIds: ['预约开始提醒模板ID'],
            success: (res) => {
              console.log('订阅消息成功', res);
            }
          }).catch(err => console.log('订阅消息请求失败', err));
        }, timeDiff);
        
        global.reminderTimers.push(startReminder);
      }
      
      // 如果结束提醒时间在当前时间之后，设置结束提醒
      if (endReminderTime > now) {
        const endTimeDiff = endReminderTime.getTime() - now.getTime();
        
        // 设置结束提醒
        const endReminder = setTimeout(() => {
          Taro.showModal({
            title: '预约即将结束',
            content: `您在${reservation.roomName}的座位${reservation.seatName}使用时间还剩15分钟，请注意安排时间。`,
            showCancel: false,
            confirmText: '我知道了'
          });
        }, endTimeDiff);
        
        global.reminderTimers.push(endReminder);
      }
    });
  }
}))

export default useReservationStore