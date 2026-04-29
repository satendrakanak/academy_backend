import { Module } from '@nestjs/common';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './providers/articles.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from './article.entity';
import { CreateArticleProvider } from './providers/create-article.provider';
import { UpdateArticleProvider } from './providers/update-article.provider';
import { SlugModule } from 'src/common/slug/slug.module';
import { UsersModule } from 'src/users/users.module';
import { UploadsModule } from 'src/uploads/uploads.module';
import { CategoriesModule } from 'src/categories/categories.module';
import { TagsModule } from 'src/tags/tags.module';
import { FindAllProvider } from './providers/find-all.provider';
import { FindOneBySlugProvider } from './providers/find-one-by-slug.provider';
import { FindOneByIdProvider } from './providers/find-one-by-id.provider';
import { GetFeaturedArticlesProvider } from './providers/get-featured-articles.provider';
import { GetRelatedArticlesProvider } from './providers/get-related-articles.provider';
import { PaginationModule } from 'src/common/pagination/pagination.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Article]),
    SlugModule,
    UsersModule,
    UploadsModule,
    CategoriesModule,
    TagsModule,
    PaginationModule,
  ],
  controllers: [ArticlesController],
  providers: [
    ArticlesService,
    CreateArticleProvider,
    UpdateArticleProvider,
    FindAllProvider,
    FindOneBySlugProvider,
    FindOneByIdProvider,
    GetFeaturedArticlesProvider,
    GetRelatedArticlesProvider,
  ],
  exports: [ArticlesService],
})
export class ArticlesModule {}
