// 检查模拟数据是否都设置了状态为非0的值
const mockSeats = [
  { id: 1, name: "A1", status: 0 }, // 将一些座位设为可预约(status: 0)
  { id: 2, name: "A2", status: 1 }, // 一些座位已预约(status: 1)
  { id: 3, name: "A3", status: 2 }, // 一些座位维修中(status: 2)
  { id: 4, name: "A4", status: 0 }, // 可预约
  // ...
]; 