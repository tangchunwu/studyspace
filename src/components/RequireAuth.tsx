import { ReactElement, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '@/store/authStore';

interface RequireAuthProps {
  children: ReactElement;
}

const RequireAuth = ({ children }: RequireAuthProps) => {
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

  return children;
};

export default RequireAuth; 