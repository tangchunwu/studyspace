require('dotenv').config();
const axios = require('axios');

async function testSpecialUser() {
  console.log('=== 测试特殊用户登录 ===');
  
  const testUser = {
    email: 'testadmin@test.com',
    password: 'test123'
  };
  
  try {
    console.log(`尝试登录: ${testUser.email} / ${testUser.password}`);
    
    const response = await axios.post('http://localhost:3000/api/auth/login', testUser, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log(`✅ 登录成功! 状态码: ${response.status}`);
    
    // 检查响应数据结构
    if (!response.data.token) {
      console.log('❌ 缺少token!');
    } else {
      console.log('✓ token存在');
    }
    
    if (!response.data.user) {
      console.log('❌ 缺少user对象!');
    } else {
      console.log('✓ user对象存在');
      console.log('\n用户数据:');
      console.log(JSON.stringify(response.data.user, null, 2));
    }
  } catch (error) {
    console.log('❌ 登录失败');
    if (error.response) {
      console.log(`状态码: ${error.response.status}`);
      console.log(`错误信息: ${JSON.stringify(error.response.data)}`);
    } else {
      console.log(`错误: ${error.message}`);
    }
  }
  
  console.log('\n=== 测试完成 ===');
}

testSpecialUser(); 