import { Category } from 'src/categories/category.entity';
import { Chapter } from 'src/chapters/chapter.entity';
import { Enrollment } from 'src/enrollments/enrollment.entity';
import { Tag } from 'src/tags/tag.entity';
import { Upload } from 'src/uploads/upload.entity';
import { User } from 'src/users/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Course {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  title!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  shortDescription?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 60, nullable: true })
  metaTitle?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  metaSlug?: string;

  @Column({ type: 'varchar', length: 160, nullable: true })
  metaDescription?: string;

  @ManyToOne(() => Upload, { nullable: true, onDelete: 'SET NULL' })
  image?: Upload | null;

  @Column({ type: 'varchar', length: 96, nullable: true })
  imageAlt?: string;

  @Column({ type: 'boolean', default: false })
  isFree!: boolean;

  @Column({ type: 'boolean', default: false })
  isPublished!: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  priceInr?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  priceUsd?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  duration?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  mode?: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  certificate!: string;

  @Column({ type: 'text', nullable: true })
  exams?: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  experienceLevel?: string;

  @Column({ type: 'text', nullable: true })
  studyMaterial?: string;

  @Column({ type: 'text', nullable: true })
  additionalBook?: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  language?: string;

  @Column({ type: 'text', nullable: true })
  technologyRequirements?: string;

  @Column({ type: 'text', nullable: true })
  eligibilityRequirements?: string;

  @Column({ type: 'text', nullable: true })
  disclaimer?: string;

  @ManyToOne(() => Upload, { nullable: true, onDelete: 'SET NULL' })
  video?: Upload | null;

  @ManyToOne(() => User, (user) => user.courses)
  createdBy!: User;

  @ManyToOne(() => User, { nullable: true })
  updatedBy?: User;

  @ManyToMany(() => Category, (category) => category.courses)
  @JoinTable()
  categories?: Category[];

  @ManyToMany(() => Tag, (tag) => tag.courses)
  @JoinTable()
  tags?: Tag[];

  @OneToMany(() => Chapter, (chapter) => chapter.course)
  chapters!: Chapter[];

  @OneToMany(() => Enrollment, (enrollment) => enrollment.course)
  enrollments!: Enrollment[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;
}
