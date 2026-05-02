import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { User } from '../user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from '../dtos/create-user.dto';
import { CreateUserProvider } from './create-user.provider';
import { FindOneByEmailProvider } from './find-one-by-email.provider';
import { FindOneByIdProvider } from './find-one-by-id.provider';
import { PaginationProvider } from 'src/common/pagination/providers/pagination.provider';
import { GetUsersDto } from '../dtos/get-users.dto';
import { Paginated } from 'src/common/pagination/interfaces/paginated.interface';
import { CreateBulkUsersDto } from '../dtos/create-bulk-users.dto';
import { CreateBulkUsersProvider } from './create-bulk-users.provider';
import { PatchUserDto } from '../dtos/patch-user.dto';
import { UpdateUserProvider } from './update-user.provider';
import { DeleteRecord } from 'src/common/interfaces/delete-record.interface';
import { DeleteBulkUsersDto } from '../dtos/delete-bulk-users.dto';
import { RestoreUserProvider } from './restore-user.provider';
import { DeleteUserProvider } from './delete-user.provider';
import { MarkEmailVerifiedProvider } from './mark-email-verified.provider';
import { UpdatePasswordProvider } from './update-password.provider';
import { ChangePasswordDto } from '../dtos/change-password.dto';
import { ChangePasswordProvider } from './change-password.provider';
import { GetDashboardStatsProvider } from './get-dashboard-stats.provider';
import { WeeklyProgress } from 'src/user-progress/interfaces/weekly-progress.interface';
import { AdminUpdateUserDto } from '../dtos/admin-update-user.dto';
import { UpdateProfileDto } from 'src/profiles/dtos/update-profile.dto';
import { ProfilesService } from 'src/profiles/providers/profiles.service';
import { MediaFileMappingService } from 'src/common/media-file-mapping/providers/media-file-mapping.service';
import { UpdateFacultyProfileDto } from 'src/profiles/dtos/update.faculty-profile.dto';
import { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';
import { Brackets } from 'typeorm';
import { CreateUserOptions } from '../interfaces/create-user-options.interface';
import { Enrollment } from 'src/enrollments/enrollment.entity';
import { Certificate } from 'src/certificates/certificate.entity';
import { CourseExamAttempt } from 'src/course-exams/course-exam-attempt.entity';

@Injectable()
export class UsersService {
  constructor(
    /**
     * Inject userRepository
     */

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,

    @InjectRepository(Certificate)
    private readonly certificateRepository: Repository<Certificate>,

    @InjectRepository(CourseExamAttempt)
    private readonly courseExamAttemptRepository: Repository<CourseExamAttempt>,

    /**
     * Inject createUserProvider
     */
    private readonly createUserprovider: CreateUserProvider,

    /**
     * Inject createBulkUsersProvider
     */

    private readonly createBulkUsersProvider: CreateBulkUsersProvider,

    /**
     * Inject updateUserProvider
     */
    private readonly updateUserProvider: UpdateUserProvider,

    /**
     * Inject findOneByEmailProvider
     */
    private readonly findOneByEmailProvider: FindOneByEmailProvider,

    /**
     * Inject findOneByIdProvider
     */
    private readonly findOneByIdProvider: FindOneByIdProvider,

    /**
     * Inject paginatedProvider
     */

    private readonly paginationProvider: PaginationProvider,

    /**
     * Inject deleteUserProvider
     */

    private readonly deleteUserProvider: DeleteUserProvider,

    /**
     * Inject restoreUserProvider
     */
    private readonly restoreUserProvider: RestoreUserProvider,

    /**
     * Inject markEmailVerifiedProvider
     */

    private readonly markEmailVerifiedProvider: MarkEmailVerifiedProvider,

    /**
     * Inject updatePasswordProvider
     */

    private readonly updatePasswordProvider: UpdatePasswordProvider,
    /**
     * Inject changePasswordProvider
     */
    private readonly changePasswordProvider: ChangePasswordProvider,

    /***
     * Inject getDashboardStatsProvider
     */

    private readonly getDashboardStatsProvider: GetDashboardStatsProvider,

    /**
     * Inject mediaFileMappingService
     */
    private readonly mediaFileMappingService: MediaFileMappingService,

    /**
     * Inject usersService
     */
    @Inject(forwardRef(() => ProfilesService))
    private readonly profilesService: ProfilesService,
  ) {}

  public async findAll(getUsersDto: GetUsersDto): Promise<Paginated<User>> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('roles.permissions', 'permissions')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('user.facultyProfile', 'facultyProfile')
      .leftJoinAndSelect('user.avatar', 'avatar')
      .leftJoinAndSelect('user.coverImage', 'coverImage')
      .orderBy('user.createdAt', 'DESC');

    if (getUsersDto.includeDeleted) {
      queryBuilder.withDeleted();
    }

    if (getUsersDto.roleId) {
      queryBuilder.andWhere('roles.id = :roleId', {
        roleId: getUsersDto.roleId,
      });
    }

    if (getUsersDto.search?.trim()) {
      const search = `%${getUsersDto.search.trim().toLowerCase()}%`;

      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(user.firstName) LIKE :search', { search })
            .orWhere('LOWER(user.lastName) LIKE :search', { search })
            .orWhere('LOWER(user.email) LIKE :search', { search })
            .orWhere('LOWER(user.username) LIKE :search', { search })
            .orWhere('LOWER(user.phoneNumber) LIKE :search', { search });
        }),
      );
    }

    const result = await this.paginationProvider.paginateQueryBuilder(
      {
        limit: getUsersDto.limit,
        page: getUsersDto.page,
      },
      queryBuilder,
    );

    result.data = this.mediaFileMappingService.mapUsers(result.data);

    return result;
  }

  public async findOneById(id: number): Promise<User> {
    return await this.findOneByIdProvider.findOneById(id);
  }

  public async findOneByEmail(email: string): Promise<User> {
    return await this.findOneByEmailProvider.findOneByEmail(email);
  }

  async getFacultyProfile(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: [
        'roles',
        'profile',
        'facultyProfile',
        'avatar',
        'coverImage',
        'taughtCourses',
        'taughtCourses.image',
        'taughtCourses.faculties',
        'taughtCourses.faculties.avatar',
        'taughtCourses.createdBy',
      ],
    });

    if (!user || !user.roles.some((role) => role.name === 'faculty')) {
      throw new NotFoundException('Faculty not found');
    }

    const mappedUser = this.mediaFileMappingService.mapUser(user);
    mappedUser.taughtCourses =
      mappedUser.taughtCourses?.map((course) =>
        this.mediaFileMappingService.mapCourse(course),
      ) || [];

    return mappedUser;
  }

  async getUserWithProfile(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile', 'roles', 'avatar', 'coverImage', 'facultyProfile'],
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }

  async getUserByUsername(username: string) {
    return this.userRepository.findOne({
      where: { username },
      relations: ['profile'],
    });
  }

  async getPublicProfileBundle(username: string) {
    const user = await this.userRepository.findOne({
      where: { username },
      relations: [
        'profile',
        'roles',
        'avatar',
        'coverImage',
        'facultyProfile',
        'taughtCourses',
        'taughtCourses.image',
        'taughtCourses.faculties',
        'taughtCourses.faculties.avatar',
      ],
    });

    if (!user?.profile?.isPublic) {
      return null;
    }

    const mappedUser = this.mediaFileMappingService.mapUser(user);
    mappedUser.taughtCourses =
      mappedUser.taughtCourses?.map((course) =>
        this.mediaFileMappingService.mapCourse(course),
      ) || [];

    const [stats, weeklyProgress, certificates, examAttempts, enrollments] =
      await Promise.all([
        this.getDashboardStatsProvider.getDashboardStats(user.id),
        this.getDashboardStatsProvider.getWeeklyProgress(user.id),
        user.profile.showCertificates
          ? this.certificateRepository.find({
              where: { user: { id: user.id } },
              relations: ['course'],
              order: { issuedAt: 'DESC' },
            })
          : Promise.resolve([]),
        this.courseExamAttemptRepository.find({
          where: { user: { id: user.id } },
          relations: ['course'],
          order: { submittedAt: 'DESC', createdAt: 'DESC' },
        }),
        user.profile.showCourses
          ? this.enrollmentRepository.find({
              where: { user: { id: user.id }, isActive: true },
              relations: [
                'course',
                'course.image',
                'course.faculties',
                'course.faculties.avatar',
              ],
              order: { enrolledAt: 'DESC' },
            })
          : Promise.resolve([]),
      ]);

    const examMap = new Map<
      number,
      {
        courseId: number;
        courseTitle: string;
        courseSlug: string;
        attempts: number;
        bestPercentage: number;
        latestPercentage: number;
        passed: boolean;
      }
    >();

    for (const attempt of examAttempts) {
      const existing = examMap.get(attempt.course.id);
      const percentage = Number(attempt.percentage || 0);

      if (!existing) {
        examMap.set(attempt.course.id, {
          courseId: attempt.course.id,
          courseTitle: attempt.course.title,
          courseSlug: attempt.course.slug,
          attempts: 1,
          bestPercentage: percentage,
          latestPercentage: percentage,
          passed: attempt.passed,
        });
        continue;
      }

      existing.attempts += 1;
      existing.bestPercentage = Math.max(existing.bestPercentage, percentage);
      existing.passed = existing.passed || attempt.passed;
    }

    return {
      user: mappedUser,
      stats,
      weeklyProgress,
      courses: enrollments.map((enrollment) =>
        this.mediaFileMappingService.mapCourse({
          ...enrollment.course,
          isEnrolled: true,
          progress: {
            isCompleted: enrollment.progress >= 100,
            progress: Math.round(enrollment.progress || 0),
            lastTime: 0,
          },
        } as any),
      ),
      certificates: certificates.map((certificate) => ({
        id: certificate.id,
        certificateNumber: certificate.certificateNumber,
        issuedAt: certificate.issuedAt,
        course: {
          id: certificate.course.id,
          title: certificate.course.title,
          slug: certificate.course.slug,
        },
      })),
      examHistory: Array.from(examMap.values()),
    };
  }

  public async create(
    createUserDto: CreateUserDto,
    currentUser?: ActiveUserData,
    options?: CreateUserOptions,
  ): Promise<User> {
    return await this.createUserprovider.create(
      createUserDto,
      currentUser,
      options,
    );
  }

  public async createMany(
    createBulkUsersDto: CreateBulkUsersDto,
  ): Promise<User[]> {
    return await this.createBulkUsersProvider.createMany(createBulkUsersDto);
  }

  public async update(id: number, patchUserDto: PatchUserDto): Promise<User> {
    return await this.updateUserProvider.update(id, patchUserDto);
  }

  async updateUserByAdmin(
    userId: number,
    adminUpdateUserDto: AdminUpdateUserDto,
  ) {
    const user = await this.userRepository.findOneBy({ id: userId });

    if (!user) throw new NotFoundException('User not found');

    Object.assign(user, adminUpdateUserDto);

    return this.userRepository.save(user);
  }

  async updateUserProfile(
    userId: number,
    updateProfileDto: UpdateProfileDto,
  ): Promise<User> {
    const user = await this.userRepository.findOneBy({ id: userId });

    if (!user) throw new NotFoundException('User not found');
    const profile = await this.profilesService.updateProfile(
      userId,
      updateProfileDto,
    );

    return profile;
  }

  async updateFacultyProfile(
    userId: number,
    updateFacultyProfileDto: UpdateFacultyProfileDto,
  ) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    });

    if (!user) throw new NotFoundException('User not found');
    const isFaculty = user.roles.some((r) => r.name === 'faculty');

    if (!isFaculty) {
      throw new BadRequestException('User is not a faculty');
    }
    const profile = await this.profilesService.updateFacultyProfile(
      userId,
      updateFacultyProfileDto,
    );

    return profile;
  }

  public async delete(id: number): Promise<DeleteRecord> {
    return await this.deleteUserProvider.delete(id);
  }

  public async softDelete(id: number): Promise<DeleteRecord> {
    return await this.deleteUserProvider.softDelete(id);
  }

  public async deleteMany(
    deleteBulkUsersDto: DeleteBulkUsersDto,
  ): Promise<DeleteRecord> {
    return await this.deleteUserProvider.deleteMany(deleteBulkUsersDto);
  }

  public async restore(id: number): Promise<User> {
    return await this.restoreUserProvider.restore(id);
  }

  async markEmailVerified(userId: number): Promise<User> {
    return await this.markEmailVerifiedProvider.markEmailVerified(userId);
  }
  async updatePassword(
    userId: number,
    password: string,
    confirmPassword: string,
  ): Promise<User> {
    return await this.updatePasswordProvider.updatePassword(
      userId,
      password,
      confirmPassword,
    );
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    return await this.changePasswordProvider.changePassword(
      userId,
      changePasswordDto,
    );
  }

  async getDashboardStats(userId: number) {
    return await this.getDashboardStatsProvider.getDashboardStats(userId);
  }

  async getWeeklyProgress(userId: number): Promise<WeeklyProgress[]> {
    return this.getDashboardStatsProvider.getWeeklyProgress(userId);
  }

  async getAllFaculty() {
    const faculties = await this.userRepository.find({
      relations: ['roles', 'facultyProfile', 'profile', 'avatar'],
      where: {
        roles: {
          name: 'faculty',
        },
      },
    });

    const mapped = this.mediaFileMappingService.mapUsers(faculties);

    return mapped;
  }
  async getFacultiesByIds(ids: number[]) {
    const users = await this.userRepository.find({
      where: { id: In(ids) },
      relations: ['roles'],
    });

    return users.filter((u) => u.roles.some((r) => r.name === 'faculty'));
  }
}
