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
import { CategoriesService } from 'src/categories/providers/categories.service';
import { Category } from 'src/categories/category.entity';
import { TagsService } from 'src/tags/providers/tags.service';
import { Tag } from 'src/tags/tag.entity';

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

    /**
     * Inject categoriesService
     */
    private readonly categoriesService: CategoriesService,

    /**
     * Inject tagsService
     */
    private readonly tagsService: TagsService,
  ) {}

  public async create(
    createCouseDto: CreateCourseDto,
    user: ActiveUserData,
  ): Promise<Course> {
    try {
      const baseSlug = generateSlug(
        createCouseDto.slug ?? createCouseDto.title,
      );
      const finalSlug = await this.slugProvider.ensureUniqueSlug(
        this.courseRepository,
        baseSlug,
      );
      //Find Categories
      let categories: Category[] = [];
      if (createCouseDto.categories?.length) {
        categories = await this.categoriesService.findMany(
          createCouseDto.categories,
        );
      }
      //Find Tags
      let tags: Tag[] = [];
      if (createCouseDto.tags?.length) {
        tags = await this.tagsService.findMany(createCouseDto.tags);
      }

      const newCourse = this.courseRepository.create({
        ...createCouseDto,
        slug: finalSlug,
        createdBy: { id: user.sub } as User,
        categories,
        tags,
      });

      return await this.courseRepository.save(newCourse);
    } catch (error: unknown) {
      if (typeof error === 'object' && error && 'code' in error) {
        if ((error as { code?: string }).code === '23505') {
          throw new BadRequestException('Slug already exists');
        }
      }

      throw new InternalServerErrorException(
        'Failed to create course',
        error instanceof Error ? { description: error.message } : undefined,
      );
    }
  }
}
