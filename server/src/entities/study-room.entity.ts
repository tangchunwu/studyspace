import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  OneToMany 
} from 'typeorm';
import { Seat } from './seat.entity';
import { Reservation } from './reservation.entity';

@Entity('study_rooms')
export class StudyRoom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  room_number: string;

  @Column()
  capacity: number;

  @Column({
    type: 'enum',
    enum: ['available', 'maintenance', 'closed'],
    default: 'available'
  })
  status: 'available' | 'maintenance' | 'closed';

  @Column()
  location: string;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => Seat, seat => seat.room)
  seats: Seat[];

  @OneToMany(() => Reservation, reservation => reservation.room)
  reservations: Reservation[];
} 