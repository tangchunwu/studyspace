import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  OneToOne, 
  JoinColumn 
} from 'typeorm';
import { Reservation } from './reservation.entity';

@Entity('check_ins')
export class CheckIn {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Reservation, reservation => reservation.check_in, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reservation_id' })
  reservation: Reservation;

  @Column()
  check_in_time: Date;

  @Column({ nullable: true })
  check_out_time: Date;

  @Column({
    type: 'enum',
    enum: ['on_time', 'late', 'missed'],
    default: 'on_time'
  })
  status: 'on_time' | 'late' | 'missed';

  @CreateDateColumn()
  created_at: Date;
} 