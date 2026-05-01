import { User } from 'src/users/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CourseQuestion } from './course-question.entity';

@Entity()
export class CourseAnswer {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => CourseQuestion, (question) => question.answers, {
    onDelete: 'CASCADE',
  })
  question!: CourseQuestion;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: User;

  @Column({ type: 'text' })
  body!: string;

  @Column({ type: 'boolean', default: false })
  isAccepted!: boolean;

  @Column({ type: 'boolean', default: false })
  isPublished!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
