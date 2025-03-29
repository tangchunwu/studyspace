import mongoose, { Schema, Document } from 'mongoose';
import { IReservation } from './Reservation';

export interface ICheckIn extends Document {
  reservation: IReservation['_id'];
  check_in_time: Date;
  check_out_time?: Date;
  status: 'on_time' | 'late' | 'missed';
  created_at: Date;
}

const CheckInSchema: Schema = new Schema({
  reservation: {
    type: Schema.Types.ObjectId,
    ref: 'Reservation',
    required: true
  },
  check_in_time: {
    type: Date,
    required: true
  },
  check_out_time: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['on_time', 'late', 'missed'],
    default: 'on_time'
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model<ICheckIn>('CheckIn', CheckInSchema); 