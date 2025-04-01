require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function createTestAdmin() {
  console.log('创建新的测试管理员账号...');
  
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
    
    // 创建一个简单明了的密码和固定哈希
    const plainPassword = 'test123';
    const fixedPasswordHash = '$2b$10$r4q2TrOO0bVUzLM.oEhcPeKyYfwwi4fipcyLTf4KilGCOvxm.yhxS'; // test123的哈希
    
    // 尝试插入新管理员
    const query = `
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
      ) 
      VALUES (
        uuid_generate_v4(), 
        $1, 
        $2, 
        $3, 
        $4, 
        'admin', 
        100, 
        NOW(),
        NOW()
      ) 
      ON CONFLICT (email) 
      DO UPDATE SET 
        password = $4,
        role = 'admin',
        is_disabled = false
      RETURNING id, email, name, role`;
    
    const values = ['testadmin@test.com', '20250999', '测试专用管理员', fixedPasswordHash];
    
    const result = await client.query(query, values);
    
    console.log('测试管理员账号创建/更新成功:');
    console.log(`- ID: ${result.rows[0].id}`);
    console.log(`- 邮箱: ${result.rows[0].email}`);
    console.log(`- 角色: ${result.rows[0].role}`);
    console.log(`- 密码: ${plainPassword}`);
    
    // 验证密码哈希是否正确
    const isValid = await bcrypt.compare(plainPassword, fixedPasswordHash);
    console.log(`密码验证测试: ${isValid ? '成功' : '失败'}`);
    
  } catch (error) {
    console.error('创建测试管理员账号失败:', error);
  } finally {
    await client.end();
    console.log('数据库连接已关闭');
  }
}

createTestAdmin(); 