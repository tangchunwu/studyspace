import 'reflect-metadata';
import { AppDataSource } from '../config/typeorm.config';
import { StudyRoom } from '../entities/study-room.entity';
import { Seat } from '../entities/seat.entity';
import { User } from '../entities/user.entity';
import bcrypt from 'bcrypt';

async function seedData() {
  try {
    // 初始化数据库连接
    await AppDataSource.initialize();
    console.log('数据库连接成功，开始填充数据...');
    
    // 创建测试用户
    const adminUser = new User();
    adminUser.email = 'admin@example.com';
    adminUser.student_id = '20250001';
    adminUser.name = '管理员';
    adminUser.password = await bcrypt.hash('password123', 10);
    adminUser.credit_score = 100;
    
    const testUser = new User();
    testUser.email = 'user@example.com';
    testUser.student_id = '20250002';
    testUser.name = '测试用户';
    testUser.password = await bcrypt.hash('password123', 10);
    testUser.credit_score = 100;
    
    await AppDataSource.manager.save([adminUser, testUser]);
    console.log('创建测试用户成功');
    
    // 创建自习室
    const room1 = new StudyRoom();
    room1.room_number = 'A101';
    room1.capacity = 20;
    room1.status = 'available';
    room1.location = '图书馆一楼';
    room1.description = '安静明亮的自习环境';
    
    const room2 = new StudyRoom();
    room2.room_number = 'B201';
    room2.capacity = 30;
    room2.status = 'available';
    room2.location = '图书馆二楼';
    room2.description = '宽敞舒适的学习空间';
    
    const room3 = new StudyRoom();
    room3.room_number = 'C301';
    room3.capacity = 15;
    room3.status = 'maintenance';
    room3.location = '教学楼三楼';
    room3.description = '正在维护中';
    
    await AppDataSource.manager.save([room1, room2, room3]);
    console.log('创建自习室成功');
    
    // 为自习室添加座位
    const createSeatsForRoom = async (room: StudyRoom, count: number) => {
      const seats: Seat[] = [];
      for (let i = 1; i <= count; i++) {
        const seat = new Seat();
        seat.room = room;
        seat.seat_number = `${room.room_number}-${i.toString().padStart(2, '0')}`;
        seat.is_available = true;
        seats.push(seat);
      }
      await AppDataSource.manager.save(seats);
      console.log(`为自习室 ${room.room_number} 创建了 ${count} 个座位`);
    };
    
    await createSeatsForRoom(room1, 20);
    await createSeatsForRoom(room2, 30);
    await createSeatsForRoom(room3, 15);
    
    console.log('数据填充完成!');
    process.exit(0);
  } catch (error) {
    console.error('数据填充过程中出现错误:', error);
    process.exit(1);
  }
}

seedData(); 