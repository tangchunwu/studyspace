import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  ManyToOne, 
  JoinColumn,
  OneToOne,
  Index
} from 'typeorm';
import { User } from './user.entity';
import { StudyRoom } from './study-room.entity';
import { Seat } from './seat.entity';
import { CheckIn } from './check-in.entity';

@Entity('reservations')
@Index(['seat', 'start_time', 'end_time'])
@Index(['user', 'status'])
@Index(['status', 'start_time'])
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, user => user.reservations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => StudyRoom, room => room.reservations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: StudyRoom;

  @ManyToOne(() => Seat, seat => seat.reservations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seat_id' })
  seat: Seat;

  @Column()
  start_time: Date;

  @Column()
  end_time: Date;

  @Column({
    type: 'enum',
    enum: ['pending', 'confirmed', 'canceled', 'completed'],
    default: 'confirmed'
  })
  status: 'pending' | 'confirmed' | 'canceled' | 'completed';

  @Column({ nullable: true })
  check_in_time: Date;

  @CreateDateColumn()
  created_at: Date;

  @OneToOne(() => CheckIn, checkIn => checkIn.reservation)
  check_in: CheckIn;
} 