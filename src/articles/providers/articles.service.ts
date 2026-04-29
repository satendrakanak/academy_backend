import { Injectable, NotFoundException } from '@nestjs/common';
import { Article } from '../article.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateArticleProvider } from './create-article.provider';
import { UpdateArticleProvider } from './update-article.provider';
import { CreateArticleDto } from '../dtos/create-article.dto';
import { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';
import { FindOneByIdProvider } from './find-one-by-id.provider';
import { FindOneBySlugProvider } from './find-one-by-slug.provider';
import { FindAllProvider } from './find-all.provider';
import { GetArticlesDto } from '../dtos/get-articles.dto';
import { Paginated } from 'src/common/pagination/interfaces/paginated.interface';
import { GetFeaturedArticlesProvider } from './get-featured-articles.provider';
import { GetRelatedArticlesProvider } from './get-related-articles.provider';
import { PatchArticleDto } from '../dtos/patch-article.dto';

@Injectable()
export class ArticlesService {
  constructor(
    /**
     * Inject articleRepository
     */
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    /**
     * Inject createArticleProvider
     */
    private readonly createArticleProvider: CreateArticleProvider,
    /**
     * Inject updateArticleProvider
     */
    private readonly updateArticleProvider: UpdateArticleProvider,

    /**
     * Inject findOneByIdProvider
     */

    private readonly findOneByIdProvider: FindOneByIdProvider,

    /**
     * Inject findOneBySlugProvider
     */

    private readonly findOneBySlugProvider: FindOneBySlugProvider,

    /**
     * Inject findAllProvider
     */

    private readonly findAllProvider: FindAllProvider,

    /**
     * Inject getFeaturedArticlesProvider
     */

    private readonly getFeaturedArticlesProvider: GetFeaturedArticlesProvider,

    /**
     * Inject getRelatedArticlesProvider
     */
    private readonly getRelatedArticlesProvider: GetRelatedArticlesProvider,
  ) {}

  async findAll(
    getArticlesDto: GetArticlesDto,
    user?: ActiveUserData,
  ): Promise<Paginated<Article> | Article[]> {
    return await this.findAllProvider.findAll(getArticlesDto, user);
  }

  async findOneById(id: number): Promise<Article> {
    return await this.findOneByIdProvider.findOneById(id);
  }

  async findOneBySlug(slug: string): Promise<Article> {
    return await this.findOneBySlugProvider.findOneBySlug(slug);
  }

  async getFeaturedArticles(): Promise<Article[]> {
    return await this.getFeaturedArticlesProvider.getFeaturedArticles();
  }

  async getRelatedArticles(articleId: number): Promise<Article[]> {
    return await this.getRelatedArticlesProvider.getRelatedArticles(articleId);
  }

  async create(createArticleDto: CreateArticleDto, user: ActiveUserData) {
    return await this.createArticleProvider.create(createArticleDto, user);
  }

  async update(
    id: number,
    patchArticleDto: PatchArticleDto,
    user: ActiveUserData,
  ) {
    return await this.updateArticleProvider.update(id, patchArticleDto, user);
  }

  public async delete(id: number) {
    const result = await this.articleRepository.delete(id);

    if (!result.affected) {
      throw new NotFoundException('Article not found');
    }
    return {
      message: 'Article deleted successfully',
    };
  }
}
