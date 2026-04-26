import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  DeleteDateColumn,
} from 'typeorm';
import { CouponType } from './enums/couponType.enum';
import { CouponScope } from './enums/couponScope.enum';
import { CouponStatus } from './enums/couponStatus.enum';

@Entity()
export class Coupon {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  @Index()
  code!: string;

  @Column({
    type: 'enum',
    enum: CouponType,
    default: CouponType.FIXED,
  })
  type!: CouponType;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  value?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxDiscount?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  minOrderValue?: number;

  @Column({
    type: 'enum',
    enum: CouponScope,
    default: CouponScope.GLOBAL,
  })
  scope!: CouponScope;

  @Column({ type: 'json', nullable: true })
  applicableCourseIds?: number[] | null;

  @Column({ type: 'boolean', default: false })
  isAutoApply!: boolean;

  @Column({ type: 'int', nullable: true })
  usageLimit?: number;

  @Column({ type: 'int', default: 0 })
  usedCount!: number;

  @Column({ type: 'int', default: 1 })
  perUserLimit!: number;

  @Column({ type: 'timestamp', nullable: true })
  validFrom?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  validTill?: Date | null;

  // 🟢 Status
  @Column({
    type: 'enum',
    enum: CouponStatus,
    default: CouponStatus.ACTIVE,
  })
  status!: CouponStatus;

  @Column({ type: 'boolean', default: false })
  isDeleted!: boolean;

  @Column({ type: 'json', nullable: true })
  meta?: Record<string, any>;

  // ⏱️ Timestamps
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;
}
