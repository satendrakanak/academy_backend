import {
  ConflictException,
  Injectable,
  RequestTimeoutException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Tag } from '../tag.entity';
import { generateSlug } from 'src/common/utils/slug.util';
import { SlugProvider } from 'src/common/slug/providers/slug.provider';
import { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';
import { User } from 'src/users/user.entity';
import { CreateManyTagsDto } from '../dtos/create-many-tags.dto';

@Injectable()
export class CreateManyTagsProvider {
  constructor(
    /**
     * Inject dataSource
     */
    private readonly dataSource: DataSource,
    /**
     * Inject slugProvider
     */
    private readonly slugProvider: SlugProvider,
  ) {}

  public async createMany(
    createManyTagsDto: CreateManyTagsDto,
    user: ActiveUserData,
  ): Promise<Tag[]> {
    const queryRunner = this.dataSource.createQueryRunner();

    let tags: Tag[] = [];

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
    } catch (error) {
      throw new RequestTimeoutException('Unable to connect to database', {
        description: String(error),
      });
    }

    try {
      const repository = queryRunner.manager.getRepository(Tag);

      const seenSlugs = new Set<string>();

      for (const name of createManyTagsDto.names) {
        const trimmed = name.trim();

        if (!trimmed) continue;

        const baseSlug = generateSlug(trimmed);

        // 🔥 in-request duplicate check
        if (seenSlugs.has(baseSlug)) continue;

        seenSlugs.add(baseSlug);

        // 🔥 check if already exists in DB
        let existing = await repository.findOne({
          where: { slug: baseSlug },
        });

        if (existing) {
          tags.push(existing);
          continue;
        }

        // 🔥 ensure unique slug (edge cases)
        const finalSlug = await this.slugProvider.ensureUniqueSlug(
          repository,
          baseSlug,
        );

        const tag = repository.create({
          name: trimmed,
          slug: finalSlug,
          createdBy: { id: user.sub } as User,
        });

        tags.push(tag);
      }

      const result = await queryRunner.manager.save(tags);

      await queryRunner.commitTransaction();

      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (typeof error === 'object' && error !== null && 'code' in error) {
        const err = error as { code?: string };

        if (err.code === '23505') {
          throw new ConflictException('Duplicate tag detected');
        }
      }

      throw new ConflictException('Bulk tag creation failed', {
        description: String(error),
      });
    } finally {
      try {
        await queryRunner.release();
      } catch (error) {
        throw new RequestTimeoutException('Error releasing DB connection', {
          description: String(error),
        });
      }
    }
  }
}
