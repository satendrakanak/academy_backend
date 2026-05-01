import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, QueryFailedError, Repository } from 'typeorm';
import { Cart } from '../cart.entity';
import { CartItem } from '../cart-item.entity';
import { Course } from 'src/courses/course.entity';
import { User } from 'src/users/user.entity';
import { MediaFileMappingService } from 'src/common/media-file-mapping/providers/media-file-mapping.service';

@Injectable()
export class CartsService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,

    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,

    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly mediaFileMappingService: MediaFileMappingService,
  ) {}

  async findMine(userId: number) {
    const cart = await this.getOrCreateCart(userId);
    return this.toResponse(cart);
  }

  async sync(
    userId: number,
    items: {
      courseId: number;
      instructor?: string;
      totalDuration?: string;
      totalLectures?: number;
    }[],
  ) {
    const cart = await this.getOrCreateCart(userId);
    const courseIds = [...new Set(items.map((item) => item.courseId))];
    const incomingMeta = new Map(items.map((item) => [item.courseId, item]));

    if (!courseIds.length) {
      await this.cartItemRepository.delete({
        cart: { id: cart.id },
      });

      return this.findMine(userId);
    }

    const courses = await this.courseRepository.find({
      where: { id: In(courseIds) },
      relations: [
        'image',
        'createdBy',
        'faculties',
        'chapters',
        'chapters.lectures',
      ],
    });

    const nextIds = new Set(courses.map((course) => course.id));
    const existing = cart.items || [];

    const removableIds = existing
      .filter((item) => !nextIds.has(item.course.id))
      .map((item) => item.id);

    if (removableIds.length) {
      await this.cartItemRepository.delete(removableIds);
    }

    const existingCourseIds = new Set(existing.map((item) => item.course.id));
    const newItems = courses
      .filter((course) => !existingCourseIds.has(course.id))
      .map((course) => {
        const meta = incomingMeta.get(course.id);
        return (
        this.cartItemRepository.create({
          cart,
          course,
          instructor: meta?.instructor || this.getInstructorName(course),
          totalDuration: meta?.totalDuration || null,
          totalLectures:
            meta?.totalLectures ??
            course.chapters?.reduce(
              (count, chapter) => count + (chapter.lectures?.length || 0),
              0,
            ) ??
            0,
        })
        );
      });

    if (newItems.length) {
      await this.cartItemRepository.save(newItems);
    }

    const updatableItems = existing.filter((item) => nextIds.has(item.course.id));

    if (updatableItems.length) {
      const nextItems = updatableItems.map((item) => {
        const meta = incomingMeta.get(item.course.id);
        const nextInstructor = meta?.instructor || item.instructor || this.getInstructorName(item.course);
        const nextTotalLectures =
          meta?.totalLectures ??
          item.totalLectures ??
          item.course.chapters?.reduce(
            (count, chapter) => count + (chapter.lectures?.length || 0),
            0,
          ) ??
          0;

        item.instructor = nextInstructor;
        item.totalDuration = meta?.totalDuration || item.totalDuration || null;
        item.totalLectures = nextTotalLectures;
        return item;
      });

      await this.cartItemRepository.save(nextItems);
    }

    return this.findMine(userId);
  }

  async clear(userId: number) {
    const cart = await this.getOrCreateCart(userId);
    await this.cartItemRepository.delete({
      cart: { id: cart.id },
    });
  }

  private async getOrCreateCart(userId: number) {
    const existing = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: [
        'items',
        'items.course',
        'items.course.image',
        'items.course.createdBy',
        'items.course.faculties',
        'items.course.chapters',
        'items.course.chapters.lectures',
      ],
    });

    if (existing) {
      return existing;
    }

    const user = await this.userRepository.findOneByOrFail({ id: userId });
    const cart = this.cartRepository.create({
      user,
      items: [],
    });

    try {
      return await this.cartRepository.save(cart);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as any).driverError?.code === '23505'
      ) {
        const concurrentCart = await this.cartRepository.findOne({
          where: { user: { id: userId } },
          relations: [
            'items',
            'items.course',
            'items.course.image',
            'items.course.createdBy',
            'items.course.faculties',
            'items.course.chapters',
            'items.course.chapters.lectures',
          ],
        });

        if (concurrentCart) {
          return concurrentCart;
        }
      }

      throw error;
    }
  }

  private toResponse(cart: Cart) {
    return {
      id: cart.id,
      items: (cart.items || []).map((item) => {
        const mappedImage = item.course.image
          ? this.mediaFileMappingService.mapFile(item.course.image)
          : null;
        const totalLectures =
          item.totalLectures ??
          item.course.chapters?.reduce(
            (count, chapter) => count + (chapter.lectures?.length || 0),
            0,
          ) ??
          0;

        return {
          id: item.course.id,
          title: item.course.title,
          price: Number(item.course.priceInr || 0),
          image: mappedImage?.path || null,
          slug: item.course.slug,
          instructor:
            item.instructor || this.getInstructorName(item.course) || null,
          totalDuration: item.totalDuration || null,
          totalLectures,
        };
      }),
    };
  }

  private getInstructorName(course: Course) {
    const facultyName = (course.faculties || [])
      .map((faculty) =>
        [faculty.firstName, faculty.lastName].filter(Boolean).join(' ').trim(),
      )
      .filter(Boolean)
      .join(', ');

    if (facultyName) {
      return facultyName;
    }

    return [course.createdBy?.firstName, course.createdBy?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();
  }
}
