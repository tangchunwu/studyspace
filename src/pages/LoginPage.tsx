import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { apiClient } from '../api/client';

// API状态类型定义
type ApiStatusType = 'online' | 'offline' | 'checking';

// 添加Location状态类型定义
interface LocationState {
  from?: {
    pathname: string;
  };
}

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, error: authError, resetError, isAuthenticated } = useAuthStore();
  const [apiStatus, setApiStatus] = useState<ApiStatusType>('checking');
  const [pageLoaded, setPageLoaded] = useState(false);
  const apiCheckInterval = useRef<number | null>(null);
  const [checkCount, setCheckCount] = useState(0);
  const [lastCheckTime, setLastCheckTime] = useState(0);
  const MAX_CHECK_RETRIES = 3; // 最大重试次数
  const MIN_CHECK_INTERVAL = 10000; // 最小检查间隔 (10秒)
  
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin12345');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [loginProcessing, setLoginProcessing] = useState(false);
  
  // 获取location对象，用于登录成功后重定向
  const locationState = location.state as LocationState;
  
  // 已认证用户重定向到首页
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);
  
  // 清理API检测定时器
  useEffect(() => {
    return () => {
      if (apiCheckInterval.current !== null) {
        clearInterval(apiCheckInterval.current);
      }
    };
  }, []);
  
  // 检查API状态的函数
  const checkApiStatus = useCallback(async () => {
    // 检查是否在冷却期
    const now = Date.now();
    if (now - lastCheckTime < MIN_CHECK_INTERVAL) {
      console.log(`API检查过于频繁，跳过此次检查 (间隔: ${(now - lastCheckTime) / 1000}秒)`);
      return apiStatus === 'online';
    }
    
    // 更新最后检查时间
    setLastCheckTime(now);
    
    // 如果已经达到最大检测次数，不再重试
    if (checkCount >= MAX_CHECK_RETRIES) {
      console.log(`已达到最大API检测次数(${MAX_CHECK_RETRIES})，停止检测`);
      setApiStatus('offline');
      return false;
    }

    console.log('检查API服务状态...');
    setApiStatus('checking');
    let isOnline = false;
    
    try {
      // 尝试方法1: 使用fetch而不是axios，减少依赖关系
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3秒超时
      
      const response = await fetch('/api', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok || response.status < 500) {
        console.log('API服务正常 (方法1)');
        setApiStatus('online');
        isOnline = true;
        setCheckCount(0); // 重置检测计数
        return true;
      }
    } catch (error) {
      console.log('API检查方法1失败:', error);
    }
    
    try {
      // 尝试方法2: 检查健康端点
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3秒超时
      
      const response = await fetch('/api/auth/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok || response.status < 500) {
        console.log('API服务正常 (方法2)');
        setApiStatus('online');
        isOnline = true;
        setCheckCount(0); // 重置检测计数
        return true;
      }
    } catch (error) {
      console.log('API检查方法2失败:', error);
    }
    
    if (!isOnline) {
      // 增加检测计数
      setCheckCount(prev => prev + 1);
      console.log(`API服务离线或不可用 (尝试 ${checkCount + 1}/${MAX_CHECK_RETRIES})`);
      setApiStatus('offline');
      return false;
    }
    
    return isOnline;
  }, [checkCount, apiStatus, lastCheckTime]);
  
  // 页面加载时进行一次API状态检查
  useEffect(() => {
    // 设置页面已加载标记
    setPageLoaded(true);
    
    // 初始检查，延迟1秒
    const initialCheck = setTimeout(() => {
      checkApiStatus();
    }, 1000);
    
    // 如果API离线，设置30秒的定时检查（而不是10秒）
    apiCheckInterval.current = window.setInterval(() => {
      if (apiStatus === 'offline') {
        console.log('定期重新检查API状态');
        checkApiStatus();
      }
    }, 30000) as unknown as number; // 每30秒重试一次
    
    return () => {
      clearTimeout(initialCheck);
      if (apiCheckInterval.current !== null) {
        clearInterval(apiCheckInterval.current);
      }
    };
  }, [checkApiStatus, apiStatus]);
  
  // 处理错误提示
  useEffect(() => {
    if (authError) {
      toast.error(authError);
      resetError();
    }
  }, [authError, resetError]);
  
  // 清理localStorage中可能存在的过期token
  useEffect(() => {
    localStorage.removeItem('token');
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginProcessing(true);
    setPasswordError('');
    setEmailError('');

    // 验证输入
    let isValid = true;
    if (!email) {
      setEmailError('请输入邮箱');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('邮箱格式不正确');
      isValid = false;
    }

    if (!password) {
      setPasswordError('请输入密码');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('密码长度至少为6位');
      isValid = false;
    }

    if (!isValid) {
      setLoginProcessing(false);
      return;
    }
    
    // 如果API离线，显示提示并阻止登录
    if (apiStatus === 'offline') {
      toast.error('服务器连接失败，请稍后再试');
      setLoginProcessing(false);
      return;
    }

    // 尝试登录
    console.log('提交登录表单:', { email, password: '******' });
    
    try {
      const succeeded = await login(email, password);
      
      if (succeeded) {
        toast.success('登录成功');
        
        // 导航到首页或来源页面
        const from = locationState?.from?.pathname || '/';
        console.log('登录成功，重定向到:', from);
        navigate(from, { replace: true });
      } else {
        // 登录失败但没有抛出错误，通常是服务器拒绝了请求但返回了200状态码
        setFormError('邮箱或密码错误');
        console.log('登录被拒绝');
      }
    } catch (error: any) {
      // 登录过程中出现异常
      console.error('登录异常:', error);
      const errorMessage = error.message || '登录失败，请稍后再试';
      
      // 设置适当的错误提示
      if (errorMessage.includes('邮箱') || errorMessage.includes('email')) {
        setEmailError(errorMessage);
      } else if (errorMessage.includes('密码') || errorMessage.includes('password')) {
        setPasswordError(errorMessage);
      } else {
        setFormError(errorMessage);
      }
    } finally {
      setLoginProcessing(false);
    }
  };
  
  // 手动重新检查API状态
  const handleRetryConnection = () => {
    toast.loading('正在重试连接...', { id: 'retry-connection' });
    
    // 重置连接状态
    if (apiClient.resetConnection) {
      apiClient.resetConnection();
    }
    
    // 尝试重新检查API状态
    checkApiStatus().then(isOnline => {
      if (isOnline) {
        toast.success('连接恢复成功', { id: 'retry-connection' });
      } else {
        toast.error('连接失败，服务器仍不可用', { id: 'retry-connection' });
      }
    });
  };
  
  // 页面加载过渡效果
  const pageClass = `min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 ${pageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`;
  
  if (apiStatus === 'checking') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">正在连接服务器...</h1>
            <div className="mt-4 flex justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
            <p className="mt-4 text-gray-600">首次连接可能需要几秒钟...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={pageClass}>
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            自习室预约系统
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            登录您的账号以使用完整功能
          </p>
        </div>
        
        {/* API服务离线警告 */}
        {apiStatus === 'offline' && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  无法连接到服务器，请检查网络连接
                </p>
                <div className="mt-2">
                  <button
                    onClick={handleRetryConnection}
                    className="text-sm font-medium text-red-700 hover:text-red-600 underline"
                  >
                    重试连接
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">邮箱地址</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="邮箱地址"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || apiStatus === 'offline'}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">密码</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || apiStatus === 'offline'}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || apiStatus === 'offline'}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <svg className="animate-spin h-5 w-5 text-indigo-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                  正在登录...
                </>
              ) : (
                <>登录</>
              )}
            </button>
          </div>
          
          <div>
            <p className="text-center text-sm text-gray-600">
              没有账号? <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">注册</Link>
            </p>
          </div>
          
          {/* 测试账号信息 */}
          <div className="border-t border-gray-200 pt-4">
            <p className="text-xs text-gray-500 mb-1">备用账号：admin2@example.com / admin123</p>
            <p className="text-xs text-gray-500">测试账号：testadmin@test.com / test123</p>
          </div>
          
          {/* API状态信息 */}
          <div className="flex justify-between items-center text-xs text-gray-400">
            <span>API服务状态:</span>
            {apiStatus === 'online' ? (
              <span className="text-green-500">在线</span>
            ) : (
              <span className="text-red-500">离线</span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage; 