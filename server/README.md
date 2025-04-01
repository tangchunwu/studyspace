# 自习室预约系统 - 后端服务

本目录包含自习室预约系统的后端服务代码。项目基于Node.js和Express框架开发，使用TypeORM进行数据库操作，提供完整的REST API支持前端应用。

## 技术栈

- **Node.js**: JavaScript运行时环境
- **Express**: Web应用框架
- **TypeScript**: 强类型JavaScript超集
- **TypeORM**: 对象关系映射库
- **PostgreSQL**: 关系型数据库
- **JWT**: JSON Web Token身份验证
- **Bcrypt**: 密码哈希加密
- **Helmet**: HTTP头安全中间件
- **Express-rate-limit**: 请求速率限制中间件
- **CORS**: 跨域资源共享支持

## 项目结构

```
server/
├── src/                 # 源代码
│   ├── config/          # 配置文件
│   │   ├── database.ts          # 数据库配置
│   │   └── typeorm.config.ts    # TypeORM配置
│   ├── controllers/     # 控制器
│   │   ├── authController.ts    # 认证控制器
│   │   ├── roomController.ts    # 自习室控制器
│   │   ├── userController.ts    # 用户控制器
│   │   └── reservationController.ts # 预约控制器
│   ├── entities/        # 数据实体
│   │   ├── user.entity.ts       # 用户实体
│   │   ├── study-room.entity.ts # 自习室实体
│   │   ├── seat.entity.ts       # 座位实体
│   │   ├── reservation.entity.ts # 预约实体
│   │   └── check-in.entity.ts   # 签到实体
│   ├── middlewares/     # 中间件
│   │   ├── auth.ts              # 认证中间件
│   │   └── error.ts             # 错误处理中间件
│   ├── migrations/      # 数据库迁移
│   ├── routes/          # 路由定义
│   │   ├── authRoutes.ts        # 认证路由
│   │   ├── roomRoutes.ts        # 自习室路由
│   │   ├── userRoutes.ts        # 用户路由
│   │   └── reservationRoutes.ts # 预约路由
│   ├── types/           # 类型定义
│   ├── utils/           # 工具函数
│   │   ├── generateToken.ts     # 生成JWT令牌
│   │   └── seedData.ts          # 种子数据生成
│   └── index.ts         # 应用入口
├── .env                 # 环境变量
├── package.json         # 项目依赖
└── tsconfig.json        # TypeScript配置
```

## 数据库模型

系统使用以下主要数据模型：

### 用户 (User)
- id: string (UUID)
- email: string (唯一)
- student_id: string (唯一)
- name: string
- password: string (加密存储)
- avatar_url: string (可选)
- credit_score: number
- role: 'user' | 'admin'
- created_at: Date

### 自习室 (StudyRoom)
- id: string (UUID)
- room_number: string (唯一)
- capacity: number
- status: 'available' | 'maintenance' | 'closed'
- location: string
- description: string (可选)
- created_at: Date

### 座位 (Seat)
- id: string (UUID)
- room_id: string (外键)
- seat_number: string
- is_available: boolean
- created_at: Date

### 预约 (Reservation)
- id: string (UUID)
- user_id: string (外键)
- room_id: string (外键)
- seat_id: string (外键)
- start_time: Date
- end_time: Date
- status: 'pending' | 'confirmed' | 'canceled' | 'completed'
- check_in_time: Date (可选)
- created_at: Date

### 签到 (CheckIn)
- id: string (UUID)
- reservation_id: string (外键)
- check_in_time: Date
- check_out_time: Date (可选)
- status: 'on_time' | 'late' | 'missed'
- created_at: Date

## API接口

### 认证相关
- POST `/api/auth/register` - 用户注册
- POST `/api/auth/login` - 用户登录
- GET `/api/auth/me` - 获取当前用户
- PUT `/api/auth/profile` - 更新用户资料

### 自习室相关
- GET `/api/rooms` - 获取所有自习室
- GET `/api/rooms/:id` - 获取单个自习室详情
- GET `/api/rooms/:id/seats` - 获取自习室座位
- POST `/api/rooms/:id/check-availability` - 检查座位可用性

