// 服务器连接测试脚本
import axios from 'axios';

async function testServerConnection() {
  console.log('开始测试后端API连接...');
  const API_URL = 'http://localhost:3002/api';
  
  try {
    // 测试连接
    console.log('1. 测试基本API连接');
    const healthCheck = await axios.get(`${API_URL}/auth/health`);
    console.log(`✅ API健康检查: ${healthCheck.status} ${JSON.stringify(healthCheck.data)}`);
    
    // 获取自习室列表
    console.log('\n2. 获取自习室列表');
    const roomsResponse = await axios.get(`${API_URL}/rooms`);
    console.log(`✅ 获取到 ${roomsResponse.data.length} 个自习室`);
    
    // 打印所有自习室的基本信息供调试
    if (roomsResponse.data && roomsResponse.data.length > 0) {
      console.log('所有自习室:');
      roomsResponse.data.forEach((room, index) => {
        console.log(`  ${index + 1}. ${room.room_number} (${room.id}) - ${room.status}`);
      });
    }
    
    // 选择所有状态为available的自习室，并获取第一个
    const availableRooms = roomsResponse.data ? roomsResponse.data.filter(room => room.status === 'available') : [];
    if (availableRooms.length > 0) {
      const testRoom = availableRooms[0];
      console.log(`\n3. 获取可用自习室详情: ${testRoom.room_number} (${testRoom.id})`);
      
      try {
        const roomDetailsResponse = await axios.get(`${API_URL}/rooms/${testRoom.id}`);
        console.log(`✅ 自习室详情:`, {
          id: roomDetailsResponse.data.id,
          room_number: roomDetailsResponse.data.room_number,
          capacity: roomDetailsResponse.data.capacity,
          status: roomDetailsResponse.data.status,
          seats: roomDetailsResponse.data.seats ? roomDetailsResponse.data.seats.length : 0
        });
        
        // 检查是否有座位数据
        if (roomDetailsResponse.data.seats && roomDetailsResponse.data.seats.length > 0) {
          console.log(`✅ 座位数据: 总共 ${roomDetailsResponse.data.seats.length} 个座位`);
          console.log('前5个座位:');
          roomDetailsResponse.data.seats.slice(0, 5).forEach(seat => {
            console.log(`  - ${seat.seat_number} (${seat.id}): ${seat.is_available ? '可用' : '不可用'}`);
          });
        } else {
          console.log('❌ 没有获取到座位数据!');
          
          // 尝试专门获取座位数据
          console.log('\n3.1 尝试通过专门的座位API获取数据');
          try {
            const seatsResponse = await axios.get(`${API_URL}/rooms/${testRoom.id}/seats`);
            console.log(`✅ 通过专门API获取到 ${seatsResponse.data.length} 个座位`);
            if (seatsResponse.data.length > 0) {
              console.log('前5个座位示例:');
              seatsResponse.data.slice(0, 5).forEach(seat => {
                console.log(`  - ${seat.seat_number} (${seat.id}): ${seat.is_available ? '可用' : '不可用'}`);
              });
            }
          } catch (seatsError) {
            console.log('❌ 座位API调用失败:', seatsError.message);
          }
        }
      } catch (roomError) {
        console.log('❌ 获取自习室详情失败:', roomError.message);
        if (roomError.response) {
          console.log('状态码:', roomError.response.status);
          console.log('错误数据:', roomError.response.data);
        }
      }
    } else {
      console.log('\n没有找到状态为available的自习室，尝试获取第一个自习室的详情');
      if (roomsResponse.data && roomsResponse.data.length > 0) {
        const firstRoom = roomsResponse.data[0];
        console.log(`\n3. 获取自习室详情: ${firstRoom.room_number} (${firstRoom.id})`);
        
        try {
          const roomDetailsResponse = await axios.get(`${API_URL}/rooms/${firstRoom.id}`);
          console.log(`✅ 自习室详情:`, {
            id: roomDetailsResponse.data.id,
            room_number: roomDetailsResponse.data.room_number,
            seats: roomDetailsResponse.data.seats ? roomDetailsResponse.data.seats.length : 0
          });
        } catch (roomError) {
          console.log('❌ 获取自习室详情失败:', roomError.message);
        }
      }
    }
    
    console.log('\n测试完成!');
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testServerConnection(); 