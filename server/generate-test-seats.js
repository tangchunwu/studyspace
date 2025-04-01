require('dotenv').config();
const { Client } = require('pg');

async function generateTestSeats() {
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
    const roomsResult = await client.query('SELECT * FROM study_rooms');
    console.log(`找到 ${roomsResult.rows.length} 个自习室`);
    
    for (const room of roomsResult.rows) {
      // 检查该自习室是否已有座位
      const existingSeatsResult = await client.query('SELECT COUNT(*) FROM seats WHERE room_id = $1', [room.id]);
      const existingSeatsCount = parseInt(existingSeatsResult.rows[0].count);
      
      if (existingSeatsCount > 0) {
        console.log(`自习室 ${room.room_number} 已有 ${existingSeatsCount} 个座位，跳过`);
        continue;
      }
      
      // 为该自习室创建座位
      console.log(`为自习室 ${room.room_number} 创建座位...`);
      
      // 创建座位时根据自习室编号决定座位号格式
      let seatFormat = `${room.room_number}-`;
      let seatsToCreate = Math.min(room.capacity, 50); // 最多创建50个座位作为测试
      
      for (let i = 1; i <= seatsToCreate; i++) {
        const seatNumber = `${seatFormat}${i.toString().padStart(2, '0')}`;
        
        await client.query(
          'INSERT INTO seats (id, room_id, seat_number, is_available, created_at) VALUES (gen_random_uuid(), $1, $2, true, NOW())',
          [room.id, seatNumber]
        );
      }
      
      console.log(`为自习室 ${room.room_number} 创建了 ${seatsToCreate} 个座位`);
    }
    
    console.log('座位生成完成');
    
    // 验证每个自习室的座位数
    const verifyQuery = `
      SELECT r.room_number, r.capacity, COUNT(s.id) as seat_count
      FROM study_rooms r
      LEFT JOIN seats s ON r.id = s.room_id
      GROUP BY r.id, r.room_number, r.capacity
      ORDER BY r.room_number
    `;
    
    const verifyResult = await client.query(verifyQuery);
    
    console.log('\n座位数验证结果:');
    console.log('自习室号\t容量\t座位数');
    console.log('------------------------');
    
    verifyResult.rows.forEach(row => {
      console.log(`${row.room_number}\t${row.capacity}\t${row.seat_count}`);
    });
    
  } catch (err) {
    console.error('生成座位数据失败:', err);
  } finally {
    await client.end();
    console.log('数据库连接已关闭');
  }
}

generateTestSeats(); 