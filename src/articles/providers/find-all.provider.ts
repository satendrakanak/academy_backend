import { Injectable } from '@nestjs/common';
import { Article } from '../article.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { GetArticlesDto } from '../dtos/get-articles.dto';
import { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';
import { Paginated } from 'src/common/pagination/interfaces/paginated.interface';
import { MediaFileMappingService } from 'src/common/media-file-mapping/providers/media-file-mapping.service';
import { PaginationProvider } from 'src/common/pagination/providers/pagination.provider';

@Injectable()
export class FindAllProvider {
  constructor(
    /**
     * Inject articleRepository
     */

    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,

    /**
     * Inject mediaFileMappingService
     */

    private readonly mediaFileMappingService: MediaFileMappingService,

    /**
     * Inject paginationProvider
     */

    private readonly paginationProvider: PaginationProvider,
  ) {}

  public async findAll(
    getArticlesDto: GetArticlesDto,
    user?: ActiveUserData,
  ): Promise<Paginated<Article> | Article[]> {
    /**
     * 🔥 NO PAGINATION (website case)
     */
    if (getArticlesDto.isPublished) {
      const articles = await this.articleRepository.find({
        where: {
          isPublished: true,
        },
        relations: [
          'createdBy',
          'updatedBy',
          'featuredImage',
          'categories',
          'tags',
        ],
        order: {
          createdAt: 'DESC',
        },
      });

      const mapped = this.mediaFileMappingService.mapArticles(articles);

      return mapped;
    }

    /**
     * 🔥 PAGINATION (admin case)
     */
    const result = await this.paginationProvider.paginateQuery(
      {
        limit: getArticlesDto.limit ?? 10,
        page: getArticlesDto.page ?? 1,
      },
      this.articleRepository,
      {
        relations: ['featuredImage', 'categories', 'tags'],
        order: {
          createdAt: 'DESC',
        },
      },
    );

    result.data = this.mediaFileMappingService.mapArticles(result.data);

    return result;
  }
}
