// 检查获取座位列表的API实现
const getSeats = async (roomId) => {
  try {
    // 假设这是您的API调用
    const response = await request.get(`/api/rooms/${roomId}/seats`);
    
    // 确保每个座位都有正确的status值
    const processedSeats = response.data.map(seat => {
      // 如果座位没有status属性或status属性不正确，设置一个默认值
      if (seat.status === undefined || seat.status === null) {
        // 默认设为可预约(0)
        return { ...seat, status: 0 };
      }
      return seat;
    });
    
    return processedSeats;
  } catch (error) {
    console.error("获取座位列表失败", error);
    return [];
  }
} 