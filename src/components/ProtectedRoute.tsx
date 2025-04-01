import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    // 如果用户未认证，重定向到登录页面
    return <Navigate to="/login" replace />;
  }
  
  // 用户已认证，渲染子组件
  return <>{children}</>;
};

export default ProtectedRoute; 