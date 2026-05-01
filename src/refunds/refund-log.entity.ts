import { User } from 'src/users/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RefundActorType } from './enums/refund-actor-type.enum';
import { RefundLogAction } from './enums/refund-log-action.enum';
import { RefundRequest } from './refund-request.entity';
import { RefundRequestStatus } from './enums/refund-request-status.enum';

@Entity()
export class RefundLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => RefundRequest, (refundRequest) => refundRequest.logs, {
    onDelete: 'CASCADE',
  })
  refundRequest!: RefundRequest;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  actor?: User | null;

  @Column({
    type: 'enum',
    enum: RefundActorType,
  })
  actorType!: RefundActorType;

  @Column({
    type: 'enum',
    enum: RefundLogAction,
  })
  action!: RefundLogAction;

  @Column({ type: 'enum', enum: RefundRequestStatus, nullable: true })
  fromStatus?: RefundRequestStatus | null;

  @Column({ type: 'enum', enum: RefundRequestStatus, nullable: true })
  toStatus?: RefundRequestStatus | null;

  @Column({ type: 'text', nullable: true })
  message?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;
}
