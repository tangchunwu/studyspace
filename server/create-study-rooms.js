require('dotenv').config();
const { Client } = require('pg');

async function createStudyRooms() {
  console.log('开始创建自习室和座位数据...');
  
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
    
    // 确保uuid扩展已启用
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      console.log('UUID扩展已启用');
    } catch (error) {
      console.error('启用UUID扩展失败:', error.message);
      return;
    }
    
    // 检查自习室表是否有数据
    const roomCountResult = await client.query('SELECT COUNT(*) FROM study_rooms');
    const roomCount = parseInt(roomCountResult.rows[0].count);
    
    if (roomCount > 0) {
      console.log(`自习室表已有 ${roomCount} 条数据，跳过创建`);
    } else {
      console.log('自习室表为空，开始创建自习室数据...');
      
      // 创建自习室数据
      const studyRoomsData = [
        // 主校区 - 图书馆
        {
          room_number: 'A101',
          capacity: 20,
          status: 'available',
          location: '主校区 - 图书馆一楼',
          description: '安静明亮的自习环境，靠近参考书区'
        },
        {
          room_number: 'A102',
          capacity: 25,
          status: 'available',
          location: '主校区 - 图书馆一楼',
          description: '配备电源插座的自习区域，适合使用笔记本电脑'
        },
        {
          room_number: 'A201',
          capacity: 30,
          status: 'available',
          location: '主校区 - 图书馆二楼',
          description: '宽敞舒适的学习空间，有落地窗，光线充足'
        },
        {
          room_number: 'A202',
          capacity: 15,
          status: 'available',
          location: '主校区 - 图书馆二楼',
          description: '小型讨论室，适合小组学习'
        },
        {
          room_number: 'A301',
          capacity: 40,
          status: 'available',
          location: '主校区 - 图书馆三楼',
          description: '大型自习室，配有空调和暖气'
        },
        
        // 主校区 - 教学楼
        {
          room_number: 'B101',
          capacity: 50,
          status: 'available',
          location: '主校区 - 教学楼一号楼',
          description: '教室改造的自习室，座位宽敞'
        },
        {
          room_number: 'B201',
          capacity: 30,
          status: 'available',
          location: '主校区 - 教学楼二号楼',
          description: '配有投影仪，适合小组讨论和演示'
        },
        {
          room_number: 'B301',
          capacity: 15,
          status: 'maintenance',
          location: '主校区 - 教学楼三号楼',
          description: '正在维护中，预计下周开放'
        },
        
        // 东校区
        {
          room_number: 'E101',
          capacity: 35,
          status: 'available',
          location: '东校区 - 综合楼一楼',
          description: '新装修的自习室，环境优雅'
        },
        {
          room_number: 'E201',
          capacity: 25,
          status: 'available',
          location: '东校区 - 综合楼二楼',
          description: '配有饮水机和休息区'
        },
        {
          room_number: 'E301',
          capacity: 20,
          status: 'closed',
          location: '东校区 - 综合楼三楼',
          description: '临时关闭，进行设备更新'
        },
        
        // 南校区
        {
          room_number: 'S101',
          capacity: 40,
          status: 'available',
          location: '南校区 - 图书馆',
          description: '24小时开放的自习室，需提前预约'
        },
        {
          room_number: 'S201',
          capacity: 30,
          status: 'available',
          location: '南校区 - 学生中心',
          description: '配有咖啡厅，学习氛围浓厚'
        }
      ];
      
      for (const roomData of studyRoomsData) {
        // 插入自习室
        const insertRoomQuery = `
          INSERT INTO study_rooms (
            id, room_number, capacity, status, location, description, created_at
          ) VALUES (
            uuid_generate_v4(), $1, $2, $3, $4, $5, NOW()
          ) RETURNING id, room_number`;
        
        const roomResult = await client.query(insertRoomQuery, [
          roomData.room_number,
          roomData.capacity,
          roomData.status,
          roomData.location,
          roomData.description
        ]);
        
        const roomId = roomResult.rows[0].id;
        const roomNumber = roomResult.rows[0].room_number;
        
        console.log(`创建自习室 ${roomNumber} 成功，ID: ${roomId}`);
        
        // 为每个自习室创建座位
        console.log(`为自习室 ${roomNumber} 创建 ${roomData.capacity} 个座位...`);
        
        for (let i = 1; i <= roomData.capacity; i++) {
          const seatNumber = `${roomNumber}-${i.toString().padStart(2, '0')}`;
          
          const insertSeatQuery = `
            INSERT INTO seats (
              id, room_id, seat_number, is_available, created_at
            ) VALUES (
              uuid_generate_v4(), $1, $2, true, NOW()
            )`;
          
          await client.query(insertSeatQuery, [roomId, seatNumber]);
        }
        
        console.log(`自习室 ${roomNumber} 的座位创建完成`);
      }
      
      console.log('所有自习室和座位数据创建完成');
    }
    
    // 检查座位表是否有数据
    const seatCountResult = await client.query('SELECT COUNT(*) FROM seats');
    const seatCount = parseInt(seatCountResult.rows[0].count);
    
    console.log(`系统中共有 ${roomCount} 个自习室和 ${seatCount} 个座位`);
    
  } catch (error) {
    console.error('创建自习室和座位数据失败:', error);
  } finally {
    await client.end();
    console.log('数据库连接已关闭');
  }
}

createStudyRooms(); 