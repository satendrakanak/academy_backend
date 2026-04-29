import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Article } from '../article.entity';
import { Repository } from 'typeorm';
import { MediaFileMappingService } from 'src/common/media-file-mapping/providers/media-file-mapping.service';

@Injectable()
export class FindOneByIdProvider {
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

  public async findOneById(id: number): Promise<Article> {
    const article = await this.articleRepository.findOne({
      where: { id },
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
