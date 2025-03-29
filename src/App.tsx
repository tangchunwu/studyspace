import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import RoomListPage from './pages/RoomListPage';
import RoomDetailPage from './pages/RoomDetailPage';
import ProfilePage from './pages/ProfilePage';
import ReservationPage from './pages/ReservationPage';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import useAuthStore from './store/authStore';

function App() {
  const { isAuthenticated, getCurrentUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  // 应用加载时检查用户认证状态
  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated) {
        await getCurrentUser();
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [isAuthenticated, getCurrentUser]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <Toaster position="top-center" />
      <Routes>
        {/* 公开路由 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* 受保护路由 - 使用Layout包装 */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <HomePage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/rooms"
          element={
            <ProtectedRoute>
              <Layout>
                <RoomListPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/rooms/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <RoomDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reservation/:roomId"
          element={
            <ProtectedRoute>
              <Layout>
                <ReservationPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <ProfilePage />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        {/* 重定向到登录页面 */}
        <Route path="/index.html" element={<Navigate to="/" replace />} />
        
        {/* 404页面 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;