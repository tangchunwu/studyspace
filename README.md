# 自习室预约系统 StudySpace

![版本](https://img.shields.io/badge/版本-0.1.0-blue)
![React](https://img.shields.io/badge/React-18.2.0-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-3178c6)
![Node.js](https://img.shields.io/badge/Node.js-18.x-339933)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-latest-336791)

自习室预约系统是一个全栈Web应用，为学生提供了方便的自习室和座位预约服务。学生可以浏览自习室信息，查看座位可用性，进行预约，并管理自己的预约记录。

## 功能特点

- 🔐 用户认证 - 注册、登录和个人资料管理
- 📚 自习室查询 - 浏览可用自习室列表和详情
- 💺 座位预约 - 选择时间段和可用座位进行预约
- 📅 预约管理 - 查看、取消和管理个人预约
- ✅ 签到功能 - 支持预约签到确认到场
- 👤 信用分系统 - 鼓励用户遵守预约规则

## 技术栈

### 前端

- **React** - UI构建库
- **TypeScript** - 类型安全的JavaScript超集
- **React Router** - 客户端路由管理
- **Zustand** - 状态管理
- **TailwindCSS** - 实用优先的CSS框架
- **Lucide React** - 图标组件库
- **React Hot Toast** - 通知组件
- **Vite** - 构建工具和开发服务器

### 后端

- **Node.js** - JavaScript运行时
- **Express** - Web框架
- **TypeORM** - ORM工具
- **PostgreSQL** - 关系型数据库
- **JWT** - 用户认证
- **bcrypt** - 密码加密

## 系统架构

项目采用前后端分离架构：

- **前端**：负责用户界面和交互，通过API与后端通信
- **后端**：提供RESTful API，处理业务逻辑和数据库操作

## 开始使用

### 环境要求

- Node.js v16+
- PostgreSQL v12+
- npm v8+

### 安装步骤

1. 克隆仓库

```bash
git clone [仓库地址]
cd studyspace
```

2. 安装后端依赖

```bash
cd project/server
npm install
```

3. 配置后端环境变量

创建或修改`.env`文件：

```
PORT=3000
NODE_ENV=development

# PostgreSQL数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=你的密码
DB_NAME=studyspace

# JWT配置
JWT_SECRET=studyspace_jwt_secret_key
JWT_EXPIRES_IN=1d
```

4. 初始化数据库

```bash
# 创建数据库
npm run db-test

# 填充测试数据
npm run seed
```

5. 安装前端依赖

```bash
cd ../
npm install
```

6. 配置前端环境变量

创建或修改`.env`文件：

```
VITE_API_URL=http://localhost:3000/api
```

### 启动应用

1. 启动后端服务

```bash
cd project/server
npm run dev
```

2. 启动前端服务（新终端）

```bash
cd project
npm run dev
```

应用将在 http://localhost:5173 上运行

### 测试账号

- 管理员：
  - 邮箱：admin@example.com
  - 密码：password123
  
- 普通用户：
  - 邮箱：user@example.com
  - 密码：password123

## 项目结构

### 前端

```
project/
├── public/            # 静态资源
├── src/
│   ├── api/           # API请求和服务
│   ├── components/    # 可复用组件
│   ├── lib/           # 工具库
│   ├── pages/         # 页面组件
│   ├── store/         # Zustand状态管理
│   ├── types/         # TypeScript类型定义
│   ├── App.tsx        # 应用入口
│   └── main.tsx       # 渲染入口
├── .env               # 环境变量
├── package.json       # 依赖管理
└── vite.config.ts     # Vite配置
```

### 后端

```
project/server/
├── src/
│   ├── config/        # 配置文件
│   ├── controllers/   # 控制器
│   ├── entities/      # TypeORM实体
│   ├── middlewares/   # 中间件
│   ├── routes/        # 路由定义
│   ├── utils/         # 工具函数
│   └── index.ts       # 应用入口
├── .env               # 环境变量
└── package.json       # 依赖管理
```

## API文档

### 认证API

- `POST /api/auth/register` - 注册新用户
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

### 自习室API

- `GET /api/rooms` - 获取所有自习室
- `GET /api/rooms/:id` - 获取自习室详情
- `GET /api/rooms/:id/seats` - 获取自习室座位
- `POST /api/rooms/:id/check-availability` - 检查座位可用性

### 预约API

- `GET /api/reservations` - 获取用户预约
- `POST /api/reservations` - 创建新预约
- `PUT /api/reservations/:id/cancel` - 取消预约
- `POST /api/reservations/:id/check-in` - 预约签到

## 后续开发计划

### 功能增强

1. **管理员后台**
   - 自习室和座位管理
   - 用户管理
   - 预约数据统计和报表

2. **高级预约功能**
   - 周期性预约
   - 预约提醒
   - 座位推荐

3. **社交功能**
   - 好友同步预约
   - 小组共同学习

### 技术优化

1. **前端优化**
   - 实现响应式设计，支持移动端
   - 添加PWA支持
   - 优化加载性能

2. **后端优化**
   - 添加完整的单元测试
   - 实现缓存机制
   - 日志和监控系统

3. **架构升级**
   - 考虑使用微服务架构
   - 容器化部署支持
   - CI/CD流程优化

## 贡献指南

1. Fork本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 提交Pull Request

## 开源许可

该项目基于MIT许可证发布 - 详情请参阅 LICENSE 文件

## 联系方式

项目维护者 - 邮箱: [维护者邮箱]

项目链接: [仓库地址]

---

祝您使用愉快！如有问题或建议，请随时提出issue或联系维护者。 