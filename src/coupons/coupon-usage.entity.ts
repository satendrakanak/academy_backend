import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Coupon } from './coupon.entity';
import { User } from 'src/users/user.entity';
import { Order } from 'src/orders/order.entity';

@Entity()
export class CouponUsage {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Coupon)
  coupon!: Coupon;

  @ManyToOne(() => User)
  user!: User;

  @ManyToOne(() => Order)
  order!: Order;

  @CreateDateColumn()
  usedAt!: Date;
}
