import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user.entity';
import { QueryFailedError, Repository } from 'typeorm';
import { CreateUserDto } from '../dtos/create-user.dto';
import { HashingProvider } from 'src/auth/providers/hashing.provider';
import { MailService } from 'src/mail/providers/mail.service';
import { RolesPermissionsService } from 'src/roles-permissions/providers/roles-permissions.service';
import { ProfilesService } from 'src/profiles/providers/profiles.service';
import { GenerateUsernameProvider } from './generate-username.provider';
import { Upload } from 'src/uploads/upload.entity';
import { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';
import { CreateUserOptions } from '../interfaces/create-user-options.interface';
import { GenerateVerificationTokenProvider } from 'src/auth/providers/generate-verification-token.provider';
import { TokenType } from 'src/auth/enums/token-type.enum';

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
     * Inject rolesPermissionsService
     */

    private readonly rolesPermissionsService: RolesPermissionsService,
    /**
     * Inject profilesService
     */
    @Inject(forwardRef(() => ProfilesService))
    private readonly profilesService: ProfilesService,

    /**
     * Inject generateUsernameProvider
     */

    private readonly generateUsernameProvider: GenerateUsernameProvider,
    private readonly generateVerificationTokenProvider: GenerateVerificationTokenProvider,
  ) {}

  public async create(
    createUserDto: CreateUserDto,
    currentUser?: ActiveUserData,
    options?: CreateUserOptions,
  ): Promise<User> {
    try {
      const existingUserByEmail = await this.userRepository.findOne({
        where: { email: createUserDto.email },
        withDeleted: true, // 🔥 include soft deleted
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

      const roles = createUserDto.roleIds?.length
        ? await this.rolesPermissionsService.findByIds(createUserDto.roleIds)
        : [await this.rolesPermissionsService.findRoleByName('student')];

      const hasStudent = roles.some((role) => role.name === 'student');
      if (!hasStudent) {
        throw new ConflictException('User must always have student role');
      }

      console.log('Current User', currentUser);

      const isAdmin =
        currentUser?.roles?.includes('admin') ||
        currentUser?.roles?.some((r: any) => r.name === 'admin'); // अगर objects हैं
      const hashedPassword = await this.hashingProvider.hashPassword(
        createUserDto.password,
      );

      let newUser: User | null = null;

      for (let attempt = 0; attempt < 3; attempt++) {
        const username = await this.generateUsernameProvider.generateUsername(
          createUserDto.email,
        );

        const user = this.userRepository.create({
          ...createUserDto,
          avatar: createUserDto.avatarId
            ? ({ id: createUserDto.avatarId } as Upload)
            : undefined,

          coverImage: createUserDto.coverImageId
            ? ({ id: createUserDto.coverImageId } as Upload)
            : undefined,
          username,
          roles,
          password: hashedPassword,
          emailVerified: isAdmin ? new Date() : undefined,
        });

        try {
          newUser = await this.userRepository.save(user);
          break;
        } catch (error: unknown) {
          const isUsernameConflict =
            error instanceof QueryFailedError &&
            (error as QueryFailedError & { code?: string; detail?: string })
              .code === '23505' &&
            String(
              (
                error as QueryFailedError & {
                  detail?: string;
                }
              ).detail || '',
            ).includes('(username)=');

          if (!isUsernameConflict) {
            throw error;
          }
        }
      }

      if (!newUser) {
        throw new ConflictException(
          'Unable to generate a unique username for this user',
        );
      }

      await this.profilesService.createProfile(newUser.id);
      if (!isAdmin) {
        if (options?.verificationMode === 'otp') {
          await this.sendCheckoutVerificationOtp(newUser);
        } else if (options?.verificationMode !== 'none') {
          await this.sendVerificationEmail(newUser);
        }
      }

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

  private async sendVerificationEmail(user: User) {
    const tokenRecord = await this.generateVerificationTokenProvider.generate({
      userId: user.id,
      type: TokenType.EMAIL_VERIFICATION,
    });

    await this.mailService.sendVerificationEmail(
      user,
      tokenRecord.token,
      tokenRecord.expiresAt,
    );
  }

  private async sendCheckoutVerificationOtp(user: User) {
    const tokenRecord = await this.generateVerificationTokenProvider.generate({
      userId: user.id,
      type: TokenType.CHECKOUT_EMAIL_OTP,
    });

    await this.mailService.sendCheckoutOtpEmail(
      user,
      tokenRecord.token,
      tokenRecord.expiresAt,
    );
  }
}
