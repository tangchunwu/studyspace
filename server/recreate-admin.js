require('dotenv').config();
const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function recreateAdmin() {
  console.log('开始重建主管理员账号...');
  
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
    
    // 1. 删除旧的管理员账号
    console.log('删除旧的管理员账号...');
    await client.query('DELETE FROM users WHERE email = $1', ['admin@example.com']);
    
    // 2. 创建新的管理员账号
    console.log('创建新的管理员账号...');
    
    // 生成密码哈希
    const password = 'admin12345';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // 验证密码哈希能否正确验证
    const isValid = await bcrypt.compare(password, passwordHash);
    console.log(`密码哈希验证测试: ${isValid ? '成功' : '失败'}`);
    
    // 插入新管理员
    const insertQuery = `
      INSERT INTO users (
        id, 
        email, 
        student_id, 
        name, 
        password, 
        role, 
        credit_score, 
        created_at,
        last_login
      ) VALUES (
        uuid_generate_v4(), 
        $1, 
        $2, 
        $3, 
        $4, 
        'admin', 
        100, 
        NOW(),
        NOW()
      ) RETURNING id, email, name, role`;
    
    const values = ['admin@example.com', '20250001', '主管理员', passwordHash];
    const result = await client.query(insertQuery, values);
    
    console.log('管理员账号创建成功:');
    console.log(`- ID: ${result.rows[0].id}`);
    console.log(`- 名称: ${result.rows[0].name}`);
    console.log(`- 邮箱: ${result.rows[0].email}`);
    console.log(`- 角色: ${result.rows[0].role}`);
    console.log(`- 密码: ${password}`);
    
    // 测试一下登录
    console.log('\n测试登录验证...');
    const checkQuery = 'SELECT password FROM users WHERE email = $1';
    const checkResult = await client.query(checkQuery, ['admin@example.com']);
    
    if (checkResult.rows.length > 0) {
      const dbHash = checkResult.rows[0].password;
      const loginValid = await bcrypt.compare(password, dbHash);
      console.log(`主管理员账号密码验证: ${loginValid ? '成功' : '失败'}`);
    }
    
  } catch (error) {
    console.error('重建管理员账号出错:', error);
  } finally {
    await client.end();
    console.log('数据库连接已关闭');
  }
}

recreateAdmin(); 