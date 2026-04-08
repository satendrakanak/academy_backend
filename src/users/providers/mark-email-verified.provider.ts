import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { User } from '../user.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class MarkEmailVerifiedProvider {
  constructor(
    /**
     * Inject usersRepository
     */

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}
  async markEmailVerified(id: number): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    user.emailVerified = new Date();

    return await this.usersRepository.save(user);
  }
}
