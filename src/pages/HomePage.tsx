import { useEffect, useState, useCallback, memo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useReservationStore from '../store/reservationStore';
import { Reservation } from '../types';

// 使用memo减少不必要的重渲染
const ReservationCard = memo(({ 
  reservation, 
  formatDateTime, 
  getStatusDisplay 
}: { 
  reservation: any; 
  formatDateTime: (date: string) => string;
  getStatusDisplay: (status: string) => JSX.Element;
}) => (
  <div className="border rounded-md p-4 hover:bg-gray-50 content-transition">
    <div className="flex justify-between items-start">
      <div>
        <h3 className="font-medium">{reservation.room_number} - 座位 {reservation.seat_number}</h3>
        <div className="mt-2 space-y-1">
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{reservation.location}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-1" />
            <span>{formatDateTime(reservation.start_time)}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-1" />
            <span>
              {new Date(reservation.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
              {new Date(reservation.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end">
        {getStatusDisplay(reservation.status)}
      </div>
    </div>
  </div>
));

// 加载占位符组件
const LoadingPlaceholder = memo(() => (
  <div className="animate-pulse space-y-4">
    <div className="h-20 bg-gray-200 rounded"></div>
    <div className="h-20 bg-gray-200 rounded"></div>
    <div className="h-20 bg-gray-200 rounded"></div>
  </div>
));

const HomePage = () => {
  const { user } = useAuthStore();
  const { fetchUserReservations, userReservations, loading } = useReservationStore();
  const [upcomingReservations, setUpcomingReservations] = useState<any[]>([]);
  const [pastReservations, setPastReservations] = useState<any[]>([]);
  const [isContentVisible, setIsContentVisible] = useState(false);
  const hasFetchedRef = useRef(false); // 使用ref跟踪是否已获取数据
  
  // 使用useCallback缓存函数定义
  const filterReservations = useCallback(() => {
    if (userReservations.length > 0) {
      const now = new Date();
      
      // 筛选即将到来的预约（结束时间在当前时间之后）
      const upcoming = userReservations
        .filter(res => new Date(res.end_time) > now && res.status !== 'canceled')
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
      
      // 筛选过去的预约（结束时间在当前时间之前）
      const past = userReservations
        .filter(res => new Date(res.end_time) <= now || res.status === 'canceled')
        .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
      
      setUpcomingReservations(upcoming);
      setPastReservations(past);
    }
  }, [userReservations]);
  
  // 一次性加载预约数据 - 只在组件首次挂载时获取
  useEffect(() => {
    // 防止重复获取数据
    if (!hasFetchedRef.current) {
      setIsContentVisible(false); // 加载前隐藏内容
      fetchUserReservations();
      hasFetchedRef.current = true;
    }
  }, []); // 移除fetchUserReservations依赖，仅在挂载时执行一次
  
  // 数据变化时过滤预约
  useEffect(() => {
    filterReservations();
    
    // 添加短延迟以确保平滑过渡
    const timer = setTimeout(() => {
      setIsContentVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [userReservations, filterReservations]);
  
  // 格式化日期时间
  const formatDateTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }, []);
  
  // 显示预约状态
  const getStatusDisplay = useCallback((status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">待确认</span>;
      case 'confirmed':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">已确认</span>;
      case 'completed':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">已完成</span>;
      case 'canceled':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">已取消</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  }, []);
  
  // 应用过渡动画的内容类
  const contentClass = `${isContentVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`;
  
  return (
    <div className={`max-w-4xl mx-auto ${contentClass}`}>
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">欢迎回来，{user?.name || '用户'}</h1>
          <p className="mt-2 text-gray-600">
            这是您的自习室预约管理面板。您可以查看您的预约记录，预约新的自习室，或管理您的账户。
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="bg-indigo-600 px-6 py-4">
            <h2 className="text-lg font-semibold text-white">快速操作</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <Link 
                to="/rooms"
                className="block w-full py-3 px-4 text-center text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition"
              >
                浏览自习室
              </Link>
              <Link 
                to="/profile"
                className="block w-full py-3 px-4 text-center text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition"
              >
                个人信息
              </Link>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="bg-indigo-600 px-6 py-4">
            <h2 className="text-lg font-semibold text-white">预约统计</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-indigo-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-indigo-600">即将到来</h3>
                <p className="text-3xl font-bold text-indigo-800">{upcomingReservations.length}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-gray-600">历史预约</h3>
                <p className="text-3xl font-bold text-gray-800">{pastReservations.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">即将到来的预约</h2>
        </div>
        <div className="p-6">
          {loading ? (
            <LoadingPlaceholder />
          ) : upcomingReservations.length > 0 ? (
            <div className="space-y-4">
              {upcomingReservations.map((reservation) => (
                <ReservationCard 
                  key={reservation.id} 
                  reservation={reservation}
                  formatDateTime={formatDateTime}
                  getStatusDisplay={getStatusDisplay}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500">您没有即将到来的预约</p>
              <Link 
                to="/rooms"
                className="mt-4 inline-block py-2 px-4 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition"
              >
                立即预约
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {pastReservations.length > 0 && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">历史预约</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {pastReservations.slice(0, 3).map((reservation) => (
                <ReservationCard 
                  key={reservation.id} 
                  reservation={reservation}
                  formatDateTime={formatDateTime}
                  getStatusDisplay={getStatusDisplay}
                />
              ))}
              
              {pastReservations.length > 3 && (
                <div className="text-center pt-2">
                  <Link 
                    to="/profile"
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    查看所有历史记录
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage; 