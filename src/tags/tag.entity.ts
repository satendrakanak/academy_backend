import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToMany,
  ManyToOne,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Course } from 'src/courses/course.entity';
import { User } from 'src/users/user.entity';
import { Article } from 'src/articles/article.entity';

@Entity()
export class Tag {
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

  @ManyToMany(() => Course, (course) => course.tags, {
    onDelete: 'CASCADE',
  })
  courses?: Course[];

  @ManyToMany(() => Article, (article) => article.tags, {
    onDelete: 'CASCADE',
  })
  articles?: Article[];

  @ManyToOne(() => User, (user) => user.tags)
  createdBy!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
