import React, { ReactElement, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '@/store/authStore';
import { Alert, AlertTitle, AlertDescription } from './ui';

interface AdminRouteProps {
  children: ReactElement;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, token, getCurrentUser, loading } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    // 如果有token但没有用户信息，尝试获取当前用户信息
    if (token && !user) {
      getCurrentUser();
    }
  }, [token, user, getCurrentUser]);

  // 如果正在加载中，显示加载状态
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // 如果没有token，重定向到登录页面
  if (!token) {
    // 将当前url作为state传递给登录页面，以便登录成功后重定向回来
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 如果不是管理员角色，显示无权限提示
  if (user && user.role !== 'admin') {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertTitle>访问受限</AlertTitle>
          <AlertDescription>
            您没有管理员权限。如需访问此页面，请联系系统管理员。
          </AlertDescription>
        </Alert>
        <div className="mt-4 text-center">
          <button 
            onClick={() => window.history.back()} 
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            返回上一页
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default AdminRoute; 