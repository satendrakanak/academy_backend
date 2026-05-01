import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderStatus } from './enums/orderStatus.enum';
import { OrderItem } from './order-item.entity';
import { User } from 'src/users/user.entity';
import { RefundRequest } from 'src/refunds/refund-request.entity';

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, (user) => user.orders, {
    onDelete: 'CASCADE',
  })
  user!: User;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subTotal!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  autoDiscount!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  manualDiscount!: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  autoCouponCode?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  manualCouponCode?: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalAmount!: number;

  @Column({ type: 'varchar', length: 10, default: 'INR' })
  currency!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  paymentId?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  orderId?: string | null;

  @Column({ default: 0 })
  paymentAttempts!: number;

  @Column({ type: 'timestamp', nullable: true })
  paidAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  failedAt?: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  paymentMethod?: string | null;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status!: OrderStatus;

  @Column('json')
  billingAddress!: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    address: string;
    country: string;
    state: string;
    city: string;
    pincode: string;
  };

  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
  })
  items!: OrderItem[];

  @OneToMany(() => RefundRequest, (refundRequest) => refundRequest.order)
  refundRequests?: RefundRequest[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
