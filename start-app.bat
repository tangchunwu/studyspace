@echo off
echo 正在启动自习室预约系统...

echo 1. 启动后端服务
start powershell -Command "cd server && npm run dev"

echo 2. 启动前端应用
start powershell -Command "npm run dev"

echo 应用已经启动！请等待浏览器自动打开...
echo 如果浏览器没有自动打开，请访问: http://localhost:5174

timeout /t 5
start http://localhost:5174

echo.
echo 按任意键退出此窗口...
pause > nul 