# 自习室预约系统 (Study Room Reservation System)

一个完整的自习室预约管理系统，提供自习室查询、座位预约、用户管理等功能。系统采用前后端分离架构，具有高性能、响应式的用户界面和安全可靠的后端服务。

![自习室预约系统](https://img.shields.io/badge/版本-1.0.0-blue)

## 🚀 主要功能

- 📚 **自习室管理**：查看自习室列表、详情和实时状态
- 💺 **座位预约**：选择自习室、座位和时间段进行预约
- 👥 **用户系统**：注册、登录、个人资料管理
- 📊 **预约管理**：查看、取消预约，签到功能
- 🔍 **搜索筛选**：按地点、容量等条件筛选自习室
- 👑 **管理员功能**：用户管理、自习室管理、数据统计

## 🔧 技术栈

### 前端
- **React 18**：构建用户界面
- **TypeScript**：类型安全的JavaScript超集
- **Zustand**：状态管理库
- **TailwindCSS**：原子化CSS框架
- **React Router**：路由管理
- **React Hot Toast**：通知提示组件
- **Axios**：HTTP客户端
- **Vite**：构建工具

### 后端
- **Node.js**：JavaScript运行时
- **Express**：Web框架
- **TypeScript**：类型安全
- **TypeORM**：对象关系映射
- **PostgreSQL**：关系型数据库
- **JWT**：身份验证
- **Helmet**：安全增强中间件
- **Rate Limiting**：请求限流

## 📋 系统要求

- Node.js 16.x 或更高版本
- PostgreSQL 14.x 或更高版本
- npm 或 yarn 包管理器

## ⚙️ 安装与设置

### 1. 克隆仓库

```bash
git clone https://github.com/yourusername/studyspace.git
cd studyspace
```

### 2. 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server
npm install
cd ..
```

### 3. 环境配置

创建并配置环境变量文件：

**前端 (.env)：**
```
VITE_API_URL=http://localhost:3002/api
```

**后端 (server/.env)：**
```
PORT=3002
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=studyspace
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=1d
```

### 4. 数据库设置

```bash
# 初始化数据库
cd server
npm run migration:run

# 填充测试数据
npm run seed
```

### 5. 启动应用

```bash
# 启动后端 (在server目录下)
npm run dev

# 启动前端 (在项目根目录)
npm run dev
```

应用将运行在：
- 前端：http://localhost:5174
- 后端：http://localhost:3002

## 🎮 使用指南

### 用户角色

系统支持两种用户角色：
- **普通用户**：可以浏览自习室、预约座位、管理个人预约
- **管理员**：可以管理用户、自习室和座位，查看统计数据

### 默认账户

系统初始包含以下测试账户：
- 管理员：admin@example.com / password123
- 测试用户：user@example.com / password123

## 🔥 性能优化

系统已实施多项性能优化措施：
- 前端数据缓存机制，减少不必要的API请求
- API请求防抖和节流，避免短时间内重复请求
- 后端CORS配置优化，减少OPTIONS预检请求
- 数据库索引优化，提高查询效率
- CDN资源加载和组件懒加载

## 📱 响应式设计

系统界面采用响应式设计，完美支持桌面电脑、平板和手机等各种设备。

## 🛡️ 安全特性

- JWT身份验证，保护API
- 请求速率限制，防止暴力攻击
- 安全HTTP头部，预防常见Web攻击
- 密码加密存储，保护用户数据
- 输入验证和清洗，防止注入攻击

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出改进建议！

1. Fork这个仓库
2. 创建你的功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建一个Pull Request

## 📄 许可证

本项目采用MIT许可证 - 详情请参阅[LICENSE](LICENSE)文件。

## 🙏 致谢

- 感谢所有为本项目做出贡献的开发者
- 感谢用户的反馈和建议，帮助我们不断改进 