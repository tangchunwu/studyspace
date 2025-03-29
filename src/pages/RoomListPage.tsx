import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Clock, ArrowRight } from 'lucide-react';
import useRoomStore from '../store/roomStore';

const RoomListPage = () => {
  const { fetchRooms, rooms, loading, error } = useRoomStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);
  
  // 获取所有位置（用于筛选）
  const allLocations = Array.from(new Set(rooms.map(room => room.location))).sort();
  
  // 筛选房间
  const filteredRooms = rooms.filter(room => {
    let matchesSearchTerm = true;
    let matchesLocation = true;
    
    if (searchTerm) {
      matchesSearchTerm = 
        room.room_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
        room.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">自习室列表</h1>
        <p className="mt-2 text-gray-600">
          浏览所有可用的自习室。选择一个自习室查看详情并预约座位。
        </p>
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
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              {error}
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
                        room.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {room.is_active ? '开放中' : '已关闭'}
                      </span>
                    </div>
                    
                    <p className="mt-1 text-sm text-gray-600">{room.location}</p>
                    <p className="mt-2 text-sm text-gray-500 line-clamp-2">{room.description}</p>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="h-4 w-4 mr-1" />
                        <span>容量: {room.capacity}个座位</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>开放时间: 8:00-22:00</span>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <Link 
                        to={`/rooms/${room.id}`}
                        className="flex items-center justify-center w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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