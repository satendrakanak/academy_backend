import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Enrollment } from '../enrollment.entity';
import { In, Repository } from 'typeorm';
import { Order } from 'src/orders/order.entity';

@Injectable()
export class EnrollmentsService {
  constructor(
    /**
     * Inject enrollmentRepository
     */
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
  ) {}

  async enrollUser(order: Order) {
    const enrollments: Enrollment[] = [];

    for (const item of order.items) {
      // 🔥 duplicate check
      const existing = await this.enrollmentRepository.findOne({
        where: {
          user: { id: order.user.id },
          course: { id: item.course.id },
        },
      });

      if (existing) {
        continue; // skip duplicate
      }

      const enrollment = this.enrollmentRepository.create({
        user: order.user,
        course: item.course,
        order: order,
      });

      enrollments.push(enrollment);
    }

    if (enrollments.length > 0) {
      await this.enrollmentRepository.save(enrollments);
    }

    return enrollments;
  }

  // 🥈 GET USER COURSES (My Courses page)
  async getUserCourses(userId: number) {
    const enrollments = await this.enrollmentRepository.find({
      where: { user: { id: userId }, isActive: true },
      relations: ['course'],
      order: { enrolledAt: 'DESC' },
    });

    return enrollments;
  }

  async getUserCourseCount(userId: number): Promise<number> {
    return this.enrollmentRepository.count({
      where: { user: { id: userId } },
    });
  }

  // 🥉 CHECK ACCESS (important)
  async checkEnrollment(userId: number, courseId: number) {
    const enrollment = await this.enrollmentRepository.findOne({
      where: {
        user: { id: userId },
        course: { id: courseId },
        isActive: true,
      },
    });

    return enrollment;
  }

  async checkMultipleEnrollments(userId: number, courseIds: number[]) {
    const records = await this.enrollmentRepository.find({
      where: {
        user: { id: userId },
        course: { id: In(courseIds) },
        isActive: true,
      },
      relations: ['course'],
    });

    const map: Record<number, boolean> = {};

    for (const id of courseIds) map[id] = false;

    for (const r of records) {
      map[r.course.id] = true;
    }

    return map;
  }

  async deactivateByOrder(orderId: number) {
    const enrollments = await this.enrollmentRepository.find({
      where: { order: { id: orderId }, isActive: true },
    });

    if (!enrollments.length) {
      return [];
    }

    for (const enrollment of enrollments) {
      enrollment.isActive = false;
    }

    return this.enrollmentRepository.save(enrollments);
  }
}
