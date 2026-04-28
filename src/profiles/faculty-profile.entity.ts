import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from 'src/users/user.entity';

@Entity()
export class FacultyProfile {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToOne(() => User, (user) => user.facultyProfile, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user!: User;

  @Column()
  expertise!: string;

  @Column({ nullable: true })
  experience!: string;

  @Column({ nullable: true })
  designation!: string;

  @Column({ nullable: true })
  linkedin!: string;

  @Column({ default: false })
  isApproved!: boolean;
}
