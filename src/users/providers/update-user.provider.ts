import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PatchUserDto } from '../dtos/patch-user.dto';
import { Repository } from 'typeorm';
import { User } from '../user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Upload } from 'src/uploads/upload.entity';
import { RolesPermissionsService } from 'src/roles-permissions/providers/roles-permissions.service';

@Injectable()
export class UpdateUserProvider {
  constructor(
    /**
     * Inject userRepository
     */

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    /**
     * Inject rolesPermissionsService
     */
    private readonly rolesPermissionsService: RolesPermissionsService,
  ) {}

  public async update(id: number, patchUserDto: PatchUserDto): Promise<User> {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
        relations: ['avatar', 'coverImage'], // 🔥 important
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // 🔒 Email check
      if (patchUserDto.email) {
        const existing = await this.userRepository.findOneBy({
          email: patchUserDto.email,
        });

        if (existing && existing.id !== id) {
          throw new ConflictException('Email already exists');
        }
      }

      // 🔒 Phone check
      if (patchUserDto.phoneNumber) {
        const existing = await this.userRepository.findOneBy({
          phoneNumber: patchUserDto.phoneNumber,
        });

        if (existing && existing.id !== id) {
          throw new ConflictException('Phone number already exists');
        }
      }

      const { avatarId, coverImageId, roleIds, ...rest } = patchUserDto;

      // avatar
      if (patchUserDto.avatarId !== undefined) {
        user.avatar = patchUserDto.avatarId
          ? ({ id: patchUserDto.avatarId } as Upload)
          : null;
      }

      // cover
      if (patchUserDto.coverImageId !== undefined) {
        user.coverImage = patchUserDto.coverImageId
          ? ({ id: patchUserDto.coverImageId } as Upload)
          : null;
      }

      if (patchUserDto.roleIds !== undefined) {
        if (!patchUserDto.roleIds.length) {
          throw new BadRequestException('User must have at least one role');
        }

        const roles = await this.rolesPermissionsService.findByIds(
          patchUserDto.roleIds,
        );
        const hasStudent = roles.some((r) => r.name === 'student');

        if (!hasStudent) {
          throw new BadRequestException('User must always have student role');
        }

        if (roles.length !== patchUserDto.roleIds.length) {
          throw new BadRequestException('Invalid role(s) provided');
        }

        user.roles = roles;
      }

      Object.assign(user, rest);

      // 🔥 SAVE
      return await this.userRepository.save(user);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      console.error(error);
      throw new InternalServerErrorException('Failed to update user');
    }
  }
}
