import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/typeorm.config';
import { User } from '../entities/user.entity';

// 扩展Request类型以包含user字段
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  // 检查Authorization请求头
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 获取token
      token = req.headers.authorization.split(' ')[1];

      // 验证token
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);

      // 将用户信息添加到req对象中（不含密码）
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ 
        where: { id: decoded.id }
      });

      if (!user) {
        res.status(401).json({ message: '未授权，用户不存在' });
        return;
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Token verification failed:', error);
      res.status(401).json({ message: '未授权，token验证失败' });
      return;
    }
  }

  if (!token) {
    res.status(401).json({ message: '未授权，缺少token' });
    return;
  }
}; 