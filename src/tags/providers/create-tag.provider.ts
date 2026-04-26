import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Tag } from '../tag.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTagDto } from '../dtos/create-tag-dto';
import { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';
import { generateSlug } from 'src/common/utils/slug.util';
import { SlugProvider } from 'src/common/slug/providers/slug.provider';
import { User } from 'src/users/user.entity';

@Injectable()
export class CreateTagProvider {
  constructor(
    /**
     * Inject tagsRepository
     */
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    /**
     * Inject slugProvider
     */

    private readonly slugProvider: SlugProvider,
  ) {}

  async create(createTagDto: CreateTagDto, user: ActiveUserData) {
    try {
      const baseSlug = generateSlug(createTagDto.slug ?? createTagDto.name);
      const finalSlug = await this.slugProvider.ensureUniqueSlug(
        this.tagsRepository,
        baseSlug,
      );

      const tag = this.tagsRepository.create({
        ...createTagDto,
        slug: finalSlug,
        createdBy: { id: user.sub } as User,
      });
      return await this.tagsRepository.save(tag);
    } catch (error: unknown) {
      if (typeof error === 'object' && error && 'code' in error) {
        if ((error as { code?: string }).code === '23505') {
          throw new BadRequestException('Slug already exists');
        }
      }

      throw new InternalServerErrorException(
        'Failed to create category',
        error instanceof Error ? { description: error.message } : undefined,
      );
    }
  }
}
