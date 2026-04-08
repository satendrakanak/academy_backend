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
import { UsersService } from './providers/users.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { User } from './user.entity';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { AuthType } from 'src/auth/enums/auth-type.enum';
import { GetUsersDto } from './dtos/get-users.dto';
import { Paginated } from 'src/common/pagination/interfaces/paginated.interface';
import { CreateBulkUsersDto } from './dtos/create-bulk-users.dto';
import { PatchUserDto } from './dtos/patch-user.dto';
import { DeleteRecord } from 'src/common/interfaces/delete-record.interface';
import { DeleteBulkUsersDto } from './dtos/delete-bulk-users.dto';

@Auth(AuthType.None)
@Controller('users')
export class UsersController {
  constructor(
    /**
     * Inject usersService
     */

    private readonly usersService: UsersService,
  ) {}

  @Get()
  public async getUsers(
    @Query() getUsersDto: GetUsersDto,
  ): Promise<Paginated<User>> {
    return await this.usersService.findAll(getUsersDto);
  }

  @Get(':id')
  public async getUserById(@Param('id', ParseIntPipe) id: number) {
    return await this.usersService.findOneById(id);
  }

  @Auth(AuthType.None)
  @Post()
  public async createUser(
    @Body()
    createUserDto: CreateUserDto,
  ): Promise<User> {
    const result = await this.usersService.create(createUserDto);
    return result;
  }

  @Auth(AuthType.None)
  @Post('bulk')
  public async createBulkUsers(
    @Body()
    createBulkUsersDto: CreateBulkUsersDto,
  ): Promise<User[]> {
    const result = await this.usersService.createMany(createBulkUsersDto);
    return result;
  }

  @Auth(AuthType.None)
  @Patch(':id')
  public async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() patchUserDto: PatchUserDto,
  ): Promise<User> {
    return await this.usersService.update(id, patchUserDto);
  }

  @Delete(':id')
  public async deleteUser(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DeleteRecord> {
    return await this.usersService.softDelete(id);
  }

  @Delete(':id/permanent')
  public async permanentDeleteUser(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DeleteRecord> {
    return await this.usersService.delete(id);
  }

  @HttpCode(HttpStatus.OK)
  @Post('bulk-delete')
  public async deleteBulkUsers(
    @Body() deleteBulkUsersDto: DeleteBulkUsersDto,
  ): Promise<DeleteRecord> {
    return await this.usersService.deleteMany(deleteBulkUsersDto);
  }

  @Patch(':id/restore')
  public async restoreUser(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<User> {
    return await this.usersService.restore(id);
  }
}
