import { ReactElement, useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

interface RequireAuthProps {
  children: ReactElement;
}

const RequireAuth = ({ children }: RequireAuthProps) => {
  const { user, isAuthenticated, getCurrentUser, loading } = useAuthStore();
  const location = useLocation();
  const lastCheckedRef = useRef<number>(0);
  const requestInProgressRef = useRef<boolean>(false);

  useEffect(() => {
    // 检查是否已经有请求在进行中
    if (requestInProgressRef.current) {
      console.log('已有一个用户信息请求在进行中，跳过');
      return;
    }

    // 计算距离上次检查的时间（毫秒）
    const now = Date.now();
    const timeSinceLastCheck = now - lastCheckedRef.current;
    
    // 如果已通过认证但没有用户信息，且上次检查是在60秒前，则尝试获取
    if (isAuthenticated && !user && !loading && (timeSinceLastCheck > 60000 || lastCheckedRef.current === 0)) {
      console.log('RequireAuth: 已认证但缺少用户信息，尝试获取');
      
      // 标记请求正在进行
      requestInProgressRef.current = true;
      
      // 更新最后检查时间
      lastCheckedRef.current = now;
      
      getCurrentUser()
        .catch(err => {
          console.error('获取用户信息失败:', err);
        })
        .finally(() => {
          // 标记请求已完成
          requestInProgressRef.current = false;
        });
    }
  }, [isAuthenticated, user, getCurrentUser, loading]);

  // 如果正在加载中，显示加载状态
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // 如果未认证，重定向到登录页面
  if (!isAuthenticated) {
    // 将当前url作为state传递给登录页面，以便登录成功后重定向回来
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default RequireAuth; 