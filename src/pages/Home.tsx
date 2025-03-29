import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, ClipboardCheck, BarChart3 } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';

interface ReservationStats {
  total: number;
  upcoming: number;
  checkedIn: number;
}

export function Home() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ReservationStats>({ total: 0, upcoming: 0, checkedIn: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!user) return;

      try {
        setLoading(true);
        
        // 获取预约总数
        const { data: totalData, error: totalError } = await supabase
          .from('reservations')
          .select('count')
          .eq('user_id', user.id);
        
        if (totalError) throw totalError;
        
        // 获取即将到来的预约
        const { data: upcomingData, error: upcomingError } = await supabase
          .from('reservations')
          .select('count')
          .eq('user_id', user.id)
          .eq('status', 'confirmed')
          .gt('start_time', new Date().toISOString());
        
        if (upcomingError) throw upcomingError;
        
        // 获取已签到的预约
        const { data: checkedInData, error: checkedInError } = await supabase
          .from('reservations')
          .select('count')
          .eq('user_id', user.id)
          .not('check_in_time', 'is', null);
        
        if (checkedInError) throw checkedInError;
        
        setStats({
          total: totalData[0]?.count || 0,
          upcoming: upcomingData[0]?.count || 0,
          checkedIn: checkedInData[0]?.count || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchStats();
  }, [user]);

  return (
    <div className="px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">欢迎, {user?.user_metadata?.full_name || '同学'}</h1>
        <p className="mt-2 text-gray-600">使用StudySpace管理您的自习室预约</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="bg-indigo-100 p-3 rounded-full">
                <BookOpen className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-semibold text-gray-900">总预约</h2>
                <p className="text-3xl font-bold text-indigo-600">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-semibold text-gray-900">即将到来</h2>
                <p className="text-3xl font-bold text-green-600">{stats.upcoming}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <ClipboardCheck className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-semibold text-gray-900">已签到</h2>
                <p className="text-3xl font-bold text-blue-600">{stats.checkedIn}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/rooms"
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center">
            <div className="bg-indigo-100 p-3 rounded-full">
              <BookOpen className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-900">浏览自习室</h2>
              <p className="text-sm text-gray-600">查看所有可用自习室并预约</p>
            </div>
          </div>
        </Link>
        
        <Link
          to="/profile"
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center">
            <div className="bg-indigo-100 p-3 rounded-full">
              <BarChart3 className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-900">我的记录</h2>
              <p className="text-sm text-gray-600">查看预约历史和使用统计</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}