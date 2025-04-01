require('dotenv').config();
const axios = require('axios');
const bcrypt = require('bcrypt');
const { Client } = require('pg');

// 测试登录API
async function testLoginApi() {
  console.log('开始测试登录API...');
  
  // 1. 先检查数据库中的管理员信息
  const adminInfo = await checkAdminInDb();
  
  // 2. 测试登录API
  try {
    console.log('\n尝试使用API登录管理员账号...');
    const loginData = {
      email: 'admin@example.com',
      password: 'password123'
    };
    
    console.log('请求数据:', loginData);
    const response = await axios.post('http://localhost:3000/api/auth/login', loginData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('登录成功!');
    console.log('响应状态:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('API登录失败:');
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    } else {
      console.error('错误信息:', error.message);
    }
    
    // 3. 如果API登录失败，测试密码加密和验证
    await testPasswordEncryption();
    return false;
  }
}

// 检查数据库中的管理员信息
async function checkAdminInDb() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'studyspace'
  });
  
  try {
    await client.connect();
    console.log('数据库连接成功');
    
    // 查询管理员用户
    const query = 'SELECT id, email, name, password, role FROM users WHERE email = $1';
    const res = await client.query(query, ['admin@example.com']);
    
    if (res.rows.length === 0) {
      console.log('未找到管理员账号');
      return null;
    }
    
    const admin = res.rows[0];
    console.log('数据库中的管理员信息:');
    console.log('- 名称:', admin.name);
    console.log('- 邮箱:', admin.email);
    console.log('- 角色:', admin.role);
    console.log('- 密码哈希:', admin.password.substring(0, 20) + '...');
    
    return admin;
  } catch (err) {
    console.error('数据库查询失败:', err);
    return null;
  } finally {
    await client.end();
  }
}

// 测试密码加密和验证
async function testPasswordEncryption() {
  console.log('\n测试密码加密和验证...');
  
  try {
    // 正确的密码
    const correctPassword = 'password123';
    console.log('期望的密码:', correctPassword);
    
    // 从数据库获取管理员信息
    const client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      user: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'studyspace'
    });
    
    await client.connect();
    const query = 'SELECT password FROM users WHERE email = $1';
    const res = await client.query(query, ['admin@example.com']);
    
    if (res.rows.length === 0) {
      console.log('未找到管理员账号');
      return;
    }
    
    const dbPasswordHash = res.rows[0].password;
    console.log('数据库中的密码哈希:', dbPasswordHash);
    
    // 生成新的哈希进行比较
    const newSalt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(correctPassword, newSalt);
    console.log('新生成的密码哈希:', newHash);
    
    // 验证密码
    const isMatch = await bcrypt.compare(correctPassword, dbPasswordHash);
    console.log('密码验证结果:', isMatch ? '成功' : '失败');
    
    // 如果验证失败，重置密码
    if (!isMatch) {
      console.log('\n密码验证失败，尝试重置管理员密码...');
      // 生成新密码哈希
      const resetSalt = await bcrypt.genSalt(10);
      const resetHash = await bcrypt.hash(correctPassword, resetSalt);
      
      // 更新数据库密码
      const updateQuery = 'UPDATE users SET password = $1 WHERE email = $2 RETURNING *';
      const updateRes = await client.query(updateQuery, [resetHash, 'admin@example.com']);
      
      if (updateRes.rows.length > 0) {
        console.log('管理员密码已重置为: password123');
        console.log('新密码哈希:', resetHash);
      } else {
        console.log('密码重置失败');
      }
    }
    
    await client.end();
  } catch (err) {
    console.error('密码测试失败:', err);
  }
}

// 直接测试固定账号登录
async function testDirectLogin() {
  try {
    // 1. 创建固定哈希的管理员账号
    console.log('\n创建/重置固定哈希的测试管理员账号...');
    const client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      user: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'studyspace'
    });
    
    await client.connect();
    
    // 使用固定的哈希值
    const fixedHash = '$2b$10$ZlHJiCDeipLARBd0vVJTeeXeJPOGfDvXAj7yz9psBX9HE6QKMnOIq'; // "abc123" 的哈希
    
    // 插入或更新测试管理员
    const query = `
      INSERT INTO users (
        id, email, student_id, name, password, role, credit_score, created_at
      ) 
      VALUES (
        uuid_generate_v4(), $1, $2, $3, $4, 'admin', 100, NOW()
      )
      ON CONFLICT (email) 
      DO UPDATE SET 
        password = $4,
        role = 'admin', 
        is_disabled = false
      RETURNING *`;
    
    const values = ['testadmin@example.com', 'testadmin', '测试管理员', fixedHash];
    const res = await client.query(query, values);
    
    if (res.rows.length > 0) {
      console.log('测试管理员账号已创建/更新:');
      console.log('- 邮箱:', res.rows[0].email);
      console.log('- 密码: abc123 (固定)');
      console.log('- 密码哈希:', fixedHash);
    }
    
    await client.end();
    
    // 2. 尝试登录这个固定哈希账号
    console.log('\n尝试使用固定哈希测试账号登录...');
    const loginData = {
      email: 'testadmin@example.com',
      password: 'abc123'
    };
    
    try {
      const response = await axios.post('http://localhost:3000/api/auth/login', loginData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('登录成功!');
      console.log('响应状态:', response.status);
      return true;
    } catch (error) {
      console.error('固定哈希账号登录失败:');
      if (error.response) {
        console.error('响应状态:', error.response.status);
        console.error('响应数据:', error.response.data);
      } else {
        console.error('错误信息:', error.message);
      }
      return false;
    }
  } catch (err) {
    console.error('测试登录过程出错:', err);
    return false;
  }
}

// 执行测试
async function runTests() {
  console.log('=== 开始登录测试 ===');
  
  // 先测试API登录
  const apiLoginSuccess = await testLoginApi();
  
  if (!apiLoginSuccess) {
    // 如果API登录失败，测试固定哈希账号
    await testDirectLogin();
  }
  
  console.log('=== 测试完成 ===');
}

runTests(); 