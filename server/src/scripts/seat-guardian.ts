import { AppDataSource } from '../config/typeorm.config';
import { StudyRoom } from '../entities/study-room.entity';
import { Seat } from '../entities/seat.entity';

/**
 * 座位守护进程
 * 检查所有自习室是否都有对应的座位，如果没有则自动创建
 */
async function seatGuardian() {
  try {
    console.log('启动座位守护进程...');
    
    // 初始化数据库连接
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('数据库连接已初始化');
    }
    
    const roomRepository = AppDataSource.getRepository(StudyRoom);
    const seatRepository = AppDataSource.getRepository(Seat);
    
    // 获取所有自习室
    const rooms = await roomRepository.find({
      order: { room_number: 'ASC' }
    });
    
    console.log(`发现 ${rooms.length} 个自习室`);
    
    // 统计各状态自习室
    const availableRooms = rooms.filter(room => room.status === 'available').length;
    const maintenanceRooms = rooms.filter(room => room.status === 'maintenance').length;
    const closedRooms = rooms.filter(room => room.status === 'closed').length;
    
    console.log(`自习室状态: ${availableRooms} 个可用, ${maintenanceRooms} 个维护中, ${closedRooms} 个已关闭`);
    
    // 检查每个自习室的座位
    for (const room of rooms) {
      // 获取该自习室已有的座位数量
      const existingSeats = await seatRepository.count({
        where: { room: { id: room.id } }
      });
      
      console.log(`自习室 ${room.room_number} (${room.status}): 已有 ${existingSeats}/${room.capacity} 个座位`);
      
      // 如果座位数量不足，创建新座位
      if (existingSeats < room.capacity) {
        console.log(`为自习室 ${room.room_number} 创建 ${room.capacity - existingSeats} 个新座位`);
        
        // 获取当前最大座位号
        let maxSeatNumber = 0;
        if (existingSeats > 0) {
          const lastSeat = await seatRepository.findOne({
            where: { room: { id: room.id } },
            order: { seat_number: 'DESC' }
          });
          
          if (lastSeat) {
            const lastNumber = parseInt(lastSeat.seat_number.split('-')[1]);
            if (!isNaN(lastNumber)) {
              maxSeatNumber = lastNumber;
            }
          }
        }
        
        // 创建新座位
        const newSeats: Seat[] = [];
        
        for (let i = 1; i <= room.capacity - existingSeats; i++) {
          const seatNumber = maxSeatNumber + i;
          const seat = new Seat();
          seat.room = room;
          seat.seat_number = `${room.room_number}-${seatNumber.toString().padStart(2, '0')}`;
          seat.is_available = true;
          
          newSeats.push(seat);
        }
        
        // 批量保存新座位
        await seatRepository.save(newSeats);
        console.log(`已为自习室 ${room.room_number} 添加 ${newSeats.length} 个新座位`);
      }
    }
    
    console.log('座位守护进程完成');
    
    // 检查完成后关闭数据库连接
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('数据库连接已关闭');
    }
    
    return { success: true, message: '座位检查并修复完成' };
  } catch (error: any) {
    console.error('座位守护进程错误:', error);
    
    // 确保关闭数据库连接
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    
    return { 
      success: false, 
      message: error && typeof error.message === 'string' 
        ? error.message 
        : '执行座位守护进程时发生未知错误' 
    };
  }
}

// 如果直接运行此脚本，则执行座位守护进程
if (require.main === module) {
  seatGuardian()
    .then(result => {
      console.log('执行结果:', result);
      
      // 正常退出
      process.exit(0);
    })
    .catch(error => {
      console.error('执行失败:', error);
      
      // 错误退出
      process.exit(1);
    });
}

export default seatGuardian; 