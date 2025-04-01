import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import RoomListPage from './pages/RoomListPage';
import RoomDetailPage from './pages/RoomDetailPage';
import ReservationPage from './pages/ReservationPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';
import RequireAuth from './components/RequireAuth';
import AdminRoute from './components/AdminRoute';
import useAuthStore from './store/authStore';
import { StudyRoom } from './types';

// 加载中组件
const LoadingSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function App() {
  const { initAuth, isAuthenticated, loading: authLoading } = useAuthStore();
  const [appLoading, setAppLoading] = useState(true);
  const authChecked = useRef(false); // 使用ref跟踪是否已经检查过认证状态

  // 应用初始化时同步认证状态
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('初始化应用程序...');
        // 初始化认证状态（从localStorage恢复）
        initAuth();
        
        // 给页面一点时间加载以提供更流畅的用户体验
        await new Promise(resolve => setTimeout(resolve, 800));
      } catch (error) {
        console.error('应用初始化失败:', error);
      } finally {
        authChecked.current = true;
        setAppLoading(false);
      }
    };
    
    initializeApp();
  }, [initAuth]);

  // 处理自习室状态更新
  const handleRoomStatusUpdate = (updatedRooms: StudyRoom[]) => {
    console.log(`接收到${updatedRooms.length}个自习室状态更新`);
    // 可以在这里处理自习室状态更新的逻辑
  };

  if (appLoading || authLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <Toaster position="top-center" />
      
      <Routes>
        {/* 公开路由 */}
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
        } />
        <Route path="/register" element={
          isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />
        } />
        
        {/* 自习室列表页面 - 公开访问 */}
        <Route path="/rooms" element={
          <Layout>
            <RoomListPage />
          </Layout>
        } />
        
        {/* 受保护路由 */}
        <Route path="/" element={
          <RequireAuth>
            <Layout>
              <HomePage />
            </Layout>
          </RequireAuth>
        } />
        <Route path="/rooms/:roomId" element={
          <RequireAuth>
            <Layout>
              <RoomDetailPage />
            </Layout>
          </RequireAuth>
        } />
        <Route path="/reservation/:roomId/:seatId" element={
          <RequireAuth>
            <Layout>
              <ReservationPage />
            </Layout>
          </RequireAuth>
        } />
        <Route path="/profile" element={
          <RequireAuth>
            <Layout>
              <ProfilePage />
            </Layout>
          </RequireAuth>
        } />
        
        {/* 管理员路由 */}
        <Route path="/admin" element={
          <RequireAuth>
            <AdminRoute>
              <Layout>
                <AdminPage />
              </Layout>
            </AdminRoute>
          </RequireAuth>
        } />
        
        {/* 404页面 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;