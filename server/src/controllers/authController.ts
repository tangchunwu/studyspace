import { Request, Response } from 'express';
import { User } from '../entities/user.entity';
import { AppDataSource } from '../config/typeorm.config';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../middlewares/error';

// 生成JWT Token
const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'studyspace_jwt_secret_key', {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
};

// @desc    用户注册
// @route   POST /api/auth/register
// @access  Public
export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name, student_id } = req.body;

  const userRepository = AppDataSource.getRepository(User);

  // 检查邮箱是否已存在
  const userExists = await userRepository.findOne({ where: { email } });
  if (userExists) {
    res.status(400).json({ message: '邮箱已经被注册' });
    return;
  }

  // 检查学号是否已存在
  const studentIdExists = await userRepository.findOne({ where: { student_id } });
  if (studentIdExists) {
    res.status(400).json({ message: '学号已经被注册' });
    return;
  }

  // 创建用户
  const user = new User();
  user.name = name;
  user.email = email;
  user.password = password; // 密码会在实体的BeforeInsert钩子中自动哈希
  user.student_id = student_id;
  user.credit_score = 100;

  await userRepository.save(user);

  res.status(201).json({
    id: user.id,
    name: user.name,
    email: user.email,
    student_id: user.student_id,
    credit_score: user.credit_score,
    token: generateToken(user.id)
  });
});

// @desc    用户登录
// @route   POST /api/auth/login
// @access  Public
export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const userRepository = AppDataSource.getRepository(User);

  // 查找用户（包含密码字段用于验证）
  const user = await userRepository
    .createQueryBuilder('user')
    .where('user.email = :email', { email })
    .addSelect('user.password') // 显式选择password字段，因为它在实体中被设置为select: false
    .getOne();

  if (!user) {
    res.status(401).json({ message: '邮箱或密码不正确' });
    return;
  }

  // 检查密码是否匹配
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    res.status(401).json({ message: '邮箱或密码不正确' });
    return;
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    student_id: user.student_id,
    credit_score: user.credit_score,
    token: generateToken(user.id)
  });
});

// @desc    获取用户资料
// @route   GET /api/auth/me
// @access  Private
export const getUserProfile = asyncHandler(async (req: Request, res: Response) => {
  const userRepository = AppDataSource.getRepository(User);
  
  const user = await userRepository.findOne({ where: { id: req.user.id } });

  if (user) {
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      student_id: user.student_id,
      credit_score: user.credit_score,
      avatar_url: user.avatar_url
    });
  } else {
    res.status(404).json({ message: '用户不存在' });
  }
}); 