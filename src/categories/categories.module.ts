import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './providers/categories.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './category.entity';
import { UpdateCategoryProvider } from './providers/update-category.provider';
import { SlugModule } from 'src/common/slug/slug.module';
import { PaginationModule } from 'src/common/pagination/pagination.module';
import { CreateBulkCategoriesProvider } from './providers/create-bulk-categories.provider';
import { CreateCategoryProvider } from './providers/create-category.provider';
import { UploadsModule } from 'src/uploads/uploads.module';

@Module({
  imports: [
    PaginationModule,
    SlugModule,
    TypeOrmModule.forFeature([Category]),
    UploadsModule,
  ],
  controllers: [CategoriesController],
  providers: [
    CategoriesService,
    UpdateCategoryProvider,
    CreateBulkCategoriesProvider,
    CreateCategoryProvider,
  ],
  exports: [CategoriesService],
})
export class CategoriesModule {}
