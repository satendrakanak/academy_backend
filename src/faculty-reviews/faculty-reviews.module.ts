import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { FacultyReview } from './faculty-review.entity';
import { FacultyReviewsController } from './faculty-reviews.controller';
import { FacultyReviewsService } from './providers/faculty-reviews.service';

@Module({
  imports: [TypeOrmModule.forFeature([FacultyReview, User])],
  controllers: [FacultyReviewsController],
  providers: [FacultyReviewsService],
})
export class FacultyReviewsModule {}
