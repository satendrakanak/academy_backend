import { Order } from 'src/orders/order.entity';
import { User } from 'src/users/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RefundRequestStatus } from './enums/refund-request-status.enum';
import { RefundLog } from './refund-log.entity';

@Entity()
export class RefundRequest {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Order, (order) => order.refundRequests, {
    onDelete: 'CASCADE',
  })
  order!: Order;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  requester!: User;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  reviewedBy?: User | null;

  @Column({
    type: 'enum',
    enum: RefundRequestStatus,
    default: RefundRequestStatus.REQUESTED,
  })
  status!: RefundRequestStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  requestedAmount!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  approvedAmount?: number | null;

  @Column({ type: 'text' })
  reason!: string;

  @Column({ type: 'text', nullable: true })
  customerNote?: string | null;

  @Column({ type: 'text', nullable: true })
  adminNote?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  gatewayRefundId?: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  gatewayStatus?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  gatewayReference?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  gatewayPayload?: Record<string, unknown> | null;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  processedAt?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  rejectedAt?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  failedAt?: Date | null;

  @OneToMany(() => RefundLog, (log) => log.refundRequest, {
    cascade: true,
  })
  logs!: RefundLog[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
