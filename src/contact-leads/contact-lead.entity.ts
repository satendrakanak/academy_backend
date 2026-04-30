import { User } from 'src/users/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ContactLeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  QUALIFIED = 'QUALIFIED',
  CLOSED = 'CLOSED',
}

@Entity()
export class ContactLead {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 140 })
  fullName!: string;

  @Column({ type: 'varchar', length: 180 })
  email!: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  phoneNumber?: string | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  subject?: string | null;

  @Column({ type: 'text' })
  message!: string;

  @Column({
    type: 'enum',
    enum: ContactLeadStatus,
    default: ContactLeadStatus.NEW,
  })
  status!: ContactLeadStatus;

  @Column({ type: 'varchar', length: 160, nullable: true })
  source?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  pageUrl?: string | null;

  @Column({ type: 'text', nullable: true })
  adminNotes?: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  user?: User | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
