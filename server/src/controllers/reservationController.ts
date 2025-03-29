import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/error';
import Reservation from '../models/Reservation';
import Seat from '../models/Seat';
import CheckIn from '../models/CheckIn';

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

  // 验证座位是否存在
  const seat = await Seat.findById(seat_id);
  if (!seat) {
    res.status(404).json({ message: '座位不存在' });
    return;
  }

  // 验证座位是否在指定房间中
  if (seat.room.toString() !== room_id) {
    res.status(400).json({ message: '座位不属于指定的自习室' });
    return;
  }

  // 检查该时间段内座位是否已被预约
  const conflictingReservation = await Reservation.findOne({
    seat: seat_id,
    status: 'confirmed',
    $or: [
      // 开始时间在已有预约时间段内
      { start_time: { $lt: new Date(end_time), $gte: new Date(start_time) } },
      // 结束时间在已有预约时间段内
      { end_time: { $lte: new Date(end_time), $gt: new Date(start_time) } },
      // 已有预约时间段完全包含请求时间段
      { 
        start_time: { $lte: new Date(start_time) },
        end_time: { $gte: new Date(end_time) }
      }
    ]
  });

  if (conflictingReservation) {
    res.status(400).json({ message: '该座位在选定时间段内已被预约' });
    return;
  }

  // 创建预约
  const reservation = await Reservation.create({
    user: req.user._id,
    room: room_id,
    seat: seat_id,
    start_time,
    end_time,
    status: 'confirmed'
  });

  // 更新座位状态
  await Seat.findByIdAndUpdate(seat_id, { is_available: false });

  // 返回创建的预约信息
  if (reservation) {
    res.status(201).json(reservation);
  } else {
    res.status(400).json({ message: '创建预约失败' });
  }
});

// @desc    获取用户的所有预约
// @route   GET /api/reservations
// @access  Private
export const getUserReservations = asyncHandler(async (req: Request, res: Response) => {
  const reservations = await Reservation.find({ user: req.user._id })
    .sort({ start_time: -1 })
    .populate('room', 'room_number location')
    .populate('seat', 'seat_number');

  res.json(reservations);
});

// @desc    取消预约
// @route   PUT /api/reservations/:id/cancel
// @access  Private
export const cancelReservation = asyncHandler(async (req: Request, res: Response) => {
  const reservation = await Reservation.findById(req.params.id);

  if (!reservation) {
    res.status(404).json({ message: '预约不存在' });
    return;
  }

  // 验证预约归属权
  if (reservation.user.toString() !== req.user._id.toString()) {
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
  await reservation.save();

  // 更新座位状态
  await Seat.findByIdAndUpdate(reservation.seat, { is_available: true });

  res.json({ message: '预约已成功取消', reservation });
});

// @desc    签到
// @route   POST /api/reservations/:id/check-in
// @access  Private
export const checkInReservation = asyncHandler(async (req: Request, res: Response) => {
  const reservation = await Reservation.findById(req.params.id);

  if (!reservation) {
    res.status(404).json({ message: '预约不存在' });
    return;
  }

  // 验证预约归属权
  if (reservation.user.toString() !== req.user._id.toString()) {
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
  let checkInStatus = 'on_time';
  const fifteenMinutesAfterStart = new Date(reservation.start_time);
  fifteenMinutesAfterStart.setMinutes(fifteenMinutesAfterStart.getMinutes() + 15);
  
  if (currentTime > fifteenMinutesAfterStart) {
    checkInStatus = 'late';
  }

  // 更新预约签到时间
  reservation.check_in_time = currentTime;
  await reservation.save();

  // 创建签到记录
  const checkIn = await CheckIn.create({
    reservation: reservation._id,
    check_in_time: currentTime,
    status: checkInStatus
  });

  res.json({ 
    message: '签到成功', 
    reservation, 
    checkIn
  });
}); 