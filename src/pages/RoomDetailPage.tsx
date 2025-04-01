import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useRoomStore from '../store/roomStore';
import useReservationStore from '../store/reservationStore';
import { Seat } from '../types';
import { toast } from 'react-hot-toast';
import SeatMap from '../components/SeatMap';

const RoomDetailPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { 
    currentRoom, 
    fetchRoomById, 
    checkAvailability, 
    availableSeats, 
    loading, 
    error, 
    setAvailableSeats 
  } = useRoomStore();
  const { createReservation, message: reservationMessage } = useReservationStore();
  
  // 预约表单状态
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [dateChangeTimer] = useState<NodeJS.Timeout | null>(null);
  
  // 获取自习室详情
  useEffect(() => {
    if (roomId) {
      console.log('RoomDetailPage: 尝试获取自习室详情，ID =', roomId);
      
      // 显示加载提示给用户
      const loadingToastId = toast.loading('加载自习室信息...');
      
      // 清除先前可能存在的错误状态
      setFormError(null);
      
      fetchRoomById(roomId)
        .then(data => {
          console.log('RoomDetailPage: 成功获取自习室详情:', data);
          
          // 关闭加载提示
          toast.dismiss(loadingToastId);
          
          if (data) {
            if (data.seats && Array.isArray(data.seats) && data.seats.length > 0) {
              console.log(`RoomDetailPage: 成功获取自习室座位数据，共 ${data.seats.length} 个座位`);
              toast.success(`成功加载自习室 ${data.room_number} 的座位信息`, {
                duration: 2000
              });
              
              // 自动填充为今天的日期和默认时间段
              const today = new Date();
              const dateString = today.toISOString().split('T')[0];
              setStartTime(`${dateString}T08:00:00`);
              setEndTime(`${dateString}T10:00:00`);
              
              // 自动检查座位可用性
              setTimeout(() => {
                handleCheckAvailability();
              }, 1000);
            } else {
              console.warn('RoomDetailPage: 自习室数据中没有座位信息或座位为空数组');
              toast.error('此自习室尚未配置座位信息，请联系管理员', {
                duration: 3000
              });
            }
          }
        })
        .catch(err => {
          console.error('RoomDetailPage: 获取自习室详情失败:', err);
          toast.dismiss(loadingToastId);
          toast.error('获取自习室信息失败: ' + (err.message || '未知错误'), {
            duration: 4000
          });
          // 设置组件内部错误状态，方便在UI上显示
          setFormError('无法获取自习室详情，请稍后重试或返回列表页');
        });
    } else {
      // 如果没有roomId参数
      console.error('RoomDetailPage: 缺少自习室ID参数');
      toast.error('缺少自习室ID参数');
      setTimeout(() => navigate('/rooms'), 2000);
    }
  }, [roomId, fetchRoomById, navigate]);

  // 根据预约成功消息导航回首页
  useEffect(() => {
    if (reservationMessage) {
      setTimeout(() => {
        navigate('/');
      }, 2000);
    }
  }, [reservationMessage, navigate]);

  // 在useEffect中检测当前room状态变化，并确保数据加载完成后自动填充当前日期和进行查询
  useEffect(() => {
    if (currentRoom && currentRoom.id && !isSearching && !selectedDate) {
      // 自动填充今天的日期和默认时间
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0];
      setSelectedDate(formattedDate);
      setStartTime('08:00');
      setEndTime('10:00');
      
      // 1秒后自动检查可用座位
      const timer = setTimeout(() => {
        handleCheckAvailability();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [currentRoom]);

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

  // 日期改变时，添加延迟自动查询
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    
    // 清除之前的定时器
    if (dateChangeTimer.current) {
      clearTimeout(dateChangeTimer.current);
    }
    
    // 设置新的定时器，500毫秒后自动查询可用座位
    dateChangeTimer.current = setTimeout(() => {
      handleCheckAvailability();
    }, 500);
  };

  // 修复时间处理和座位选择逻辑
  const handleStartTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStartTime = e.target.value;
    setStartTime(newStartTime);
    
    // 确保结束时间在开始时间之后
    const startHour = parseInt(newStartTime.split(':')[0]);
    const endHour = parseInt(endTime.split(':')[0]);
    
    if (endHour <= startHour) {
      const newEndHour = Math.min(startHour + 2, 22);
      setEndTime(`${newEndHour.toString().padStart(2, '0')}:00`);
    }
    
    // 如果已经选择了日期，则自动触发座位查询
    if (selectedDate) {
      // 延迟500毫秒执行查询，给用户反应时间
      if (dateChangeTimer.current) {
        clearTimeout(dateChangeTimer.current);
      }
      dateChangeTimer.current = setTimeout(() => {
        handleCheckAvailability();
      }, 500);
    }
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newEndTime = e.target.value;
    setEndTime(newEndTime);
    
    // 如果已经选择了日期和开始时间，则自动触发座位查询
    if (selectedDate && startTime) {
      // 延迟500毫秒执行查询，给用户反应时间
      if (dateChangeTimer.current) {
        clearTimeout(dateChangeTimer.current);
      }
      dateChangeTimer.current = setTimeout(() => {
        handleCheckAvailability();
      }, 500);
    }
  };

  // 改进检查可用座位的函数
  const handleCheckAvailability = async () => {
    if (!selectedDate) {
      toast.error('请选择日期');
      return;
    }
    
    if (!startTime || !endTime) {
      toast.error('请选择时间段');
      return;
    }
    
    const startHour = parseInt(startTime.split(':')[0]);
    const endHour = parseInt(endTime.split(':')[0]);
    
    if (endHour <= startHour) {
      toast.error('结束时间必须晚于开始时间');
      return;
    }
    
    // 显示加载提示
    const loadingToast = toast.loading('正在查询可用座位...');
    
    setIsSearching(true);
    setSelectedSeat(null);
    
    try {
      if (currentRoom?.id) {
        const timeSlot = `${startTime}-${endTime}`;
        console.log(`查询参数: 自习室=${currentRoom.id}, 日期=${selectedDate}, 时间段=${timeSlot}`);
        
        const result = await checkAvailability(currentRoom.id, selectedDate, timeSlot);
        
        toast.dismiss(loadingToast);
        
        if (result && result.length > 0) {
          toast.success(`查询成功，有 ${result.length} 个可用座位`);
          console.log(`查询结果: ${result.length} 个可用座位`, result);
          // 更新全局状态中的可用座位列表
          setAvailableSeats(result);
        } else {
          toast.error('所选时间段没有可用座位');
          console.log('查询结果: 没有可用座位');
          setAvailableSeats([]);
        }
      } else {
        toast.dismiss(loadingToast);
        toast.error('自习室信息不完整，无法查询');
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('查询座位可用性出错:', error);
      toast.error('查询座位可用性出错');
      setAvailableSeats([]);
    } finally {
      setIsSearching(false);
    }
  };

  // 处理座位选择
  const handleSeatSelect = (seatId: string) => {
    console.log(`选择座位: ${seatId}`);
    setSelectedSeat(seatId);
    toast.success(`已选择座位 ${
      currentRoom?.seats?.find(s => s.id === seatId)?.seat_number || seatId
    }`);
  };

  // 判断座位是否可用
  const isSeatAvailable = (seatId: string): boolean => {
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
    
    if (!currentRoom) {
      setFormError('无法获取自习室信息');
      return;
    }
    
    try {
      // 使用更新后的reservationStore接口
      const success = await createReservation({
        room_id: currentRoom.id,
        seat_id: selectedSeat,
        start_time: startTime,
        end_time: endTime
      });
      
      if (success) {
        toast.success('预约成功！');
        
        // 预约成功后，延迟一段时间返回首页
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (error) {
      console.error('预约失败:', error);
      setFormError('预约失败，请稍后重试');
    }
  };

  // 渲染座位图
  const renderSeats = () => {
    if (!currentRoom) {
      console.warn('renderSeats: currentRoom 为 null');
      return (
        <div className="text-center py-8 text-gray-500">
          <p>无法获取自习室信息</p>
          <button 
            onClick={() => navigate('/rooms')}
            className="mt-2 text-sm text-indigo-600 hover:text-indigo-500"
          >
            返回自习室列表
          </button>
        </div>
      );
    }
    
    if (!currentRoom.seats) {
      console.warn('renderSeats: currentRoom.seats 为 undefined');
      return (
        <div className="text-center py-8 text-gray-500">
          <p>暂无座位数据，请联系管理员添加座位</p>
          <button 
            onClick={() => {
              console.log('手动刷新自习室详情');
              toast.loading('重新加载自习室信息...');
              fetchRoomById(currentRoom.id || '');
            }}
            className="mt-2 text-sm text-indigo-600 hover:text-indigo-500"
          >
            重新加载
          </button>
        </div>
      );
    }
    
    if (currentRoom.seats.length === 0) {
      console.warn('renderSeats: currentRoom.seats 为空数组');
      return (
        <div className="text-center py-8 text-gray-500">
          <p>该自习室暂无座位数据，请联系管理员添加座位</p>
          <button 
            onClick={() => navigate('/rooms')}
            className="mt-2 text-sm text-indigo-600 hover:text-indigo-500"
          >
            返回自习室列表
          </button>
        </div>
      );
    }
    
    console.log('renderSeats: 渲染座位数据', {
      总数: currentRoom.seats.length,
      前5个: currentRoom.seats.slice(0, 5).map(s => s.seat_number)
    });
    
    return (
      <SeatMap 
        seats={currentRoom.seats}
        selectedSeatId={selectedSeat}
        isSearching={isSearching}
        availableSeats={availableSeats}
        onSeatSelect={handleSeatSelect}
        className="mt-4"
      />
    );
  };

  // 在渲染前添加调试日志
  console.log('RoomDetailPage状态:', { 
    currentRoom: currentRoom ? { 
      id: currentRoom.id, 
      room_number: currentRoom.room_number, 
      seatsCount: currentRoom.seats?.length || 0,
      seats: currentRoom.seats?.slice(0, 3).map(s => s.seat_number) || []
    } : null,
    loading, 
    error, 
    isSearching, 
    selectedSeat,
    availableSeats: availableSeats ? `${availableSeats.length}个可用座位` : '无'
  });

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-red-50 p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-red-700 mb-2">加载失败</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <div className="flex space-x-4">
            <button
              onClick={() => {
                console.log('尝试重新加载自习室详情');
                toast.loading('重新加载自习室信息...');
                fetchRoomById(currentRoom?.id || '');
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              重新加载
            </button>
            <button
              onClick={() => navigate('/rooms')}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              返回自习室列表
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !currentRoom) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center h-64">
          <svg className="animate-spin h-12 w-12 text-indigo-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-500">正在加载自习室信息，请稍候...</p>
        </div>
      </div>
    );
  }

  if (!currentRoom) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-red-50 p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-red-700 mb-2">无法加载自习室信息</h2>
          <p className="text-red-700 mb-4">未能获取到自习室数据，请检查URL参数是否正确</p>
          <button
            onClick={() => navigate('/rooms')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
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
            <h1 className="text-2xl font-bold text-gray-900">{currentRoom.room_number}</h1>
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
              <p className="text-sm text-gray-500">状态</p>
              <p className="font-medium">
                {currentRoom.status === 'available' ? '开放中' : 
                 currentRoom.status === 'maintenance' ? '维护中' : '已关闭'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-md p-3">
              <p className="text-sm text-gray-500">位置</p>
              <p className="font-medium">{currentRoom.location}</p>
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
                <input
                  id="date"
                  type="date"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  onChange={handleDateChange}
                  value={selectedDate}
                />
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
                  {!availableSeats || availableSeats.length === 0 
                    ? '当前时段没有可用座位' 
                    : `当前时段有 ${availableSeats.length} 个可用座位，请在下方选择`}
                </p>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <p className="text-gray-700">请先选择日期和时间段，然后点击"查询可用座位"</p>
              </div>
            )}
            
            <div className="mt-4 border-t border-gray-200 pt-6">
              <div className="flex justify-center mb-6">
                <div className="bg-gray-200 text-center py-2 px-16 rounded-md">
                  <p className="text-gray-600 text-sm">前方</p>
                </div>
              </div>
              
              <div className="overflow-x-auto max-h-[500px]">
                {renderSeats()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 调试面板 - 仅在开发模式下显示 */}
      {import.meta.env.MODE === 'development' && (
        <div className="mt-8 p-4 border border-gray-300 rounded-md bg-gray-50">
          <h3 className="text-lg font-medium text-gray-700 mb-2">调试信息</h3>
          <div className="grid grid-cols-1 gap-4 text-sm">
            <div>
              <p className="font-medium">自习室ID:</p>
              <pre className="bg-white p-2 rounded">{currentRoom?.id}</pre>
            </div>
            {currentRoom && (
              <>
                <div>
                  <p className="font-medium">自习室信息:</p>
                  <pre className="bg-white p-2 rounded overflow-auto max-h-40">
                    {JSON.stringify({
                      room_number: currentRoom.room_number,
                      location: currentRoom.location,
                      capacity: currentRoom.capacity,
                      status: currentRoom.status,
                    }, null, 2)}
                  </pre>
                </div>
                <div>
                  <p className="font-medium">座位数量: {currentRoom.seats?.length || 0}</p>
                  {currentRoom.seats && currentRoom.seats.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium">前5个座位:</p>
                      <pre className="bg-white p-2 rounded overflow-auto max-h-40">
                        {JSON.stringify(currentRoom.seats.slice(0, 5), null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </>
            )}
            <div>
              <p className="font-medium">组件状态:</p>
              <pre className="bg-white p-2 rounded overflow-auto max-h-40">
                {JSON.stringify({
                  loading,
                  error: error || "无",
                  isSearching,
                  selectedSeat,
                  availableSeatsCount: availableSeats?.length || 0,
                }, null, 2)}
              </pre>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => window.location.reload()}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded"
              >
                刷新页面
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomDetailPage; 