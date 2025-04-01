// 登录功能测试工具
import axios from 'axios';

// 设置基础URL - 通过前端代理访问
const apiClient = axios.create({
  baseURL: 'http://localhost:5174/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 测试用户凭据
const credentials = {
  email: 'admin@example.com',
  password: 'admin12345'
};

// 测试登录功能
async function testLogin() {
  console.log('开始登录功能测试...\n');
  console.log(`使用凭据: ${credentials.email} / ${'*'.repeat(credentials.password.length)}`);
  
  try {
    console.log(`POST /auth/login (通过apiClient, baseURL=${apiClient.defaults.baseURL})`);
    const startTime = Date.now();
    
    // 使用apiClient，路径不包含/api前缀
    const response = await apiClient.post('/auth/login', credentials);
    
    const duration = Date.now() - startTime;
    
    console.log(`  状态: ${response.status} ${response.statusText}`);
    console.log(`  响应时间: ${duration}ms`);
    
    if (response.data) {
      if (response.data.token) {
        console.log('  登录成功! 已获取认证令牌');
        console.log(`  令牌: ${response.data.token.substring(0, 20)}...`);
      }
      
      if (response.data.user) {
        console.log('  用户信息:');
        console.log(`    ID: ${response.data.user.id}`);
        console.log(`    姓名: ${response.data.user.name}`);
        console.log(`    邮箱: ${response.data.user.email}`);
        console.log(`    角色: ${response.data.user.role}`);
      }
    }
  } catch (error) {
    console.log('  登录失败');
    
    if (error.response) {
      console.log(`  状态: ${error.response.status} ${error.response.statusText}`);
      console.log(`  错误信息: ${JSON.stringify(error.response.data)}`);
    } else {
      console.log(`  错误: ${error.message}`);
    }
  }
  
  console.log('\n登录功能测试完成');
}

// 执行测试
testLogin(); 