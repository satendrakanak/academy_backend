import { Course } from 'src/courses/course.entity';
import { Order } from 'src/orders/order.entity';
import { User } from 'src/users/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Enrollment {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, (user) => user.enrollments)
  user!: User;

  @ManyToOne(() => Course, (course) => course.enrollments)
  course!: Course;

  @ManyToOne(() => Order)
  order!: Order;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'float', default: 0 })
  progress!: number;

  @CreateDateColumn()
  enrolledAt!: Date;
}
