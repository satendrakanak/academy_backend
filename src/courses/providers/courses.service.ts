import { Injectable } from '@nestjs/common';
import { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';
import { CreateCourseDto } from '../dtos/create-course.dto';
import { CreateCourseProvider } from './create-course.provider';

@Injectable()
export class CoursesService {
  constructor(
    /**
     * Inject createCourseProvider
     */
    private readonly createCourseProvider: CreateCourseProvider,
  ) {}

  public async findAll() {}
  public async findOneById() {}
  public async create(createCouseDto: CreateCourseDto, user: ActiveUserData) {
    return await this.createCourseProvider.create(createCouseDto, user);
  }
  public async update() {}
  public async delete() {}
  public async softDelete() {}
  public async restore() {}
}
