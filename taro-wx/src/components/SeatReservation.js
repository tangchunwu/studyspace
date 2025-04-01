const getSeatStatus = (status) => {
  // 根据状态码返回对应的状态文本
  switch(status) {
    case 0:
      return "可预约";
    case 1:
      return "已预约";
    case 2:
      return "维修中";
    default:
      return "无法预约";
  }
}; 