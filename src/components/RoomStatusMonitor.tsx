import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import useRoomStore from '../store/roomStore';
import { StudyRoom } from '../types';

interface RoomStatusMonitorProps {
  onStatusUpdate?: (rooms: StudyRoom[]) => void;
  pollingInterval?: number; // 轮询间隔，单位毫秒
  autoNotify?: boolean; // 是否自动通知状态变化
}

/**
 * 自习室状态监控组件
 * 定期检查自习室状态并通知变化
 */
const RoomStatusMonitor: React.FC<RoomStatusMonitorProps> = ({
  onStatusUpdate,
  pollingInterval = 60000, // 默认每分钟更新一次
  autoNotify = true
}) => {
  const { rooms, forceRefreshRooms } = useRoomStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const prevRoomsRef = useRef<StudyRoom[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  
  // 监控自习室状态变化
  useEffect(() => {
    if (!isMonitoring) return;
    
    const monitorStatus = async () => {
      try {
        const prevRooms = prevRoomsRef.current;
        
        // 使用强制刷新方法获取最新数据
        await forceRefreshRooms();
        
        // 如果是第一次加载，不进行比较
        if (prevRooms.length === 0) {
          prevRoomsRef.current = [...rooms];
          if (onStatusUpdate) {
            onStatusUpdate(rooms);
          }
          return;
        }
        
        // 检查是否有状态变化
        let hasChanges = false;
        const changes: string[] = [];
        
        // 减少遍历次数，仅检查关键状态变化
        rooms.forEach(room => {
          const prevRoom = prevRooms.find(r => r.id === room.id);
          if (!prevRoom) {
            hasChanges = true;
            changes.push(`新增自习室: ${room.room_number}`);
            return;
          }
          
          // 只检查状态和可用座位的重大变化
          if (prevRoom.status !== room.status) {
            hasChanges = true;
            changes.push(`自习室 ${room.room_number} 状态变更: ${prevRoom.status} → ${room.status}`);
          }
          
          // 只有较大变化才通知，减少不必要的更新
          const prevSeats = prevRoom.available_seats || 0;
          const currentSeats = room.available_seats || 0;
          
          if (Math.abs(prevSeats - currentSeats) > 5 || 
              (prevSeats === 0 && currentSeats > 0) || 
              (prevSeats > 0 && currentSeats === 0)) {
            hasChanges = true;
            changes.push(`自习室 ${room.room_number} 可用座位变更: ${prevSeats} → ${currentSeats}`);
          }
        });
        
        // 保存当前状态作为下次比较的基准
        prevRoomsRef.current = [...rooms];
        
        // 如果有变化，通知父组件并显示提示
        if (hasChanges) {
          if (onStatusUpdate) {
            onStatusUpdate(rooms);
          }
          
          if (autoNotify && changes.length > 0) {
            // 最多显示2条变更，减少UI负担
            const displayChanges = changes.slice(0, 2);
            if (changes.length > 2) {
              displayChanges.push(`... 另有 ${changes.length - 2} 项变更`);
            }
            
            toast((t) => (
              <div>
                <h3 className="font-medium mb-1">自习室状态已更新</h3>
                <ul className="text-sm">
                  {displayChanges.map((change, index) => (
                    <li key={index} className="mb-0.5">{change}</li>
                  ))}
                </ul>
              </div>
            ), { duration: 4000 });
          }
        } else if (onStatusUpdate) {
          onStatusUpdate(rooms);
        }
      } catch (error) {
        console.error("监控自习室状态时出错:", error);
      }
    };
    
    // 初始化监控
    monitorStatus();
    
    // 设置轮询间隔 - 增加防抖逻辑
    intervalRef.current = setInterval(() => {
      requestAnimationFrame(() => {
        monitorStatus();
      });
    }, pollingInterval);
    
    // 组件卸载时清除定时器
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [forceRefreshRooms, rooms, onStatusUpdate, autoNotify, pollingInterval, isMonitoring]);
  
  // 如果页面不可见，暂停监控
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsMonitoring(!document.hidden);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // 该组件不渲染任何内容
  return null;
};

export default RoomStatusMonitor; 