import express from 'express';
import { 
  getRooms, 
  getRoomById, 
  getRoomSeats,
  checkSeatAvailability 
} from '../controllers/roomController';
import { protect } from '../middlewares/auth';

const router = express.Router();

// 所有路由都需要认证
router.use(protect);

// 获取所有自习室
router.get('/', getRooms);

// 获取单个自习室详情
router.get('/:id', getRoomById);

// 获取自习室的座位
router.get('/:id/seats', getRoomSeats);

// 检查座位可用性
router.post('/:id/check-availability', checkSeatAvailability);

export default router; 