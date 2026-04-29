import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Article } from '../article.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MediaFileMappingService } from 'src/common/media-file-mapping/providers/media-file-mapping.service';

@Injectable()
export class FindOneBySlugProvider {
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

  public async findOneBySlug(slug: string): Promise<Article> {
    const article = await this.articleRepository.findOne({
      where: { slug },
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

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return this.mediaFileMappingService.mapArticle(article);
  }
}
