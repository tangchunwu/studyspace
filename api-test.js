// API连接测试工具
import axios from 'axios';

// API端点列表
const endpoints = [
  { url: 'http://localhost:3001', name: '后端根路径' },
  { url: 'http://localhost:3001/api', name: 'API根路径' },
  { url: 'http://localhost:3001/api/auth/health', name: '认证健康检查' },
  { url: 'http://localhost:3001/api/rooms', name: '房间列表' },
];

// 测试每个端点
async function testEndpoints() {
  console.log('开始API连接测试...\n');
  
  for (const endpoint of endpoints) {
    try {
      console.log(`测试 ${endpoint.name}: ${endpoint.url}`);
      const startTime = Date.now();
      const response = await axios.get(endpoint.url, {
        timeout: 5000,
        validateStatus: null, // 接受任何状态码
      });
      const duration = Date.now() - startTime;
      
      console.log(`  状态: ${response.status} ${response.statusText}`);
      console.log(`  响应时间: ${duration}ms`);
      console.log(`  结果: ${response.status < 500 ? '成功' : '失败'} (${response.status < 400 ? '正常响应' : '错误响应但服务器在线'})`);
    } catch (error) {
      console.log(`  错误: ${error.message}`);
      console.log(`  结果: 失败 (无法连接)`);
    }
    console.log(''); // 空行分隔
  }
  
  console.log('API连接测试完成');
}

// 执行测试
testEndpoints(); 