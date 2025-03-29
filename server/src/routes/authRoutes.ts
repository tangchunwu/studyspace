import express from 'express';
import { registerUser, loginUser, getUserProfile, updateUserProfile } from '../controllers/authController';
import { protect } from '../middlewares/auth';

const router = express.Router();

// 公开路由
router.post('/register', registerUser);
router.post('/login', loginUser);

// 需要认证的路由
router.get('/me', protect, getUserProfile);

// PUT /api/auth/profile - 更新用户资料
router.put('/profile', protect, updateUserProfile);

export default router; 