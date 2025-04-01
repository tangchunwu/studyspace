require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function createAdmin() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  
  try {
    await client.connect();
    console.log('数据库连接成功');
    
    // 生成密码哈希
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('admin123', salt);
    
    // 尝试插入新管理员
    const query = `
      INSERT INTO users (
        id, email, student_id, name, password, role, 
        credit_score, created_at
      ) 
      VALUES (
        uuid_generate_v4(), $1, $2, $3, $4, $5, 
        100, NOW()
      ) 
      ON CONFLICT (email) 
      DO UPDATE SET 
        password = $4,
        role = 'admin',
        is_disabled = false
      RETURNING *`;
    
    const values = [
      'admin2@example.com', 
      'admin2', 
      '管理员2', 
      password, 
      'admin'
    ];
    
    const res = await client.query(query, values);
    console.log('管理员账户更新成功:', {
      id: res.rows[0].id,
      email: res.rows[0].email,
      role: res.rows[0].role
    });
    
    console.log('登录信息:');
    console.log('- 邮箱: admin2@example.com');
    console.log('- 密码: admin123');
  } catch (err) {
    console.error('操作失败:', err);
  } finally {
    await client.end();
    console.log('数据库连接已关闭');
  }
}

createAdmin(); 