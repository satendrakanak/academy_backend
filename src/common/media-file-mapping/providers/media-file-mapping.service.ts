import { Injectable } from '@nestjs/common';
import { Article } from 'src/articles/article.entity';
import { Category } from 'src/categories/category.entity';
import { Chapter } from 'src/chapters/chapter.entity';
import { Course } from 'src/courses/course.entity';
import { Order } from 'src/orders/order.entity';
import { Testimonial } from 'src/testimonials/testimonial.entity';
import { S3Provider } from 'src/uploads/providers/s3.provider';
import { User } from 'src/users/user.entity';

@Injectable()
export class MediaFileMappingService {
  constructor(
    /**
     * Inject s3Provider
     */

    private readonly s3Provider: S3Provider,
  ) {}
  mapFile<T extends { path: string } | null>(file: T): T {
    if (!file) return file;

    const baseUrl = `https://${this.s3Provider.getCloudFrontUrl()}`;

    return {
      ...file,
      path: `${baseUrl}/${file.path}`,
    };
  }
  mapCourse(course: Course) {
    return {
      ...course,
      image: this.mapFile(course.image!),
      video: this.mapFile(course.video!),
      // 🔥 faculties mapping
      faculties: course.faculties?.map((faculty) => ({
        ...faculty,
        avatar: faculty.avatar ? this.mapFile(faculty.avatar) : null,
      })),

      chapters: course.chapters?.map((chapter: Chapter) => ({
        ...chapter,
        lectures: chapter.lectures?.map((lecture) => ({
          ...lecture,
          video: this.mapFile(lecture.video!),
          attachments: lecture.attachments?.map((attachment) => ({
            ...attachment,
            file: this.mapFile(attachment.file),
          })),
        })),
      })),
    };
  }

  mapCourses(courses: Course[]) {
    return courses.map((course) => this.mapCourse(course));
  }

  mapArticle(article: Article) {
    return {
      ...article,
      featuredImage: this.mapFile(article.featuredImage!),
    };
  }

  mapArticles(articles: Article[]) {
    return articles.map((article) => this.mapArticle(article));
  }

  mapCategory(category: Category) {
    return {
      ...category,
      image: this.mapFile(category.image!),
    };
  }

  mapCategories(categories: Category[]) {
    return categories.map((category) => this.mapCategory(category));
  }

  mapUser(user: User) {
    return {
      ...user,
      avatar: this.mapFile(user.avatar!),
      coverImage: this.mapFile(user.coverImage!),
    };
  }

  mapUsers(users: User[]) {
    return users.map((user) => this.mapUser(user));
  }

  mapOrder(order: Order) {
    return {
      ...order,
      items: order.items.map((item) => ({
        ...item,
        course: {
          ...item.course,
          image: this.mapFile(item.course.image!),
        },
      })),
    };
  }

  mapTestimonial(testimonial: Testimonial) {
    return {
      ...testimonial,
      avatar: this.mapFile(testimonial.avatar!),
      video: this.mapFile(testimonial.video!),
      course: testimonial.course
        ? {
            ...testimonial.course,
            image: this.mapFile(testimonial.course.image!),
            video: this.mapFile(testimonial.course.video!),
          }
        : null,
    };
  }

  mapTestimonials(testimonials: Testimonial[]) {
    return testimonials.map((testimonial) => this.mapTestimonial(testimonial));
  }
}
