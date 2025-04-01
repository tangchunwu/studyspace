import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, Clock, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import useRoomStore from '../store/roomStore';
import { StudyRoom } from '../types';
import RoomStatusMonitor from '../components/RoomStatusMonitor';

export function RoomList() {
  const { rooms, loading, error, fetchRooms, forceRefreshRooms, debouncedFetchRooms } = useRoomStore();
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [manualRefreshing, setManualRefreshing] = useState(false);
  
  // 记录组件挂载状态，防止在组件卸载后设置状态
  const isMounted = useRef(true);
  
  useEffect(() => {
    // 初始挂载时设置
    isMounted.current = true;
    
    // 清理函数
    return () => {
      isMounted.current = false;
    };
  }, []);

  // 初始加载自习室数据
  useEffect(() => {
    // 只在初次加载时使用防抖版本获取数据
    fetchRooms().then(() => {
      if (isMounted.current) {
        setLastUpdate(new Date());
      }
    });
  }, [fetchRooms]);

  // 设置定时刷新
  useEffect(() => {
    // 创建一个自动刷新的定时器，每60秒刷新一次数据
    // 使用防抖版本的API调用，减少重复请求
    const intervalId = setInterval(() => {
      if (!manualRefreshing) {
        debouncedFetchRooms();
        if (isMounted.current) {
          setLastUpdate(new Date());
        }
      }
    }, 60000); // 60秒刷新一次
    
    // 清理定时器
    return () => clearInterval(intervalId);
  }, [debouncedFetchRooms, manualRefreshing]);

  // 手动刷新处理
  const handleManualRefresh = useCallback(() => {
    setManualRefreshing(true);
    forceRefreshRooms().then(() => {
      if (isMounted.current) {
        setLastUpdate(new Date());
        setManualRefreshing(false);
        toast.success('自习室数据已更新');
      }
    }).catch(err => {
      if (isMounted.current) {
        setManualRefreshing(false);
        toast.error('刷新失败，请重试');
      }
    });
  }, [forceRefreshRooms]);

  // 状态监控更新处理
  const handleStatusUpdate = (updatedRooms: StudyRoom[]) => {
    if (isMounted.current) {
      setLastUpdate(new Date());
    }
  };

  if (loading && !manualRefreshing) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const getStatusText = (status: string, availableSeats: number) => {
    if (status === 'closed') return '已关闭';
    if (status === 'maintenance') return '维护中';
    if (availableSeats === 0) return '已满';
    return '可预约';
  };

  const getStatusColor = (status: string, availableSeats: number) => {
    if (status === 'closed' || status === 'maintenance') return 'text-red-600';
    if (availableSeats === 0) return 'text-orange-600';
    return 'text-green-600';
  };

  // 根据可用座位比例获取填充色
  const getAvailabilityColor = (capacity: number, availableSeats: number) => {
    if (capacity === 0) return 'bg-gray-200';
    
    const ratio = availableSeats / capacity;
    if (ratio <= 0) return 'bg-red-500';
    if (ratio < 0.2) return 'bg-red-400';
    if (ratio < 0.5) return 'bg-yellow-500';
    if (ratio < 0.8) return 'bg-green-400';
    return 'bg-green-500';
  };

  // 显示错误信息
  if (error) {
    return (
      <div className="px-4 py-8">
        <div className="bg-red-50 p-4 rounded-lg mb-6">
          <h2 className="text-red-800 font-semibold mb-2">加载失败</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button 
            onClick={handleManualRefresh}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-md transition-colors"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  // 调试信息
  console.log('渲染自习室数据:', rooms.length, '个自习室');
  console.log('自习室状态统计:', 
    rooms.filter(r => r.status === 'available').length, '个可用,',
    rooms.filter(r => r.status === 'maintenance').length, '个维护中,',
    rooms.filter(r => r.status === 'closed').length, '个已关闭'
  );

  return (
    <div className="px-4 py-8">
      {/* 状态监控组件 */}
      <RoomStatusMonitor 
        onStatusUpdate={handleStatusUpdate}
        pollingInterval={30000} // 30秒更新一次
        autoNotify={true}
      />
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">全部自习室</h1>
        
        <div className="flex items-center">
          {lastUpdate && (
            <span className="text-sm text-gray-500 mr-3">
              上次更新: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          
          <button 
            onClick={handleManualRefresh}
            disabled={manualRefreshing}
            className="flex items-center px-3 py-1 text-sm bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${manualRefreshing ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>
      </div>
      
      {/* 状态筛选和提示 */}
      <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
        <div className="flex flex-wrap gap-2 mb-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
            可预约
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            <span className="w-2 h-2 bg-orange-500 rounded-full mr-1"></span>
            已满
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
            维护中
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
            已关闭
          </span>
        </div>
        <p className="text-sm text-indigo-700">提示：维护中和已关闭的自习室暂时不可预约，请选择状态为"可预约"的自习室。</p>
      </div>
      
      {rooms.length === 0 && !loading ? (
        <div className="text-center py-10">
          <p className="text-gray-500 mb-4">没有找到自习室数据</p>
          <button 
            onClick={handleManualRefresh}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            刷新数据
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div key={room.id} className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-semibold text-gray-900">自习室 {room.room_number}</h2>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${room.status === 'available' && (room.available_seats || 0) > 0 ? 'bg-green-100 text-green-800' : 
                     room.status === 'available' && (room.available_seats || 0) <= 0 ? 'bg-orange-100 text-orange-800' :
                     room.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' : 
                     'bg-red-100 text-red-800'}`}>
                    {getStatusText(room.status, room.available_seats || 0)}
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-5 w-5 mr-2" />
                    <span>{room.location}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="h-5 w-5 mr-2" />
                    <span>总容量: {room.capacity} 座位</span>
                  </div>
                  {room.status === 'available' && (
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-5 w-5 mr-2" />
                      <span className={getStatusColor(room.status, room.available_seats || 0)}>
                        {(room.available_seats || 0) > 0 
                          ? `可用座位: ${room.available_seats}/${room.capacity}`
                          : '所有座位已预约'}
                      </span>
                    </div>
                  )}
                  
                  {/* 座位可用性进度条 - 仅在状态为available时显示 */}
                  {room.status === 'available' && (
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getAvailabilityColor(room.capacity, room.available_seats || 0)} transition-all duration-500`}
                        style={{ width: `${((room.available_seats || 0) / room.capacity) * 100}%` }}
                      ></div>
                    </div>
                  )}
                  
                  {/* 自习室描述 */}
                  {room.description && (
                    <div className="text-sm text-gray-500 italic">
                      {room.description}
                    </div>
                  )}
                </div>
                <div className="mt-6 flex gap-3">
                  <Link
                    to={`/rooms/${room.id}`}
                    className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    查看详情
                  </Link>
                  <Link
                    to={`/rooms/${room.id}`}
                    className={`flex-1 inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md transition-colors 
                      ${room.status === 'available' && (room.available_seats || 0) > 0 
                        ? 'text-white bg-indigo-600 hover:bg-indigo-700' 
                        : 'text-gray-400 bg-gray-200 cursor-not-allowed'}`}
                    onClick={(e) => {
                      if (room.status !== 'available' || (room.available_seats || 0) <= 0) {
                        e.preventDefault();
                        if (room.status === 'maintenance') {
                          toast.error('该自习室正在维护中，暂不可预约');
                        } else if (room.status === 'closed') {
                          toast.error('该自习室已关闭，暂不可预约');
                        } else {
                          toast.error('该自习室当前没有可用座位');
                        }
                      }
                    }}
                  >
                    {room.status === 'available' && (room.available_seats || 0) > 0 
                      ? '预约座位' 
                      : room.status === 'maintenance' 
                        ? '维护中' 
                        : room.status === 'closed' 
                          ? '已关闭' 
                          : '已满'}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}