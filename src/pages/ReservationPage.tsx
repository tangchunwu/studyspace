import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { RefreshCw, AlertCircle } from 'lucide-react';
import useRoomStore from '../store/roomStore';
import useReservationStore from '../store/reservationStore';
import useAuthStore from '../store/authStore';
import { roomService } from '../api/services/roomService';
import { Seat } from '../types';
import ErrorHandler from '../components/ErrorHandler';

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
  const [availableSeats, setAvailableSeats] = useState<Seat[]>([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialFetch = useRef<boolean>(true);
  
  useEffect(() => {
    if (roomId) {
      console.log(`加载自习室详情: ${roomId}`);
      fetchRoomById(roomId);
    }
    
    return () => {
      // 组件卸载时清除定时器
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
        autoRefreshIntervalRef.current = null;
      }
    };
  }, [roomId, fetchRoomById]);
  
  // 如果获取到自习室详情，自动检查座位可用性
  useEffect(() => {
    if (currentRoom && currentRoom.id && isInitialFetch.current && currentRoom.status === 'available') {
      console.log('自动检查座位可用性');
      isInitialFetch.current = false;
      checkAvailability();
    }
  }, [currentRoom]);
  
  useEffect(() => {
    if (reservationError) {
      toast.error(reservationError);
    }
  }, [reservationError]);
  
  // 检查座位可用性的函数
  const checkAvailability = useCallback(async () => {
    if (!roomId || !selectedDate || !selectedStartTime || !selectedEndTime) {
      return;
    }
    
    // 检查自习室状态，如果不可用，清空座位数据并设置错误消息
    if (currentRoom && currentRoom.status !== 'available') {
      setAvailableSeats([]);
      let errorMsg = '';
      switch (currentRoom.status) {
        case 'maintenance':
          errorMsg = '该自习室正在维护中，暂不可预约';
          break;
        case 'closed':
          errorMsg = '该自习室已关闭，暂不可预约';
          break;
        default:
          errorMsg = '该自习室当前不可预约';
      }
      setAvailabilityError(errorMsg);
      return;
    }
    
    setAvailabilityError(null);
    
    try {
      setIsCheckingAvailability(true);
      
      // 构建开始和结束时间
      const startDateTime = `${selectedDate}T${selectedStartTime}:00`;
      const endDateTime = `${selectedDate}T${selectedEndTime}:00`;
      
      console.log(`检查座位可用性: ${startDateTime} 至 ${endDateTime}`);
      
      // 添加时间戳参数，确保每次请求都是最新的
      const timestamp = Date.now();
      const queryString = `?_t=${timestamp}`;
      
      // 检查可用座位
      const data = await roomService.checkAvailability(roomId, {
        start_time: startDateTime,
        end_time: endDateTime
      }, queryString);
      
      console.log(`获取到 ${data.length} 个座位，其中可用座位 ${data.filter(s => s.is_available).length} 个`);
      
      setAvailableSeats(data);
      setLastUpdate(new Date());
      
      // 如果已经选择了座位，但该座位现在不可用，取消选择
      if (selectedSeatId) {
        const seatStillAvailable = data.find(seat => seat.id === selectedSeatId && seat.is_available);
        if (!seatStillAvailable) {
          setSelectedSeatId('');
          toast.error('您选择的座位已不可用，请重新选择');
        }
      }
      
      // 如果没有可用座位，显示提示
      if (data.filter((seat) => seat.is_available).length === 0) {
        toast.error('所选时间段内没有可用座位');
      }
    } catch (error: any) {
      console.error('检查座位可用性失败:', error);
      
      // 处理特定错误码
      if (error.response && error.response.data) {
        setAvailabilityError(error.response.data.message || '检查座位可用性失败');
      } else {
        setAvailabilityError('检查座位可用性失败，请稍后重试');
      }
      
      setAvailableSeats([]);
    } finally {
      setIsCheckingAvailability(false);
    }
  }, [roomId, selectedDate, selectedStartTime, selectedEndTime, selectedSeatId, currentRoom]);
  
  // 手动检查可用性
  const handleCheckAvailability = () => {
    checkAvailability();
  };
  
  // 设置自动刷新 - 使用requestIdleCallback或setTimeout优化性能
  useEffect(() => {
    // 如果有可用座位数据，且启用了自动刷新，设置定时器
    if (availableSeats.length > 0 && autoRefreshEnabled) {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
      
      const requestRefresh = () => {
        if (typeof window.requestIdleCallback === 'function') {
          // 使用requestIdleCallback优化性能，在浏览器空闲时执行
          window.requestIdleCallback(() => checkAvailability(), { timeout: 2000 });
        } else {
          // 降级使用setTimeout
          setTimeout(checkAvailability, 500);
        }
      };
      
      autoRefreshIntervalRef.current = setInterval(() => {
        console.log('自动刷新座位状态...');
        requestRefresh();
      }, 60000); // 减少刷新频率，每60秒刷新一次
      
      return () => {
        if (autoRefreshIntervalRef.current) {
          clearInterval(autoRefreshIntervalRef.current);
          autoRefreshIntervalRef.current = null;
        }
      };
    } else if (!autoRefreshEnabled && autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current);
      autoRefreshIntervalRef.current = null;
    }
  }, [availableSeats.length, autoRefreshEnabled, checkAvailability]);
  
  const handleSeatSelect = (seatId: string) => {
    // 避免重复选择同一个座位
    if (selectedSeatId === seatId) {
      return;
    }
    setSelectedSeatId(seatId);
    
    // 查找座位对象用于提示
    const selectedSeat = availableSeats.find(seat => seat.id === seatId);
    if (selectedSeat) {
      toast.success(`已选择座位: ${selectedSeat.seat_number}`);
    }
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  if (roomError) {
    return (
      <div className="p-6">
        <ErrorHandler 
          type="server" 
          message={roomError}
          onRetry={() => fetchRoomById(roomId || '')}
        />
      </div>
    );
  }
  
  if (!currentRoom || !currentRoom.id) {
    return (
      <div className="p-6">
        <ErrorHandler 
          type="not-found" 
          message="找不到自习室信息"
        />
      </div>
    );
  }
  
  // 自习室状态不可用时显示警告
  if (currentRoom.status !== 'available') {
    let statusMessage = '';
    let statusType: 'maintenance' | 'closed' = 'closed';
    
    switch (currentRoom.status) {
      case 'maintenance':
        statusMessage = '该自习室正在维护中，暂不可预约';
        statusType = 'maintenance';
        break;
      case 'closed':
      default:
        statusMessage = '该自习室已关闭，暂不可预约';
        statusType = 'closed';
    }
    
    return (
      <div className="p-6">
        <div className="mb-6">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">{currentRoom.room_number} - {currentRoom.location}</h2>
            <p className="text-gray-600 mt-1">{currentRoom.description}</p>
          </div>
        </div>
        
        <div className={`p-4 rounded-lg mb-6 flex items-start ${
          statusType === 'maintenance' ? 'bg-yellow-50 text-yellow-800' : 'bg-red-50 text-red-800'
        }`}>
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium">{statusType === 'maintenance' ? '自习室维护中' : '自习室已关闭'}</h3>
            <p className="mt-1 text-sm">{statusMessage}</p>
            <p className="mt-2 text-sm">请选择其他可用的自习室进行预约。</p>
            <div className="mt-4">
              <button
                onClick={() => navigate('/rooms')}
                className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                  statusType === 'maintenance' 
                    ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                }`}
              >
                返回自习室列表
              </button>
            </div>
          </div>
        </div>
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
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSeatId(''); // 清除座位选择
                  setAvailableSeats([]); // 清除座位数据
                }}
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
                    setSelectedSeatId(''); // 清除座位选择
                    setAvailableSeats([]); // 清除座位数据
                    
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
                  onChange={(e) => {
                    setSelectedEndTime(e.target.value);
                    setSelectedSeatId(''); // 清除座位选择
                    setAvailableSeats([]); // 清除座位数据
                  }}
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
      
      {availabilityError && (
        <div className="bg-red-50 p-4 rounded-lg mb-6 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 text-red-600" />
          <div>
            <p className="text-red-800">{availabilityError}</p>
          </div>
        </div>
      )}
      
      {availableSeats.length > 0 && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-xl font-semibold">选择座位</h2>
            <div className="flex items-center">
              {lastUpdate && (
                <span className="text-xs text-gray-500 mr-2">
                  更新于 {lastUpdate.toLocaleTimeString()}
                </span>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => checkAvailability()}
                  disabled={isCheckingAvailability}
                  className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                  title="刷新座位状态"
                >
                  <RefreshCw className={`h-4 w-4 text-gray-600 ${isCheckingAvailability ? 'animate-spin' : ''}`} />
                </button>
                
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRefreshEnabled}
                    onChange={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                    className="sr-only"
                  />
                  <div className={`w-9 h-5 rounded-full transition-colors ${autoRefreshEnabled ? 'bg-indigo-500' : 'bg-gray-300'}`}>
                    <div className={`transform transition-transform duration-300 w-3.5 h-3.5 bg-white rounded-full shadow-md mt-0.75 ${autoRefreshEnabled ? 'translate-x-5' : 'translate-x-0.75'}`} style={{marginTop: '3px', marginLeft: '3px'}}></div>
                  </div>
                  <span className="ml-1 text-xs text-gray-600">自动刷新</span>
                </label>
              </div>
            </div>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {availableSeats.map((seat) => (
                <button
                  key={seat.id}
                  onClick={() => seat.is_available && handleSeatSelect(seat.id)}
                  disabled={!seat.is_available}
                  className={`
                    p-2 rounded-md text-center transition-all duration-200
                    ${selectedSeatId === seat.id ? 'bg-indigo-600 text-white ring-2 ring-indigo-300 ring-offset-2' : ''}
                    ${seat.is_available 
                      ? 'bg-green-100 hover:bg-green-200 text-green-800 border border-green-300 hover:scale-105'
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
              <div className="text-xs text-gray-500">
                共 {availableSeats.length} 个座位，可用 {availableSeats.filter(s => s.is_available).length} 个
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