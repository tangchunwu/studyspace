import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import useRoomStore from '../store/roomStore';
import useReservationStore from '../store/reservationStore';
import useAuthStore from '../store/authStore';

const ReservationPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { fetchRoomById, currentRoom, loading: roomLoading, error: roomError } = useRoomStore();
  const { createReservation, loading: reservationLoading, error: reservationError } = useReservationStore();
  
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedStartTime, setSelectedStartTime] = useState<string>('09:00');
  const [selectedEndTime, setSelectedEndTime] = useState<string>('11:00');
  const [selectedSeatId, setSelectedSeatId] = useState<string>('');
  const [availableSeats, setAvailableSeats] = useState<any[]>([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  
  useEffect(() => {
    if (roomId) {
      fetchRoomById(roomId);
    }
  }, [roomId, fetchRoomById]);
  
  useEffect(() => {
    if (reservationError) {
      toast.error(reservationError);
    }
  }, [reservationError]);
  
  const handleCheckAvailability = async () => {
    if (!roomId || !selectedDate || !selectedStartTime || !selectedEndTime) {
      toast.error('请选择预约日期和时间');
      return;
    }
    
    try {
      setIsCheckingAvailability(true);
      
      // 构建开始和结束时间
      const startDateTime = `${selectedDate}T${selectedStartTime}:00`;
      const endDateTime = `${selectedDate}T${selectedEndTime}:00`;
      
      // 检查可用座位
      const response = await fetch(`http://localhost:3000/api/rooms/${roomId}/check-availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          start_time: startDateTime,
          end_time: endDateTime
        })
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || '检查座位可用性失败');
      }
      
      setAvailableSeats(data);
      
      // 如果没有可用座位，显示提示
      if (data.filter((seat: any) => seat.is_available).length === 0) {
        toast.error('所选时间段内没有可用座位');
      }
    } catch (error) {
      console.error('检查座位可用性失败:', error);
      toast.error('检查座位可用性失败');
    } finally {
      setIsCheckingAvailability(false);
    }
  };
  
  const handleSeatSelect = (seatId: string) => {
    setSelectedSeatId(seatId);
  };
  
  const handleSubmit = async () => {
    if (!roomId || !selectedSeatId || !selectedDate || !selectedStartTime || !selectedEndTime) {
      toast.error('请选择座位和预约时间');
      return;
    }
    
    // 构建开始和结束时间
    const startDateTime = `${selectedDate}T${selectedStartTime}:00`;
    const endDateTime = `${selectedDate}T${selectedEndTime}:00`;
    
    // 创建预约
    const success = await createReservation(roomId, selectedSeatId, startDateTime, endDateTime);
    
    if (success) {
      toast.success('预约成功');
      navigate('/');
    }
  };
  
  // 生成日期选项（今天和未来7天）
  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return {
      value: format(date, 'yyyy-MM-dd'),
      label: format(date, 'yyyy年MM月dd日') + (i === 0 ? ' (今天)' : i === 1 ? ' (明天)' : '')
    };
  });
  
  // 生成时间选项（8:00 - 22:00，以小时为间隔）
  const timeOptions = Array.from({ length: 15 }, (_, i) => {
    const hour = i + 8;
    const hourString = hour.toString().padStart(2, '0');
    return {
      value: `${hourString}:00`,
      label: `${hourString}:00`
    };
  });
  
  if (roomLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  if (roomError) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">{roomError}</p>
        <button 
          onClick={() => navigate('/rooms')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          返回自习室列表
        </button>
      </div>
    );
  }
  
  if (!currentRoom) {
    return (
      <div className="p-4 text-center">
        <p>未找到自习室信息</p>
        <button 
          onClick={() => navigate('/rooms')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          返回自习室列表
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">预约自习室</h1>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">{currentRoom.room_number} - {currentRoom.location}</h2>
          <p className="text-gray-600 mt-1">{currentRoom.description}</p>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">选择日期</label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {dateOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
                <select
                  value={selectedStartTime}
                  onChange={(e) => {
                    setSelectedStartTime(e.target.value);
                    // 确保结束时间至少比开始时间晚1小时
                    const startIndex = timeOptions.findIndex(t => t.value === e.target.value);
                    if (startIndex >= timeOptions.length - 1) {
                      setSelectedEndTime(timeOptions[timeOptions.length - 1].value);
                    } else {
                      setSelectedEndTime(timeOptions[startIndex + 1].value);
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {timeOptions.slice(0, -1).map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">结束时间</label>
                <select
                  value={selectedEndTime}
                  onChange={(e) => setSelectedEndTime(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {timeOptions.slice(timeOptions.findIndex(t => t.value === selectedStartTime) + 1).map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleCheckAvailability}
            disabled={isCheckingAvailability}
            className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isCheckingAvailability ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                检查座位可用性...
              </span>
            ) : '检查座位可用性'}
          </button>
        </div>
      </div>
      
      {availableSeats.length > 0 && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">选择座位</h2>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {availableSeats.map((seat) => (
                <button
                  key={seat.id}
                  onClick={() => handleSeatSelect(seat.id)}
                  disabled={!seat.is_available}
                  className={`
                    p-2 rounded-md text-center 
                    ${selectedSeatId === seat.id ? 'bg-indigo-600 text-white' : ''}
                    ${seat.is_available 
                      ? 'bg-green-100 hover:bg-green-200 text-green-800 border border-green-300'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
                  `}
                >
                  {seat.seat_number.split('-')[1]}
                </button>
              ))}
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-100 border border-green-300 mr-1"></div>
                  <span className="text-sm">可用</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-indigo-600 mr-1"></div>
                  <span className="text-sm">已选</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-100 mr-1"></div>
                  <span className="text-sm">已占</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {selectedSeatId && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">确认预约信息</h2>
          </div>
          
          <div className="p-4">
            <div className="space-y-2 mb-4">
              <p><span className="font-semibold">自习室:</span> {currentRoom.room_number} - {currentRoom.location}</p>
              <p><span className="font-semibold">座位号:</span> {availableSeats.find(s => s.id === selectedSeatId)?.seat_number}</p>
              <p><span className="font-semibold">预约日期:</span> {dateOptions.find(d => d.value === selectedDate)?.label}</p>
              <p><span className="font-semibold">时间段:</span> {selectedStartTime} - {selectedEndTime}</p>
              <p><span className="font-semibold">预约人:</span> {user?.name}</p>
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={reservationLoading}
              className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {reservationLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  提交中...
                </span>
              ) : '确认预约'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationPage; 