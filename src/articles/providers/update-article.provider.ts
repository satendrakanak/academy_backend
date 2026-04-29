import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PatchArticleDto } from '../dtos/patch-article.dto';
import { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Article } from '../article.entity';
import { Repository } from 'typeorm';
import { SlugProvider } from 'src/common/slug/providers/slug.provider';
import { generateSlug } from 'src/common/utils/slug.util';
import { UploadsService } from 'src/uploads/providers/uploads.service';
import { ArticleStatus } from '../enums/article-status.enum';
import { CategoriesService } from 'src/categories/providers/categories.service';
import { TagsService } from 'src/tags/providers/tags.service';
import { User } from 'src/users/user.entity';
import { UsersService } from 'src/users/providers/users.service';

@Injectable()
export class UpdateArticleProvider {
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

    /**
     * Inject uploadsService
     */

    private readonly uploadsService: UploadsService,

    /**
     * Inject categoriesService
     */

    private readonly categoriesService: CategoriesService,

    /**
     * Inject tagsService
     */

    private readonly tagsService: TagsService,

    /**
     * Inject usersService
     */
    private readonly usersService: UsersService,
  ) {}
  async update(
    id: number,
    patchArticleDto: PatchArticleDto,
    user: ActiveUserData,
  ) {
    const article = await this.articleRepository.findOne({
      where: { id },
      relations: [
        'categories',
        'tags',
        'createdBy',
        'updatedBy',
        'featuredImage',
      ],
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    // 🔥 Title update → slug regenerate
    let finalSlug = article.slug;
    const baseRawSlug = patchArticleDto.slug || patchArticleDto.title;
    if (baseRawSlug) {
      const baseSlug = generateSlug(baseRawSlug);
      finalSlug = await this.slugProvider.ensureUniqueSlug(
        this.articleRepository,
        baseSlug,
        {},
        id,
      );
    }
    //Image update

    if (patchArticleDto.featuredImageId !== undefined) {
      if (patchArticleDto.featuredImageId === null) {
        article.featuredImage = null;
      } else {
        const image = await this.uploadsService.getOneById(
          patchArticleDto.featuredImageId,
        );

        if (!image) {
          throw new NotFoundException('Image not found');
        }

        article.featuredImage = image;
      }
    }

    if (patchArticleDto.imageAlt !== undefined) {
      article.imageAlt = patchArticleDto.imageAlt;
    }

    // 🔥 Content update
    if (patchArticleDto.title !== undefined)
      article.title = patchArticleDto.title;
    if (patchArticleDto.content !== undefined)
      article.content = patchArticleDto.content;
    if (patchArticleDto.excerpt !== undefined)
      article.excerpt = patchArticleDto.excerpt;
    if (patchArticleDto.metaTitle !== undefined)
      article.metaTitle = patchArticleDto.metaTitle;
    if (patchArticleDto.metaDescription !== undefined)
      article.metaDescription = patchArticleDto.metaDescription;

    // 🔥 isPublished toggle
    if (patchArticleDto.isPublished !== undefined) {
      article.isPublished = patchArticleDto.isPublished;

      if (patchArticleDto.isPublished === true && !article.publishedAt) {
        article.publishedAt = new Date();
      }

      // optional: unpublish case
      if (patchArticleDto.isPublished === false) {
        article.publishedAt = null;
      }
    }

    // 🔥 isFeatured toggle
    if (patchArticleDto.isFeatured !== undefined) {
      article.isFeatured = patchArticleDto.isFeatured;
    }

    // Author update

    if (patchArticleDto.authorId !== undefined) {
      const authorData = await this.usersService.findOneById(
        patchArticleDto.authorId,
      );
      article.author = { id: authorData.id } as User;
    }

    if (patchArticleDto.categoryIds !== undefined) {
      if (patchArticleDto.categoryIds.length === 0) {
        // remove all
        article.categories = [];
      } else {
        const foundCategories = await this.categoriesService.findMany(
          patchArticleDto.categoryIds,
        );

        article.categories = foundCategories;
      }
    }

    // TAGS
    if (patchArticleDto.tagIds !== undefined) {
      // normalize incoming ids
      const incomingIds = [...new Set(patchArticleDto.tagIds)].sort(
        (a, b) => a - b,
      );

      // current DB ids
      const currentIds = (article.tags || [])
        .map((t) => t.id)
        .sort((a, b) => a - b);

      // 🔥 compare
      const isSame =
        incomingIds.length === currentIds.length &&
        incomingIds.every((id, i) => id === currentIds[i]);

      if (!isSame) {
        if (incomingIds.length === 0) {
          article.tags = [];
        } else {
          const foundTags = await this.tagsService.findMany(incomingIds);

          // safety check
          if (foundTags.length !== incomingIds.length) {
            throw new BadRequestException('Invalid tag IDs');
          }

          article.tags = foundTags;
        }
      }
    }

    article.slug = finalSlug;
    article.updatedBy = { id: user.sub } as User;

    return await this.articleRepository.save(article);
  }
}