### 预约相关
- POST `/api/reservations` - 创建预约
- GET `/api/reservations` - 获取用户预约
- PUT `/api/reservations/:id/cancel` - 取消预约
- POST `/api/reservations/:id/check-in` - 预约签到

### 用户相关 (管理员)
- GET `/api/users` - 获取所有用户
- GET `/api/users/:id` - 获取用户详情
- PUT `/api/users/:id/toggle-status` - 切换用户状态

## 身份验证与授权

系统使用JWT进行身份验证：

1. 用户登录后获取JWT令牌
2. 后续请求在Authorization头中携带令牌
3. 需要认证的路由使用auth中间件保护
4. 特定操作检查用户角色和权限

## 安全措施

1. **密码安全**：使用bcrypt进行密码哈希存储
2. **HTTP安全**：应用Helmet中间件设置安全HTTP头
3. **请求限流**：对敏感接口应用速率限制，防止暴力攻击
4. **输入验证**：所有用户输入经过验证和清洗
5. **错误处理**：统一的错误处理机制，避免敏感信息泄漏

## 缓存策略

为提高性能，系统实现了多级缓存：

1. **内存缓存**：频繁访问的数据（如自习室列表）
2. **结果缓存**：短期缓存查询结果
3. **缓存过期**：自动清理过期缓存
4. **缓存刷新**：数据变更时主动刷新缓存

## 开发指南

### 环境准备

1. 确保已安装Node.js (v18+)和PostgreSQL (v14+)
2. 创建PostgreSQL数据库

### 安装依赖
```bash
npm install
```

### 配置环境变量
复制`.env.example`文件为`.env`并根据实际情况修改：
```
PORT=3002
NODE_ENV=development

# PostgreSQL数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=studyspace

# JWT配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=1d
```

### 数据库迁移
```bash
# 运行迁移创建表结构
npm run migration:run

# 填充测试数据
npm run seed
```

### 启动开发服务器
```bash
npm run dev
```
服务器将在 http://localhost:3002 运行

### 构建生产版本
```bash
npm run build
npm start
```

## 数据库管理

### 创建新迁移
```bash
npm run migration:create -- -n MigrationName
```

### 从实体生成迁移
```bash
npm run migration:generate -- -n GeneratedMigration
```

### 回滚迁移
```bash
npm run migration:revert
```

## 性能优化

本服务实现了以下性能优化措施：

1. **数据库索引**：关键查询字段添加索引
2. **查询优化**：避免N+1查询问题，优化JOIN操作
3. **连接池**：数据库连接池管理
4. **缓存机制**：合理使用内存缓存减少数据库负载
5. **分页查询**：大数据集支持分页查询

## 错误处理

系统采用统一的错误处理机制：

1. 使用`asyncHandler`包装异步路由处理器
2. 集中式错误捕获和格式化
3. 生产环境隐藏详细错误信息
4. 不同类型错误返回适当的HTTP状态码

## 测试

```bash
# 运行单元测试
npm test

# 带覆盖率报告
npm run test:coverage
```

## 日志

系统使用分级日志记录，开发环境详细记录请求和错误，生产环境仅记录重要信息和错误。

## 部署

推荐的部署选项：

1. **Docker容器**：提供完整的Dockerfile和docker-compose配置
2. **PM2**：使用进程管理器在生产环境运行Node应用
3. **反向代理**：生产环境使用Nginx作为反向代理

## 常见问题

### 数据库连接问题
- 检查环境变量中的数据库配置
- 确认PostgreSQL服务运行状态
- 查看数据库用户权限

### JWT相关问题
- 确保JWT_SECRET已正确设置且安全
- 检查令牌过期设置是否合理

### TypeORM问题
- 检查实体字段与数据库表结构匹配
- 运行最新迁移确保数据库结构最新

## 贡献指南

1. 创建功能分支 (feature/xxx)
2. 遵循代码规范和命名约定
3. 添加适当的单元测试
4. 提交时使用约定式提交规范 