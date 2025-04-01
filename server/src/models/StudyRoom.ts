import mongoose, { Schema, Document } from 'mongoose';

export interface IStudyRoom extends Document {
  room_number: string;
  capacity: number;
  status: 'available' | 'maintenance' | 'closed';
  location: string;
  description?: string;
  created_at: Date;
}

const StudyRoomSchema: Schema = new Schema({
  room_number: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['available', 'maintenance', 'closed'],
    default: 'available'
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model<IStudyRoom>('StudyRoom', StudyRoomSchema); 