import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  OneToMany,
  BeforeInsert,
  BeforeUpdate
} from 'typeorm';
import bcrypt from 'bcrypt';
import { Reservation } from './reservation.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  student_id: string;

  @Column()
  name: string;

  @Column({ select: false })
  password: string;

  @Column({ nullable: true })
  avatar_url: string;

  @Column({ default: 100 })
  credit_score: number;

  @Column({ nullable: true })
  phone_number: string;

  @Column({ nullable: true })
  major: string;

  @Column({ nullable: true })
  grade: string;

  @Column({ 
    type: 'enum', 
    enum: ['user', 'admin'],
    default: 'user'
  })
  role: 'user' | 'admin';

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ nullable: true })
  last_login: Date;

  @Column({ default: false })
  is_disabled: boolean;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => Reservation, reservation => reservation.user)
  reservations: Reservation[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    // 只有当密码被修改时才进行哈希
    if (this.password) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  // 验证密码方法
  async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }
} 