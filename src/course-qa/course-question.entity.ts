import { Course } from 'src/courses/course.entity';
import { User } from 'src/users/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CourseAnswer } from './course-answer.entity';

@Entity()
export class CourseQuestion {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  course!: Course;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: User;

  @OneToMany(() => CourseAnswer, (answer) => answer.question)
  answers!: CourseAnswer[];

  @Column({ type: 'varchar', length: 220 })
  title!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ type: 'boolean', default: false })
  isResolved!: boolean;

  @Column({ type: 'boolean', default: false })
  isPublished!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
