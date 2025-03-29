import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Calendar, LogOut, User, BookOpen, Home, Users } from 'lucide-react';
import useAuthStore from '../store/authStore';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  // 检查当前路径是否活跃
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-indigo-600">自习室预约系统</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <div className="text-sm text-gray-700">
                  欢迎，<span className="font-medium">{user.name}</span>
                  {user.role === 'admin' && <span className="ml-1 text-xs bg-indigo-100 text-indigo-800 py-0.5 px-1.5 rounded-full">管理员</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* 主内容区 */}
      <div className="flex-1 flex">
        {/* 侧边导航 */}
        <nav className="bg-indigo-800 text-white w-64 flex-shrink-0">
          <div className="p-4">
            <div className="space-y-1">
              <Link
                to="/"
                className={`flex items-center px-4 py-3 rounded-md ${
                  isActive('/') 
                    ? 'bg-indigo-900 text-white' 
                    : 'text-indigo-100 hover:bg-indigo-700'
                }`}
              >
                <Home className="mr-3 h-5 w-5" />
                首页
              </Link>
              <Link
                to="/rooms"
                className={`flex items-center px-4 py-3 rounded-md ${
                  isActive('/rooms') 
                    ? 'bg-indigo-900 text-white' 
                    : 'text-indigo-100 hover:bg-indigo-700'
                }`}
              >
                <BookOpen className="mr-3 h-5 w-5" />
                自习室列表
              </Link>
              <Link
                to="/profile"
                className={`flex items-center px-4 py-3 rounded-md ${
                  isActive('/profile') 
                    ? 'bg-indigo-900 text-white' 
                    : 'text-indigo-100 hover:bg-indigo-700'
                }`}
              >
                <User className="mr-3 h-5 w-5" />
                个人信息
              </Link>
              
              {/* 管理员才能看到的菜单项 */}
              {user && user.role === 'admin' && (
                <Link
                  to="/admin"
                  className={`flex items-center px-4 py-3 rounded-md ${
                    isActive('/admin') 
                      ? 'bg-indigo-900 text-white' 
                      : 'text-indigo-100 hover:bg-indigo-700'
                  }`}
                >
                  <Users className="mr-3 h-5 w-5" />
                  用户管理
                </Link>
              )}
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-3 rounded-md text-indigo-100 hover:bg-indigo-700"
              >
                <LogOut className="mr-3 h-5 w-5" />
                退出登录
              </button>
            </div>
          </div>
        </nav>
        
        {/* 内容区 */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;