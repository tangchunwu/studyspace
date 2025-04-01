require('dotenv').config();
const { Client } = require('pg');

async function checkUsers() {
  console.log('测试用户表数据...');
  console.log('正在连接数据库...');
  
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'studyspace'
  });

  try {
    await client.connect();
    console.log('数据库连接成功!');
    
    // 检查表是否存在
    console.log('检查users表是否存在...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ users表存在');
      
      // 检查表结构
      console.log('\n检查users表结构...');
      const tableStructure = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users';
      `);
      
      console.log('users表字段:');
      tableStructure.rows.forEach(column => {
        console.log(`- ${column.column_name}: ${column.data_type}`);
      });
      
      // 查询用户数据
      console.log('\n查询用户数据...');
      const userCount = await client.query('SELECT COUNT(*) FROM users');
      console.log(`总共有 ${userCount.rows[0].count} 个用户`);
      
      if (parseInt(userCount.rows[0].count) > 0) {
        // 显示用户示例数据
        const usersResult = await client.query('SELECT * FROM users LIMIT 3');
        console.log('\n用户数据示例:');
        
        usersResult.rows.forEach((user, index) => {
          console.log(`\n用户 ${index + 1}:`);
          console.log(`- ID: ${user.id}`);
          console.log(`- 姓名: ${user.name}`);
          console.log(`- 邮箱: ${user.email}`);
          console.log(`- 学号: ${user.student_id}`);
          console.log(`- 角色: ${user.role || '未设置'}`);
          console.log(`- 信用分: ${user.credit_score}`);
          console.log(`- 专业: ${user.major || '未设置'}`);
          console.log(`- 年级: ${user.grade || '未设置'}`);
          console.log(`- 手机: ${user.phone_number || '未设置'}`);
          console.log(`- 简介: ${user.bio || '未设置'}`);
        });
      } else {
        console.log('⚠️ 用户表为空，没有用户数据');
      }
    } else {
      console.log('❌ users表不存在！');
    }
    
  } catch (error) {
    console.error('❌ 检查用户表时出错:', error);
  } finally {
    await client.end();
    console.log('\n数据库连接已关闭');
  }
}

checkUsers(); 