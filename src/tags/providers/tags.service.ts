import { Injectable, NotFoundException } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { Tag } from '../tag.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTagDto } from '../dtos/create-tag-dto';
import { CreateTagProvider } from './create-tag.provider';
import { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';
import { CreateManyTagsDto } from '../dtos/create-many-tags.dto';
import { CreateManyTagsProvider } from './create-many-tags.provider';
import { PatchTagDto } from '../dtos/patch-tag.dto';
import { UpdateTagProvider } from './update-tag.provider';
import { DeleteRecord } from 'src/common/interfaces/delete-record.interface';

@Injectable()
export class TagsService {
  constructor(
    /**
     * Inject tagsRepository
     */

    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,

    /**
     * Inject createTagProvider
     */

    private readonly createTagProvider: CreateTagProvider,

    /**
     * Inject updateTagProvider
     */

    private readonly updateTagProvider: UpdateTagProvider,

    /**
     * Inject createManyTagsProvider
     */

    private readonly createManyTagsProvider: CreateManyTagsProvider,
  ) {}
  async findAll() {
    return this.tagsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }
  async findOne(id: number) {
    return this.tagsRepository.findOneBy({ id });
  }

  public async findMany(ids: number[]): Promise<Tag[]> {
    return this.tagsRepository.findBy({
      id: In(ids),
    });
  }
  async create(createTagDto: CreateTagDto, user: ActiveUserData): Promise<Tag> {
    return await this.createTagProvider.create(createTagDto, user);
  }
  async createMany(
    createManyTagsDto: CreateManyTagsDto,
    user: ActiveUserData,
  ): Promise<Tag[]> {
    return await this.createManyTagsProvider.createMany(
      createManyTagsDto,
      user,
    );
  }
  async update(id: number, patchTagDto: PatchTagDto): Promise<Tag> {
    return await this.updateTagProvider.update(id, patchTagDto);
  }
  async delete(id: number): Promise<DeleteRecord> {
    const result = await this.tagsRepository.delete(id);

    if (!result.affected) {
      throw new NotFoundException('Tag not found');
    }
    return {
      message: 'Tag deleted successfully',
    };
  }
  async restore() {}
  async softDelete() {}
}
