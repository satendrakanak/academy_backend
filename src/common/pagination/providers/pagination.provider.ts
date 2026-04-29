import { Inject, Injectable } from '@nestjs/common';
import { PaginationQueryDto } from '../dtos/pagination-query.dto';
import {
  FindManyOptions,
  FindOptionsOrder,
  ObjectLiteral,
  Repository,
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

    const baseUrl =
      this.request.protocol + '://' + this.request.headers.host + '/';
    const newUrl = new URL(this.request.url, baseUrl);

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
        first: `${newUrl.origin}${newUrl.pathname}?limit=${limit}&page=1`,
        last: `${newUrl.origin}${newUrl.pathname}?limit=${limit}&page=${totalPages}`,
        current: `${newUrl.origin}${newUrl.pathname}?limit=${limit}&page=${page}`,
        next: `${newUrl.origin}${newUrl.pathname}?limit=${limit}&page=${nextPage}`,
        previous: `${newUrl.origin}${newUrl.pathname}?limit=${limit}&page=${previousPage}`,
      },
    };

    return finalResponse;
  }
}
