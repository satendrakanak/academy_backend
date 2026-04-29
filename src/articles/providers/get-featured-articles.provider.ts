import { Injectable } from '@nestjs/common';
import { Article } from '../article.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MediaFileMappingService } from 'src/common/media-file-mapping/providers/media-file-mapping.service';

@Injectable()
export class GetFeaturedArticlesProvider {
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
  ) {}

  async getFeaturedArticles(): Promise<Article[]> {
    const articles = await this.articleRepository.find({
      where: {
        isFeatured: true,
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
}
