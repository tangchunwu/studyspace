import mongoose, { Schema, Document } from 'mongoose';
import { IStudyRoom } from './StudyRoom';

export interface ISeat extends Document {
  room: IStudyRoom['_id'];
  seat_number: string;
  is_available: boolean;
  created_at: Date;
}

const SeatSchema: Schema = new Schema({
  room: {
    type: Schema.Types.ObjectId,
    ref: 'StudyRoom',
    required: true
  },
  seat_number: {
    type: String,
    required: true,
    trim: true
  },
  is_available: {
    type: Boolean,
    default: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  // 确保每个自习室中的座位号是唯一的
  indexes: [
    { fields: { room: 1, seat_number: 1 }, unique: true }
  ]
});

export default mongoose.model<ISeat>('Seat', SeatSchema); 