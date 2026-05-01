import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
@Index(['key'], { unique: true })
export class AppSetting {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 120 })
  key!: string;

  @Column({ type: 'simple-json', nullable: true })
  valueJson?: Record<string, any> | null;

  @Column({ type: 'text', nullable: true })
  valueEnc?: string | null;

  @Column({ type: 'boolean', default: false })
  isEncrypted!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
