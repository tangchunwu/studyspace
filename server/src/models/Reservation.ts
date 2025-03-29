import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User';
import { IStudyRoom } from './StudyRoom';
import { ISeat } from './Seat';

export interface IReservation extends Document {
  user: IUser['_id'];
  room: IStudyRoom['_id'];
  seat: ISeat['_id'];
  start_time: Date;
  end_time: Date;
  status: 'pending' | 'confirmed' | 'canceled' | 'completed';
  check_in_time?: Date;
  created_at: Date;
}

const ReservationSchema: Schema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  room: {
    type: Schema.Types.ObjectId,
    ref: 'StudyRoom',
    required: true
  },
  seat: {
    type: Schema.Types.ObjectId,
    ref: 'Seat',
    required: true
  },
  start_time: {
    type: Date,
    required: true
  },
  end_time: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'canceled', 'completed'],
    default: 'confirmed'
  },
  check_in_time: {
    type: Date,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// 创建索引来优化查询性能
ReservationSchema.index({ user: 1, status: 1 });
ReservationSchema.index({ seat: 1, start_time: 1, end_time: 1 });
ReservationSchema.index({ status: 1, start_time: 1 });

export default mongoose.model<IReservation>('Reservation', ReservationSchema); 