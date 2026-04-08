import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { Course } from '../course.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCourseDto } from '../dtos/create-course.dto';
import { SlugProvider } from 'src/common/slug/providers/slug.provider';
import { generateSlug } from 'src/common/utils/slug.util';
import { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';
import { User } from 'src/users/user.entity';

@Injectable()
export class CreateCourseProvider {
  constructor(
    /**
     * Inject courseRepository
     */

    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,

    /**
     * Inject slugProvider
     */

    private readonly slugProvider: SlugProvider,
  ) {}

  public async create(createCouseDto: CreateCourseDto, user: ActiveUserData) {
    try {
      const baseSlug = generateSlug(
        createCouseDto.slug ?? createCouseDto.title,
      );
      const finalSlug = await this.slugProvider.ensureUniqueSlug(
        this.courseRepository,
        baseSlug,
      );

      const newCourse = this.courseRepository.create({
        ...createCouseDto,
        slug: finalSlug,
        //createdBy: { id: user.sub } as User,
      });

      return await this.courseRepository.save(newCourse);
    } catch (error) {
      if (error.code === '23505') {
        throw new BadRequestException('Slug already exists');
      }

      throw new InternalServerErrorException('Failed to create course', {
        description: error.message,
      });
    }
  }
}
