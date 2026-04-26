import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FileTypes } from './enums/file-types.enum';
import { UploadStatus } from './enums/upload-status.enum';

@Entity()
export class Upload {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'varchar',
    length: 1024,
    nullable: false,
  })
  name!: string;

  @Column({
    type: 'varchar',
    length: 1024,
    nullable: false,
  })
  path!: string;

  @Column({
    type: 'enum',
    enum: FileTypes,
    default: FileTypes.IMAGE,
  })
  type!: string;

  @Column({
    type: 'varchar',
    length: 128,
    nullable: false,
  })
  mime!: string;

  @Column({
    type: 'varchar',
    length: 1024,
    nullable: false,
  })
  size!: number;

  @Column({
    type: 'enum',
    enum: UploadStatus,
    default: UploadStatus.PENDING,
  })
  status!: UploadStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
