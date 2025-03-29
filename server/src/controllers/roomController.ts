import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/error';
import StudyRoom from '../models/StudyRoom';
import Seat from '../models/Seat';
import Reservation from '../models/Reservation';

// @desc    获取所有自习室
// @route   GET /api/rooms
// @access  Private
export const getRooms = asyncHandler(async (req: Request, res: Response) => {
  const rooms = await StudyRoom.find({}).sort({ room_number: 1 });
  
  // 获取每个自习室的可用座位数
  const roomsWithAvailableSeats = await Promise.all(
    rooms.map(async (room) => {
      const availableSeats = await Seat.countDocuments({
        room: room._id,
        is_available: true
      });
      
      return {
        ...room.toObject(),
        available_seats: availableSeats
      };
    })
  );
  
  res.json(roomsWithAvailableSeats);
});

// @desc    获取单个自习室详情
// @route   GET /api/rooms/:id
// @access  Private
export const getRoomById = asyncHandler(async (req: Request, res: Response) => {
  const room = await StudyRoom.findById(req.params.id);
  
  if (room) {
    // 获取自习室的所有座位
    const seats = await Seat.find({ room: room._id }).sort({ seat_number: 1 });
    
    res.json({
      ...room.toObject(),
      seats
    });
  } else {
    res.status(404).json({ message: '自习室不存在' });
  }
});

// @desc    获取自习室的座位
// @route   GET /api/rooms/:id/seats
// @access  Private
export const getRoomSeats = asyncHandler(async (req: Request, res: Response) => {
  const room = await StudyRoom.findById(req.params.id);
  
  if (!room) {
    res.status(404).json({ message: '自习室不存在' });
    return;
  }
  
  const seats = await Seat.find({ room: room._id }).sort({ seat_number: 1 });
  
  res.json(seats);
});

// @desc    检查时间段内座位的可用性
// @route   POST /api/rooms/:id/check-availability
// @access  Private
export const checkSeatAvailability = asyncHandler(async (req: Request, res: Response) => {
  const { start_time, end_time } = req.body;
  
  if (!start_time || !end_time) {
    res.status(400).json({ message: '请提供开始和结束时间' });
    return;
  }
  
  const room = await StudyRoom.findById(req.params.id);
  
  if (!room) {
    res.status(404).json({ message: '自习室不存在' });
    return;
  }
  
  // 查找该时间段内已被预约的座位ID
  const reservations = await Reservation.find({
    room: room._id,
    status: 'confirmed',
    $or: [
      // 开始时间在预约时间段内
      { start_time: { $lt: new Date(end_time), $gte: new Date(start_time) } },
      // 结束时间在预约时间段内
      { end_time: { $lte: new Date(end_time), $gt: new Date(start_time) } },
      // 预约时间段完全包含请求时间段
      { 
        start_time: { $lte: new Date(start_time) },
        end_time: { $gte: new Date(end_time) }
      }
    ]
  }).select('seat');
  
  const reservedSeatIds = reservations.map(r => r.seat.toString());
  
  // 获取所有座位并标记可用性
  const seats = await Seat.find({ room: room._id }).sort({ seat_number: 1 });
  
  const availabilityResults = seats.map(seat => ({
    ...seat.toObject(),
    is_available: !reservedSeatIds.includes(seat._id.toString())
  }));
  
  res.json(availabilityResults);
}); 