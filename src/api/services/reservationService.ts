import { apiClient } from '../client';
import { CreateReservationRequest, Reservation } from '../../types';

export const reservationService = {
  // 创建预约
  createReservation: (data: CreateReservationRequest): Promise<Reservation> => {
    return apiClient.post<Reservation>('/reservations', data);
  },

  // 获取用户的所有预约
  getUserReservations: (): Promise<Reservation[]> => {
    return apiClient.get<Reservation[]>('/reservations');
  },

  // 取消预约
  cancelReservation: (id: string): Promise<{ message: string, reservation: Reservation }> => {
    return apiClient.put<{ message: string, reservation: Reservation }>(`/reservations/${id}/cancel`);
  },

  // 签到
  checkInReservation: (id: string): Promise<{ message: string, reservation: Reservation }> => {
    return apiClient.post<{ message: string, reservation: Reservation }>(`/reservations/${id}/check-in`);
  }
};

export default reservationService; 