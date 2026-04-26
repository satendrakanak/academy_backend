import { Course } from '../course.entity';

export type CourseWithAccess = Course & {
  isEnrolled: boolean;
  progress: CourseProgress;
};

export type CourseProgress = {
  isCompleted: boolean;
  progress: number;
  lastTime: number;
};
