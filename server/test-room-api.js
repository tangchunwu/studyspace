require('dotenv').config();
const axios = require('axios');
const { Client } = require('pg');

// 创建一个http客户端
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

async function testRoomAPI() {
  console.log('开始测试自习室API...');
  
  try {
    // 1. 连接数据库以获取用户信息
    const client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      user: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'studyspace'
    });
    
    await client.connect();
    console.log('数据库连接成功');
    
    // 获取admin用户信息
    const adminResult = await client.query(`
      SELECT * FROM users WHERE email = 'admin@example.com' LIMIT 1
    `);
    
    if (adminResult.rows.length === 0) {
      throw new Error('找不到管理员用户');
    }
    
    const admin = adminResult.rows[0];
    console.log('获取到管理员用户:', admin.name, admin.email);
    
    // 2. 登录获取token
    console.log('尝试登录...');
    const loginResponse = await api.post('/auth/login', {
      email: 'admin@example.com',
      password: 'admin12345'
    });
    
    const { token } = loginResponse.data;
    console.log('登录成功，获取到token');
    
    // 3. 设置认证头
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // 4. 获取所有自习室
    console.log('获取所有自习室...');
    const roomsResponse = await api.get('/rooms');
    const rooms = roomsResponse.data;
    
    console.log(`成功获取到 ${rooms.length} 个自习室:`);
    rooms.forEach(room => {
      console.log(`- 自习室 ${room.room_number}: ${room.location}, 容量: ${room.capacity}, 可用座位: ${room.available_seats}`);
    });
    
    // 如果有自习室，测试获取单个自习室详情
    if (rooms.length > 0) {
      const firstRoom = rooms[0];
      console.log(`获取自习室 ${firstRoom.room_number} 的详情...`);
      
      const roomDetailResponse = await api.get(`/rooms/${firstRoom.id}`);
      const roomDetail = roomDetailResponse.data;
      
      console.log('自习室详情:', {
        id: roomDetail.id,
        room_number: roomDetail.room_number,
        capacity: roomDetail.capacity,
        status: roomDetail.status,
        location: roomDetail.location,
        seats: roomDetail.seats?.length || 0
      });
      
      // 测试座位列表API
      console.log(`获取自习室 ${firstRoom.room_number} 的座位...`);
      const seatsResponse = await api.get(`/rooms/${firstRoom.id}/seats`);
      const seats = seatsResponse.data;
      
      console.log(`成功获取到 ${seats.length} 个座位`);
      // 输出前5个座位
      seats.slice(0, 5).forEach(seat => {
        console.log(`- 座位 ${seat.seat_number}: ${seat.is_available ? '可用' : '不可用'}`);
      });
    }
    
    console.log('自习室API测试完成，所有接口正常');
    
  } catch (error) {
    console.error('测试自习室API时出错:', error.message);
    if (error.response) {
      console.error('服务器响应:', {
        status: error.response.status,
        data: error.response.data
      });
    }
  }
}

testRoomAPI(); 