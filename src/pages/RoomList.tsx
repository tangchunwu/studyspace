import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface StudyRoom {
  id: string;
  room_number: string;
  capacity: number;
  status: string;
  location: string;
  available_seats: number;
}

export function RoomList() {
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRooms() {
      try {
        setLoading(true);
        
        // 获取自习室信息
        const { data: roomsData, error: roomsError } = await supabase
          .from('study_rooms')
          .select('*')
          .order('room_number');

        if (roomsError) throw roomsError;
        
        // 获取每个自习室的可用座位数
        const roomsWithAvailableSeats = await Promise.all(
          (roomsData || []).map(async (room) => {
            const { count, error: seatsError } = await supabase
              .from('seats')
              .select('*', { count: 'exact' })
              .eq('room_id', room.id)
              .eq('is_available', true);
              
            if (seatsError) throw seatsError;
            
            return {
              ...room,
              available_seats: count || 0
            };
          })
        );
        
        setRooms(roomsWithAvailableSeats);
      } catch (error) {
        console.error('Error fetching rooms:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRooms();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const getStatusText = (status: string, availableSeats: number) => {
    if (status === 'closed') return '已关闭';
    if (status === 'maintenance') return '维护中';
    if (availableSeats === 0) return '已满';
    return '可预约';
  };

  const getStatusColor = (status: string, availableSeats: number) => {
    if (status === 'closed' || status === 'maintenance') return 'text-red-600';
    if (availableSeats === 0) return 'text-orange-600';
    return 'text-green-600';
  };

  return (
    <div className="px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">可用自习室</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <div key={room.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">自习室 {room.room_number}</h2>
              <div className="space-y-3">
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-5 w-5 mr-2" />
                  <span>{room.location}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Users className="h-5 w-5 mr-2" />
                  <span>总容量: {room.capacity} 座位</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="h-5 w-5 mr-2" />
                  <span className={getStatusColor(room.status, room.available_seats)}>
                    状态: {getStatusText(room.status, room.available_seats)}
                    {room.status === 'available' && room.available_seats > 0 && 
                      ` (${room.available_seats}座位可用)`}
                  </span>
                </div>
              </div>
              <div className="mt-6">
                <Link
                  to={`/reservation/${room.id}`}
                  className={`w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md 
                    ${room.status === 'available' && room.available_seats > 0 
                      ? 'text-white bg-indigo-600 hover:bg-indigo-700' 
                      : 'text-gray-400 bg-gray-200 cursor-not-allowed'}`}
                  onClick={(e) => {
                    if (room.status !== 'available' || room.available_seats <= 0) {
                      e.preventDefault();
                    }
                  }}
                >
                  {room.status === 'available' && room.available_seats > 0 ? '预约座位' : '不可预约'}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}