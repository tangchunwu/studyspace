import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/error';
import { AppDataSource } from '../config/typeorm.config';
import { User } from '../entities/user.entity';

// @desc    获取所有用户
// @route   GET /api/users
// @access  Admin
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  // 检查是否为管理员
  if (req.user.role !== 'admin') {
    res.status(403).json({ message: '没有权限访问此资源' });
    return;
  }
  
  const userRepository = AppDataSource.getRepository(User);
  
  // 获取所有用户，按创建时间降序排序
  const users = await userRepository.find({
    order: {
      created_at: 'DESC'
    }
  });
  
  // 返回用户列表，不包含密码字段
  res.json(users);
});

// @desc    获取单个用户详情
// @route   GET /api/users/:id
// @access  Admin
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  // 检查是否为管理员
  if (req.user.role !== 'admin') {
    res.status(403).json({ message: '没有权限访问此资源' });
    return;
  }
  
  const userRepository = AppDataSource.getRepository(User);
  
  const user = await userRepository.findOne({
    where: { id: req.params.id }
  });
  
  if (!user) {
    res.status(404).json({ message: '用户不存在' });
    return;
  }
  
  res.json(user);
});

// @desc    切换用户禁用状态
// @route   PUT /api/users/:id/toggle-status
// @access  Admin
export const toggleUserStatus = asyncHandler(async (req: Request, res: Response) => {
  // 检查是否为管理员
  if (req.user.role !== 'admin') {
    res.status(403).json({ message: '没有权限访问此资源' });
    return;
  }
  
  const { is_disabled } = req.body;
  
  if (is_disabled === undefined) {
    res.status(400).json({ message: '缺少is_disabled参数' });
    return;
  }
  
  const userRepository = AppDataSource.getRepository(User);
  
  // 查找用户
  const user = await userRepository.findOne({
    where: { id: req.params.id }
  });
  
  if (!user) {
    res.status(404).json({ message: '用户不存在' });
    return;
  }
  
  // 不允许管理员禁用自己的账号
  if (user.id === req.user.id && is_disabled) {
    res.status(400).json({ message: '不能禁用自己的账号' });
    return;
  }
  
  // 更新用户状态
  user.is_disabled = is_disabled;
  await userRepository.save(user);
  
  res.json({ 
    message: is_disabled ? '账号已禁用' : '账号已启用',
    user 
  });
}); 