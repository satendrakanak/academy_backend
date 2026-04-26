import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  DeleteDateColumn,
  ManyToOne,
  ManyToMany,
} from 'typeorm';
import { CategoryType } from './enums/categoryType.enum';
import { User } from 'src/users/user.entity';
import { Course } from 'src/courses/course.entity';
import { Upload } from 'src/uploads/upload.entity';

@Entity()
@Index(['type'])
export class Category {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'varchar',
    length: 96,
    nullable: false,
  })
  name!: string;

  @Column({
    type: 'varchar',
    length: 96,
    nullable: false,
  })
  slug!: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description?: string;

  @ManyToOne(() => Upload, { nullable: true, onDelete: 'SET NULL' })
  image?: Upload | null;

  @Column({ type: 'varchar', length: 96, nullable: true })
  imageAlt?: string;

  @Column({
    type: 'enum',
    enum: CategoryType,
    default: CategoryType.COURSE,
  })
  type!: CategoryType;

  @ManyToMany(() => Course, (course) => course.categories, {
    onDelete: 'CASCADE',
  })
  courses?: Course[];

  @ManyToOne(() => User, (user) => user.categories)
  createdBy!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
