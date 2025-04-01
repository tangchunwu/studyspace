import React from 'react';
import { Seat } from '../types';
import './SeatAnimation.css';

interface SeatMapProps {
  seats: Seat[];
  selectedSeatId: string | null;
  isSearching: boolean;
  availableSeats: string[] | null;
  onSeatSelect: (seatId: string) => void;
  className?: string;
}

/**
 * 座位图组件，用于显示和管理自习室内的座位
 */
const SeatMap: React.FC<SeatMapProps> = ({
  seats,
  selectedSeatId,
  isSearching,
  availableSeats,
  onSeatSelect,
  className = ''
}) => {
  // 将座位按照行分组
  const groupSeatsByRow = () => {
    const groups: Record<string, Seat[]> = {};
    
    console.log(`SeatMap: 开始分组座位，总数: ${seats.length}`);
    console.log(`SeatMap: 座位号示例: ${seats.slice(0, 5).map(s => s.seat_number).join(', ')}`);
    
    // 检查第一个座位的格式，决定如何分组
    const firstSeatHasHyphen = seats.length > 0 && seats[0].seat_number.includes('-');
    console.log(`SeatMap: 座位号格式包含连字符: ${firstSeatHasHyphen}`);
    
    seats.forEach(seat => {
      // 从座位号中提取行标识
      let row = '未知';
      
      try {
        if (seat.seat_number.includes('-')) {
          // 如果包含"-"，则按"-"分割，使用前半部分作为行标识
          row = seat.seat_number.split('-')[0];
        } else if (seat.seat_number.length > 1) {
          // 如果没有"-"但长度>1，尝试提取字母前缀
          // 例如 "A1", "B12" 等
          const match = seat.seat_number.match(/^([A-Za-z]+)/);
          if (match && match[1]) {
            row = match[1];
          } else {
            // 如果没有字母前缀，使用完整座位号
            row = seat.seat_number;
          }
        } else if (seat.seat_number.length > 0) {
          // 如果只有一个字符，直接使用
          row = seat.seat_number;
        }
      } catch (err) {
        console.error(`SeatMap: 处理座位号时出错: ${seat.seat_number}`, err);
      }
      
      if (!groups[row]) {
        groups[row] = [];
      }
      
      groups[row].push(seat);
    });
    
    // 记录分组结果
    const rowKeys = Object.keys(groups);
    console.log(`SeatMap: 座位已分为 ${rowKeys.length} 组: ${rowKeys.join(', ')}`);
    rowKeys.forEach(row => {
      console.log(`SeatMap: 第 ${row} 组有 ${groups[row].length} 个座位`);
    });
    
    return groups;
  };

  // 判断座位是否可用
  const isSeatAvailable = (seatId: string): boolean => {
    if (!isSearching || !availableSeats) return true;
    return availableSeats.includes(seatId);
  };

  // 获取座位号显示的部分
  const getDisplayNumber = (seatNumber: string): string => {
    if (seatNumber.includes('-')) {
      // 例如 "A101-01" 显示为 "01"
      return seatNumber.split('-')[1];
    } else if (seatNumber.length > 1) {
      // 例如 "A1" 显示为 "1", "B12" 显示为 "12"
      const match = seatNumber.match(/^[A-Za-z]+(.+)$/);
      if (match && match[1]) {
        return match[1];
      }
    }
    return seatNumber;
  };

  // 获取座位状态CSS类名 - 增强视觉效果
  const getSeatClassName = (seat: Seat): string => {
    let className = 'seat-btn w-12 h-12 flex items-center justify-center rounded-md focus:outline-none transition-all duration-300 transform hover:scale-110 font-semibold ';
    
    if (!isSearching) {
      return className + 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60';
    }
    
    if (selectedSeatId === seat.id) {
      return className + 'bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-300 scale-110 pulse-animation';
    }
    
    if (isSeatAvailable(seat.id)) {
      return className + 'bg-green-100 text-green-800 hover:bg-green-200 hover:shadow-md border border-green-300 active:bg-green-300';
    }
    
    return className + 'bg-red-100 text-red-800 cursor-not-allowed opacity-80';
  };

  const seatGroups = groupSeatsByRow();
  const sortedRows = Object.keys(seatGroups).sort();

  return (
    <div className={`seat-map-container ${className}`}>
      <div className="screen mb-8 bg-gradient-to-r from-blue-100 via-indigo-200 to-blue-100 h-8 rounded-lg shadow-inner"></div>
      
      {sortedRows.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          无法分析座位布局，请联系管理员检查座位编号格式
        </div>
      ) : (
        <div className="seat-map-inner overflow-auto max-h-[500px] pb-4">
          {sortedRows.map(row => {
            // 按座位号排序
            const rowSeats = seatGroups[row].sort((a, b) => {
              // 获取数字部分进行排序
              let numA = 0;
              let numB = 0;
              
              try {
                if (a.seat_number.includes('-')) {
                  // 例如 "A101-01"，取"-"后面的部分作为排序依据
                  numA = parseInt(a.seat_number.split('-')[1]) || 0;
                } else {
                  // 例如 "A1"，取字母后面的数字部分
                  const match = a.seat_number.match(/^[A-Za-z]+(\d+)/);
                  numA = match && match[1] ? parseInt(match[1]) : 0;
                }
                
                if (b.seat_number.includes('-')) {
                  numB = parseInt(b.seat_number.split('-')[1]) || 0;
                } else {
                  const match = b.seat_number.match(/^[A-Za-z]+(\d+)/);
                  numB = match && match[1] ? parseInt(match[1]) : 0;
                }
              } catch (err) {
                console.error('SeatMap: 座位排序出错', err);
              }
              
              return numA - numB;
            });
            
            return (
              <div key={`row-${row}`} className="seat-row flex justify-center my-3 w-full">
                <div className="flex flex-wrap items-center justify-center gap-2 max-w-full">
                  <div className="row-label w-20 text-right text-sm font-medium text-gray-700 bg-gray-100 p-2 rounded-md shadow-sm">
                    第 {row} 排
                  </div>
                  <div className="flex flex-wrap gap-3 justify-center">
                    {rowSeats.map(seat => (
                      <button
                        key={seat.id}
                        disabled={!isSeatAvailable(seat.id) || !isSearching}
                        onClick={() => isSearching && isSeatAvailable(seat.id) && onSeatSelect(seat.id)}
                        className={getSeatClassName(seat)}
                        title={isSearching 
                          ? (isSeatAvailable(seat.id) 
                              ? `座位号: ${seat.seat_number} - 可选, 点击选择此座位` 
                              : `座位号: ${seat.seat_number} - 已被预约`) 
                          : `座位号: ${seat.seat_number} - 请先选择日期和时间`}
                      >
                        {getDisplayNumber(seat.seat_number)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <div className="mt-8 flex justify-center space-x-6">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-green-100 rounded-md mr-2 border border-green-300 flex items-center justify-center text-green-800 font-medium">A</div>
          <span className="text-sm text-gray-700">可选</span>
        </div>
        <div className="flex items-center">
          <div className="w-8 h-8 bg-red-100 rounded-md mr-2 border border-red-300 flex items-center justify-center text-red-800 font-medium opacity-80">B</div>
          <span className="text-sm text-gray-700">已约</span>
        </div>
        <div className="flex items-center">
          <div className="w-8 h-8 bg-indigo-600 rounded-md mr-2 border border-indigo-700 flex items-center justify-center text-white font-medium ring-2 ring-indigo-300">✓</div>
          <span className="text-sm text-gray-700">已选</span>
        </div>
      </div>
    </div>
  );
};

export default SeatMap; 