import { apiClient } from '../client';
import { CheckAvailabilityRequest, Seat, StudyRoom } from '../../types';

export const roomService = {
  // 获取所有自习室
  getRooms: (query: string = ''): Promise<StudyRoom[]> => {
    return apiClient.get<StudyRoom[]>(`/rooms${query}`);
  },

  // 获取单个自习室详情
  getRoomById: (id: string, query: string = ''): Promise<StudyRoom & { seats: Seat[] }> => {
    console.log(`roomService: 获取自习室详情, ID = ${id}`);
    const result = apiClient.get<StudyRoom & { seats: Seat[] }>(`/rooms/${id}${query}`);
    result.then(
      data => console.log(`roomService: 成功获取自习室详情, 座位数 = ${data.seats?.length || 0}`),
      error => console.error(`roomService: 获取自习室详情失败, 错误:`, error)
    );
    return result;
  },

  // 获取自习室的所有座位
  getRoomSeats: (roomId: string, query: string = ''): Promise<Seat[]> => {
    return apiClient.get<Seat[]>(`/rooms/${roomId}/seats${query}`);
  },

  // 检查座位可用性
  checkAvailability: (roomId: string, data: CheckAvailabilityRequest, query: string = ''): Promise<Seat[]> => {
    return apiClient.post<Seat[]>(`/rooms/${roomId}/check-availability${query}`, data);
  }
};

export default roomService; 