import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  ManyToOne, 
  JoinColumn,
  OneToMany,
  Unique
} from 'typeorm';
import { StudyRoom } from './study-room.entity';
import { Reservation } from './reservation.entity';

@Entity('seats')
@Unique(['room', 'seat_number'])  // 确保每个自习室中座位号唯一
export class Seat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => StudyRoom, room => room.seats, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: StudyRoom;

  @Column()
  seat_number: string;

  @Column({ default: true })
  is_available: boolean;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => Reservation, reservation => reservation.seat)
  reservations: Reservation[];
} 