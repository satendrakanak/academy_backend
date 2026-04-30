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
import { RolesPermissionsService } from 'src/roles-permissions/providers/roles-permissions.service';
import { ProfilesService } from 'src/profiles/providers/profiles.service';
import { GenerateUsernameProvider } from './generate-username.provider';
import { Upload } from 'src/uploads/upload.entity';
import { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';

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
  ) {}

  public async create(
    createUserDto: CreateUserDto,
    currentUser?: ActiveUserData,
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

      const username = await this.generateUsernameProvider.generateUsername(
        createUserDto.email,
      );

      console.log('Current User', currentUser);

      const isAdmin =
        currentUser?.roles?.includes('admin') ||
        currentUser?.roles?.some((r: any) => r.name === 'admin'); // अगर objects हैं
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
        password: await this.hashingProvider.hashPassword(
          createUserDto.password,
        ),
        emailVerified: isAdmin ? new Date() : undefined,
      });
      const newUser = await this.userRepository.save(user);
      await this.profilesService.createProfile(newUser.id);
      if (!isAdmin) {
        await this.authService.sendVerificationEmail(newUser);
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
}
