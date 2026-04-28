import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user.entity';
import { Repository } from 'typeorm';
import { ChangePasswordDto } from '../dtos/change-password.dto';
import { HashingProvider } from 'src/auth/providers/hashing.provider';

@Injectable()
export class ChangePasswordProvider {
  constructor(
    /**
     * Inject userRepository
     */

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    /**
     * Inject hashingProvider
     */
    @Inject(forwardRef(() => HashingProvider))
    private readonly hashingProvider: HashingProvider,
  ) {}
  public async changePassword(
    userId: number,
    changePasswordDto: ChangePasswordDto,
  ): Promise<User> {
    const user = await this.userRepository.findOneBy({ id: userId });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await this.hashingProvider.comparePassword(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isMatch) {
      throw new BadRequestException('Current password is incorrect');
    }

    // ✅ hash new password
    const hashedPassword = await this.hashingProvider.hashPassword(
      changePasswordDto.newPassword,
    );

    // ✅ update
    user.password = hashedPassword;
    return await this.userRepository.save(user);
  }
}
