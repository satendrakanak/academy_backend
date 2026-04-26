import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { PaymentProvider } from './enums/payment-provider.enum';
import { PaymentMode } from './enums/payment-mode.enum';

@Entity()
@Index(['provider', 'mode'], { unique: true })
export class PaymentGateway {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'enum', enum: PaymentProvider })
  provider!: PaymentProvider;

  @Column({ type: 'enum', enum: PaymentMode })
  mode!: PaymentMode;

  @Column({ type: 'boolean', default: false })
  isActive!: boolean;

  // 🔒 encrypted at rest
  @Column({ type: 'text' })
  keyIdEnc!: string;

  @Column({ type: 'text' })
  keySecretEnc!: string;

  @Column({ type: 'text', nullable: true })
  webhookSecretEnc!: string;

  @Column({ type: 'varchar', nullable: true })
  webhookUrl!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
