import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from '../dtos/create-user.dto';
import { HashingProvider } from 'src/auth/providers/hashing.provider';
import { MailService } from 'src/mail/providers/mail.service';
import { AuthService } from 'src/auth/providers/auth.service';

@Injectable()
export class CreateUserProvider {
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
    /**
     * Inject mailService
     */
    private readonly mailService: MailService,

    /**
     * Inject authService
     */
    private readonly authService: AuthService,
  ) {}

  public async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const existingUserByEmail = await this.userRepository.findOneBy({
        email: createUserDto.email,
      });

      if (existingUserByEmail) {
        throw new ConflictException('User already exists with this email');
      }

      if (createUserDto.phoneNumber) {
        const existingUserByPhone = await this.userRepository.findOneBy({
          phoneNumber: createUserDto.phoneNumber,
        });

        if (existingUserByPhone) {
          throw new ConflictException(
            'User already exists with this phone number',
          );
        }
      }

      const user = this.userRepository.create({
        ...createUserDto,
        password: await this.hashingProvider.hashPassword(
          createUserDto.password,
        ),
      });
      const newUser = await this.userRepository.save(user);
      await this.authService.sendVerificationEmail(newUser);
      //await this.mailService.sendWelcomeEmail(user);
      return newUser;
    } catch (error: unknown) {
      if (error instanceof ConflictException) {
        throw error;
      }
      console.error('🔥 REAL ERROR:', error);
      throw new InternalServerErrorException(
        'Something went wrong while creating user',
        {
          description: String(error),
        },
      );
    }
  }
}
