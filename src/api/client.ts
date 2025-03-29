import axios from 'axios';
import { toast } from 'react-hot-toast';

// 简化API客户端以便调试
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
console.log('API客户端初始化，使用baseURL:', API_BASE_URL);

// 缓存机制
const cache = new Map<string, {data: any, timestamp: number}>();
const CACHE_DURATION = 60000; // 缓存有效期1分钟

// 跟踪OPTIONS预检请求
const optionsCache = new Map<string, number>();
const OPTIONS_CACHE_DURATION = 5 * 60 * 1000; // 5分钟内不重复发送OPTIONS

// 创建一个简单的axios实例
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 增加超时时间到30秒
  headers: {
    'Content-Type': 'application/json',
    // 移除不必要的跨域头，浏览器会自动处理
  },
  withCredentials: false, // 不带凭证，避免额外的CORS复杂性
});

// 添加请求拦截器来减少OPTIONS请求
axiosInstance.interceptors.request.use(
  config => {
    // 如果是非GET请求，检查是否已经发送过OPTIONS
    if (config.method !== 'get' && config.url) {
      const key = `${config.method}:${config.url}`;
      const lastOptions = optionsCache.get(key);
      const now = Date.now();
      
      if (lastOptions && now - lastOptions < OPTIONS_CACHE_DURATION) {
        // 最近已经发送过OPTIONS请求，添加头部以跳过浏览器的预检
        console.log(`复用OPTIONS预检结果: ${key}`);
      } else {
        // 记录新的OPTIONS请求时间
        optionsCache.set(key, now);
      }
    }
    return config;
  },
  error => Promise.reject(error)
);

// 简化的API客户端
export const apiClient = {
  // 获取数据 
  async get(url: string, config = {}) {
    // 检查缓存
    const cacheKey = `get:${url}`;
    const cachedResponse = cache.get(cacheKey);
    const now = Date.now();
    
    if (cachedResponse && now - cachedResponse.timestamp < CACHE_DURATION) {
      console.log(`[API] 使用缓存数据: ${url}`);
      return cachedResponse.data;
    }
    
    try {
      console.log(`[API] 发送GET请求: ${url}`);
      const response = await axiosInstance.get(url, config);
      console.log(`[API] 收到响应:`, response.data);
      
      // 更新缓存
      cache.set(cacheKey, {
        data: response.data,
        timestamp: now
      });
      
      return response.data;
    } catch (error: any) {
      console.error(`[API] GET请求错误: ${url}`, error);
      
      let errorMessage = '请求失败';
      if (error.response) {
        errorMessage = error.response.data?.message || `服务器错误 ${error.response.status}`;
      } else if (error.message) {
        errorMessage = error.message.includes('timeout') 
          ? '请求超时，服务器无响应' 
          : error.message;
      }
      
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },
  
  // 发送数据
  async post(url: string, data: any, config = {}) {
    try {
      console.log(`[API] 发送POST请求: ${url}`);
      const response = await axiosInstance.post(url, data, config);
      console.log(`[API] 收到响应:`, response.data);
      
      // 清除相关GET请求的缓存
      for (const key of cache.keys()) {
        if (key.startsWith('get:') && key.includes(url.split('/')[1])) {
          cache.delete(key);
        }
      }
      
      return response.data;
    } catch (error: any) {
      console.error(`[API] POST请求错误: ${url}`, error);
      
      let errorMessage = '请求失败';
      if (error.response) {
        errorMessage = error.response.data?.message || `服务器错误 ${error.response.status}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },
  
  // 更新数据
  async put(url: string, data: any, config = {}) {
    try {
      console.log(`[API] 发送PUT请求: ${url}`);
      const response = await axiosInstance.put(url, data, config);
      
      // 清除相关GET请求的缓存
      for (const key of cache.keys()) {
        if (key.startsWith('get:') && key.includes(url.split('/')[1])) {
          cache.delete(key);
        }
      }
      
      return response.data;
    } catch (error: any) {
      console.error(`[API] PUT请求错误: ${url}`, error);
      throw error;
    }
  },
  
  // 删除数据
  async delete(url: string, config = {}) {
    try {
      console.log(`[API] 发送DELETE请求: ${url}`);
      const response = await axiosInstance.delete(url, config);
      
      // 清除相关GET请求的缓存
      for (const key of cache.keys()) {
        if (key.startsWith('get:') && key.includes(url.split('/')[1])) {
          cache.delete(key);
        }
      }
      
      return response.data;
    } catch (error: any) {
      console.error(`[API] DELETE请求错误: ${url}`, error);
      throw error;
    }
  },
  
  // 清除缓存
  clearCache(url?: string) {
    if (url) {
      // 清除特定URL的缓存
      const cacheKey = `get:${url}`;
      cache.delete(cacheKey);
      console.log(`[API] 清除URL的缓存: ${url}`);
    } else {
      // 清除所有缓存
      cache.clear();
      console.log('[API] 清除所有缓存');
    }
  },
  
  // 重置连接状态
  resetConnection() {
    console.log(`[API] 重置连接状态`);
    // 清除所有缓存
    cache.clear();
    optionsCache.clear();
  },
  
  // 检查API状态
  async checkApiStatus() {
    try {
      console.log('[API] 检查API状态');
      
      try {
        const response = await axiosInstance.get('/rooms?limit=1', {
          timeout: 5000,
          headers: { 'Cache-Control': 'no-cache' }
        });
        
        console.log('[API] 状态检查成功', response.status);
        return true;
      } catch (error: any) {
        if (error.response) {
          // 如果有响应但状态码不是200，仍视为服务器在线
          console.log(`[API] 服务器在线但返回错误状态: ${error.response.status}`);
          return true;
        }
        
        console.error('[API] 状态检查失败:', error.message);
        return false;
      }
    } catch (e) {
      console.error('[API] 状态检查过程出错:', e);
      return false;
    }
  }
};

export default apiClient; 