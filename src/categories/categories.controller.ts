import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CategoriesService } from './providers/categories.service';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { PatchCategoryDto } from './dtos/patch-category.dto';
import { GetCategoriesDto } from './dtos/get-categories.dto';
import { CreateBulkCategoriesDto } from './dtos/create-bulk-categories.dto';
import { Category } from './category.entity';
import { DeleteRecord } from 'src/common/interfaces/delete-record.interface';
import { Paginated } from 'src/common/pagination/interfaces/paginated.interface';
import { DeleteBulkCategoriesDto } from './dtos/delete-bulk-categories.dto';
import { ActiveUser } from 'src/auth/decorators/active-user.decorator';
import type { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';
import { CategoryType } from './enums/categoryType.enum';

@Controller('categories')
export class CategoriesController {
  constructor(
    /**
     * Inject categoriesService
     */
    private readonly categoriesService: CategoriesService,
  ) {}

  @Get()
  public async getCategories(
    @Query() getCategoriesDto: GetCategoriesDto,
  ): Promise<Paginated<Category>> {
    return await this.categoriesService.findAll(getCategoriesDto);
  }

  @Get('by-type')
  public async getCategoriesByType(
    @Query('type') type: string,
  ): Promise<Category[]> {
    return await this.categoriesService.findAllByType(
      type.toLowerCase() as CategoryType,
    );
  }

  @Get(':id')
  public async getCategoryById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Category> {
    return await this.categoriesService.findOne(id);
  }

  @Post()
  public async createCategory(
    @ActiveUser() user: ActiveUserData,
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<Category> {
    return await this.categoriesService.create(createCategoryDto, user);
  }

  @Post('bulk')
  public async createMany(
    @Body() createBulkCategoriesDto: CreateBulkCategoriesDto,
  ): Promise<Category[]> {
    return await this.categoriesService.createMany(createBulkCategoriesDto);
  }

  @Patch(':id')
  public async updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() patchCategoryDto: PatchCategoryDto,
  ): Promise<Category> {
    return await this.categoriesService.update(id, patchCategoryDto);
  }

  @Delete(':id')
  public async deleteCategory(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DeleteRecord> {
    await this.categoriesService.softDelete(id);
    return {
      message: 'Category deleted successfully',
    };
  }

  @Delete(':id/permanent')
  public async permanentDeleteCategory(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DeleteRecord> {
    await this.categoriesService.delete(id);
    return {
      message: 'Category permanently deleted successfully',
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post('bulk-delete')
  public async deleteMany(
    @Body() deleteBulkCategoriesDto: DeleteBulkCategoriesDto,
  ): Promise<DeleteRecord> {
    await this.categoriesService.deleteMany(deleteBulkCategoriesDto);
    return {
      message: 'Categories deleted successfully',
    };
  }

  @Patch(':id/restore')
  public async restoreCategory(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Category> {
    return await this.categoriesService.restore(id);
  }
}
