import express from 'express';
import { getUsers, getUserById, toggleUserStatus } from '../controllers/userController';
import { protect } from '../middlewares/auth';

const router = express.Router();

// 所有路由都需要认证
router.use(protect);

// 获取所有用户 - 仅限管理员
router.get('/', getUsers);

// 获取单个用户详情 - 仅限管理员
router.get('/:id', getUserById);

// 切换用户状态 - 仅限管理员
router.put('/:id/toggle-status', toggleUserStatus);

export default router; 