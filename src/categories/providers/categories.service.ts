import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { Category } from '../category.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCategoryDto } from '../dtos/create-category.dto';
import { PatchCategoryDto } from '../dtos/patch-category.dto';
import { UpdateCategoryProvider } from './update-category.provider';
import { PaginationProvider } from 'src/common/pagination/providers/pagination.provider';
import { Paginated } from 'src/common/pagination/interfaces/paginated.interface';
import { GetCategoriesDto } from '../dtos/get-categories.dto';
import { SlugProvider } from 'src/common/slug/providers/slug.provider';
import { DeleteRecord } from 'src/common/interfaces/delete-record.interface';
import { CreateBulkCategoriesDto } from '../dtos/create-bulk-categories.dto';
import { CreateBulkCategoriesProvider } from './create-bulk-categories.provider';
import { DeleteBulkCategoriesDto } from '../dtos/delete-bulk-categories.dto';
import { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';
import { CreateCategoryProvider } from './create-category.provider';
import { CategoryType } from '../enums/categoryType.enum';
import { MediaFileMappingService } from 'src/common/media-file-mapping/providers/media-file-mapping.service';

@Injectable()
export class CategoriesService {
  constructor(
    /**
     * Inject categoryRepository
     */
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,

    /**
     * Inject createBulkCategoriesProvider
     */

    private readonly createBulkCategoriesProvider: CreateBulkCategoriesProvider,

    /**
     * Inject updateCategoryProvider
     */

    private readonly updateCategoryProvider: UpdateCategoryProvider,

    /**
     * Inject paginatedProvider
     */

    private readonly paginationProvider: PaginationProvider,

    /**
     * Inject slugProvider
     */

    private readonly slugProvider: SlugProvider,

    /**
     * Inject createCategoryProvider
     */

    private readonly createCategoryProvider: CreateCategoryProvider,

    /**
     * Inject mediaFileMappingService
     */

    private readonly mediaFileMappingService: MediaFileMappingService,
  ) {}

  public async findAll(
    getCategoriesDto: GetCategoriesDto,
  ): Promise<Paginated<Category>> {
    const result = await this.paginationProvider.paginateQuery(
      {
        limit: getCategoriesDto.limit,
        page: getCategoriesDto.page,
      },
      this.categoryRepository,
      {
        relations: ['createdBy', 'image'],
        order: {
          createdAt: 'DESC',
        },
      },
    );
    result.data = this.mediaFileMappingService.mapCategories(result.data);

    return result;
  }

  public async findAllByType(type: CategoryType): Promise<Category[]> {
    const categories = await this.categoryRepository.find({
      where: { type },
      order: { name: 'ASC' }, // 🔥 UX better
    });

    return categories;
  }

  public async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['createdBy'],
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  public async findMany(ids: number[]): Promise<Category[]> {
    return await this.categoryRepository.find({
      where: {
        id: In(ids),
      },
    });
  }

  public async create(
    createCategoryDto: CreateCategoryDto,
    user: ActiveUserData,
  ): Promise<Category> {
    return await this.createCategoryProvider.create(createCategoryDto, user);
  }

  public async createMany(
    createBulkCategoriesDto: CreateBulkCategoriesDto,
  ): Promise<Category[]> {
    return await this.createBulkCategoriesProvider.createMany(
      createBulkCategoriesDto,
    );
  }

  public async update(
    id: number,
    patchCategoryDto: PatchCategoryDto,
  ): Promise<Category> {
    return await this.updateCategoryProvider.update(id, patchCategoryDto);
  }

  public async delete(id: number): Promise<DeleteRecord> {
    const result = await this.categoryRepository.delete(id);

    if (!result.affected) {
      throw new NotFoundException('Category not found');
    }
    return {
      message: 'Category deleted successfully',
    };
  }

  public async softDelete(id: number): Promise<DeleteRecord> {
    const result = await this.categoryRepository.softDelete(id);

    if (!result.affected) {
      throw new NotFoundException('Category not found');
    }

    return {
      message: 'Category deleted successfully',
    };
  }

  public async deleteMany(
    deleteBulkCategoriesDto: DeleteBulkCategoriesDto,
  ): Promise<DeleteRecord> {
    const result = await this.categoryRepository.softDelete(
      deleteBulkCategoriesDto.ids,
    );
    if (!result.affected) {
      throw new NotFoundException('Category not found');
    }

    return {
      message: 'Categories deleted successfully',
    };
  }

  public async restore(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (!category.deletedAt) {
      throw new BadRequestException('Category is not deleted');
    }

    const existing = await this.categoryRepository.findOne({
      where: {
        slug: category.slug,
        type: category.type,
      },
    });

    if (existing) {
      const newSlug = await this.slugProvider.ensureUniqueSlug(
        this.categoryRepository,
        category.slug,
        { type: category.type },
      );

      category.slug = newSlug;
      await this.categoryRepository.save(category);
    }

    const result = await this.categoryRepository.restore(id);

    if (!result.affected) {
      throw new InternalServerErrorException('Failed to restore category');
    }
    const restoredCategory = await this.categoryRepository.findOneBy({ id });

    return restoredCategory!;
  }

  // private buildCategoryQuery(type?: CategoryType) {
  //   const qb = this.categoryRepository
  //     .createQueryBuilder('category')
  //     .leftJoinAndSelect('category.createdBy', 'createdBy');

  //   if (type) {
  //     qb.andWhere('category.type = :type', { type });
  //   }

  //   return qb;
  // }
}
