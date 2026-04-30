import { Article } from 'src/articles/article.entity';
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
export class ArticleComment {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Article, { onDelete: 'CASCADE' })
  article!: Article;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: User;

  @ManyToOne(() => ArticleComment, (comment) => comment.replies, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  parent?: ArticleComment | null;

  @OneToMany(() => ArticleComment, (comment) => comment.parent)
  replies!: ArticleComment[];

  @ManyToMany(() => User)
  @JoinTable({ name: 'article_comment_likes' })
  likedBy!: User[];

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'boolean', default: false })
  isPublished!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
