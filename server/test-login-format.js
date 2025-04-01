require('dotenv').config();
const axios = require('axios');

async function testLoginResponseFormat() {
  console.log('=== 开始测试登录响应数据格式 ===');
  
  // 管理员账号信息
  const accounts = [
    { email: 'admin@example.com', password: 'admin12345', name: '主管理员' },
    { email: 'admin2@example.com', password: 'admin123', name: '备用管理员' },
    { email: 'testadmin@example.com', password: 'abc123', name: '测试管理员' }
  ];
  
  console.log('测试账号:');
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
      
      // 验证响应数据格式和完整性
      const data = response.data;
      
      // 验证顶层结构
      if (!data.token) {
        console.log('❌ 响应数据缺少 token!');
      } else {
        console.log('✓ token 存在');
      }
      
      if (!data.user) {
        console.log('❌ 响应数据缺少 user 对象!');
        continue;
      } else {
        console.log('✓ user 对象存在');
      }
      
      // 验证用户对象字段
      const user = data.user;
      const requiredFields = ['id', 'name', 'email', 'student_id', 'role', 'credit_score', 'created_at'];
      const optionalFields = ['avatar_url', 'phone_number', 'major', 'grade', 'bio', 'last_login', 'is_disabled'];
      
      // 检查必填字段
      console.log('\n必填字段检查:');
      const missingRequired = requiredFields.filter(field => !user[field]);
      if (missingRequired.length > 0) {
        console.log(`❌ 以下必填字段缺失: ${missingRequired.join(', ')}`);
      } else {
        console.log('✓ 所有必填字段都存在');
      }
      
      // 检查可选字段
      console.log('\n可选字段状态:');
      optionalFields.forEach(field => {
        if (user[field] !== undefined) {
          console.log(`✓ ${field}: ${user[field]}`);
        } else {
          console.log(`○ ${field}: 未提供`);
        }
      });
      
      // 输出完整的用户数据结构
      console.log('\n完整用户数据:');
      console.log(JSON.stringify(user, null, 2));
      
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
  
  console.log('\n=== 测试完成 ===');
}

testLoginResponseFormat(); 