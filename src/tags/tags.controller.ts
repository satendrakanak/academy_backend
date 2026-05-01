import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { TagsService } from './providers/tags.service';
import { CreateTagDto } from './dtos/create-tag-dto';
import type { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';
import { ActiveUser } from 'src/auth/decorators/active-user.decorator';
import { CreateManyTagsDto } from './dtos/create-many-tags.dto';
import { PatchTagDto } from './dtos/patch-tag.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { AuthType } from 'src/auth/enums/auth-type.enum';

@Controller('tags')
export class TagsController {
  constructor(
    /**
     * Inject tagsService
     */

    private readonly tagsService: TagsService,
  ) {}

  @Auth(AuthType.None)
  @Get()
  async findAll() {
    const result = await this.tagsService.findAll();
    return result;
  }

  @Auth(AuthType.None)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.tagsService.findOne(id);
  }

  @Post()
  async create(
    @ActiveUser() user: ActiveUserData,
    @Body() createTagDto: CreateTagDto,
  ) {
    return await this.tagsService.create(createTagDto, user);
  }
  @Post('bulk')
  async createMany(
    @ActiveUser() user: ActiveUserData,
    @Body() createManyTagsDto: CreateManyTagsDto,
  ) {
    return await this.tagsService.createMany(createManyTagsDto, user);
  }

  @Patch(':id')
  async updateTag(
    @Param('id', ParseIntPipe) id: number,
    @Body() patchTagDto: PatchTagDto,
  ) {
    return await this.tagsService.update(id, patchTagDto);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return await this.tagsService.delete(id);
  }
}
