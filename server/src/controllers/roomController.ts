import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/error';
import { AppDataSource } from '../config/typeorm.config';
import { StudyRoom } from '../entities/study-room.entity';
import { Seat } from '../entities/seat.entity';
import { Reservation } from '../entities/reservation.entity';
import { Between, LessThanOrEqual, MoreThanOrEqual, In } from 'typeorm';

// 控制器级别的缓存，进一步减少数据库查询
const roomsCache = {
  data: null as any | null,
  timestamp: 0,
  expires: 5 * 60 * 1000 // 5分钟过期
};

// 缓存实用函数
const getCachedData = () => {
  const now = Date.now();
  if (roomsCache.data && (now - roomsCache.timestamp < roomsCache.expires)) {
    console.log('使用控制器内存缓存的自习室数据');
    return roomsCache.data;
  }
  return null;
};

const setCachedData = (data: any) => {
  roomsCache.data = data;
  roomsCache.timestamp = Date.now();
};

// @desc    获取所有自习室
// @route   GET /api/rooms
// @access  Public
export const getRooms = asyncHandler(async (req: Request, res: Response) => {
  console.log('获取所有自习室列表');
  
  try {
    // 简化查询，直接获取所有自习室
    const roomRepository = AppDataSource.getRepository(StudyRoom);
    const rooms = await roomRepository.find({
      order: { room_number: 'ASC' }
    });
    
    // 确保返回的是数组格式
    if (!Array.isArray(rooms)) {
      console.error('自习室数据非数组格式');
      return res.status(500).json({ message: '服务器内部错误' });
    }
    
    console.log(`找到 ${rooms.length} 个自习室`);
    console.log('返回的自习室数据样例:', rooms.length > 0 ? JSON.stringify(rooms[0]).substring(0, 100) + '...' : '无数据');
    
    // 直接返回数组数据，不做复杂转换
    return res.json(rooms);
  } catch (error) {
    console.error('获取自习室列表失败:', error);
    throw error;
  }
});

// 单个房间缓存
const roomDetailCache = new Map<string, {data: any, timestamp: number}>();
const ROOM_CACHE_DURATION = 3 * 60 * 1000; // 3分钟

// @desc    获取单个自习室详情
// @route   GET /api/rooms/:id
// @access  Private
export const getRoomById = asyncHandler(async (req: Request, res: Response) => {
  const roomId = req.params.id;
  console.log(`获取自习室详情: ID = ${roomId}`);
  
  // 检查缓存
  const now = Date.now();
  const cached = roomDetailCache.get(roomId);
  if (cached && (now - cached.timestamp < ROOM_CACHE_DURATION) && !req.query._forceRefresh) {
    console.log(`使用缓存的自习室详情: ID = ${roomId}`);
    return res.json(cached.data);
  }
  
  try {
    const roomRepository = AppDataSource.getRepository(StudyRoom);
    const seatRepository = AppDataSource.getRepository(Seat);
    
    const room = await roomRepository.findOne({
      where: { id: roomId }
    });
    
    if (room) {
      // 获取自习室的所有座位
      const seats = await seatRepository.find({
        where: { room: { id: room.id } },
        order: { seat_number: 'ASC' }
      });
      
      console.log(`自习室 ${room.room_number} 有 ${seats.length} 个座位`);
      
      const roomData = {
        ...room,
        seats
      };
      
      // 更新缓存
      roomDetailCache.set(roomId, {
        data: roomData,
        timestamp: now
      });
      
      res.json(roomData);
    } else {
      console.warn(`找不到ID为 ${roomId} 的自习室`);
      res.status(404).json({ message: '自习室不存在' });
    }
  } catch (error) {
    console.error(`获取自习室详情失败: ID = ${roomId}`, error);
    throw error;
  }
});

// 座位缓存
const seatsCache = new Map<string, {data: any, timestamp: number}>();
const SEATS_CACHE_DURATION = 3 * 60 * 1000; // 3分钟

// @desc    获取自习室的座位
// @route   GET /api/rooms/:id/seats
// @access  Private
export const getRoomSeats = asyncHandler(async (req: Request, res: Response) => {
  const roomId = req.params.id;
  console.log(`获取自习室座位: roomId = ${roomId}`);
  
  // 检查缓存
  const now = Date.now();
  const cached = seatsCache.get(roomId);
  if (cached && (now - cached.timestamp < SEATS_CACHE_DURATION) && !req.query._forceRefresh) {
    console.log(`使用缓存的自习室座位: roomId = ${roomId}`);
    return res.json(cached.data);
  }
  
  try {
    const roomRepository = AppDataSource.getRepository(StudyRoom);
    const seatRepository = AppDataSource.getRepository(Seat);
    
    const room = await roomRepository.findOne({
      where: { id: roomId }
    });
    
    if (!room) {
      console.warn(`找不到ID为 ${roomId} 的自习室`);
      res.status(404).json({ message: '自习室不存在' });
      return;
    }
    
    const seats = await seatRepository.find({
      where: { room: { id: room.id } },
      order: { seat_number: 'ASC' }
    });
    
    console.log(`自习室 ${room.room_number} 座位数量: ${seats.length}`);
    
    // 更新缓存
    seatsCache.set(roomId, {
      data: seats,
      timestamp: now
    });
    
    res.json(seats);
  } catch (error) {
    console.error(`获取自习室座位失败: roomId = ${roomId}`, error);
    throw error;
  }
});

// 可用性检查缓存 (短期缓存，因为可用性会变化)
const availabilityCache = new Map<string, {data: any, timestamp: number}>();
const AVAILABILITY_CACHE_DURATION = 30 * 1000; // 30秒 

