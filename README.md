# 自习室预约系统

这是一个基于React和Node.js的自习室预约系统，允许用户浏览自习室、选择座位并进行预约。

## 功能特性

- 用户注册和登录
- 个人资料管理
- 浏览自习室列表
- 查看自习室详情和座位布局
- 按日期和时间检查座位可用性
- 预约座位
- 查看和管理个人预约
- 管理员功能（用户管理、自习室管理）

## 技术栈

### 前端
- React 18
- TypeScript
- React Router v6
- Zustand (状态管理)
- Tailwind CSS
- Vite

### 后端
- Node.js
- Express
- TypeORM
- PostgreSQL
- JWT认证

## 快速开始

### 系统要求
- Node.js 18+
- PostgreSQL 14+
- npm 9+

### 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server
npm install
cd ..
```

### 配置数据库

1. 确保PostgreSQL已安装并运行
2. 创建一个名为`studyspace`的数据库
3. 编辑`server/.env`文件，配置数据库连接信息

```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=studyspace
```

### 启动应用

#### Windows用户
直接运行`start-app.bat`文件，或使用以下命令：

```bash
# 启动前端和后端
npm run win-full

# 或分别启动
# 后端
cd server
npm run dev

# 前端
npm run dev
```

#### 其他平台用户

```bash
# 在一个终端中启动后端
cd server
npm run dev

# 在另一个终端中启动前端
npm run dev
```

### 测试账号

系统提供以下测试账号：

1. 普通用户
   - 邮箱: testuser@example.com
   - 密码: test123

2. 管理员
   - 邮箱: admin@example.com
   - 密码: password123

## 开发指南

### 项目结构

```
project/
├── src/                # 前端源代码
│   ├── api/            # API客户端和服务
│   ├── components/     # React组件
│   ├── pages/          # 页面组件
│   ├── store/          # 状态管理
│   ├── types/          # TypeScript类型定义
│   └── utils/          # 工具函数
├── server/             # 后端源代码
│   ├── src/
│   │   ├── controllers/  # 控制器
│   │   ├── entities/     # 数据库实体
│   │   ├── middlewares/  # 中间件
│   │   ├── routes/       # 路由
│   │   └── utils/        # 工具函数
├── public/             # 静态资源
└── readme-fixes.md     # 修复和改进记录
```

### 测试工具

项目包含多个测试脚本以验证功能：

- `server/test-db-connection.js`: 测试数据库连接
- `server/check-users.js`: 检查用户表结构和数据
- `server/create-test-user.js`: 创建测试用户
- `server/test-profile-update.js`: 测试个人资料更新功能

## 贡献指南

1. Fork仓库
2. 创建你的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启一个Pull Request

## 许可证

此项目遵循MIT许可证。 