import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Course } from '../course.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SlugProvider } from 'src/common/slug/providers/slug.provider';
import { PatchCourseDto } from '../dtos/patch-course.dto';
import { generateSlug } from 'src/common/utils/slug.util';
import { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';
import { User } from 'src/users/user.entity';
import { UploadsService } from 'src/uploads/providers/uploads.service';
import { CategoriesService } from 'src/categories/providers/categories.service';
import { TagsService } from 'src/tags/providers/tags.service';
import { getCoursePublishErrors } from '../utils/course-publish.validator';
import { UsersService } from 'src/users/providers/users.service';

@Injectable()
export class UpdateCourseProvider {
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
     * Inject uploadsService
     */

    private readonly uploadsService: UploadsService,
    /**
     * Inject categoriesService
     */
    private readonly categoriesService: CategoriesService,

    /**
     * Inject tagsService
     */
    private readonly tagsService: TagsService,

    /**
     * Inject usersService
     */

    private readonly usersService: UsersService,
  ) {}
  public async update(
    id: number,
    patchCourseDto: PatchCourseDto,
    user: ActiveUserData,
  ): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id },
      relations: [
        'image',
        'categories',
        'tags',
        'video',
        'chapters',
        'chapters.lectures',
      ],
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    try {
      let finalSlug = course.slug;
      const baseRawSlug = patchCourseDto.slug || patchCourseDto.title;
      if (baseRawSlug) {
        const baseSlug = generateSlug(baseRawSlug);
        finalSlug = await this.slugProvider.ensureUniqueSlug(
          this.courseRepository,
          baseSlug,
          {},
          id,
        );
      }
      //Image Update
      if (patchCourseDto.imageId !== undefined) {
        if (patchCourseDto.imageId === null) {
          course.image = null;
        } else {
          const image = await this.uploadsService.getOneById(
            patchCourseDto.imageId,
          );

          if (!image) {
            throw new NotFoundException('Image not found');
          }

          course.image = image;
        }
      }

      //Video Update
      if (patchCourseDto.videoId !== undefined) {
        if (patchCourseDto.videoId === null) {
          course.video = null;
        } else {
          const video = await this.uploadsService.getOneById(
            patchCourseDto.videoId,
          );

          if (!video) {
            throw new NotFoundException('Video not found');
          }

          course.video = video;
        }
      }

      if (patchCourseDto.imageAlt !== undefined) {
        course.imageAlt = patchCourseDto.imageAlt;
      }

      if (patchCourseDto.facultyIds !== undefined) {
        const faculties = await this.usersService.getFacultiesByIds(
          patchCourseDto.facultyIds,
        );

        if (faculties.length !== patchCourseDto.facultyIds.length) {
          throw new BadRequestException('Some users are not faculty');
        }

        course.faculties = faculties;
      }

      const {
        imageId,
        videoId,
        imageAlt,
        categories,
        tags,
        facultyIds,
        isPublished,
        ...rest
      } = patchCourseDto;

      Object.assign(course, rest);
      course.slug = finalSlug;
      course.updatedBy = { id: user.sub } as User;

      // Categories
      if (categories !== undefined) {
        if (categories.length === 0) {
          // remove all
          course.categories = [];
        } else {
          const foundCategories =
            await this.categoriesService.findMany(categories);

          course.categories = foundCategories;
        }
      }
      // TAGS
      if (tags !== undefined) {
        // normalize incoming ids
        const incomingIds = [...new Set(tags)].sort((a, b) => a - b);

        // current DB ids
        const currentIds = (course.tags || [])
          .map((t) => t.id)
          .sort((a, b) => a - b);

        // 🔥 compare
        const isSame =
          incomingIds.length === currentIds.length &&
          incomingIds.every((id, i) => id === currentIds[i]);

        if (!isSame) {
          if (incomingIds.length === 0) {
            course.tags = [];
          } else {
            const foundTags = await this.tagsService.findMany(incomingIds);

            // safety check
            if (foundTags.length !== incomingIds.length) {
              throw new BadRequestException('Invalid tag IDs');
            }

            course.tags = foundTags;
          }
        }
      }

      /**
       * 🔥 PUBLISH VALIDATION
       */

      if (isPublished !== undefined) {
        if (isPublished) {
          const errors = getCoursePublishErrors(course);

          if (errors.length > 0) {
            throw new BadRequestException({
              message: errors,
              error: 'Bad Request',
            });
          }

          course.isPublished = true;
        } else {
          course.isPublished = false;
        }
      }
      const errors = getCoursePublishErrors(course);

      if (course.isPublished && errors.length > 0) {
        course.isPublished = false;
      }

      const result = await this.courseRepository.save(course);

      return result;
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to update course');
    }
  }
}
