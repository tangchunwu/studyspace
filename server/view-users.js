require('dotenv').config();
const { Client } = require('pg');

// 创建数据库连接
const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'studyspace'
});

// 连接数据库
client.connect()
  .then(() => {
    console.log('数据库连接成功');
    
    // 查询所有用户
    return client.query('SELECT * FROM users');
  })
  .then(res => {
    console.log(`找到 ${res.rows.length} 个用户:`);
    
    // 输出所有用户信息
    res.rows.forEach(user => {
      console.log('====================');
      console.log(`用户: ${user.name}`);
      console.log(`邮箱: ${user.email}`);
      console.log(`角色: ${user.role}`);
      console.log(`学号: ${user.student_id}`);
      console.log(`密码Hash: ${user.password.substring(0, 10)}...`);
      console.log(`是否禁用: ${user.is_disabled ? '是' : '否'}`);
    });
    
    console.log('\n登录信息:');
    console.log('1. 管理员');
    console.log('   邮箱: admin@example.com');
    console.log('   密码: password123');
    console.log('   ');
    console.log('2. 备用管理员');
    console.log('   邮箱: admin2@example.com');
    console.log('   密码: admin123');
  })
  .catch(err => {
    console.error('查询失败:', err);
  })
  .finally(() => {
    client.end();
    console.log('数据库连接已关闭');
  }); 