import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, addHours, parseISO, isAfter, isBefore } from 'date-fns';
import { MapPin, Clock, Users, Calendar, CheckCircle } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { roomService } from '../api/services/roomService';
import { reservationService } from '../api/services/reservationService';
import { Seat, StudyRoom } from '../types';

interface TimeSlot {
  start: Date;
  end: Date;
  formatted: string;
}

export function Reservation() {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [room, setRoom] = useState<StudyRoom | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 获取自习室信息和座位
  useEffect(() => {
    async function fetchRoomAndSeats() {
      if (!roomId) return;

      try {
        setLoading(true);
        
        // 获取自习室信息
        const roomData = await roomService.getRoomById(roomId);
        setRoom(roomData);
        
        // 获取座位信息
        const seatsData = await roomService.getRoomSeats(roomId);
        setSeats(seatsData || []);
        
      } catch (error) {
        console.error('Error fetching room data:', error);
        setError('获取自习室信息失败');
      } finally {
        setLoading(false);
      }
    }
    
    fetchRoomAndSeats();
  }, [roomId]);

  // 生成时间段选项
  useEffect(() => {
    const now = new Date();
    const isToday = selectedDate === format(now, 'yyyy-MM-dd');
    const currentHour = now.getHours();
    
    const startHour = isToday ? Math.max(8, currentHour + 1) : 8;
    const slots: TimeSlot[] = [];
    
    for (let i = startHour; i < 22; i++) {
      const start = new Date(selectedDate);
      start.setHours(i, 0, 0, 0);
      
      const end = new Date(selectedDate);
      end.setHours(i + 1, 0, 0, 0);
      
      slots.push({
        start,
        end,
        formatted: `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`
      });
    }
    
    setTimeSlots(slots);
    setSelectedTimeSlot(null);
  }, [selectedDate]);

  // 检查座位在选定时间段的可用性
  useEffect(() => {
    async function checkSeatAvailability() {
      if (!roomId || !selectedTimeSlot) return;
      
      try {
        // 使用roomService检查座位可用性
        const availableSeats = await roomService.checkAvailability(roomId, {
          start_time: selectedTimeSlot.start.toISOString(),
          end_time: selectedTimeSlot.end.toISOString()
        });
        
        // 更新座位可用性状态
        setSeats(prevSeats => 
          prevSeats.map(seat => {
            const availableSeat = availableSeats.find(s => s.id === seat.id);
            return {
              ...seat,
              is_available: availableSeat ? availableSeat.is_available : false
            };
          })
        );
        
      } catch (error) {
        console.error('Error checking seat availability:', error);
      }
    }
    
    checkSeatAvailability();
  }, [roomId, selectedTimeSlot]);

  // 提交预约
  const handleReservation = async () => {
    if (!user || !roomId || !selectedSeat || !selectedTimeSlot) {
      setError('请选择座位和时间段');
      return;
    }

    try {
      setReserving(true);
      setError(null);
      
      // 使用reservationService创建预约
      await reservationService.createReservation({
        room_id: roomId,
        seat_id: selectedSeat,
        start_time: selectedTimeSlot.start.toISOString(),
        end_time: selectedTimeSlot.end.toISOString()
      });
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
      
    } catch (error) {
      console.error('Error creating reservation:', error);
      setError('创建预约失败，请重试');
    } finally {
      setReserving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="px-4 py-8">
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-600">自习室不存在或已被删除</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="px-4 py-8">
        <div className="bg-green-50 p-6 rounded-md text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">预约成功！</h2>
          <p className="text-gray-600 mb-6">您的自习室已成功预约，即将跳转到个人资料页面...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">预约自习室</h1>
      
      {error && (
        <div className="bg-red-50 p-4 rounded-md mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">自习室 {room.room_number}</h2>
          <div className="space-y-3 mb-6">
            <div className="flex items-center text-gray-600">
              <MapPin className="h-5 w-5 mr-2" />
              <span>{room.location}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Users className="h-5 w-5 mr-2" />
              <span>总容量: {room.capacity} 座位</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Clock className="h-5 w-5 mr-2" />
              <span>开放时间: 08:00 - 22:00</span>
            </div>
          </div>
          
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">选择预约日期和时间</h3>
            
            <div className="mb-6">
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                日期
              </label>
              <input
                type="date"
                id="date"
                min={format(new Date(), 'yyyy-MM-dd')}
                max={format(addHours(new Date(), 24 * 7), 'yyyy-MM-dd')}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                时间段
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {timeSlots.map((slot, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      selectedTimeSlot?.formatted === slot.formatted
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setSelectedTimeSlot(slot)}
                  >
                    {slot.formatted}
                  </button>
                ))}
              </div>
            </div>
            
            {selectedTimeSlot && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">选择座位</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {seats.map((seat) => (
                    <button
                      key={seat.id}
                      type="button"
                      disabled={!seat.is_available}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        !seat.is_available
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : selectedSeat === seat.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedSeat(seat.id)}
                    >
                      {seat.seat_number}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-8">
              <button
                type="button"
                disabled={!selectedSeat || !selectedTimeSlot || reserving}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                onClick={handleReservation}
              >
                {reserving ? (
                  <span className="flex items-center">
                    <svg className="w-5 h-5 mr-3 -ml-1 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    处理中...
                  </span>
                ) : (
                  '确认预约'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}