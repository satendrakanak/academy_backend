import { Injectable } from '@nestjs/common';
import { Article } from '../article.entity';
import { Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MediaFileMappingService } from 'src/common/media-file-mapping/providers/media-file-mapping.service';

@Injectable()
export class GetRelatedArticlesProvider {
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

  async getRelatedArticles(articleId: number) {
    const articles = await this.articleRepository.find({
      where: {
        isPublished: true,
        id: Not(articleId),
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
