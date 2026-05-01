import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MediaFileMappingService } from 'src/common/media-file-mapping/providers/media-file-mapping.service';
import { User } from 'src/users/user.entity';
import { Repository } from 'typeorm';
import { CreateFacultyReviewDto } from '../dtos/create-faculty-review.dto';
import { FacultyReview } from '../faculty-review.entity';

@Injectable()
export class FacultyReviewsService {
  constructor(
    @InjectRepository(FacultyReview)
    private readonly facultyReviewRepository: Repository<FacultyReview>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly mediaFileMappingService: MediaFileMappingService,
  ) {}

  async getByFaculty(facultyId: number) {
    const reviews = await this.facultyReviewRepository.find({
      where: { faculty: { id: facultyId }, isPublished: true },
      relations: ['user', 'user.avatar'],
      order: { createdAt: 'DESC' },
    });

    return reviews.map((review) => this.mapReviewMedia(review));
  }

  async getMine(facultyId: number, userId: number) {
    const review = await this.facultyReviewRepository.findOne({
      where: { faculty: { id: facultyId }, user: { id: userId } },
      relations: ['faculty', 'faculty.avatar', 'user', 'user.avatar'],
    });

    return review ? this.mapReviewMedia(review) : null;
  }

  async getSummary(facultyId: number) {
    const reviews = await this.facultyReviewRepository.find({
      where: { faculty: { id: facultyId }, isPublished: true },
      select: { id: true, rating: true },
    });

    const total = reviews.length;
    const average = total
      ? Number(
          (
            reviews.reduce((sum, review) => sum + review.rating, 0) / total
          ).toFixed(1),
        )
      : 0;

    const breakdown = [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: reviews.filter((review) => review.rating === rating).length,
    }));

    return { average, total, breakdown };
  }

  async findAll() {
    const reviews = await this.facultyReviewRepository.find({
      relations: ['faculty', 'faculty.avatar', 'user', 'user.avatar'],
      order: { createdAt: 'DESC' },
    });

    return reviews.map((review) => this.mapReviewMedia(review));
  }

  async upsert(
    facultyId: number,
    userId: number,
    createFacultyReviewDto: CreateFacultyReviewDto,
  ) {
    const [faculty, user] = await Promise.all([
      this.userRepository.findOne({
        where: { id: facultyId },
        relations: ['roles', 'avatar'],
      }),
      this.userRepository.findOne({
        where: { id: userId },
        relations: ['avatar'],
      }),
    ]);

    if (!faculty) throw new NotFoundException('Faculty not found');
    if (!user) throw new NotFoundException('User not found');

    const isFaculty = faculty.roles?.some((role) => role.name === 'faculty');
    if (!isFaculty) {
      throw new BadRequestException('Selected user is not a faculty member');
    }

    if (faculty.id === user.id) {
      throw new ForbiddenException('You cannot review your own faculty profile');
    }

    let review = await this.facultyReviewRepository.findOne({
      where: { faculty: { id: facultyId }, user: { id: userId } },
      withDeleted: true,
    });

    if (!review) {
      review = this.facultyReviewRepository.create({ faculty, user });
    }

    review.rating = createFacultyReviewDto.rating;
    review.comment = createFacultyReviewDto.comment?.trim() || null;
    review.isPublished = true;
    review.deletedAt = null as unknown as Date;

    const saved = await this.facultyReviewRepository.save(review);
    return this.mapReviewMedia(saved);
  }

  async update(
    id: number,
    userId: number,
    roles: string[],
    createFacultyReviewDto: CreateFacultyReviewDto,
  ) {
    const review = await this.facultyReviewRepository.findOne({
      where: { id },
      relations: ['faculty', 'faculty.avatar', 'user', 'user.avatar'],
    });

    if (!review) throw new NotFoundException('Review not found');
    if (!this.canManage(review.user.id, userId, roles)) {
      throw new ForbiddenException('You can edit only your own review');
    }

    review.rating = createFacultyReviewDto.rating;
    review.comment = createFacultyReviewDto.comment?.trim() || null;
    const saved = await this.facultyReviewRepository.save(review);
    return this.mapReviewMedia(saved);
  }

  async delete(id: number, userId: number, roles: string[] = []) {
    const review = await this.facultyReviewRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!review) throw new NotFoundException('Review not found');
    if (!this.canManage(review.user.id, userId, roles)) {
      throw new ForbiddenException('You can delete only your own review');
    }

    await this.facultyReviewRepository.softDelete(id);
    return { message: 'Review deleted successfully' };
  }

  private canManage(ownerId: number, userId: number, roles: string[] = []) {
    return ownerId === userId || roles.includes('admin');
  }

  private mapReviewMedia(review: FacultyReview) {
    if (review.user?.avatar) {
      review.user.avatar = this.mediaFileMappingService.mapFile(
        review.user.avatar,
      );
    }

    if (review.faculty?.avatar) {
      review.faculty.avatar = this.mediaFileMappingService.mapFile(
        review.faculty.avatar,
      );
    }

    return review;
  }
}
