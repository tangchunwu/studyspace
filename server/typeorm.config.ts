import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量
dotenv.config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'studyspace',
  entities: [path.join(__dirname, './src/entities/**/*.entity.{ts,js}')],
  migrations: [path.join(__dirname, './src/migrations/**/*.{ts,js}')],
  subscribers: [path.join(__dirname, './src/subscribers/**/*.{ts,js}')],
  synchronize: true,
  logging: process.env.NODE_ENV === 'development',
}); 