import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class FindOneByEmailProvider {
  constructor(
    /**
     * Inject userRepository
     */

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  public async findOneByEmail(email: string): Promise<User> {
    let user: User | null;

    user = await this.userRepository.findOne({
      where: { email },
      relations: ['profile', 'roles', 'avatar', 'coverImage', 'facultyProfile'],
    });

    if (!user) {
      throw new NotFoundException('User Not Found');
    }

    return user;
  }
}
