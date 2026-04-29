import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ArticlesService } from './providers/articles.service';
import { CreateArticleDto } from './dtos/create-article.dto';
import type { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';
import { GetArticlesDto } from './dtos/get-articles.dto';
import { Paginated } from 'src/common/pagination/interfaces/paginated.interface';
import { Article } from './article.entity';
import { ActiveUser } from 'src/auth/decorators/active-user.decorator';
import { PatchArticleDto } from './dtos/patch-article.dto';

@Controller('articles')
export class ArticlesController {
  constructor(
    /**
     * Inject articlesService
     */
    private readonly articlesService: ArticlesService,
  ) {}

  @Get()
  async findAll(
    @Query() getArticlesDto: GetArticlesDto,
    @ActiveUser() user: ActiveUserData,
  ): Promise<Paginated<Article> | Article[]> {
    return await this.articlesService.findAll(getArticlesDto, user);
  }

  @Get('featured')
  async getFeaturedArticles(): Promise<Article[]> {
    return await this.articlesService.getFeaturedArticles();
  }

  @Get('related/:id')
  async getRelatedArticles(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Article[]> {
    return await this.articlesService.getRelatedArticles(id);
  }

  @Get('slug/:slug')
  async findOneBySlug(@Param('slug') slug: string): Promise<Article> {
    return await this.articlesService.findOneBySlug(slug);
  }

  @Get(':id')
  async findOneById(@Param('id', ParseIntPipe) id: number): Promise<Article> {
    return await this.articlesService.findOneById(id);
  }

  @Post()
  async create(
    @Body() createArticleDto: CreateArticleDto,
    @ActiveUser() user: ActiveUserData,
  ): Promise<Article> {
    return await this.articlesService.create(createArticleDto, user);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() patchArticleDto: PatchArticleDto,
    @ActiveUser() user: ActiveUserData,
  ) {
    return await this.articlesService.update(id, patchArticleDto, user);
  }

  @Delete(':id')
  public async delete(@Param('id', ParseIntPipe) id: number) {
    return await this.articlesService.delete(id);
  }
}
