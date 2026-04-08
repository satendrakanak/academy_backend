import {
  ConflictException,
  Injectable,
  RequestTimeoutException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateBulkCategoriesDto } from '../dtos/create-bulk-categories.dto';
import { Category } from '../category.entity';
import { generateSlug } from 'src/common/utils/slug.util';
import { SlugProvider } from 'src/common/slug/providers/slug.provider';

@Injectable()
export class CreateBulkCategoriesProvider {
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
    createBulkCategoriesDto: CreateBulkCategoriesDto,
  ): Promise<Category[]> {
    let newCategories: Category[] = [];
    //create queryRunner Instance
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      //Connect queryRunner to datasource
      await queryRunner.connect();
      //Start Transaction
      await queryRunner.startTransaction();
    } catch (error) {
      throw new RequestTimeoutException(
        'Unable to process your request at the moment, please try again later',
        {
          description: 'Error in connnecting to database',
        },
      );
    }

    //Run Query
    try {
      const seenSlugs = new Set<string>();
      const repository = queryRunner.manager.getRepository(Category);
      for (const category of createBulkCategoriesDto.categories) {
        const type = category.type;
        // Generate base slug
        const baseSlug = generateSlug(category.slug || category.name);
        const key = `${baseSlug}-${type}`;
        // In-request duplicate check
        if (seenSlugs.has(key)) {
          throw new ConflictException(`Duplicate slug in request: ${baseSlug}`);
        }

        seenSlugs.add(key);

        // DB unique slug
        const finalSlug = await this.slugProvider.ensureUniqueSlug(
          repository,
          baseSlug,
          { type },
        );

        let newCategory = repository.create({
          ...category,
          slug: finalSlug,
        });
        newCategories.push(newCategory);
      }
      const result = await queryRunner.manager.save(newCategories);
      //If successfull Commit Transaction
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      //Else Rollback Transaction
      await queryRunner.rollbackTransaction();
      if (error.code === '23505') {
        throw new ConflictException('Duplicate entry detected');
      }

      throw new ConflictException('Bulk create failed', {
        description: String(error),
      });
    } finally {
      try {
        //Release connection
        await queryRunner.release();
      } catch (error) {
        throw new RequestTimeoutException(
          'Unable to process your request at the moment, please try again later',
          {
            description: String(error),
          },
        );
      }
    }
  }
}
