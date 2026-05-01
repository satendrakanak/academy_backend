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
import { ActiveUser } from 'src/auth/decorators/active-user.decorator';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { AuthType } from 'src/auth/enums/auth-type.enum';
import type { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';
import { ArticleCommentsService } from './providers/article-comments.service';
import { CreateArticleCommentDto } from './dtos/create-article-comment.dto';

@Controller('article-comments')
export class ArticleCommentsController {
  constructor(
    private readonly articleCommentsService: ArticleCommentsService,
  ) {}

  @Auth(AuthType.None)
  @Get('article/:articleId')
  getByArticle(@Param('articleId', ParseIntPipe) articleId: number) {
    return this.articleCommentsService.getByArticle(articleId);
  }

  @Get('article/:articleId/mine')
  getMineByArticle(
    @Param('articleId', ParseIntPipe) articleId: number,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.articleCommentsService.getMineByArticle(articleId, user.sub);
  }

  @Get()
  findAll() {
    return this.articleCommentsService.findAll();
  }

  @Post('article/:articleId')
  create(
    @Param('articleId', ParseIntPipe) articleId: number,
    @ActiveUser() user: ActiveUserData,
    @Body() createArticleCommentDto: CreateArticleCommentDto,
  ) {
    return this.articleCommentsService.create(
      articleId,
      user.sub,
      createArticleCommentDto,
    );
  }

  @Post(':id/replies')
  reply(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() user: ActiveUserData,
    @Body() createArticleCommentDto: CreateArticleCommentDto,
  ) {
    return this.articleCommentsService.reply(
      id,
      user.sub,
      createArticleCommentDto,
    );
  }

  @Post(':id/like')
  toggleLike(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.articleCommentsService.toggleLike(id, user.sub);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() user: ActiveUserData,
    @Body() createArticleCommentDto: CreateArticleCommentDto,
  ) {
    return this.articleCommentsService.update(
      id,
      user.sub,
      user.roles,
      createArticleCommentDto,
    );
  }

  @Delete(':id')
  delete(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.articleCommentsService.delete(id, user.sub, user.roles);
  }

  @Patch(':id/publish')
  setPublished(
    @Param('id', ParseIntPipe) id: number,
    @Query('isPublished') isPublished = 'true',
  ) {
    return this.articleCommentsService.setPublished(id, isPublished === 'true');
  }
}
