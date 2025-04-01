import 'reflect-metadata';
import { AppDataSource } from '../config/typeorm.config';
import { StudyRoom } from '../entities/study-room.entity';

/**
 * 更新自习室状态脚本
 * 该脚本将大部分自习室状态设置为'available'，
 * 并保留少数室为'maintenance'状态作为演示。
 */
async function updateRoomStatus() {
  try {
    // 初始化数据库连接
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    console.log('数据库连接成功，开始更新自习室状态...');
    
    // 获取所有自习室
    const roomRepository = AppDataSource.getRepository(StudyRoom);
    const rooms = await roomRepository.find();
    
    console.log(`找到 ${rooms.length} 个自习室`);
    console.log('更新前状态统计:');
    const beforeStats: Record<string, number> = {
      available: 0,
      maintenance: 0,
      closed: 0
    };
    
    rooms.forEach(room => {
      beforeStats[room.status] = (beforeStats[room.status] || 0) + 1;
    });
    
    console.log('- available:', beforeStats.available);
    console.log('- maintenance:', beforeStats.maintenance);
    console.log('- closed:', beforeStats.closed);
    
    // 将大部分自习室设置为available，保留少数为maintenance或closed
    const roomsToUpdate = [];
    
    for (let i = 0; i < rooms.length; i++) {
      const room = rooms[i];
      
      // 将B301设为维护中
      if (room.room_number === 'B301') {
        room.status = 'maintenance';
      }
      // 将E301设为已关闭
      else if (room.room_number === 'E301') {
        room.status = 'closed';
      }
      // 其他所有自习室设为可用
      else {
        room.status = 'available';
      }
      
      roomsToUpdate.push(room);
    }
    
    // 批量更新自习室状态
    await roomRepository.save(roomsToUpdate);
    
    // 验证更新结果
    const updatedRooms = await roomRepository.find();
    console.log('更新后状态统计:');
    const afterStats: Record<string, number> = {
      available: 0,
      maintenance: 0,
      closed: 0
    };
    
    updatedRooms.forEach(room => {
      afterStats[room.status] = (afterStats[room.status] || 0) + 1;
    });
    
    console.log('- available:', afterStats.available);
    console.log('- maintenance:', afterStats.maintenance);
    console.log('- closed:', afterStats.closed);
    
    console.log('自习室状态更新成功!');
    process.exit(0);
  } catch (error) {
    console.error('更新过程中出现错误:', error);
    process.exit(1);
  }
}

// 执行更新
updateRoomStatus(); 