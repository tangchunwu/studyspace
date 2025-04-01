import 'reflect-metadata';
import { AppDataSource } from '../config/typeorm.config';
import { exec } from 'child_process';
import { promisify } from 'util';
import { DataSource } from 'typeorm';

const execPromise = promisify(exec);

async function resetDatabase() {
  try {
    // 初始化数据库连接
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    console.log('数据库连接成功，开始重置数据库...');
    
    // 获取当前数据库连接配置
    const options = AppDataSource.options;
    
    // 关闭现有连接
    await AppDataSource.destroy();
    console.log('关闭现有数据库连接...');
    
    // 创建新的数据源配置，添加dropSchema选项
    const tempDataSource = new DataSource({
      ...options,
      dropSchema: true, // 添加这个选项以确保完全删除所有表和数据
      synchronize: true
    });
    
    // 初始化临时连接，这将删除所有表并重新创建
    await tempDataSource.initialize();
    console.log('数据库架构已重置，所有表都被删除并重新创建...');
    
    // 关闭临时连接
    await tempDataSource.destroy();
    console.log('临时连接已关闭...');
    
    // 重新初始化原始连接
    await AppDataSource.initialize();
    
    // 运行seed脚本填充数据
    console.log('开始填充数据...');
    try {
      await execPromise('npx ts-node src/utils/seedData.ts');
      console.log('数据填充成功！');
    } catch (seedError) {
      console.error('填充数据时出错:', seedError);
      console.error('尝试继续执行...');
    }
    
    console.log('数据库已成功重置和填充！');
    process.exit(0);
  } catch (error) {
    console.error('重置过程中出现错误:', error);
    process.exit(1);
  }
}

resetDatabase(); 