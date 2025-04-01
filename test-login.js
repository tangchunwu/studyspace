import axios from 'axios';

const apiUrl = 'http://localhost:3001/api';

async function testLogin() {
  try {
    console.log('=== 测试登录功能 ===');
    console.log('1. 尝试使用管理员账号登录');
    
    const loginData = {
      email: 'admin@example.com',
      password: 'admin12345'
    };
    
    console.log(`请求数据: ${JSON.stringify(loginData, null, 2)}`);
    console.log(`请求地址: ${apiUrl}/auth/login`);
    
    const response = await axios.post(`${apiUrl}/auth/login`, loginData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('登录成功!');
    console.log('状态码:', response.status);
    console.log('响应头:', JSON.stringify(response.headers, null, 2));
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    // 使用获取的token测试获取用户信息
    if (response.data && response.data.token) {
      console.log('\n2. 使用token获取用户信息');
      
      const userResponse = await axios.get(`${apiUrl}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${response.data.token}`
        }
      });
      
      console.log('获取用户信息成功!');
      console.log('用户数据:', JSON.stringify(userResponse.data, null, 2));
    }
    
    return true;
  } catch (error) {
    console.error('登录测试失败:');
    
    if (error.response) {
      // 服务器返回错误响应
      console.error('状态码:', error.response.status);
      console.error('响应头:', JSON.stringify(error.response.headers, null, 2));
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      // 请求发送成功但没有收到响应
      console.error('没有收到响应，请求详情:', error.request);
    } else {
      // 设置请求时发生错误
      console.error('请求错误:', error.message);
    }
    
    console.error('完整错误:', error);
    
    return false;
  }
}

// 运行测试
testLogin()
  .then(success => {
    console.log(`\n测试${success ? '成功' : '失败'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('测试执行错误:', err);
    process.exit(1);
  });

// 测试登录页面 - 在浏览器中直接加载此文件
const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>登录测试</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      text-align: center;
    }
    .form-group {
      margin-bottom: 15px;
    }
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }
    input {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    button {
      background-color: #4f46e5;
      color: white;
      border: none;
      padding: 10px 15px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
    }
    button:hover {
      background-color: #4338ca;
    }
    button:disabled {
      background-color: #93c5fd;
      cursor: not-allowed;
    }
    #result {
      margin-top: 20px;
      padding: 15px;
      border-radius: 4px;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 300px;
      overflow: auto;
    }
    .success {
      background-color: #ecfdf5;
      border: 1px solid #10b981;
      color: #047857;
    }
    .error {
      background-color: #fef2f2;
      border: 1px solid #ef4444;
      color: #b91c1c;
    }
    .info {
      background-color: #eff6ff;
      border: 1px solid #3b82f6;
      color: #1d4ed8;
    }
    .loading {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255,255,255,.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 1s ease-in-out infinite;
      margin-right: 5px;
      vertical-align: middle;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <h1>登录测试</h1>
  
  <div class="form-group">
    <label for="email">邮箱</label>
    <input type="email" id="email" value="admin@example.com">
  </div>
  
  <div class="form-group">
    <label for="password">密码</label>
    <input type="password" id="password" value="admin12345">
  </div>

  <div class="form-group">
    <label for="api-url">API URL</label>
    <input type="text" id="api-url" value="http://localhost:5174/api">
  </div>
  
  <button id="login-btn" onclick="login()">登录</button>
  <button id="check-health-btn" onclick="checkHealth()">检查API状态</button>
  <button id="clear-btn" onclick="clearResult()">清除结果</button>
  
  <div id="result" class="info">等待操作...</div>
  
  <script>
    // 获取页面元素
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const apiUrlInput = document.getElementById('api-url');
    const loginBtn = document.getElementById('login-btn');
    const checkHealthBtn = document.getElementById('check-health-btn');
    const resultDiv = document.getElementById('result');
    
    // 显示结果
    function showResult(content, type = 'info') {
      resultDiv.className = type;
      resultDiv.textContent = content;
    }
    
    // 清除结果
    function clearResult() {
      resultDiv.className = 'info';
      resultDiv.textContent = '等待操作...';
    }
    
    // 设置按钮加载状态
    function setLoading(isLoading) {
      loginBtn.disabled = isLoading;
      checkHealthBtn.disabled = isLoading;
      
      if (isLoading) {
        loginBtn.innerHTML = '<span class="loading"></span> 处理中...';
        checkHealthBtn.innerHTML = '<span class="loading"></span> 检查中...';
      } else {
        loginBtn.textContent = '登录';
        checkHealthBtn.textContent = '检查API状态';
      }
    }
    
    // 检查API状态
    async function checkHealth() {
      const apiUrl = apiUrlInput.value.trim();
      if (!apiUrl) {
        showResult('请输入API URL', 'error');
        return;
      }
      
      try {
        setLoading(true);
        showResult('正在检查API状态...', 'info');
        
        const response = await fetch(\`\${apiUrl}/auth/health\`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        if (response.ok) {
          showResult(\`API状态检查成功: \${JSON.stringify(data, null, 2)}\`, 'success');
        } else {
          showResult(\`API返回错误: \${JSON.stringify(data, null, 2)}\`, 'error');
        }
      } catch (error) {
        showResult(\`API状态检查失败: \${error.message}\`, 'error');
      } finally {
        setLoading(false);
      }
    }
    
    // 登录
    async function login() {
      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();
      const apiUrl = apiUrlInput.value.trim();
      
      if (!email || !password) {
        showResult('请输入邮箱和密码', 'error');
        return;
      }
      
      if (!apiUrl) {
        showResult('请输入API URL', 'error');
        return;
      }
      
      try {
        setLoading(true);
        showResult('正在登录...', 'info');
        
        const response = await fetch(\`\${apiUrl}/auth/login\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          showResult(\`登录成功: \${JSON.stringify(data, null, 2)}\`, 'success');
        } else {
          showResult(\`登录失败: \${JSON.stringify(data, null, 2)}\`, 'error');
        }
      } catch (error) {
        showResult(\`登录请求失败: \${error.message}\`, 'error');
      } finally {
        setLoading(false);
      }
    }
  </script>
</body>
</html>
`;

// 将HTML写入文件
import { writeFileSync } from 'fs';
writeFileSync('login-test.html', html);

console.log('测试登录页面已生成: login-test.html');
console.log('请在浏览器中打开此文件以测试登录功能'); 