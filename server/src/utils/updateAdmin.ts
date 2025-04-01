import 'reflect-metadata';
import { AppDataSource } from '../config/typeorm.config';
import { User } from '../entities/user.entity';

async function updateAdmin() {
  try {
    // 初始化数据库连接
    await AppDataSource.initialize();
    console.log('数据库连接成功，开始更新管理员...');
    
    const userRepository = AppDataSource.getRepository(User);
    
    // 查找邮箱为admin@example.com的用户
    const adminUser = await userRepository.findOne({ 
      where: { email: 'admin@example.com' } 
    });
    
    if (!adminUser) {
      console.log('未找到管理员用户！');
      process.exit(1);
    }
    
    // 更新管理员角色
    adminUser.role = 'admin';
    await userRepository.save(adminUser);
    
    console.log('管理员用户已成功更新为admin角色！');
    process.exit(0);
  } catch (error) {
    console.error('更新过程中出现错误:', error);
    process.exit(1);
  }
}

updateAdmin(); 