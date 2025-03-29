import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Input, Form, Avatar, Textarea, Alert, AlertTitle, AlertDescription, Label } from '@/components/ui';
import Layout from '@/components/Layout';
import useAuthStore from '@/store/authStore';
import { UserCircle2 } from 'lucide-react';

// 定义表单字段类型
type ProfileFormData = {
  name: string;
  phone_number?: string;
  major?: string;
  grade?: string;
  bio?: string;
  avatar_url?: string;
};

const ProfilePage = () => {
  const { user, updateProfile } = useAuthStore();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileFormData>({
    defaultValues: {
      name: user?.name || '',
      phone_number: user?.phone_number || '',
      major: user?.major || '',
      grade: user?.grade || '',
      bio: user?.bio || '',
      avatar_url: user?.avatar_url || '',
    }
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);

      // 调用API更新个人资料
      await updateProfile(data);
      setSuccess('个人资料更新成功！');
      
      // 3秒后清除成功信息
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      setError(err.message || '更新个人资料失败，请稍后再试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 计算注册日期
  const formatDate = (dateString?: string) => {
    if (!dateString) return '未知';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">个人资料</h1>
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>错误</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-6 bg-green-50 text-green-700 border-green-200">
            <AlertTitle>成功</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* 左侧：用户基本信息卡片 */}
          <Card className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4">
                {user?.avatar_url ? (
                  <Avatar 
                    className="h-24 w-24"
                    src={user.avatar_url} 
                    alt={user.name || '用户头像'} 
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center">
                    <UserCircle2 className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>
              
              <h2 className="text-xl font-semibold">{user?.name}</h2>
              <p className="text-gray-500 mt-1">{user?.email}</p>
              <p className="text-gray-500 mt-1">学号: {user?.student_id}</p>
              
              <div className="mt-4 w-full">
                <div className="flex justify-between py-2 border-t">
                  <span className="text-gray-600">信用分</span>
                  <span className="font-medium">{user?.credit_score}</span>
                </div>
                <div className="flex justify-between py-2 border-t">
                  <span className="text-gray-600">角色</span>
                  <span className="font-medium">{user?.role === 'admin' ? '管理员' : '普通用户'}</span>
                </div>
                <div className="flex justify-between py-2 border-t">
                  <span className="text-gray-600">注册日期</span>
                  <span className="font-medium">{formatDate(user?.created_at)}</span>
                </div>
                <div className="flex justify-between py-2 border-t border-b">
                  <span className="text-gray-600">最后登录</span>
                  <span className="font-medium">{formatDate(user?.last_login)}</span>
                </div>
              </div>
              
              <div className="mt-6 w-full">
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => navigate('/rooms')}
                >
                  查看我的预约
                </Button>
              </div>
            </div>
          </Card>
          
          {/* 右侧：编辑表单 */}
          <Card className="p-6 md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">编辑个人资料</h2>
            
            <Form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">姓名 *</Label>
                <Input
                  id="name"
                  placeholder="请输入您的姓名"
                  {...register('name', { required: '姓名是必填项' })}
                  error={errors.name?.message}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="avatar_url">头像URL</Label>
                <Input
                  id="avatar_url"
                  placeholder="请输入您的头像URL"
                  {...register('avatar_url')}
                  error={errors.avatar_url?.message}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone_number">手机号码</Label>
                <Input
                  id="phone_number"
                  placeholder="请输入您的手机号码"
                  {...register('phone_number', {
                    pattern: {
                      value: /^1[3-9]\d{9}$/,
                      message: '请输入有效的手机号码',
                    },
                  })}
                  error={errors.phone_number?.message}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="major">专业</Label>
                  <Input
                    id="major"
                    placeholder="请输入您的专业"
                    {...register('major')}
                    error={errors.major?.message}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="grade">年级</Label>
                  <Input
                    id="grade"
                    placeholder="请输入您的年级"
                    {...register('grade')}
                    error={errors.grade?.message}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">个人简介</Label>
                <Textarea
                  id="bio"
                  placeholder="请简单介绍一下自己"
                  className="min-h-[100px]"
                  {...register('bio')}
                  error={errors.bio?.message}
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? '保存中...' : '保存资料'}
              </Button>
            </Form>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage; 