import 'reflect-metadata';
import { AppDataSource } from '../config/typeorm.config';
import { User } from '../entities/user.entity';

// 要提升为管理员的用户邮箱
const emailToPromote = process.argv[2];

if (!emailToPromote) {
  console.error('请提供要提升为管理员的用户邮箱。');
  console.error('示例: npm run promote-admin your.email@example.com');
  process.exit(1);
}

async function promoteToAdmin() {
  try {
    // 初始化数据库连接
    await AppDataSource.initialize();
    console.log(`数据库连接成功，开始将用户 ${emailToPromote} 提升为管理员...`);
    
    const userRepository = AppDataSource.getRepository(User);
    
    // 查找指定邮箱的用户
    const user = await userRepository.findOne({ 
      where: { email: emailToPromote } 
    });
    
    if (!user) {
      console.log(`未找到邮箱为 ${emailToPromote} 的用户！`);
      process.exit(1);
    }
    
    // 更新用户角色为管理员
    user.role = 'admin';
    await userRepository.save(user);
    
    console.log(`用户 ${emailToPromote} 已成功提升为管理员！`);
    process.exit(0);
  } catch (error) {
    console.error('提升过程中出现错误:', error);
    process.exit(1);
  }
}

promoteToAdmin(); 