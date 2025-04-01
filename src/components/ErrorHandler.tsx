import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, RefreshCw, Home, Lock } from 'lucide-react';

export type ErrorType = 
  | 'connection' 
  | 'server' 
  | 'not-found' 
  | 'unauthorized' 
  | 'forbidden' 
  | 'validation' 
  | 'unknown';

interface ErrorHandlerProps {
  type: ErrorType;
  message?: string;
  onRetry?: () => void;
  showHomeLink?: boolean;
}

/**
 * 通用错误处理组件
 * 显示不同类型的错误信息并提供可能的操作
 */
const ErrorHandler: React.FC<ErrorHandlerProps> = ({
  type,
  message,
  onRetry,
  showHomeLink = true
}) => {
  const getErrorDetails = () => {
    switch (type) {
      case 'connection':
        return {
          title: '连接错误',
          description: message || '无法连接到服务器，请检查您的网络连接',
          icon: <AlertCircle className="h-16 w-16 text-red-500" />,
          actionText: '重试',
        };
      case 'server':
        return {
          title: '服务器错误',
          description: message || '服务器出现错误，请稍后再试',
          icon: <AlertCircle className="h-16 w-16 text-red-500" />,
          actionText: '重试',
        };
      case 'not-found':
        return {
          title: '资源未找到',
          description: message || '请求的资源不存在或已被移除',
          icon: <AlertCircle className="h-16 w-16 text-orange-500" />,
          actionText: '返回首页',
        };
      case 'unauthorized':
        return {
          title: '未授权访问',
          description: message || '请先登录后再访问此资源',
          icon: <Lock className="h-16 w-16 text-orange-500" />,
          actionText: '登录',
          actionLink: '/login',
        };
      case 'forbidden':
        return {
          title: '访问被拒绝',
          description: message || '您没有权限访问此资源',
          icon: <Lock className="h-16 w-16 text-red-500" />,
          actionText: '返回首页',
        };
      case 'validation':
        return {
          title: '验证错误',
          description: message || '提交的数据无效',
          icon: <AlertCircle className="h-16 w-16 text-yellow-500" />,
          actionText: '重试',
        };
      default:
        return {
          title: '发生错误',
          description: message || '发生了未知错误，请重试或联系管理员',
          icon: <AlertCircle className="h-16 w-16 text-gray-500" />,
          actionText: '重试',
        };
    }
  };

  const errorDetails = getErrorDetails();

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md">
      <div className="mb-4">{errorDetails.icon}</div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{errorDetails.title}</h3>
      <p className="text-gray-600 mb-6 text-center">{errorDetails.description}</p>
      <div className="flex flex-col sm:flex-row gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {errorDetails.actionText}
          </button>
        )}
        
        {errorDetails.actionLink && !onRetry && (
          <Link
            to={errorDetails.actionLink}
            className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            {errorDetails.actionText}
          </Link>
        )}
        
        {showHomeLink && (
          <Link
            to="/"
            className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <Home className="h-4 w-4 mr-2" />
            返回首页
          </Link>
        )}
      </div>
    </div>
  );
};

export default ErrorHandler; 