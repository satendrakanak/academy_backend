import { Course } from 'src/courses/course.entity';
import { Lecture } from 'src/lectures/lecture.entity';
import { Upload } from 'src/uploads/upload.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Chapter {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int', default: 0 })
  position!: number;

  @Column({ type: 'boolean', default: false })
  isPublished!: boolean;

  @Column({ type: 'boolean', default: false })
  isFree!: boolean;

  @OneToMany(() => Lecture, (lecture) => lecture.chapter)
  lectures!: Lecture[];

  @ManyToOne(() => Course, (course) => course.chapters, {
    onDelete: 'CASCADE',
  })
  course!: Course;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;
}
