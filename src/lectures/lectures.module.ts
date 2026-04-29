import { Module } from '@nestjs/common';
import { LecturesController } from './lectures.controller';
import { LecturesService } from './providers/lectures.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lecture } from './lecture.entity';
import { CreateLectureProvider } from './providers/create-lecture.provider';
import { UpdateLectureProvider } from './providers/update-lecture.provider';

@Module({
  imports: [TypeOrmModule.forFeature([Lecture])],
  controllers: [LecturesController],
  providers: [LecturesService, CreateLectureProvider, UpdateLectureProvider],
})
export class LecturesModule {}
