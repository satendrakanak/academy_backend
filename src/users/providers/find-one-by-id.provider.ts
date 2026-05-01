import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { MediaFileMappingService } from 'src/common/media-file-mapping/providers/media-file-mapping.service';

@Injectable()
export class FindOneByIdProvider {
  constructor(
    /**
     * Inject userRepository
     */
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    /**
     * Inject mediaFileMappingService
     */
    private readonly mediaFileMappingService: MediaFileMappingService,
  ) {}

  public async findOneById(id: number): Promise<User> {
    let user: User | null;

    try {
      user = await this.userRepository.findOne({
        where: { id },
        relations: [
          'profile',
          'roles',
          'roles.permissions',
          'avatar',
          'coverImage',
          'facultyProfile',
        ],
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      const mappedUser = this.mediaFileMappingService.mapUser(user);
      return mappedUser;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
