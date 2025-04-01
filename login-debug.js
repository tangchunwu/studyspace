// 登录调试工具 - 详细跟踪请求和响应
import axios from 'axios';

// 创建一个完整的axios实例，以便我们可以拦截请求和响应
const apiClient = axios.create({
  baseURL: 'http://localhost:5174/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 添加请求拦截器，打印出完整请求信息
apiClient.interceptors.request.use(
  config => {
    console.log('\n=== 发送请求 ===');
    console.log(`${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    console.log('请求头:', JSON.stringify(config.headers, null, 2));
    if (config.data) {
      console.log('请求体:', JSON.stringify(config.data, null, 2).replace(/"password":"[^"]+"/g, '"password":"***"'));
    }
    console.log('=== 请求结束 ===\n');
    return config;
  },
  error => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 添加响应拦截器，打印出完整响应信息
apiClient.interceptors.response.use(
  response => {
    console.log('\n=== 收到响应 ===');
    console.log(`状态: ${response.status} ${response.statusText}`);
    console.log('响应头:', JSON.stringify(response.headers, null, 2));
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    console.log('=== 响应结束 ===\n');
    return response;
  },
  error => {
    console.log('\n=== 响应错误 ===');
    if (error.response) {
      console.log(`状态: ${error.response.status} ${error.response.statusText}`);
      console.log('响应头:', JSON.stringify(error.response.headers, null, 2));
      console.log('响应数据:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('没有收到响应，请求详情:', error.request);
    } else {
      console.log('错误详情:', error.message);
    }
    console.log('错误配置:', error.config);
    console.log('=== 错误结束 ===\n');
    return Promise.reject(error);
  }
);

// 测试用户凭据
const credentials = {
  email: 'admin@example.com',
  password: 'admin12345'
};

// 测试登录功能
async function debugLogin() {
  console.log('======= 开始登录调试 =======');
  console.log(`使用凭据: ${credentials.email} / ${'*'.repeat(credentials.password.length)}`);
  
  try {
    // 1. 先测试健康检查端点
    console.log('\n>> 测试健康检查端点...');
    try {
      const healthResponse = await apiClient.get('/auth/health');
      console.log('健康检查成功!');
    } catch (healthError) {
      console.log('健康检查失败，但继续测试登录...');
    }
    
    // 2. 测试登录端点
    console.log('\n>> 执行登录请求...');
    const loginResponse = await apiClient.post('/auth/login', credentials);
    
    console.log('\n登录成功!');
    if (loginResponse.data.token) {
      console.log(`令牌: ${loginResponse.data.token.substring(0, 20)}...`);
    }
    
    if (loginResponse.data.user) {
      console.log('用户信息:');
      Object.entries(loginResponse.data.user).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
    }
    
    // 3. 测试使用获取的令牌进行认证请求
    if (loginResponse.data.token) {
      console.log('\n>> 测试认证请求...');
      try {
        const authResponse = await apiClient.get('/auth/me', {
          headers: {
            'Authorization': `Bearer ${loginResponse.data.token}`
          }
        });
        console.log('认证请求成功!');
      } catch (authError) {
        console.log('认证请求失败，但登录成功');
      }
    }
  } catch (error) {
    console.log('\n登录失败');
    if (error.code === 'ECONNREFUSED') {
      console.log('无法连接到服务器，检查服务器是否运行');
    } else if (error.code === 'ECONNABORTED') {
      console.log('请求超时，服务器响应时间过长');
    }
  } finally {
    console.log('\n======= 登录调试结束 =======');
  }
}

// 执行调试
debugLogin(); 