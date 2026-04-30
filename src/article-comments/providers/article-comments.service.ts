import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Article } from 'src/articles/article.entity';
import { MediaFileMappingService } from 'src/common/media-file-mapping/providers/media-file-mapping.service';
import { User } from 'src/users/user.entity';
import { Repository } from 'typeorm';
import { ArticleComment } from '../article-comment.entity';
import { CreateArticleCommentDto } from '../dtos/create-article-comment.dto';

@Injectable()
export class ArticleCommentsService {
  constructor(
    @InjectRepository(ArticleComment)
    private readonly articleCommentRepository: Repository<ArticleComment>,
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly mediaFileMappingService: MediaFileMappingService,
  ) {}

  async getByArticle(articleId: number) {
    const comments = await this.articleCommentRepository.find({
      where: { article: { id: articleId }, isPublished: true },
      relations: ['user', 'user.avatar', 'likedBy', 'parent'],
      order: { createdAt: 'ASC' },
    });

    return this.buildTree(comments).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  async getMineByArticle(articleId: number, userId: number) {
    const comments = await this.articleCommentRepository.find({
      where: { article: { id: articleId }, user: { id: userId } },
      relations: ['user', 'user.avatar', 'likedBy', 'parent'],
      order: { createdAt: 'ASC' },
    });

    return comments.map((comment) => {
      this.mapCommentMedia(comment);
      comment.replies = [];
      return comment;
    });
  }

  async findAll() {
    const comments = await this.articleCommentRepository.find({
      relations: ['article', 'user', 'user.avatar', 'likedBy', 'parent'],
      order: { createdAt: 'DESC' },
    });

    return comments.map((comment) => this.mapCommentMedia(comment));
  }

  async create(
    articleId: number,
    userId: number,
    createArticleCommentDto: CreateArticleCommentDto,
  ) {
    const [article, user] = await Promise.all([
      this.articleRepository.findOne({ where: { id: articleId } }),
      this.userRepository.findOne({ where: { id: userId } }),
    ]);

    if (!article) throw new NotFoundException('Article not found');
    if (!user) throw new NotFoundException('User not found');

    const comment = this.articleCommentRepository.create({
      article,
      user,
      content: createArticleCommentDto.content.trim(),
    });

    const savedComment = await this.articleCommentRepository.save(comment);
    return this.findOneResponse(savedComment.id);
  }

  async reply(
    parentId: number,
    userId: number,
    createArticleCommentDto: CreateArticleCommentDto,
  ) {
    const [parent, user] = await Promise.all([
      this.articleCommentRepository.findOne({
        where: { id: parentId },
        relations: ['article'],
      }),
      this.userRepository.findOne({ where: { id: userId } }),
    ]);

    if (!parent) throw new NotFoundException('Comment not found');
    if (!user) throw new NotFoundException('User not found');

    const reply = this.articleCommentRepository.create({
      article: parent.article,
      parent,
      user,
      content: createArticleCommentDto.content.trim(),
    });

    const savedReply = await this.articleCommentRepository.save(reply);
    return this.findOneResponse(savedReply.id);
  }

  async toggleLike(id: number, userId: number) {
    const [comment, user] = await Promise.all([
      this.articleCommentRepository.findOne({
        where: { id },
        relations: ['likedBy'],
      }),
      this.userRepository.findOne({ where: { id: userId } }),
    ]);

    if (!comment) throw new NotFoundException('Comment not found');
    if (!user) throw new NotFoundException('User not found');

    const isLiked = comment.likedBy?.some((item) => item.id === userId);
    comment.likedBy = isLiked
      ? comment.likedBy.filter((item) => item.id !== userId)
      : [...(comment.likedBy || []), user];

    await this.articleCommentRepository.save(comment);
    return this.findOneResponse(id);
  }

  async setPublished(id: number, isPublished: boolean) {
    const comment = await this.articleCommentRepository.findOne({
      where: { id },
      relations: ['article', 'user', 'user.avatar', 'likedBy', 'parent'],
    });

    if (!comment) throw new NotFoundException('Comment not found');

    comment.isPublished = isPublished;
    const saved = await this.articleCommentRepository.save(comment);
    return this.mapCommentMedia(saved);
  }

  async update(
    id: number,
    userId: number,
    roles: string[],
    createArticleCommentDto: CreateArticleCommentDto,
  ) {
    const comment = await this.articleCommentRepository.findOne({
      where: { id },
      relations: ['article', 'user', 'user.avatar', 'likedBy', 'parent'],
    });

    if (!comment) throw new NotFoundException('Comment not found');
    if (!this.canManage(comment.user.id, userId, roles)) {
      throw new ForbiddenException('You can edit only your own comment');
    }

    comment.content = createArticleCommentDto.content.trim();
    comment.isPublished = roles.includes('admin') ? comment.isPublished : false;
    const saved = await this.articleCommentRepository.save(comment);
    return this.mapCommentMedia(saved);
  }

  async delete(id: number, userId: number, roles: string[] = []) {
    const comment = await this.articleCommentRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!comment) throw new NotFoundException('Comment not found');
    if (!this.canManage(comment.user.id, userId, roles)) {
      throw new ForbiddenException('You can delete only your own comment');
    }

    await this.articleCommentRepository.softDelete(id);
    return { message: 'Comment deleted successfully' };
  }

  private async findOneResponse(id: number) {
    const comment = await this.articleCommentRepository.findOne({
      where: { id },
      relations: ['user', 'user.avatar', 'likedBy'],
    });

    if (!comment) throw new NotFoundException('Comment not found');
    this.mapCommentMedia(comment);
    comment.replies = [];
    return comment;
  }

  private buildTree(comments: ArticleComment[]) {
    const map = new Map<number, ArticleComment>();
    const roots: ArticleComment[] = [];

    comments.forEach((comment) => {
      this.mapCommentMedia(comment);
      comment.replies = [];
      map.set(comment.id, comment);
    });

    comments.forEach((comment) => {
      const parentId = comment.parent?.id;
      if (parentId && map.has(parentId)) {
        map.get(parentId)?.replies.push(comment);
      } else {
        roots.push(comment);
      }
    });

    return roots;
  }

  private canManage(ownerId: number, userId: number, roles: string[] = []) {
    return ownerId === userId || roles.includes('admin');
  }

  private mapCommentMedia(comment: ArticleComment) {
    if (comment.user?.avatar) {
      comment.user.avatar = this.mediaFileMappingService.mapFile(
        comment.user.avatar,
      );
    }

    if (comment.article?.featuredImage) {
      comment.article.featuredImage = this.mediaFileMappingService.mapFile(
        comment.article.featuredImage,
      );
    }

    comment.likedBy = (comment.likedBy || []).map((user) => ({
      ...user,
      avatar: user.avatar ? this.mediaFileMappingService.mapFile(user.avatar) : null,
    })) as User[];

    return comment;
  }
}
