import { Inject, Injectable } from '@nestjs/common';
import { PaginationQueryDto } from '../dtos/pagination-query.dto';
import {
  FindManyOptions,
  FindOptionsOrder,
  ObjectLiteral,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { Paginated } from '../interfaces/paginated.interface';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
@Injectable()
export class PaginationProvider {
  constructor(
    /**
     * Injecting Request
     */

    @Inject(REQUEST)
    private readonly request: Request,
  ) {}

  public async paginateQuery<T extends ObjectLiteral>(
    paginateQuery: PaginationQueryDto,
    repository: Repository<T>,
    findOptions?: FindManyOptions<T>,
  ): Promise<Paginated<T>> {
    const { page = 1, limit = 10, sortBy, sortOrder } = paginateQuery;
    let order: FindOptionsOrder<T> | undefined;

    const allowedSortFields: (keyof T)[] = ['name', 'createdAt'];

    if (sortBy && allowedSortFields.includes(sortBy as keyof T)) {
      order = {} as FindOptionsOrder<T>;
      (order as Record<string, any>)[sortBy] = sortOrder;
    }
    const mergedOrder = {
      ...(findOptions?.order || {}),
      ...(order || {}),
    } as FindOptionsOrder<T>;
    const [results, totalItems] = await repository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      ...findOptions,
      order: mergedOrder,
    });

    /**
     * create the request Urls
     */

    const newUrl = this.createRequestUrl();

    /**
     * Calculating the total number of pages
     */

    //const totalItems = await repository.count();
    const totalPages = Math.ceil(totalItems / limit);
    const nextPage = page === totalPages ? page : page + 1;
    const previousPage = page === 1 ? page : page - 1;

    const finalResponse: Paginated<T> = {
      data: results,
      meta: {
        itemsPerPage: limit,
        totalItems: totalItems,
        currentPage: page,
        totalPages: totalPages,
      },
      links: {
        first: this.buildPageLink(newUrl, limit, 1),
        last: this.buildPageLink(newUrl, limit, totalPages || 1),
        current: this.buildPageLink(newUrl, limit, page),
        next: this.buildPageLink(newUrl, limit, nextPage),
        previous: this.buildPageLink(newUrl, limit, previousPage),
      },
    };

    return finalResponse;
  }

  public async paginateQueryBuilder<T extends ObjectLiteral>(
    paginateQuery: PaginationQueryDto,
    queryBuilder: SelectQueryBuilder<T>,
  ): Promise<Paginated<T>> {
    const { page = 1, limit = 10 } = paginateQuery;
    const [results, totalItems] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(totalItems / limit);
    const nextPage = page === totalPages ? page : page + 1;
    const previousPage = page === 1 ? page : page - 1;
    const newUrl = this.createRequestUrl();

    return {
      data: results,
      meta: {
        itemsPerPage: limit,
        totalItems,
        currentPage: page,
        totalPages,
      },
      links: {
        first: this.buildPageLink(newUrl, limit, 1),
        last: this.buildPageLink(newUrl, limit, totalPages || 1),
        current: this.buildPageLink(newUrl, limit, page),
        next: this.buildPageLink(newUrl, limit, nextPage),
        previous: this.buildPageLink(newUrl, limit, previousPage),
      },
    };
  }

  private createRequestUrl() {
    const baseUrl =
      this.request.protocol + '://' + this.request.headers.host + '/';
    return new URL(this.request.url, baseUrl);
  }

  private buildPageLink(url: URL, limit: number, page: number) {
    const nextUrl = new URL(url.toString());
    nextUrl.searchParams.set('limit', String(limit));
    nextUrl.searchParams.set('page', String(page));
    return nextUrl.toString();
  }
}
