import axios from 'axios';

async function testLogin() {
  console.log('开始测试登录...');
  
  // 管理员账号信息
  const accounts = [
    { email: 'admin@example.com', password: 'password123', name: '管理员' },
    { email: 'admin2@example.com', password: 'admin123', name: '备用管理员' },
    { email: 'testadmin@example.com', password: 'abc123', name: '测试管理员' }
  ];
  
  console.log('可用账号:');
  accounts.forEach(account => {
    console.log(`- ${account.name}: ${account.email} / ${account.password}`);
  });
  
  for (const account of accounts) {
    console.log(`\n尝试登录 ${account.name} (${account.email})...`);
    
    try {
      // 发送登录请求
      const response = await axios.post('http://localhost:3000/api/auth/login', {
        email: account.email,
        password: account.password
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`✅ 登录成功! 状态码: ${response.status}`);
      console.log('用户信息:');
      console.log(`- 名称: ${response.data.name}`);
      console.log(`- 邮箱: ${response.data.email}`);
      console.log(`- 角色: ${response.data.role}`);
      console.log(`- Token: ${response.data.token.substring(0, 20)}...`);
    } catch (error) {
      console.log(`❌ 登录失败: ${account.email}`);
      if (error.response) {
        console.log(`状态码: ${error.response.status}`);
        console.log(`错误信息: ${JSON.stringify(error.response.data)}`);
      } else {
        console.log(`错误: ${error.message}`);
      }
    }
  }
  
  console.log('\n测试完成');
}

testLogin(); 