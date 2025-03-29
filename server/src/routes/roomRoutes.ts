import express from 'express';
import { 
  getRooms, 
  getRoomById, 
  getRoomSeats,
  checkSeatAvailability 
} from '../controllers/roomController';
import { protect } from '../middlewares/auth';

const router = express.Router();

// 获取所有自习室 - 公开访问
router.get('/', getRooms);

// 获取单个自习室详情 - 公开访问
router.get('/:id', getRoomById);

// 获取自习室的座位 - 公开访问
router.get('/:id/seats', getRoomSeats);

// 检查座位可用性 - 需要认证
router.post('/:id/check-availability', protect, checkSeatAvailability);

export default router; 