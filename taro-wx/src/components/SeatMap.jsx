import React, { useEffect, useState } from 'react';
import { getSeats } from '../api/seatApi';

const SeatMap = () => {
  const [seats, setSeats] = useState([]);
  const [roomId, setRoomId] = useState('');

  // 处理获取到的座位数据
  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const seatsData = await getSeats(roomId);
        
        // 检查每个座位是否有status属性，如果没有则设置默认值
        const processedSeats = seatsData.map(seat => {
          if (seat.status === undefined) {
            return { ...seat, status: 0 }; // 默认可预约
          }
          return seat;
        });
        
        setSeats(processedSeats);
      } catch (error) {
        console.error("获取座位失败", error);
      }
    };
    
    fetchSeats();
  }, [roomId]);

  return (
    <div>
      {/* 座位渲染逻辑 */}
    </div>
  );
};

export default SeatMap; 