import { Module } from '@nestjs/common';
import { ChaptersController } from './chapters.controller';
import { ChaptersService } from './providers/chapters.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chapter } from './chapter.entity';
import { CreateChapterProvider } from './providers/create-chapter.provider';
import { UpdateChapterProvider } from './providers/update-chapter.provider';

@Module({
  imports: [TypeOrmModule.forFeature([Chapter])],
  controllers: [ChaptersController],
  providers: [ChaptersService, CreateChapterProvider, UpdateChapterProvider],
})
export class ChaptersModule {}
