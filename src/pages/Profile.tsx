import React, { useEffect, useState } from 'react';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import { User, Clock, CheckCircle, X, BarChart3 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

interface Reservation {
  id: string;
  room: {
    room_number: string;
    location: string;
  };
  seat: {
    seat_number: string;
  };
  start_time: string;
  end_time: string;
  status: string;
  check_in_time: string | null;
}

interface CheckInStats {
  onTime: number;
  late: number;
  missed: number;
  total: number;
}

export function Profile() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [stats, setStats] = useState<CheckInStats>({ onTime: 0, late: 0, missed: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    
    async function fetchReservations() {
      try {
        setLoading(true);
        
        // 获取用户预约
        const { data, error } = await supabase
          .from('reservations')
          .select(`
            id,
            start_time,
            end_time,
            status,
            check_in_time,
            study_rooms!inner(room_number, location),
            seats!inner(seat_number)
          `)
          .eq('user_id', user.id)
          .order('start_time', { ascending: false });
        
        if (error) throw error;
        
        // 格式化数据
        const formattedReservations = (data || []).map(item => ({
          id: item.id,
          room: {
            room_number: item.study_rooms.room_number,
            location: item.study_rooms.location
          },
          seat: {
            seat_number: item.seats.seat_number
          },
          start_time: item.start_time,
          end_time: item.end_time,
          status: item.status,
          check_in_time: item.check_in_time
        }));
        
        setReservations(formattedReservations);
        
        // 计算签到统计
        const checkInData = await supabase
          .from('check_ins')
          .select('status, count')
          .eq('reservation_id', 'in', (data || []).map(r => r.id))
          .groupBy('status');
          
        if (checkInData.error) throw checkInData.error;
        
        const statsData: CheckInStats = {
          onTime: 0,
          late: 0,
          missed: 0,
          total: (data || []).length
        };
        
        (checkInData.data || []).forEach(item => {
          if (item.status === 'on_time') statsData.onTime = item.count;
          if (item.status === 'late') statsData.late = item.count;
          if (item.status === 'missed') statsData.missed = item.count;
        });
        
        setStats(statsData);
      } catch (err) {
        console.error('Error fetching reservations:', err);
        setError('获取预约记录失败');
      } finally {
        setLoading(false);
      }
    }
    
    fetchReservations();
  }, [user]);

  // 签到
  const handleCheckIn = async (reservationId: string) => {
    if (!user) return;
    
    try {
      setCheckingIn(true);
      setError(null);
      setSuccess(null);
      
      const now = new Date();
      const reservation = reservations.find(r => r.id === reservationId);
      
      if (!reservation) {
        throw new Error('找不到预约记录');
      }
      
      const startTime = parseISO(reservation.start_time);
      const endTime = parseISO(reservation.end_time);
      
      // 检查是否在有效时间范围内
      if (isBefore(now, startTime)) {
        throw new Error('预约尚未开始，无法签到');
      }
      
      if (isAfter(now, endTime)) {
        throw new Error('预约已过期，无法签到');
      }
      
      // 确定签到状态
      let checkInStatus = 'on_time';
      if (isAfter(now, new Date(startTime.getTime() + 15 * 60000))) {
        checkInStatus = 'late';
      }
      
      // 更新预约签到时间
      const { error: reservationError } = await supabase
        .from('reservations')
        .update({ check_in_time: now.toISOString() })
        .eq('id', reservationId);
      
      if (reservationError) throw reservationError;
      
      // 创建签到记录
      const { error: checkInError } = await supabase
        .from('check_ins')
        .insert({
          reservation_id: reservationId,
          check_in_time: now.toISOString(),
          status: checkInStatus
        });
      
      if (checkInError) throw checkInError;
      
      // 更新本地数据
      setReservations(prev => 
        prev.map(res => 
          res.id === reservationId 
            ? { ...res, check_in_time: now.toISOString() } 
            : res
        )
      );
      
      setSuccess('签到成功！');
      
      // 更新统计数据
      setStats(prev => ({
        ...prev,
        [checkInStatus]: prev[checkInStatus as keyof CheckInStats] + 1
      }));
      
    } catch (err) {
      console.error('Error checking in:', err);
      setError(err instanceof Error ? err.message : '签到失败，请重试');
    } finally {
      setCheckingIn(false);
    }
  };

  // 取消预约
  const handleCancel = async (reservationId: string) => {
    if (!user) return;
    
    try {
      setCancelling(true);
      setError(null);
      setSuccess(null);
      
      // 更新预约状态
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'canceled' })
        .eq('id', reservationId);
      
      if (error) throw error;
      
      // 更新本地数据
      setReservations(prev => 
        prev.map(res => 
          res.id === reservationId 
            ? { ...res, status: 'canceled' } 
            : res
        )
      );
      
      setSuccess('预约已取消');
    } catch (err) {
      console.error('Error cancelling reservation:', err);
      setError('取消预约失败，请重试');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">我的资料</h1>

      {(error || success) && (
        <div className={`p-4 mb-6 rounded-md ${error ? 'bg-red-50' : 'bg-green-50'}`}>
          <p className={error ? 'text-red-600' : 'text-green-600'}>
            {error || success}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <div className="bg-indigo-100 p-3 rounded-full">
              <User className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-900">用户信息</h2>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">姓名</p>
              <p className="text-gray-800">{user?.user_metadata?.full_name || '未设置'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">学号</p>
              <p className="text-gray-800">{user?.user_metadata?.student_id || '未设置'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">邮箱</p>
              <p className="text-gray-800">{user?.email || '未设置'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <div className="bg-indigo-100 p-3 rounded-full">
              <BarChart3 className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-900">签到统计</h2>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-green-600 font-bold text-2xl">{stats.onTime}</div>
              <p className="text-sm text-gray-500">准时</p>
            </div>
            <div className="text-center">
              <div className="text-orange-600 font-bold text-2xl">{stats.late}</div>
              <p className="text-sm text-gray-500">迟到</p>
            </div>
            <div className="text-center">
              <div className="text-red-600 font-bold text-2xl">{stats.missed}</div>
              <p className="text-sm text-gray-500">未签到</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">我的预约</h2>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : reservations.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">暂无预约记录</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    自习室
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    座位
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reservations.map((reservation) => {
                  const isActive = 
                    reservation.status === 'confirmed' && 
                    !reservation.check_in_time &&
                    isBefore(new Date(), parseISO(reservation.end_time)) &&
                    isAfter(new Date(), parseISO(reservation.start_time));
                  
                  const isPending = 
                    reservation.status === 'confirmed' && 
                    !reservation.check_in_time &&
                    isBefore(new Date(), parseISO(reservation.start_time));
                  
                  return (
                    <tr key={reservation.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {reservation.room.room_number}
                        </div>
                        <div className="text-sm text-gray-500">{reservation.room.location}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{reservation.seat.seat_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(parseISO(reservation.start_time), 'yyyy-MM-dd')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(parseISO(reservation.start_time), 'HH:mm')} - 
                          {format(parseISO(reservation.end_time), 'HH:mm')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          reservation.check_in_time 
                            ? 'bg-green-100 text-green-800'
                            : reservation.status === 'canceled'
                            ? 'bg-red-100 text-red-800'
                            : isPending
                            ? 'bg-yellow-100 text-yellow-800'
                            : isActive
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {reservation.check_in_time 
                            ? '已签到' 
                            : reservation.status === 'canceled'
                            ? '已取消'
                            : isPending
                            ? '即将开始'
                            : isActive
                            ? '可签到'
                            : '已过期'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {isActive && !reservation.check_in_time && (
                          <button
                            onClick={() => handleCheckIn(reservation.id)}
                            disabled={checkingIn}
                            className="text-indigo-600 hover:text-indigo-900 mr-4 disabled:opacity-50"
                          >
                            签到
                          </button>
                        )}
                        {isPending && (
                          <button
                            onClick={() => handleCancel(reservation.id)}
                            disabled={cancelling}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            取消
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}