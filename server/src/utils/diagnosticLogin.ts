import 'reflect-metadata';
import { AppDataSource } from '../config/typeorm.config';
import { User } from '../entities/user.entity';
import bcrypt from 'bcrypt';

async function diagnosticLogin() {
  try {
    // 初始化数据库连接
    await AppDataSource.initialize();
    console.log('数据库连接成功，开始诊断登录...');
    
    const email = 'admin@example.com';
    const password = 'password123';
    
    console.log(`尝试使用email: ${email}, password: ${password} 登录`);
    
    const userRepository = AppDataSource.getRepository(User);
    
    // 直接尝试查找用户
    console.log('方法1: 使用findOne查找用户...');
    const user1 = await userRepository.findOne({ 
      where: { email },
      select: ['id', 'email', 'name', 'password', 'role'] // 显式选择password字段
    });
    
    if (user1) {
      console.log('用户存在! 信息:', {
        id: user1.id,
        email: user1.email,
        name: user1.name,
        role: user1.role,
        passwordExists: !!user1.password
      });
      
      if (user1.password) {
        const isMatch1 = await bcrypt.compare(password, user1.password);
        console.log(`密码匹配结果: ${isMatch1 ? '成功' : '失败'}`);
      } else {
        console.log('警告: password字段不存在');
      }
    } else {
      console.log('未找到用户(方法1)');
    }
    
    // 使用QueryBuilder查找用户
    console.log('\n方法2: 使用QueryBuilder查找用户...');
    const user2 = await userRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .addSelect('user.password') // 显式选择password字段
      .getOne();
    
    if (user2) {
      console.log('用户存在! 信息:', {
        id: user2.id,
        email: user2.email,
        name: user2.name,
        role: user2.role,
        passwordExists: !!user2.password
      });
      
      if (user2.password) {
        try {
          const isMatch2 = await bcrypt.compare(password, user2.password);
          console.log(`密码匹配结果: ${isMatch2 ? '成功' : '失败'}`);
          
          // 如果匹配失败，打印更多信息
          if (!isMatch2) {
            console.log('密码不匹配。数据库中的哈希值:', user2.password);
            
            // 创建一个新的哈希值进行比较
            const salt = await bcrypt.genSalt(10);
            const newHash = await bcrypt.hash(password, salt);
            console.log('新创建的哈希值:', newHash);
          }
        } catch (error) {
          console.error('密码比对过程出错:', error);
        }
      } else {
        console.log('警告: password字段不存在');
      }
    } else {
      console.log('未找到用户(方法2)');
    }
    
    // 尝试创建一个新的管理员用户
    console.log('\n尝试从头创建一个新的管理员用户...');
    try {
      // 首先检查是否已经存在同样邮箱的用户
      const existingUser = await userRepository.findOne({ where: { email: 'admin2@example.com' } });
      
      if (existingUser) {
        console.log('admin2@example.com 用户已存在，跳过创建');
      } else {
        // 创建新管理员用户
        const newAdmin = new User();
        newAdmin.email = 'admin2@example.com';
        newAdmin.student_id = '20250003';
        newAdmin.name = '新管理员';
        newAdmin.password = 'password123'; // 会在保存前自动哈希
        newAdmin.role = 'admin';
        
        await userRepository.save(newAdmin);
        console.log('成功创建新管理员用户:', {
          email: newAdmin.email,
          password: 'password123' // 明文密码
        });
      }
    } catch (error) {
      console.error('创建新管理员出错:', error);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('诊断过程中出现错误:', error);
    process.exit(1);
  }
}

diagnosticLogin(); 