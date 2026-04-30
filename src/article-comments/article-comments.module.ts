import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from 'src/articles/article.entity';
import { User } from 'src/users/user.entity';
import { ArticleComment } from './article-comment.entity';
import { ArticleCommentsController } from './article-comments.controller';
import { ArticleCommentsService } from './providers/article-comments.service';

@Module({
  imports: [TypeOrmModule.forFeature([ArticleComment, Article, User])],
  controllers: [ArticleCommentsController],
  providers: [ArticleCommentsService],
})
export class ArticleCommentsModule {}
