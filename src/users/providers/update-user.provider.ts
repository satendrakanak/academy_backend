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

@Injectable()
export class UpdateUserProvider {
  constructor(
    /**
     * Inject userRepository
     */

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  public async update(id: number, patchUserDto: PatchUserDto): Promise<User> {
    try {
      const user = await this.userRepository.findOneBy({ id });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      if (patchUserDto.email) {
        const existing = await this.userRepository.findOneBy({
          email: patchUserDto.email,
        });

        if (existing && existing.id !== id) {
          throw new ConflictException('Email already exists');
        }
      }
      if (patchUserDto.phoneNumber) {
        const existing = await this.userRepository.findOneBy({
          phoneNumber: patchUserDto.phoneNumber,
        });

        if (existing && existing.id !== id) {
          throw new ConflictException('Phone number already exists');
        }
      }
      Object.assign(user, patchUserDto);
      return await this.userRepository.save(user);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      if (error.code === '23505') {
        throw new ConflictException('Duplicate value detected');
      }

      throw new InternalServerErrorException('Failed to update user');
    }
  }
}
