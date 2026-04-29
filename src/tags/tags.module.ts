import { Module } from '@nestjs/common';
import { TagsController } from './tags.controller';
import { TagsService } from './providers/tags.service';
import { CreateTagProvider } from './providers/create-tag.provider';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tag } from './tag.entity';
import { PaginationModule } from 'src/common/pagination/pagination.module';
import { SlugModule } from 'src/common/slug/slug.module';
import { CreateManyTagsProvider } from './providers/create-many-tags.provider';
import { UpdateTagProvider } from './providers/update-tag.provider';

@Module({
  imports: [TypeOrmModule.forFeature([Tag]), SlugModule, PaginationModule],
  controllers: [TagsController],
  providers: [TagsService, CreateTagProvider, CreateManyTagsProvider, UpdateTagProvider],
  exports: [TagsService],
})
export class TagsModule {}
