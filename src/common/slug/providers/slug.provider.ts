import { Injectable } from '@nestjs/common';
import { FindOptionsWhere, Not, ObjectLiteral, Repository } from 'typeorm';

@Injectable()
export class SlugProvider {
  public async ensureUniqueSlug<T extends ObjectLiteral>(
    repository: Repository<T>,
    slug: string,
    where?: FindOptionsWhere<T>,
    currentId?: number,
  ): Promise<string> {
    let uniqueSlug = slug;
    let count = 2;

    while (true) {
      const condition = {
        ...(where || {}),
        slug: uniqueSlug,
        ...(currentId ? { id: Not(currentId) } : {}),
      } as FindOptionsWhere<T>;
      const existing = await repository.findOne({
        where: condition,
      });
      if (!existing) return uniqueSlug;
      uniqueSlug = `${slug}-${count++}`;
    }
  }
}
