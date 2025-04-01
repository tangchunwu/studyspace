require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function createTestUser() {
  console.log('创建测试用户...');
  
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'studyspace'
  });

  try {
    await client.connect();
    console.log('数据库连接成功！');
    
    // 检查是否已存在测试用户
    const checkUser = await client.query(`
      SELECT * FROM users WHERE email = $1
    `, ['testuser@example.com']);
    
    if (checkUser.rows.length > 0) {
      // 更新现有用户
      console.log('测试用户已存在，更新密码...');
      
      // 生成密码哈希
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('test123', salt);
      
      await client.query(`
        UPDATE users 
        SET password = $1, is_disabled = false 
        WHERE email = $2
      `, [hashedPassword, 'testuser@example.com']);
      
      console.log('✅ 测试用户密码已更新');
      
    } else {
      // 创建新用户
      console.log('创建新的测试用户...');
      
      // 生成密码哈希
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('test123', salt);
      
      // 生成UUID
      const userIdResult = await client.query("SELECT gen_random_uuid() as id");
      const userId = userIdResult.rows[0].id;
      
      await client.query(`
        INSERT INTO users (
          id, email, student_id, name, password, credit_score, 
          role, avatar_url, phone_number, major, grade, bio, 
          created_at, last_login
        ) VALUES (
          $1, $2, $3, $4, $5, $6, 
          $7, $8, $9, $10, $11, $12, 
          $13, $14
        )
      `, [
        userId,
        'testuser@example.com',
        'TEST001',
        '测试用户',
        hashedPassword,
        100,
        'user',
        null,
        '13800138000',
        '计算机科学',
        '2025级',
        '这是一个测试账号',
        new Date(),
        new Date()
      ]);
      
      console.log('✅ 测试用户创建成功');
    }
    
    // 获取并显示用户信息
    const userData = await client.query(`
      SELECT id, email, student_id, name, role, is_disabled
      FROM users 
      WHERE email = $1
    `, ['testuser@example.com']);
    
    const user = userData.rows[0];
    console.log('\n测试用户信息:');
    console.log(`- ID: ${user.id}`);
    console.log(`- 名称: ${user.name}`);
    console.log(`- 邮箱: ${user.email}`);
    console.log(`- 学号: ${user.student_id}`);
    console.log(`- 角色: ${user.role}`);
    console.log(`- 状态: ${user.is_disabled ? '已禁用' : '正常'}`);
    
    console.log('\n登录信息:');
    console.log('- 邮箱: testuser@example.com');
    console.log('- 密码: test123');
    
  } catch (error) {
    console.error('创建测试用户失败:', error);
  } finally {
    await client.end();
    console.log('\n数据库连接已关闭');
  }
}

createTestUser(); 