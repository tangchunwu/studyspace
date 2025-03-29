import express from 'express';
import { 
  createReservation, 
  getUserReservations, 
  cancelReservation, 
  checkInReservation 
} from '../controllers/reservationController';
import { protect } from '../middlewares/auth';

const router = express.Router();

// 所有预约路由都需要认证
router.use(protect);

// 创建预约和获取用户预约
router.route('/')
  .post(createReservation)
  .get(getUserReservations);

// 取消预约
router.route('/:id/cancel')
  .put(cancelReservation);

// 签到
router.route('/:id/check-in')
  .post(checkInReservation);

export default router; 