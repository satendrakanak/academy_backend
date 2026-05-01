import { Course } from 'src/courses/course.entity';
import { User } from 'src/users/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type CourseExamAttemptAnswer = {
  questionId: string;
  selectedOptionIds: string[];
  answerText?: string;
};

export type CourseExamAttemptQuestionResult = {
  questionId: string;
  prompt: string;
  selectedOptionIds: string[];
  correctOptionIds: string[];
  answerText?: string;
  acceptedAnswers?: string[];
  isCorrect: boolean;
  earnedPoints: number;
  totalPoints: number;
  explanation?: string;
};

export type CourseExamAttemptSnapshot = {
  title: string;
  passingPercentage: number;
  questions: {
    id: string;
    prompt: string;
    type: 'single' | 'multiple' | 'true_false' | 'short_text' | 'drag_drop';
    explanation?: string;
    points: number;
    acceptedAnswers?: string[];
    options: {
      id: string;
      text: string;
      isCorrect: boolean;
    }[];
  }[];
};

@Entity()
export class CourseExamAttempt {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  course!: Course;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: User;

  @Column({ type: 'int' })
  attemptNumber!: number;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  answers!: CourseExamAttemptAnswer[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  questionResults!: CourseExamAttemptQuestionResult[];

  @Column({ type: 'jsonb' })
  examSnapshot!: CourseExamAttemptSnapshot;

  @Column({ type: 'int', default: 0 })
  score!: number;

  @Column({ type: 'int', default: 0 })
  maxScore!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  percentage!: string;

  @Column({ type: 'boolean', default: false })
  passed!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  submittedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