// @desc    检查时间段内座位的可用性
// @route   POST /api/rooms/:id/check-availability
// @access  Private
export const checkSeatAvailability = asyncHandler(async (req: Request, res: Response) => {
  const { start_time, end_time } = req.body;
  const roomId = req.params.id;
  
  console.log(`检查座位可用性: roomId = ${roomId}, 时间段 = ${start_time} 至 ${end_time}`);
  
  // 生成缓存键
  const cacheKey = `${roomId}_${start_time}_${end_time}`;
  
  // 检查缓存
  const now = Date.now();
  const cached = availabilityCache.get(cacheKey);
  if (cached && (now - cached.timestamp < AVAILABILITY_CACHE_DURATION)) {
    console.log(`使用缓存的座位可用性: ${cacheKey}`);
    return res.json(cached.data);
  }
  
  try {
    if (!start_time || !end_time) {
      res.status(400).json({ message: '请提供开始和结束时间' });
      return;
    }
    
    const roomRepository = AppDataSource.getRepository(StudyRoom);
    const seatRepository = AppDataSource.getRepository(Seat);
    const reservationRepository = AppDataSource.getRepository(Reservation);
    
    const room = await roomRepository.findOne({
      where: { id: roomId }
    });
    
    if (!room) {
      console.warn(`找不到ID为 ${roomId} 的自习室`);
      res.status(404).json({ message: '自习室不存在' });
      return;
    }
    
    // 检查自习室状态，只有available状态的自习室才可预约
    if (room.status !== 'available') {
      let statusMessage = '';
      switch (room.status) {
        case 'maintenance':
          statusMessage = '该自习室正在维护中，暂不可预约';
          break;
        case 'closed':
          statusMessage = '该自习室已关闭，暂不可预约';
          break;
        default:
          statusMessage = '该自习室当前不可预约';
      }
      
      console.warn(`自习室 ${room.room_number} 状态为 ${room.status}, 不可预约`);
      
      const response = { 
        message: statusMessage,
        status: room.status 
      };
      
      // 缓存结果
      availabilityCache.set(cacheKey, {
        data: response,
        timestamp: now
      });
      
      res.status(400).json(response);
      return;
    }
    
    // 查找该时间段内已被预约的座位
    const startDate = new Date(start_time);
    const endDate = new Date(end_time);
    
    // 验证日期有效性
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      res.status(400).json({ message: '提供的日期格式无效' });
      return;
    }
    
    // 验证起止时间是否合理
    const currentTime = new Date();
    if (startDate < currentTime) {
      res.status(400).json({ message: '预约开始时间不能早于当前时间' });
      return;
    }
    
    if (endDate <= startDate) {
      res.status(400).json({ message: '预约结束时间必须晚于开始时间' });
      return;
    }
    
    // 并行查询座位和预约，提高性能
    const [seats, reservations] = await Promise.all([
      // 查询所有座位
      seatRepository.find({
        where: { room: { id: room.id } },
        order: { seat_number: 'ASC' }
      }),
      
      // 查询所有预约
      reservationRepository.find({
        where: [
          {
            seat: { room_id: roomId },
            status: 'confirmed',
            start_time: Between(startDate, endDate)
          },
          {
            seat: { room_id: roomId },
            status: 'confirmed',
            end_time: Between(startDate, endDate)
          },
          {
            seat: { room_id: roomId },
            status: 'confirmed',
            start_time: LessThanOrEqual(startDate),
            end_time: MoreThanOrEqual(endDate)
          }
        ],
        relations: ['seat']
      })
    ]);
    
    if (seats.length === 0) {
      console.warn(`自习室 ${room.room_number} 没有座位数据`);
      res.status(404).json({ message: '该自习室没有座位数据，请联系管理员' });
      return;
    }
    
    console.log(`自习室 ${room.room_number} 总共有 ${seats.length} 个座位`);
    
    // 创建一个保存已预约座位ID的集合，提高查找性能
    const reservedSeatIds = new Set(reservations.map(r => r.seat.id));
    console.log(`找到 ${reservations.length} 个预约，${reservedSeatIds.size} 个座位已被预约`);
    
    // 标记座位可用性
    const availabilityResults = seats.map(seat => ({
      ...seat,
      is_available: !reservedSeatIds.has(seat.id)
    }));
    
    console.log(`返回 ${availabilityResults.length} 个座位，其中 ${availabilityResults.filter(s => s.is_available).length} 个可用`);
    
    // 缓存结果
    availabilityCache.set(cacheKey, {
      data: availabilityResults,
      timestamp: now
    });
    
    res.json(availabilityResults);
  } catch (error) {
    console.error(`检查座位可用性失败: roomId = ${roomId}`, error);
    throw error;
  }
});

// 定期清理过期缓存 (每5分钟)
setInterval(() => {
  const now = Date.now();
  let clearedItems = 0;
  
  // 清理房间详情缓存
  roomDetailCache.forEach((value, key) => {
    if (now - value.timestamp > ROOM_CACHE_DURATION) {
      roomDetailCache.delete(key);
      clearedItems++;
    }
  });
  
  // 清理座位缓存
  seatsCache.forEach((value, key) => {
    if (now - value.timestamp > SEATS_CACHE_DURATION) {
      seatsCache.delete(key);
      clearedItems++;
    }
  });
  
  // 清理可用性缓存
  availabilityCache.forEach((value, key) => {
    if (now - value.timestamp > AVAILABILITY_CACHE_DURATION) {
      availabilityCache.delete(key);
      clearedItems++;
    }
  });
  
  if (clearedItems > 0) {
    console.log(`自习室控制器: 清理了 ${clearedItems} 个过期缓存项`);
  }
}, 5 * 60 * 1000); 