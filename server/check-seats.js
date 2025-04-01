require('dotenv').config();
const { Client } = require('pg');

async function checkSeats() {
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
    
    // 获取所有自习室
    const roomsResult = await client.query('SELECT * FROM study_rooms ORDER BY room_number');
    console.log(`找到 ${roomsResult.rows.length} 个自习室:`);
    
    // 获取所有座位
    const seatsResult = await client.query('SELECT COUNT(*) as total FROM seats');
    console.log(`总共有 ${seatsResult.rows[0].total} 个座位`);
    
    // 检查每个自习室的座位
    for (const room of roomsResult.rows) {
      const roomSeats = await client.query(
        'SELECT COUNT(*) as count FROM seats WHERE room_id = $1', 
        [room.id]
      );
      
      console.log(`自习室 ${room.room_number} (${room.status}): ${roomSeats.rows[0].count}/${room.capacity} 个座位`);
      
      // 如果座位数量为0，提示可能需要创建座位
      if (roomSeats.rows[0].count === 0) {
        console.log(`  警告: 自习室 ${room.room_number} 没有座位数据!`);
      } else if (roomSeats.rows[0].count < room.capacity) {
        console.log(`  注意: 自习室 ${room.room_number} 座位数量(${roomSeats.rows[0].count})小于容量(${room.capacity})`);
      }
    }
    
    // 检查各自习室状态
    const statusResult = await client.query(
      "SELECT status, COUNT(*) FROM study_rooms GROUP BY status"
    );
    console.log("\n自习室状态统计:");
    statusResult.rows.forEach(row => {
      console.log(`- ${row.status}: ${row.count} 个`);
    });

  } catch (err) {
    console.error('查询失败:', err);
  } finally {
    await client.end();
    console.log('数据库连接已关闭');
  }
}

checkSeats(); 