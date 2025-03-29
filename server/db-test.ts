import 'reflect-metadata';
import { Client } from 'pg';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

async function testConnection() {
  console.log('尝试连接到PostgreSQL数据库...');
  
  // 使用.env中的配置信息
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    database: 'postgres', // 先连接到默认数据库
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '212150'
  };
  
  console.log(`连接参数: 主机=${dbConfig.host}, 端口=${dbConfig.port}, 用户=${dbConfig.user}`);
  
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('成功连接到PostgreSQL数据库!');
    
    // 检查数据库列表
    const result = await client.query(`
      SELECT datname FROM pg_database WHERE datistemplate = false;
    `);
    
    console.log('现有数据库列表:');
    result.rows.forEach(row => {
      console.log(`- ${row.datname}`);
    });
    
    // 检查studyspace数据库是否存在
    const studyspaceExists = result.rows.some(row => row.datname === 'studyspace');
    
    if (!studyspaceExists) {
      console.log('studyspace数据库不存在，尝试创建...');
      try {
        await client.query(`
          CREATE DATABASE studyspace
          WITH OWNER = postgres
          ENCODING = 'UTF8';
        `);
        console.log('studyspace数据库创建成功!');
      } catch (createErr: any) {
        console.error('创建数据库失败:', createErr.message);
      }
    } else {
      console.log('studyspace数据库已存在');
    }
    
    await client.end();
    console.log('数据库连接已关闭');
    
    return true;
  } catch (error: any) {
    console.error('数据库连接失败:', error.message);
    try {
      await client.end();
    } catch (e) {
      // 忽略关闭连接时的错误
    }
    return false;
  }
}

testConnection(); 