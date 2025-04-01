# 自习室预约系统快速启动指南

这是一个简明的快速启动指南，帮助你迅速运行自习室预约系统。

## Windows用户最快启动方法

如果你使用的是Windows系统，最简单的方法是运行项目根目录下的`start-app.bat`文件：

1. 双击`start-app.bat`文件
2. 系统将自动启动后端和前端服务
3. 浏览器将自动打开应用页面

## 手动启动步骤

如果你需要手动启动项目，请按以下步骤操作：

### 1. 确保数据库已配置

检查`server/.env`文件中的数据库配置是否正确：

```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=studyspace
```

### 2. 安装依赖

在首次运行前，确保已安装所有依赖：

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server
npm install
cd ..
```

### 3. 启动后端服务

```bash
cd server
npm run dev
```

### 4. 启动前端应用

在新的终端窗口中：

```bash
npm run dev
```

## 测试账号

你可以使用以下账号进行测试：

- **普通用户**: 
  - 邮箱: testuser@example.com
  - 密码: test123

- **管理员用户**: 
  - 邮箱: admin@example.com
  - 密码: password123

## 常见问题排查

1. **数据库连接错误**
   - 运行 `node server/test-db-connection.js` 检查数据库连接

2. **API错误**
   - 检查浏览器控制台的网络请求
   - 查看服务器控制台日志

3. **登录问题**
   - 运行 `node server/create-test-user.js` 创建测试用户

## 基本操作流程

1. 登录系统
2. 在首页查看预约统计
3. 浏览自习室列表
4. 选择自习室查看详情
5. 选择日期和时间段
6. 查询可用座位
7. 选择座位并预约
8. 在个人中心查看预约历史 