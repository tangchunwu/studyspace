import 'reflect-metadata';
import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
// @ts-ignore
import rateLimit from 'express-rate-limit';
// @ts-ignore
import mcache from 'memory-cache';
import { initializeDatabase } from './config/typeorm.config';
import { errorHandler } from './middlewares/error';

// 导入路由
import authRoutes from './routes/authRoutes';
import roomRoutes from './routes/roomRoutes';
import reservationRoutes from './routes/reservationRoutes';
import userRoutes from './routes/userRoutes';

// 加载环境变量
dotenv.config();

// 初始化Express应用
const app = express();
const PORT = process.env.PORT || 3001;

// 声明Response扩展类型
declare global {
  namespace Express {
    interface Response {
      sendResponse: (body: any) => any;
    }
  }
}

// 添加进程异常处理以防止崩溃
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
});

// 服务器性能监控
let requestCount = 0;
let lastRequestTime = Date.now();
let responseTimeTotal = 0;
let responseCount = 0;

// 每分钟输出一次服务器性能统计
setInterval(() => {
  const now = Date.now();
  const elapsed = (now - lastRequestTime) / 1000;
  const reqPerSec = requestCount / elapsed;
  const avgResponseTime = responseCount > 0 ? responseTimeTotal / responseCount : 0;
  
  console.log(`============ 服务器性能统计 ============`);
  console.log(`每秒请求数: ${reqPerSec.toFixed(2)}`);
  console.log(`平均响应时间: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`内存使用: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`);
  console.log(`活跃缓存项: ${Object.keys(mcache.keys()).length}`);
  console.log(`=========================================`);
  
  // 重置计数器
  requestCount = 0;
  lastRequestTime = now;
  responseTimeTotal = 0;
  responseCount = 0;
}, 60000);

// 请求监控中间件
const requestMonitor = (req: Request, res: Response, next: NextFunction) => {
  requestCount++;
  
  // 记录请求开始时间
  const startTime = Date.now();
  
  // 响应完成后记录响应时间
  res.on('finish', () => {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    responseTimeTotal += responseTime;
    responseCount++;
  });
  
  next();
};

// 全局缓存中间件
const globalCache = (duration: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // 跳过非GET请求或带有Authorization头的请求
    if (req.method !== 'GET' || req.headers.authorization) {
      return next();
    }
    
    // 对频繁访问的API端点应用更长的缓存时间
    let cacheDuration = duration;
    if (req.path.startsWith('/api/rooms')) {
      cacheDuration = 300; // 自习室数据缓存5分钟
    }
    
    const key = `__express__${req.originalUrl || req.url}`;
    const cachedBody = mcache.get(key);
    
    if (cachedBody) {
      // 从缓存返回
      console.log(`从全局缓存返回: ${req.originalUrl}`);
      res.send(cachedBody);
      return;
    } else {
      // 存储到缓存
      res.sendResponse = res.send;
      res.send = (body) => {
        mcache.put(key, body, cacheDuration * 1000);
        return res.sendResponse(body);
      };
      next();
    }
  };
};

// 定义API速率限制器
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分钟
  max: 100, // 每个IP 1分钟内最多100个请求
  standardHeaders: true,
  legacyHeaders: false,
  message: '请求过于频繁，请稍后再试',
  skipSuccessfulRequests: false, // 即使请求成功也计入限制
  skip: (req: Request) => req.path.startsWith('/api/auth/health') // 跳过健康检查端点
});

// 自习室API特定的限制器 - 更严格
const roomsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分钟
  max: 30, // 每分钟最多30个请求
  message: '自习室数据请求过于频繁，请稍后再试',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false // 调整为不跳过成功请求，更严格控制频率
});

// 请求日志追踪ID
let requestId = 0;

// 中间件
app.use(express.json());
app.use(requestMonitor);

// 调试请求日志 - 只在开发环境使用
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cookieParser());

// 配置CORS中间件
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://localhost:3001', 
  'http://localhost:3002',
  'http://127.0.0.1:5173', 
  'http://127.0.0.1:5174'
];

app.use(cors({
  origin: function(origin, callback) {
    // 允许没有来源的请求（如移动应用或Postman）
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.log('CORS阻止了来源:', origin);
      callback(new Error('不允许的来源'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 204, // 使用204状态码而不是200，减少响应体大小
  maxAge: 86400 // 缓存预检请求结果24小时，大幅减少OPTIONS请求
}));

// 请求日志记录中间件
app.use((req, res, next) => {
  const currentRequestId = ++requestId;
  
  if (req.method === 'GET' && req.url.includes('?_t=')) {
    // 对于带有时间戳的GET请求，减少日志输出
    if (Math.random() < 0.05) { // 只记录5%的请求
      console.log(`[REQ-${currentRequestId}] ${req.method} ${req.url} - Origin: ${req.headers.origin || 'No Origin'}`);
    }
  } else {
    console.log(`[REQ-${currentRequestId}] ${req.method} ${req.url} - Origin: ${req.headers.origin || 'No Origin'} - Referer: ${req.headers.referer || 'No Referer'}`);
  }
  
  // 添加一个响应完成的监听器，记录请求结束
  res.on('finish', () => {
    if (res.statusCode >= 400) {
      console.log(`[REQ-${currentRequestId}] 完成 - 状态码: ${res.statusCode}`);
    }
  });
  
  next();
});

// 应用速率限制
app.use('/api/', apiLimiter);
app.use('/api/rooms', roomsLimiter);

// 应用全局缓存 - 120秒
app.use(globalCache(120));

// 路由
app.get('/', (req, res) => {
  res.send('自习室预约系统API已运行');
});

// API根路径处理
app.get('/api', globalCache(300), (req, res) => {
  res.json({
    status: 'success',
    message: '自习室预约系统API已运行',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/api/auth',
      '/api/rooms',
      '/api/reservations',
      '/api/users'
    ]
  });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/users', userRoutes);

// 错误处理中间件
app.use(errorHandler);

// 启动服务器
const startServer = async () => {
  try {
    // 初始化数据库连接
    await initializeDatabase();
    
    // 尝试不同的端口，避免冲突
    const tryPort = (portToTry: number) => {
      const server = app.listen(portToTry, '0.0.0.0', () => {
        console.log(`服务器运行在${process.env.NODE_ENV}模式下，端口：${portToTry}`);
        console.log(`内存基线: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`);
      }).on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`端口 ${portToTry} 已被占用，尝试端口 ${portToTry + 1}`);
          tryPort(portToTry + 1);
        } else {
          console.error('服务器启动失败:', err);
          process.exit(1);
        }
      });
    };
    
    // 从指定的端口开始尝试
    tryPort(Number(PORT));
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
};

startServer(); 