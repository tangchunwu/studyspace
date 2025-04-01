import express from 'express';
import { registerUser, loginUser, getUserProfile, updateUserProfile } from '../controllers/authController';
import { protect } from '../middlewares/auth';

const router = express.Router();

// 添加健康检查端点 - 必须放在最前面，确保它不被protect中间件捕获
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'success', 
    message: 'Auth service is operational',
    timestamp: new Date().toISOString()
  });
});

// 公开路由
router.post('/register', registerUser);
router.post('/login', loginUser);

// 需要认证的路由
router.get('/me', protect, getUserProfile);

// PUT /api/auth/profile - 更新用户资料
router.put('/profile', protect, updateUserProfile);

export default router; 