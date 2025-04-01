import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/error';
import { AppDataSource } from '../config/typeorm.config';
import { StudyRoom } from '../entities/study-room.entity';
import { Seat } from '../entities/seat.entity';
import { Reservation } from '../entities/reservation.entity';
import { CheckIn } from '../entities/check-in.entity';
import { Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';

// @desc    创建新预约
// @route   POST /api/reservations
// @access  Private
export const createReservation = asyncHandler(async (req: Request, res: Response) => {
  const { room_id, seat_id, start_time, end_time } = req.body;

  // 基本验证
  if (!room_id || !seat_id || !start_time || !end_time) {
    res.status(400).json({ message: '请提供所有必要的字段' });
    return;
  }

  const roomRepository = AppDataSource.getRepository(StudyRoom);
  const seatRepository = AppDataSource.getRepository(Seat);
  const reservationRepository = AppDataSource.getRepository(Reservation);

  // 检查自习室是否存在及其状态
  const room = await roomRepository.findOne({
    where: { id: room_id }
  });
  
  if (!room) {
    res.status(404).json({ message: '自习室不存在' });
    return;
  }
  
  // 检查自习室状态
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
    
    res.status(400).json({ message: statusMessage });
    return;
  }

  // 验证座位是否存在
  const seat = await seatRepository.findOne({
    where: { id: seat_id },
    relations: ['room']
  });

  if (!seat) {
    res.status(404).json({ message: '座位不存在' });
    return;
  }

  // 验证座位是否在指定房间中
  if (seat.room.id !== room_id) {
    res.status(400).json({ message: '座位不属于指定的自习室' });
    return;
  }
  
  // 验证座位是否可用
  if (!seat.is_available) {
    res.status(400).json({ message: '该座位当前不可用' });
    return;
  }

  // 检查该时间段内座位是否已被预约
  const startDate = new Date(start_time);
  const endDate = new Date(end_time);
  
  // 验证日期有效性
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    res.status(400).json({ message: '提供的日期格式无效' });
    return;
  }
  
  // 验证起止时间是否合理
  const now = new Date();
  if (startDate < now) {
    res.status(400).json({ message: '预约开始时间不能早于当前时间' });
    return;
  }
  
  if (endDate <= startDate) {
    res.status(400).json({ message: '预约结束时间必须晚于开始时间' });
    return;
  }

  const conflictingReservations = await reservationRepository.find({
    where: [
      {
        seat: { id: seat_id },
        status: 'confirmed',
        start_time: Between(startDate, endDate)
      },
      {
        seat: { id: seat_id },
        status: 'confirmed',
        end_time: Between(startDate, endDate)
      },
      {
        seat: { id: seat_id },
        status: 'confirmed',
        start_time: LessThanOrEqual(startDate),
        end_time: MoreThanOrEqual(endDate)
      }
    ]
  });

  if (conflictingReservations.length > 0) {
    res.status(400).json({ message: '该座位在选定时间段内已被预约' });
    return;
  }

  // 创建预约
  const newReservation = reservationRepository.create({
    user: req.user,
    room: { id: room_id },
    seat: { id: seat_id },
    start_time: startDate,
    end_time: endDate,
    status: 'confirmed'
  });

  const savedReservation = await reservationRepository.save(newReservation);

  // 更新座位状态
  seat.is_available = false;
  await seatRepository.save(seat);

  // 返回创建的预约信息
  res.status(201).json(savedReservation);
});

// @desc    获取用户的所有预约
// @route   GET /api/reservations
// @access  Private
export const getUserReservations = asyncHandler(async (req: Request, res: Response) => {
  const reservationRepository = AppDataSource.getRepository(Reservation);

  const reservations = await reservationRepository.find({
    where: { user: { id: req.user.id } },
    relations: ['room', 'seat'],
    order: { start_time: 'DESC' }
  });

  res.json(reservations);
});

// @desc    取消预约
// @route   PUT /api/reservations/:id/cancel
// @access  Private
export const cancelReservation = asyncHandler(async (req: Request, res: Response) => {
  const reservationRepository = AppDataSource.getRepository(Reservation);
  const seatRepository = AppDataSource.getRepository(Seat);

  const reservation = await reservationRepository.findOne({
    where: { id: req.params.id },
    relations: ['user', 'seat']
  });

  if (!reservation) {
    res.status(404).json({ message: '预约不存在' });
    return;
  }

  // 验证预约归属权
  if (reservation.user.id !== req.user.id) {
    res.status(403).json({ message: '没有权限执行此操作' });
    return;
  }

  // 检查预约是否已经开始
  if (new Date(reservation.start_time) <= new Date()) {
    res.status(400).json({ message: '无法取消已开始的预约' });
    return;
  }

  // 取消预约
  reservation.status = 'canceled';
  await reservationRepository.save(reservation);

  // 更新座位状态
  const seat = await seatRepository.findOne({
    where: { id: reservation.seat.id }
  });
  
  if (seat) {
    seat.is_available = true;
    await seatRepository.save(seat);
  }

  res.json({ message: '预约已成功取消', reservation });
});

// @desc    签到
// @route   POST /api/reservations/:id/check-in
// @access  Private
export const checkInReservation = asyncHandler(async (req: Request, res: Response) => {
  const reservationRepository = AppDataSource.getRepository(Reservation);
  const checkInRepository = AppDataSource.getRepository(CheckIn);

  const reservation = await reservationRepository.findOne({
    where: { id: req.params.id },
    relations: ['user']
  });

  if (!reservation) {
    res.status(404).json({ message: '预约不存在' });
    return;
  }

  // 验证预约归属权
  if (reservation.user.id !== req.user.id) {
    res.status(403).json({ message: '没有权限执行此操作' });
    return;
  }

  // 检查预约状态
  if (reservation.status !== 'confirmed') {
    res.status(400).json({ message: `无法签到${reservation.status === 'canceled' ? '已取消' : '已完成'}的预约` });
    return;
  }

  // 检查是否已签到
  if (reservation.check_in_time) {
    res.status(400).json({ message: '已经签到过了' });
    return;
  }

  const currentTime = new Date();
  
  // 检查是否在有效时间范围内签到
  if (currentTime < new Date(reservation.start_time)) {
    res.status(400).json({ message: '预约尚未开始，无法签到' });
    return;
  }
  
  if (currentTime > new Date(reservation.end_time)) {
    res.status(400).json({ message: '预约已过期，无法签到' });
    return;
  }

  // 确定签到状态
  let checkInStatus: 'on_time' | 'late' | 'missed' = 'on_time';
  const fifteenMinutesAfterStart = new Date(reservation.start_time);
  fifteenMinutesAfterStart.setMinutes(fifteenMinutesAfterStart.getMinutes() + 15);
  
  if (currentTime > fifteenMinutesAfterStart) {
    checkInStatus = 'late';
  }

  // 更新预约签到时间
  reservation.check_in_time = currentTime;
  await reservationRepository.save(reservation);

  // 创建签到记录
  const newCheckIn = checkInRepository.create({
    reservation: reservation,
    check_in_time: currentTime,
    status: checkInStatus
  });

  const savedCheckIn = await checkInRepository.save(newCheckIn);

  res.json({ 
    message: '签到成功', 
    reservation, 
    checkIn: savedCheckIn
  });
}); 