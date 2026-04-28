import { Injectable } from '@nestjs/common';
import { User } from '../user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class GenerateUsernameProvider {
  constructor(
    /**
     * Inject userRepository
     */

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async generateUsername(email: string): Promise<string> {
    const baseUsername = email.split('@')[0].toLowerCase();

    let username = baseUsername;
    let counter = 1;

    while (true) {
      const existing = await this.userRepository.findOne({
        where: { username },
      });

      if (!existing) {
        return username;
      }

      username = `${baseUsername}${counter}`;
      counter++;
    }
  }
}
