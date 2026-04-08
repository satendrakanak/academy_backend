import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from '../category.entity';
import { Repository } from 'typeorm';
import { SlugProvider } from 'src/common/slug/providers/slug.provider';
import { CreateCategoryDto } from '../dtos/create-category.dto';
import { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';
import { generateSlug } from 'src/common/utils/slug.util';
import { User } from 'src/users/user.entity';

@Injectable()
export class CreateCategoryProvider {
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
  public async create(
    createCategoryDto: CreateCategoryDto,
    user: ActiveUserData,
  ): Promise<Category> {
    try {
      const baseSlug = generateSlug(
        createCategoryDto.slug ?? createCategoryDto.name,
      );
      const finalSlug = await this.slugProvider.ensureUniqueSlug(
        this.categoryRepository,
        baseSlug,
        { type: createCategoryDto.type },
      );

      const category = this.categoryRepository.create({
        ...createCategoryDto,
        slug: finalSlug,
        createdBy: { id: user.sub } as User,
      });
      return await this.categoryRepository.save(category);
    } catch (error) {
      if (error.code === '23505') {
        throw new BadRequestException('Slug already exists');
      }

      throw new InternalServerErrorException('Failed to create category', {
        description: error.message,
      });
    }
  }
}
