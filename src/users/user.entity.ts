import { Exclude } from 'class-transformer';
import { Category } from 'src/categories/category.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'varchar',
    length: 96,
    nullable: false,
  })
  firstName!: string;

  @Column({
    type: 'varchar',
    length: 96,
    nullable: true,
  })
  lastName?: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    unique: true,
  })
  email!: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    unique: true,
  })
  phoneNumber!: string;

  @Column({
    type: 'varchar',
    length: 96,
    nullable: false,
  })
  @Exclude()
  password!: string;

  @Exclude()
  @Column({ nullable: true, type: 'timestamptz' })
  emailVerified?: Date;

  @OneToMany(() => Category, (category) => category.createdBy)
  categories!: Category[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;
}
