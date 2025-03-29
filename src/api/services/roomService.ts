import { apiClient } from '../client';
import { CheckAvailabilityRequest, Seat, StudyRoom } from '../../types';

export const roomService = {
  // 获取所有自习室
  getRooms: (): Promise<StudyRoom[]> => {
    return apiClient.get<StudyRoom[]>('/rooms');
  },

  // 获取单个自习室详情
  getRoomById: (id: string): Promise<StudyRoom & { seats: Seat[] }> => {
    return apiClient.get<StudyRoom & { seats: Seat[] }>(`/rooms/${id}`);
  },

  // 获取自习室的所有座位
  getRoomSeats: (roomId: string): Promise<Seat[]> => {
    return apiClient.get<Seat[]>(`/rooms/${roomId}/seats`);
  },

  // 检查座位可用性
  checkAvailability: (roomId: string, data: CheckAvailabilityRequest): Promise<Seat[]> => {
    return apiClient.post<Seat[]>(`/rooms/${roomId}/check-availability`, data);
  }
};

export default roomService; 