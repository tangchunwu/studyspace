// 前端代理测试工具
import axios from 'axios';

// 设置apiClient，模拟前端应用中的配置
const apiClient = axios.create({
  baseURL: 'http://localhost:5174/api',
  timeout: 5000,
  validateStatus: null, // 接受任何状态码
});

// 测试端点列表 - 注意这些路径不包含/api前缀，因为它已经在baseURL中
const endpoints = [
  { url: '/', name: '通过代理访问API根路径' },
  { url: '/auth/health', name: '通过代理访问健康检查' },
  { url: '/rooms', name: '通过代理访问房间列表' }
];

// 测试每个端点
async function testProxyEndpoints() {
  console.log('开始前端代理测试 (使用apiClient)...\n');
  console.log(`baseURL: ${apiClient.defaults.baseURL}\n`);
  
  for (const endpoint of endpoints) {
    try {
      console.log(`测试 ${endpoint.name}: ${endpoint.url}`);
      const startTime = Date.now();
      const response = await apiClient.get(endpoint.url);
      const duration = Date.now() - startTime;
      
      console.log(`  状态: ${response.status} ${response.statusText}`);
      console.log(`  响应时间: ${duration}ms`);
      console.log(`  结果: ${response.status < 500 ? '成功' : '失败'} (${response.status < 400 ? '正常响应' : '错误响应但服务器在线'})`);
      
      // 打印响应数据的一部分，如果有的话
      if (response.data) {
        const dataStr = JSON.stringify(response.data).substring(0, 100);
        console.log(`  数据预览: ${dataStr}${dataStr.length >= 100 ? '...' : ''}`);
      }
    } catch (error) {
      console.log(`  错误: ${error.message}`);
      console.log(`  结果: 失败 (无法连接)`);
    }
    console.log(''); // 空行分隔
  }
  
  console.log('前端代理测试完成');
}

// 执行测试
testProxyEndpoints(); 