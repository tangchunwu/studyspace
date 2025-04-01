import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Users, Clock, ArrowRight, RefreshCw, AlertTriangle } from 'lucide-react';
import useRoomStore from '../store/roomStore';
import { toast } from 'react-hot-toast';

const RoomListPage = () => {
  const { fetchRooms, rooms, loading, error, forceRefreshRooms } = useRoomStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [loadAttempts, setLoadAttempts] = useState(0);
  
  // 初始加载数据
  useEffect(() => {
    console.log('RoomListPage: 组件挂载，开始加载数据');
    loadData();
    
    // 定时刷新
    const refreshInterval = setInterval(() => {
      if (!loading && !isManualRefreshing) {
        console.log('定时自动刷新数据');
        fetchRooms().catch(err => console.error('自动刷新失败:', err));
      }
    }, 60000); // 每分钟刷新一次
    
    return () => clearInterval(refreshInterval);
  }, []);
  
  const loadData = async () => {
    try {
      console.log('RoomListPage: 初始化加载自习室数据');
      setLoadAttempts(prev => prev + 1);
      toast.loading('正在加载自习室数据...', { id: 'load-toast' });
      
      await forceRefreshRooms();
      
      console.log('自习室数据加载成功');
      toast.success('数据加载成功', { id: 'load-toast' });
    } catch (err: any) {
      console.error('加载自习室数据失败:', err);
      toast.error('无法加载自习室数据，请检查服务器连接', { id: 'load-toast' });
      
      // 如果加载尝试次数小于3，则5秒后自动重试
      if (loadAttempts < 3) {
        toast('5秒后自动重试...', { icon: '⏱️' });
        setTimeout(() => loadData(), 5000);
      }
    }
  };
  
  // 自定义刷新功能
  const handleManualRefresh = useCallback(async () => {
    if (isManualRefreshing || loading) return;
    
    setIsManualRefreshing(true);
    toast.loading('正在刷新数据...', { id: 'refresh-toast' });
    
    try {
      await forceRefreshRooms();
      toast.success('数据刷新成功', { id: 'refresh-toast' });
    } catch (err) {
      console.error('手动刷新失败:', err);
      toast.error('刷新失败，请重试', { id: 'refresh-toast' });
    } finally {
      setIsManualRefreshing(false);
    }
  }, [forceRefreshRooms, isManualRefreshing, loading]);
  
  // 获取所有位置（用于筛选）
  const allLocations = Array.from(new Set(rooms.map(room => room.location))).sort();
  
  // 筛选房间
  const filteredRooms = rooms.filter(room => {
    let matchesSearchTerm = true;
    let matchesLocation = true;
    
    if (searchTerm) {
      matchesSearchTerm = 
        room.room_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (room.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        room.location.toLowerCase().includes(searchTerm.toLowerCase());
    }
    
    if (selectedLocation) {
      matchesLocation = room.location === selectedLocation;
    }
    
    return matchesSearchTerm && matchesLocation;
  });
  
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedLocation('');
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">自习室列表</h1>
          <p className="mt-2 text-gray-600">
            浏览所有可用的自习室。选择一个自习室查看详情并预约座位。
          </p>
        </div>
        
        <button 
          onClick={handleManualRefresh}
          disabled={isManualRefreshing || loading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-4 w-4 ${isManualRefreshing || loading ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">筛选</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                搜索
              </label>
              <input
                type="text"
                id="search"
                placeholder="教室号或关键词"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                位置
              </label>
              <select
                id="location"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
              >
                <option value="">全部位置</option>
                {allLocations.map(location => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                className="w-full p-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none"
                onClick={clearFilters}
              >
                清除筛选
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">
            可用自习室 
            <span className="ml-2 text-sm font-medium text-gray-500">
              {filteredRooms.length} 个结果
            </span>
          </h2>
        </div>
        
        <div className="p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
              <p className="text-gray-600">正在加载自习室数据...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500 flex flex-col items-center">
              <AlertTriangle className="h-12 w-12 mb-4 text-red-500" />
              <p className="mb-4 font-semibold">加载失败：{error}</p>
              <p className="mb-6 text-gray-600">请检查网络连接或服务器状态</p>
              <button 
                onClick={handleManualRefresh}
                disabled={isManualRefreshing}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isManualRefreshing ? 'animate-spin' : ''}`} />
                重新加载
              </button>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              没有符合条件的自习室
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRooms.map((room) => (
                <div 
                  key={room.id}
                  className="border rounded-md overflow-hidden hover:shadow-md transition"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-medium text-gray-900">{room.room_number}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        room.status === 'available' 
                          ? 'bg-green-100 text-green-800' 
                          : room.status === 'maintenance'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {room.status === 'available' ? '开放中' : 
                          room.status === 'maintenance' ? '维护中' : '已关闭'}
                      </span>
                    </div>
                    
                    <p className="mt-1 text-sm text-gray-600">{room.location}</p>
                    <p className="mt-2 text-sm text-gray-500 line-clamp-2">{room.description || '无描述'}</p>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="h-4 w-4 mr-1" />
                        <span>容量: {room.capacity}个座位</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>空闲座位: {room.available_seats || 0}/{room.capacity}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <Link 
                        to={`/rooms/${room.id}`}
                        className={`flex items-center justify-center w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md ${
                          room.status === 'available' 
                            ? 'text-white bg-indigo-600 hover:bg-indigo-700' 
                            : 'text-gray-500 bg-gray-100 cursor-not-allowed'
                        }`}
                        onClick={(e) => {
                          if (room.status !== 'available') {
                            e.preventDefault();
                            toast.error('该自习室当前不可预约');
                          }
                        }}
                      >
                        查看详情
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomListPage; 