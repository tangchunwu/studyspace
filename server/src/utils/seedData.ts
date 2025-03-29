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
    adminUser.role = 'admin';
    
    const testUser = new User();
    testUser.email = 'user@example.com';
    testUser.student_id = '20250002';
    testUser.name = '测试用户';
    testUser.password = await bcrypt.hash('password123', 10);
    testUser.credit_score = 100;
    testUser.role = 'user';
    
    await AppDataSource.manager.save([adminUser, testUser]);
    console.log('创建测试用户成功');
    
    // 创建自习室
    const studyRooms = [
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
    
    const roomEntities = studyRooms.map(roomData => {
      const room = new StudyRoom();
      room.room_number = roomData.room_number;
      room.capacity = roomData.capacity;
      room.status = roomData.status as 'available' | 'maintenance' | 'closed';
      room.location = roomData.location;
      room.description = roomData.description;
      return room;
    });
    
    await AppDataSource.manager.save(roomEntities);
    console.log(`创建了 ${roomEntities.length} 个自习室`);
    
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
    
    // 为每个自习室创建座位
    for (const room of roomEntities) {
      await createSeatsForRoom(room, room.capacity);
    }
    
    console.log('数据填充完成!');
    process.exit(0);
  } catch (error) {
    console.error('数据填充过程中出现错误:', error);
    process.exit(1);
  }
}

seedData(); 