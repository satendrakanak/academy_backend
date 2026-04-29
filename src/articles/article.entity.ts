import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';

import { User } from 'src/users/user.entity';
import { Category } from 'src/categories/category.entity';
import { Tag } from 'src/tags/tag.entity';
import { Upload } from 'src/uploads/upload.entity';

@Entity()
@Index(['slug'], { unique: true })
export class Article {
  @PrimaryGeneratedColumn()
  id!: number;

  // 🔥 Basic Info
  @Column({ type: 'varchar', length: 255, nullable: false })
  title!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  excerpt?: string;

  @Column({ type: 'text', nullable: true })
  content?: string;

  // 🔥 Featured Image
  @ManyToOne(() => Upload, { nullable: true, onDelete: 'SET NULL' })
  featuredImage?: Upload | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  imageAlt?: string;

  // 🔥 Author
  @ManyToOne(() => User, (user) => user.articles, {
    onDelete: 'SET NULL',
  })
  author!: User;

  // 🔥 Category
  @ManyToMany(() => Category, (category) => category.articles)
  @JoinTable()
  categories?: Category[];

  // 🔥 Tags
  @ManyToMany(() => Tag, (tag) => tag.articles)
  @JoinTable()
  tags?: Tag[];

  // 🔥 SEO
  @Column({ type: 'varchar', length: 255, nullable: true })
  metaTitle?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  metaSlug?: string;

  @Column({ type: 'text', nullable: true })
  metaDescription?: string;

  // 🔥 Metrics
  @Column({ type: 'int', default: 0 })
  viewCount!: number;

  @Column({ type: 'int', nullable: true })
  readingTime?: number;

  @Column({ type: 'boolean', default: false })
  isPublished!: boolean;

  @Column({ type: 'boolean', default: false })
  isFeatured!: boolean;

  // 🔥 Publish Time
  @Column({ type: 'timestamp', nullable: true })
  publishedAt!: Date | null;

  @ManyToOne(() => User, (user) => user.courses)
  createdBy!: User;

  @ManyToOne(() => User, { nullable: true })
  updatedBy?: User;

  // 🔥 Timestamps
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
