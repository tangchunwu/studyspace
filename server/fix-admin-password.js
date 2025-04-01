require('dotenv').config();
const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function fixAdminPassword() {
  console.log('开始修复管理员密码...');
  
  // 连接数据库
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
    
    // 修复所有管理员账号的密码
    const admins = ['admin@example.com', 'admin2@example.com', 'testadmin@example.com'];
    const passwords = ['password123', 'admin123', 'abc123'];
    
    for (let i = 0; i < admins.length; i++) {
      const email = admins[i];
      const password = passwords[i];
      
      console.log(`\n修复账号 ${email} 的密码为 ${password}...`);
      
      // 使用同步方式生成密码哈希
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(password, salt);
      console.log('新生成的密码哈希:', hash);
      
      // 直接使用SQL语句更新密码哈希
      const updateQuery = 'UPDATE users SET password = $1 WHERE email = $2 RETURNING email, role';
      const result = await client.query(updateQuery, [hash, email]);
      
      if (result.rowCount > 0) {
        console.log(`✅ 密码更新成功: ${result.rows[0].email} (${result.rows[0].role})`);
      } else {
        console.log(`❌ 未找到账号: ${email}`);
      }
    }
    
    console.log('\n所有账号密码都已修复');
    
    // 测试密码验证
    console.log('\n验证所有密码哈希:');
    for (let i = 0; i < admins.length; i++) {
      const email = admins[i];
      const password = passwords[i];
      
      const query = 'SELECT password FROM users WHERE email = $1';
      const res = await client.query(query, [email]);
      
      if (res.rows.length > 0) {
        const dbHash = res.rows[0].password;
        const isMatch = bcrypt.compareSync(password, dbHash);
        console.log(`${email}: 密码验证 ${isMatch ? '✅ 成功' : '❌ 失败'}`);
      } else {
        console.log(`${email}: ❌ 账号不存在`);
      }
    }
    
  } catch (err) {
    console.error('修复密码出错:', err);
  } finally {
    await client.end();
    console.log('\n数据库连接已关闭');
  }
}

// 运行函数
fixAdminPassword(); 