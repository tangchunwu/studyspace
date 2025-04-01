require('dotenv').config();
const { Client } = require('pg');

async function testDatabaseConnection() {
  console.log('测试数据库连接...');
  console.log('数据库配置:', {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    database: process.env.DB_NAME || 'studyspace',
    password: '******' // 隐藏密码
  });

  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'studyspace'
  });

  try {
    await client.connect();
    console.log('✅ 数据库连接成功!');
    
    // 测试查询自习室数据
    console.log('查询自习室数据...');
    const roomsResult = await client.query('SELECT * FROM study_rooms');
    console.log(`发现 ${roomsResult.rows.length} 个自习室`);
    
    // 测试查询座位数据
    console.log('查询座位数据...');
    const seatsResult = await client.query('SELECT COUNT(*) as total FROM seats');
    console.log(`发现总共 ${seatsResult.rows[0].total} 个座位`);
    
    // 查询每个自习室的座位数量
    console.log('\n每个自习室的座位数量:');
    const roomSeatsQuery = `
      SELECT r.room_number, r.capacity, COUNT(s.id) as seat_count
      FROM study_rooms r
      LEFT JOIN seats s ON r.id = s.room_id
      GROUP BY r.room_number, r.capacity
      ORDER BY r.room_number
    `;
    
    const roomSeatsResult = await client.query(roomSeatsQuery);
    roomSeatsResult.rows.forEach(row => {
      const percentage = (row.seat_count / row.capacity * 100).toFixed(0);
      console.log(`- ${row.room_number}: ${row.seat_count}/${row.capacity} 座位 (${percentage}%)`);
    });
    
    // 查询预约数量
    const reservationsResult = await client.query('SELECT COUNT(*) FROM reservations');
    console.log(`\n总共 ${reservationsResult.rows[0].count} 个预约记录`);
    
  } catch (error) {
    console.error('❌ 数据库连接或查询失败:', error);
  } finally {
    await client.end();
    console.log('数据库连接已关闭');
  }
}

testDatabaseConnection(); 