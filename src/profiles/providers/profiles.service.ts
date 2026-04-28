import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserProfile } from '../user-profile.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { FacultyProfile } from '../faculty-profile.entity';
import { UsersService } from 'src/users/providers/users.service';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import { UpdateFacultyProfileDto } from '../dtos/update.faculty-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(
    /**
     * Inject userProfileRepository
     */
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,

    /**
     * Inject facultyProfileRepository
     */

    @InjectRepository(FacultyProfile)
    private readonly facultyProfileRepository: Repository<FacultyProfile>,

    /**
     * Inject usersService
     */
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

  async createProfile(userId: number) {
    return this.userProfileRepository.save({
      user: { id: userId },
    });
  }

  async getMyProfile(userId: number) {
    return this.usersService.getUserWithProfile(userId);
  }

  // 🔥 UPDATE PROFILE
  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto) {
    await this.userProfileRepository.update(
      { user: { id: userId } },
      updateProfileDto,
    );

    return this.getMyProfile(userId);
  }

  async updateFacultyProfile(
    userId: number,
    updateFacultyProfileDto: UpdateFacultyProfileDto,
  ) {
    let profile = await this.facultyProfileRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    // 👉 अगर नहीं मिला → create
    if (!profile) {
      profile = this.facultyProfileRepository.create({
        user: { id: userId },
        ...updateFacultyProfileDto,
      });
    } else {
      Object.assign(profile, updateFacultyProfileDto);
    }

    await this.facultyProfileRepository.save(profile);

    return this.getMyProfile(userId);
  }

  // 🔥 PUBLIC PROFILE
  async getPublicProfile(username: string) {
    const user = await this.usersService.getUserByUsername(username);

    if (!user?.profile?.isPublic) {
      return null;
    }

    return user;
  }
}
