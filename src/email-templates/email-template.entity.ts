import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class EmailTemplate {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  templateName!: string;

  @Column({
    type: 'varchar',
    length: 2048,
    nullable: false,
  })
  subject!: string;

  @Column({
    type: 'text',
    nullable: false,
  })
  body!: string;

  @CreateDateColumn()
  createAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;
}
