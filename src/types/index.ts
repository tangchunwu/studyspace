// 用户类型
export interface User {
  id: string;
  name: string;
  email: string;
  student_id: string;
  avatar_url?: string;
  credit_score: number;
  created_at: string;
}

// 认证响应
export interface AuthResponse {
  user: User;
  token: string;
}

// 登录请求
export interface LoginRequest {
  email: string;
  password: string;
}

// 注册请求
export interface RegisterRequest {
  name: string;
  email: string;
  student_id: string;
  password: string;
}

// 自习室类型
export interface StudyRoom {
  id: string;
  room_number: string;
  capacity: number;
  status: 'available' | 'maintenance' | 'closed';
  location: string;
  description?: string;
  created_at: string;
  available_seats?: number;
}

// 座位类型
export interface Seat {
  id: string;
  room_id: string;
  seat_number: string;
  is_available: boolean;
  created_at: string;
}

// 预约类型
export interface Reservation {
  id: string;
  user: User;
  room: StudyRoom;
  seat: Seat;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'canceled' | 'completed';
  check_in_time?: string;
  created_at: string;
}

// 签到类型
export interface CheckIn {
  id: string;
  reservation_id: string;
  check_in_time: string;
  check_out_time?: string;
  status: 'on_time' | 'late' | 'missed';
  created_at: string;
}

// 创建预约请求
export interface CreateReservationRequest {
  room_id: string;
  seat_id: string;
  start_time: string;
  end_time: string;
}

// 座位可用性检查请求
export interface CheckAvailabilityRequest {
  start_time: string;
  end_time: string;
}

// API错误响应
export interface ApiError {
  message: string;
  success: boolean;
} 