import { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';

const ProfilePage = () => {
  const { user, getCurrentUser, loading } = useAuthStore();
  const [stats, setStats] = useState({
    totalReservations: 0,
    checkedInReservations: 0,
    missedReservations: 0
  });

  useEffect(() => {
    // 确保用户数据已加载
    if (!user) {
      getCurrentUser();
    }
  }, [user, getCurrentUser]);

  // 模拟获取用户统计数据
  // 在实际应用中，这些数据应该从后端API获取
  useEffect(() => {
    if (user) {
      // 这里仅作为示例，实际应用中应该通过API获取这些统计数据
      setStats({
        totalReservations: 12,
        checkedInReservations: 10,
        missedReservations: 2
      });
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center h-64">
        <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white shadow overflow-hidden rounded-lg">
        {/* 个人资料头部 */}
        <div className="px-4 py-5 sm:px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <h1 className="text-2xl font-bold">个人资料</h1>
          <p className="mt-1 text-sm opacity-90">您的账户信息和预约统计</p>
        </div>
        
        {/* 个人资料内容 */}
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">姓名</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.name}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">邮箱地址</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.email}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">学号</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.student_id}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">账户创建日期</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(user.created_at).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* 预约统计 */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">总预约次数</dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">{stats.totalReservations}</div>
                </dd>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">已签到次数</dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">{stats.checkedInReservations}</div>
                </dd>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">未签到次数</dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">{stats.missedReservations}</div>
                </dd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 使用指南 */}
      <div className="mt-8 bg-white shadow overflow-hidden rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg font-medium text-gray-900">自习室预约使用指南</h2>
          <p className="mt-1 text-sm text-gray-500">如何更好地使用自习室预约系统</p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="space-y-4">
            <div className="bg-indigo-50 p-4 rounded-md">
              <h3 className="text-sm font-medium text-indigo-800">预约规则</h3>
              <ul className="mt-2 text-sm text-indigo-700 list-disc pl-5 space-y-1">
                <li>每位用户同一时间段最多可预约一个座位</li>
                <li>预约开始前1小时可以取消预约</li>
                <li>预约开始前30分钟至结束前可以签到</li>
                <li>连续3次未签到将临时限制预约权限</li>
              </ul>
            </div>
            <div className="bg-green-50 p-4 rounded-md">
              <h3 className="text-sm font-medium text-green-800">小贴士</h3>
              <ul className="mt-2 text-sm text-green-700 list-disc pl-5 space-y-1">
                <li>提前预约热门自习室可以增加获得座位的机会</li>
                <li>请按时签到，避免浪费座位资源</li>
                <li>如无法前往，请及时取消预约</li>
                <li>使用中遇到问题可联系管理员</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 