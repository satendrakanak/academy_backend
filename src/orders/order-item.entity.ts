import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Order } from './order.entity';
import { Course } from 'src/courses/course.entity';

@Entity()
export class OrderItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Order, (order) => order.items, {
    onDelete: 'CASCADE',
  })
  order!: Order;

  @ManyToOne(() => Course, { eager: true })
  course!: Course;

  @Column()
  price!: number;

  @Column({ default: 1 })
  quantity!: number;
}
