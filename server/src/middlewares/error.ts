import { Request, Response, NextFunction } from 'express';
import { EntityNotFoundError, QueryFailedError } from 'typeorm';

interface ErrorResponse extends Error {
  statusCode?: number;
  code?: string;
  detail?: string;
}

// 捕获异步错误的中间件
export const asyncHandler = (fn: Function) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 错误处理中间件
export const errorHandler = (
  err: ErrorResponse,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;

  // 记录错误日志
  console.error(err);

  // TypeORM 错误处理
  // 实体未找到错误
  if (err instanceof EntityNotFoundError) {
    const message = '未找到请求的资源';
    error = new Error(message) as ErrorResponse;
    error.statusCode = 404;
  }

  // 查询失败错误（通常是约束冲突）
  if (err instanceof QueryFailedError) {
    let message = '数据库操作失败';
    
    // PostgreSQL 唯一约束冲突
    if (err.message.includes('duplicate key') || err.message.includes('UNIQUE constraint failed')) {
      message = '该记录已存在，无法创建重复数据';
      error.statusCode = 400;
    }

    // PostgreSQL 外键约束失败
    if (err.message.includes('FOREIGN KEY constraint failed')) {
      message = '引用的相关数据不存在';
      error.statusCode = 400;
    }

    error = new Error(message) as ErrorResponse;
    if (!error.statusCode) error.statusCode = 400;
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || '服务器错误',
  });
}; 