import {
  CreateDateColumn,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Cart } from './cart.entity';
import { Course } from 'src/courses/course.entity';

@Entity()
@Unique(['cart', 'course'])
export class CartItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Cart, (cart) => cart.items, {
    onDelete: 'CASCADE',
  })
  cart!: Cart;

  @ManyToOne(() => Course, {
    eager: true,
    onDelete: 'CASCADE',
  })
  course!: Course;

  @Column({ type: 'varchar', length: 255, nullable: true })
  instructor?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  totalDuration?: string | null;

  @Column({ type: 'int', nullable: true })
  totalLectures?: number | null;

  @CreateDateColumn()
  createdAt!: Date;
}
