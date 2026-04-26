import { Injectable } from '@nestjs/common';
import { Category } from 'src/categories/category.entity';
import { Chapter } from 'src/chapters/chapter.entity';
import { Course } from 'src/courses/course.entity';
import { S3Provider } from 'src/uploads/providers/s3.provider';

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

  mapCategory(category: Category) {
    return {
      ...category,
      image: this.mapFile(category.image!),
    };
  }

  mapCategories(categories: Category[]) {
    return categories.map((category) => this.mapCategory(category));
  }
}
