import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from '../category.entity';
import { Repository } from 'typeorm';
import { PatchCategoryDto } from '../dtos/patch-category.dto';
import { SlugProvider } from 'src/common/slug/providers/slug.provider';
import { generateSlug } from 'src/common/utils/slug.util';

@Injectable()
export class UpdateCategoryProvider {
  constructor(
    /**
     * Inject categoryRepository
     */
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,

    /**
     * Inject slugProvider
     */

    private readonly slugProvider: SlugProvider,
  ) {}

  public async update(
    id: number,
    patchCategoryDto: PatchCategoryDto,
  ): Promise<Category> {
    const category = await this.categoryRepository.findOneBy({
      id,
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    try {
      let finalSlug = category.slug;
      const baseRawSlug = patchCategoryDto.slug || patchCategoryDto.name;
      if (baseRawSlug) {
        const baseSlug = generateSlug(baseRawSlug);
        finalSlug = await this.slugProvider.ensureUniqueSlug(
          this.categoryRepository,
          baseSlug,
          { type: patchCategoryDto.type || category.type },
          id,
        );
      }

      Object.assign(category, patchCategoryDto);
      category.slug = finalSlug;

      return await this.categoryRepository.save(category);
    } catch (error) {
      throw new InternalServerErrorException('Failed to update category');
    }
  }
}
