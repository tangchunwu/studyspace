import 'reflect-metadata';
import { AppDataSource } from '../config/typeorm.config';
import { User } from '../entities/user.entity';
import bcrypt from 'bcrypt';

async function resetAdminPassword() {
  try {
    // 初始化数据库连接
    await AppDataSource.initialize();
    console.log('数据库连接成功，开始重置管理员密码...');
    
    const userRepository = AppDataSource.getRepository(User);
    
    // 查找邮箱为admin@example.com的用户
    const adminUser = await userRepository.findOne({ 
      where: { email: 'admin@example.com' }
    });
    
    if (!adminUser) {
      console.log('未找到管理员用户！');
      process.exit(1);
    }

    // 检查用户是否被禁用
    if (adminUser.is_disabled) {
      console.log('管理员账号当前处于禁用状态，正在启用...');
      adminUser.is_disabled = false;
    }
    
    // 重置管理员密码
    const salt = await bcrypt.genSalt(10);
    adminUser.password = await bcrypt.hash('password123', salt);
    adminUser.role = 'admin'; // 确保角色为admin
    
    await userRepository.save(adminUser);
    
    console.log('管理员密码已成功重置为password123！');
    console.log('管理员信息：', {
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      is_disabled: adminUser.is_disabled
    });
    
    process.exit(0);
  } catch (error) {
    console.error('重置过程中出现错误:', error);
    process.exit(1);
  }
}

resetAdminPassword(); 