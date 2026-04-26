import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Tag } from '../tag.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PatchTagDto } from '../dtos/patch-tag.dto';
import { generateSlug } from 'src/common/utils/slug.util';
import { SlugProvider } from 'src/common/slug/providers/slug.provider';

@Injectable()
export class UpdateTagProvider {
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

  async update(id: number, patchTagDto: PatchTagDto) {
    const tag = await this.tagsRepository.findOneBy({ id });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    try {
      let finalSlug = tag.slug;
      const baseRawSlug = patchTagDto.slug || patchTagDto.name;
      if (baseRawSlug) {
        const baseSlug = generateSlug(baseRawSlug);
        finalSlug = await this.slugProvider.ensureUniqueSlug(
          this.tagsRepository,
          baseSlug,
          {},
          id,
        );
      }

      Object.assign(tag, patchTagDto);
      tag.slug = finalSlug;

      return await this.tagsRepository.save(tag);
    } catch (error) {
      throw new InternalServerErrorException('Failed to update tag');
    }
  }
}
