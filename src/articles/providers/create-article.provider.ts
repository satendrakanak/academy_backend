import { Injectable } from '@nestjs/common';
import { Article } from '../article.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateArticleDto } from '../dtos/create-article.dto';
import { generateSlug } from 'src/common/utils/slug.util';
import { SlugProvider } from 'src/common/slug/providers/slug.provider';
import { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';
import { User } from 'src/users/user.entity';

@Injectable()
export class CreateArticleProvider {
  constructor(
    /**
     * Inject articleRepository
     */

    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,

    /**
     * Inject slugProvider
     */

    private readonly slugProvider: SlugProvider,
  ) {}

  async create(createArticleDto: CreateArticleDto, user: ActiveUserData) {
    const baseSlug = generateSlug(
      createArticleDto.slug ?? createArticleDto.title,
    );
    const finalSlug = await this.slugProvider.ensureUniqueSlug(
      this.articleRepository,
      baseSlug,
    );

    const article = this.articleRepository.create({
      title: createArticleDto.title,
      slug: finalSlug,
      author: { id: user.sub } as User,
      createdBy: { id: user.sub } as User,
    });

    return await this.articleRepository.save(article);
  }
}
