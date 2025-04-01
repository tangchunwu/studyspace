// 检查座位状态的处理逻辑
const processSeats = (seats) => {
  // 这里可能需要为每个座位计算正确的status值
  return seats.map(seat => {
    // 检查是否有默认将所有座位设为"无法预约"的逻辑
    // 确保每个座位的status基于实际情况设置为0(可预约)、1(已预约)或2(维修中)
    return { ...seat, status: calculateStatus(seat) };
  });
}; 