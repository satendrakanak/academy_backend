import { Upload } from 'src/uploads/upload.entity';
import { Course } from 'src/courses/course.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { TestimonialStatus } from './enums/testimonial-status.enum';
import { TestimonialType } from './enums/testimonial-type.enum';

@Entity()
export class Testimonial {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  designation?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  company?: string;

  @Column({
    type: 'enum',
    enum: TestimonialType,
    default: TestimonialType.TEXT,
  })
  @Index()
  type!: TestimonialType;

  @Column({ type: 'text', nullable: true })
  message?: string;

  @ManyToOne(() => Upload, { nullable: true, onDelete: 'SET NULL' })
  video?: Upload | null;

  // 🖼 Image relation
  @ManyToOne(() => Upload, { nullable: true, onDelete: 'SET NULL' })
  avatar!: Upload | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatarAlt?: string;

  // ⭐ Rating
  @Column({ type: 'int', default: 5 })
  rating!: number;

  // ✅ Active toggle
  @Column({ default: true })
  @Index()
  isActive!: boolean;

  // 🎯 FEATURED (Homepage)
  @Column({ default: false })
  @Index()
  isFeatured!: boolean;

  // 🔢 Sorting priority
  @Column({ type: 'int', default: 0 })
  priority!: number;

  // 📚 Course relation (OPTIONAL)
  @ManyToOne(() => Course, (course) => course.testimonials, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  course!: Course | null;

  // 🧠 Moderation system
  @Column({
    type: 'enum',
    enum: TestimonialStatus,
    default: TestimonialStatus.PENDING,
  })
  @Index()
  status!: TestimonialStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
