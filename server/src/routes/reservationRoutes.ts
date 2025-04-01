import express from 'express';
import { 
  createReservation, 
  getUserReservations, 
  cancelReservation, 
  checkInReservation 
} from '../controllers/reservationController';
import { protect } from '../middlewares/auth';
import { clearRoomCache } from './roomRoutes';

const router = express.Router();

// 所有预约路由都需要认证
router.use(protect);

// 清除房间缓存中间件 - 用于写操作后
const clearCacheMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // 保存原始send方法
  const originalSend = res.send;
  
  // 替换send方法
  res.send = function(body) {
    try {
      // 尝试解析响应体判断操作是否成功
      const data = JSON.parse(body);
      
      // 如果请求成功（状态码2xx）且有房间ID，清除缓存
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // 从请求体或URL参数中获取房间ID
        const roomId = req.body?.room_id;
        
        if (roomId) {
          console.log(`操作成功，清除房间${roomId}缓存`);
          clearRoomCache(roomId);
        } else {
          // 如果找不到特定房间ID，清除所有房间缓存
          console.log('操作成功，清除所有房间缓存');
          clearRoomCache();
        }
      }
    } catch (e) {
      console.log('无法解析响应体，跳过缓存清除');
    }
    
    // 调用原始send方法
    return originalSend.call(this, body);
  };
  
  next();
};

// 创建预约和获取用户预约
router.route('/')
  .post(clearCacheMiddleware, createReservation)
  .get(getUserReservations);

// 取消预约
router.route('/:id/cancel')
  .put(clearCacheMiddleware, cancelReservation);

// 签到
router.route('/:id/check-in')
  .post(clearCacheMiddleware, checkInReservation);

export default router; 