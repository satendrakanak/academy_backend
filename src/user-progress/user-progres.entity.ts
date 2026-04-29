import { User } from 'src/users/user.entity';
import { Lecture } from 'src/lectures/lecture.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
@Unique(['user', 'lecture'])
export class UserProgres {
  @PrimaryGeneratedColumn()
  id!: number;

  // ✅ USER
  @ManyToOne(() => User, (user) => user.lectureProgress, {
    onDelete: 'CASCADE',
  })
  user!: User;

  // ✅ LECTURE
  @ManyToOne(() => Lecture, (lecture) => lecture.progress, {
    onDelete: 'CASCADE',
  })
  lecture!: Lecture;

  // ✅ LOGIC FIELDS
  @Column({ default: false })
  isCompleted!: boolean;

  @Column({ type: 'float', default: 0 })
  progress!: number;

  @Column({ type: 'float', default: 0 })
  lastTime!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
