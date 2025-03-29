import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useRoomStore from '../store/roomStore';
import useReservationStore from '../store/reservationStore';
import { Seat } from '../types';

const RoomDetailPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { 
    currentRoom, 
    fetchRoomById, 
    checkAvailability, 
    availableSeats, 
    loading, 
    error 
  } = useRoomStore();
  const { createReservation, message: reservationMessage } = useReservationStore();
  
  // 预约表单状态
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // 获取自习室详情
  useEffect(() => {
    if (roomId) {
      fetchRoomById(parseInt(roomId));
    }
  }, [roomId, fetchRoomById]);

  // 根据预约成功消息导航回首页
  useEffect(() => {
    if (reservationMessage) {
      setTimeout(() => {
        navigate('/');
      }, 2000);
    }
  }, [reservationMessage, navigate]);

  // 生成今天和未来7天的日期选项
  const dateOptions = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateString = date.toISOString().split('T')[0];
    const displayDate = i === 0 
      ? '今天' 
      : i === 1 
        ? '明天' 
        : date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
    
    dateOptions.push({ value: dateString, label: displayDate });
  }

  // 生成时间选项（8:00 - 22:00，每小时一个选项）
  const timeOptions = [];
  for (let hour = 8; hour <= 22; hour++) {
    const timeString = `${hour.toString().padStart(2, '0')}:00`;
    timeOptions.push({ value: timeString, label: timeString });
  }

  // 处理日期时间选择
  const handleDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedDate = e.target.value;
    setStartTime(selectedDate ? `${selectedDate}T${timeOptions[0].value}:00` : '');
    setEndTime(selectedDate ? `${selectedDate}T${timeOptions[timeOptions.length - 1].value}:00` : '');
    setSelectedSeat(null);
    setIsSearching(false);
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const date = startTime.split('T')[0];
    const newStartTime = `${date}T${e.target.value}:00`;
    setStartTime(newStartTime);
    
    // 确保结束时间在开始时间之后
    const startHour = parseInt(e.target.value.split(':')[0]);
    const endHour = parseInt(endTime.split('T')[1].split(':')[0]);
    
    if (endHour <= startHour) {
      const newEndHour = Math.min(startHour + 1, 22);
      setEndTime(`${date}T${newEndHour.toString().padStart(2, '0')}:00:00`);
    }
    
    setSelectedSeat(null);
    setIsSearching(false);
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const date = endTime.split('T')[0];
    setEndTime(`${date}T${e.target.value}:00`);
    setSelectedSeat(null);
    setIsSearching(false);
  };

  // 检查座位可用性
  const handleCheckAvailability = () => {
    setFormError(null);
    
    if (!startTime || !endTime) {
      setFormError('请选择日期和时间');
      return;
    }
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (end <= start) {
      setFormError('结束时间必须晚于开始时间');
      return;
    }
    
    if (roomId) {
      setIsSearching(true);
      checkAvailability(parseInt(roomId), startTime, endTime);
    }
  };

  // 处理座位选择
  const handleSeatSelect = (seatId: number) => {
    setSelectedSeat(selectedSeat === seatId ? null : seatId);
  };

  // 判断座位是否可用
  const isSeatAvailable = (seatId: number): boolean => {
    if (!isSearching || !availableSeats) return true;
    return availableSeats.includes(seatId);
  };

  // 处理预约提交
  const handleReservation = async () => {
    setFormError(null);
    
    if (!startTime || !endTime) {
      setFormError('请选择预约时间');
      return;
    }
    
    if (!selectedSeat) {
      setFormError('请选择座位');
      return;
    }
    
    await createReservation({
      seat_id: selectedSeat,
      start_time: startTime,
      end_time: endTime
    });
  };

  // 渲染座位图
  const renderSeats = () => {
    if (!currentRoom || !currentRoom.seats) return null;
    
    // 按行分组座位
    const seatsByRow = currentRoom.seats.reduce((acc: { [key: number]: Seat[] }, seat) => {
      if (!acc[seat.row]) {
        acc[seat.row] = [];
      }
      acc[seat.row].push(seat);
      return acc;
    }, {});
    
    return Object.keys(seatsByRow)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(row => {
        const seats = seatsByRow[parseInt(row)].sort((a, b) => a.column - b.column);
        
        return (
          <div key={`row-${row}`} className="flex justify-center my-2">
            <div className="flex space-x-3 items-center">
              <div className="w-8 text-right text-sm text-gray-500">{row}排</div>
              {seats.map(seat => {
                const isAvailable = isSeatAvailable(seat.id);
                const isSelected = selectedSeat === seat.id;
                
                return (
                  <button
                    key={seat.id}
                    disabled={!isAvailable || !isSearching}
                    onClick={() => isAvailable && isSearching && handleSeatSelect(seat.id)}
                    className={`w-10 h-10 flex items-center justify-center rounded-md focus:outline-none
                      ${!isSearching ? 'bg-gray-200 text-gray-400' : 
                        isSelected ? 'bg-indigo-600 text-white' : 
                        isAvailable ? 'bg-green-100 text-green-800 hover:bg-green-200' : 
                        'bg-red-100 text-red-800 cursor-not-allowed'}`}
                  >
                    {seat.seat_number}
                  </button>
                );
              })}
            </div>
          </div>
        );
      });
  };

  if (loading && !currentRoom) {
    return (
      <div className="flex justify-center items-center h-64">
        <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (error || !currentRoom) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-700">{error || '无法加载自习室信息'}</p>
          <button
            onClick={() => navigate('/rooms')}
            className="mt-2 text-sm text-indigo-600 hover:text-indigo-500"
          >
            返回自习室列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* 自习室信息 */}
      <div className="bg-white shadow overflow-hidden rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{currentRoom.name}</h1>
            <p className="mt-1 text-sm text-gray-500">{currentRoom.location}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">总座位数</p>
            <p className="text-xl font-semibold">{currentRoom.capacity}</p>
          </div>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <p className="text-gray-700">{currentRoom.description || '暂无描述'}</p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="bg-gray-50 rounded-md p-3">
              <p className="text-sm text-gray-500">开放时间</p>
              <p className="font-medium">8:00 - 22:00</p>
            </div>
            <div className="bg-gray-50 rounded-md p-3">
              <p className="text-sm text-gray-500">可用座位</p>
              <p className="font-medium">{currentRoom.available_seats} / {currentRoom.capacity}</p>
            </div>
            <div className="bg-gray-50 rounded-md p-3">
              <p className="text-sm text-gray-500">楼层</p>
              <p className="font-medium">{currentRoom.location.split(' ').pop() || '未知'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 预约表单和座位图 */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* 预约表单 */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">预约座位</h2>
            
            {reservationMessage && (
              <div className="mb-4 p-3 rounded-md bg-green-50 text-green-700">
                {reservationMessage}
                <p className="text-sm mt-1">即将返回首页...</p>
              </div>
            )}
            
            {formError && (
              <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700">
                {formError}
              </div>
            )}
            
            <div className="space-y-4">
              {/* 日期选择 */}
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                  日期
                </label>
                <select
                  id="date"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  onChange={handleDateChange}
                  defaultValue=""
                >
                  <option value="" disabled>选择日期</option>
                  {dateOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* 时间选择 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                    开始时间
                  </label>
                  <select
                    id="startTime"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    onChange={handleStartTimeChange}
                    value={startTime ? startTime.split('T')[1].substring(0, 5) : ''}
                    disabled={!startTime}
                  >
                    <option value="" disabled>选择开始时间</option>
                    {timeOptions.slice(0, -1).map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                    结束时间
                  </label>
                  <select
                    id="endTime"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    onChange={handleEndTimeChange}
                    value={endTime ? endTime.split('T')[1].substring(0, 5) : ''}
                    disabled={!endTime}
                  >
                    <option value="" disabled>选择结束时间</option>
                    {timeOptions.slice(1).map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 查询按钮 */}
              <button
                type="button"
                disabled={!startTime || !endTime || loading}
                onClick={handleCheckAvailability}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? '查询中...' : '查询可用座位'}
              </button>
              
              {/* 预约按钮 */}
              {isSearching && (
                <button
                  type="button"
                  disabled={!selectedSeat || loading}
                  onClick={handleReservation}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {loading ? '处理中...' : '确认预约'}
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* 座位图 */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">座位布局</h2>
            
            {isSearching ? (
              <div className="mb-4 p-3 bg-blue-50 rounded-md">
                <p className="text-blue-700">
                  {availableSeats?.length === 0 
                    ? '当前时段没有可用座位' 
                    : `当前时段有 ${availableSeats?.length} 个可用座位，请在下方选择`}
                </p>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <p className="text-gray-700">请先选择日期和时间段，然后点击"查询可用座位"</p>
              </div>
            )}
            
            <div className="mt-8 border-t border-gray-200 pt-6">
              <div className="flex justify-center mb-6">
                <div className="bg-gray-200 text-center py-2 px-16 rounded-md">
                  <p className="text-gray-600 text-sm">前方</p>
                </div>
              </div>
              
              {renderSeats()}
              
              <div className="flex justify-center mt-8 space-x-6">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-green-100 rounded-md mr-2"></div>
                  <span className="text-sm text-gray-600">可用</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-red-100 rounded-md mr-2"></div>
                  <span className="text-sm text-gray-600">已预约</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-indigo-600 rounded-md mr-2"></div>
                  <span className="text-sm text-gray-600">已选择</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetailPage; 