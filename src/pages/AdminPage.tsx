import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Alert, AlertTitle, AlertDescription } from '@/components/ui';
import useAuthStore from '@/store/authStore';
import { toast } from 'react-hot-toast';
import axios from 'axios';

interface UserData {
  id: string;
  name: string;
  email: string;
  student_id: string;
  credit_score: number;
  role: 'user' | 'admin';
  avatar_url?: string;
  phone_number?: string;
  major?: string;
  grade?: string;
  is_disabled?: boolean;
  last_login?: string;
  created_at: string;
}

const AdminPage = () => {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // API地址
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
  
  // 检查是否是管理员
  useEffect(() => {
    if (user && user.role !== 'admin') {
      // 如果不是管理员，跳转到首页
      navigate('/');
    }
  }, [user, navigate]);
  
  // 获取所有用户列表
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 先尝试通过代理请求
        try {
          const response = await axios.get('/api/users', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
            },
            timeout: 10000
          });
          
          if (response.data) {
            setUsers(response.data);
            console.log('通过代理获取用户列表成功:', response.data.length);
          } else {
            throw new Error('返回数据格式不正确');
          }
        } catch (proxyError) {
          console.error('通过代理获取用户列表失败，尝试直接请求:', proxyError);
          
          // 直接请求API
          const directResponse = await axios.get(`${API_URL}/users`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
            },
            timeout: 10000
          });
          
          if (directResponse.data) {
            setUsers(directResponse.data);
            console.log('直接请求获取用户列表成功:', directResponse.data.length);
          } else {
            throw new Error('返回数据格式不正确');
          }
        }
      } catch (err: any) {
        console.error('获取用户列表失败:', err);
        setError(err.response?.data?.message || err.message || '获取用户列表失败');
        toast.error('获取用户列表失败');
      } finally {
        setLoading(false);
      }
    };
    
    if (user && user.role === 'admin') {
      fetchUsers();
    }
  }, [user, token, API_URL]);
  
  // 切换用户禁用状态
  const toggleUserStatus = async (userId: string, isDisabled: boolean) => {
    try {
      setLoading(true);
      
      // 先尝试通过代理请求
      try {
        const response = await axios.put(`/api/users/${userId}/toggle-status`, 
          { is_disabled: !isDisabled },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );
        
        if (response.data) {
          // 更新用户列表
          setUsers(users.map(u => 
            u.id === userId ? { ...u, is_disabled: !isDisabled } : u
          ));
          
          toast.success(`用户已${!isDisabled ? '禁用' : '启用'}`);
          console.log('通过代理更新用户状态成功');
        }
      } catch (proxyError) {
        console.error('通过代理更新用户状态失败，尝试直接请求:', proxyError);
        
        // 直接请求API
        const directResponse = await axios.put(
          `${API_URL}/users/${userId}/toggle-status`, 
          { is_disabled: !isDisabled },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );
        
        if (directResponse.data) {
          // 更新用户列表
          setUsers(users.map(u => 
            u.id === userId ? { ...u, is_disabled: !isDisabled } : u
          ));
          
          toast.success(`用户已${!isDisabled ? '禁用' : '启用'}`);
          console.log('直接请求更新用户状态成功');
        }
      }
    } catch (err: any) {
      console.error('更新用户状态失败:', err);
      setError(err.response?.data?.message || err.message || '更新用户状态失败');
      toast.error('更新用户状态失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 格式化日期显示
  const formatDate = (dateString?: string) => {
    if (!dateString) return '未知';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertTitle>访问受限</AlertTitle>
          <AlertDescription>您没有权限访问管理员页面</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">用户管理</h1>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>错误</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid gap-6">
          {users.map(user => (
            <Card key={user.id} className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{user.name}</h2>
                  <p className="text-gray-500 mt-1">{user.email}</p>
                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">学号: </span>
                      <span>{user.student_id}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">信用分: </span>
                      <span>{user.credit_score}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">角色: </span>
                      <span>{user.role === 'admin' ? '管理员' : '普通用户'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">状态: </span>
                      <span className={user.is_disabled ? 'text-red-500' : 'text-green-500'}>
                        {user.is_disabled ? '已禁用' : '正常'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">注册时间: </span>
                      <span>{formatDate(user.created_at)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">最后登录: </span>
                      <span>{formatDate(user.last_login)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 md:mt-0 flex flex-col gap-2">
                  <Button 
                    variant={user.is_disabled ? "outline" : "destructive"}
                    onClick={() => toggleUserStatus(user.id, !!user.is_disabled)}
                    disabled={loading}
                  >
                    {user.is_disabled ? '启用账号' : '禁用账号'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          
          {users.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              暂无用户数据
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPage; 