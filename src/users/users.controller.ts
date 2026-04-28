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
import { ActiveUser } from 'src/auth/decorators/active-user.decorator';
import type { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { WeeklyProgress } from 'src/user-progress/interfaces/weekly-progress.interface';
import { UpdateProfileDto } from 'src/profiles/dtos/update-profile.dto';
import { UpdateFacultyProfileDto } from 'src/profiles/dtos/update.faculty-profile.dto';

@Controller('users')
export class UsersController {
  constructor(
    /**
     * Inject usersService
     */

    private readonly usersService: UsersService,
  ) {}
  @Get('me')
  public async getMe(@ActiveUser() user: ActiveUserData): Promise<User> {
    return await this.usersService.getUserWithProfile(user.sub);
  }

  @Get('all-faculty')
  public async getAllFaculty() {
    return await this.usersService.getAllFaculty();
  }

  @Get('dashboard-stats/:id')
  getDashboardStats(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getDashboardStats(id);
  }

  @Get('weekly-progress/:id')
  getWeeklyProgress(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<WeeklyProgress[]> {
    return this.usersService.getWeeklyProgress(id);
  }

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

  //@Auth(AuthType.None)
  @Post()
  public async createUser(
    @Body()
    createUserDto: CreateUserDto,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<User> {
    console.log('Current User', currentUser);
    console.log('Create User', createUserDto);
    const result = await this.usersService.create(createUserDto, currentUser);
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

  @Patch('me')
  public async updateUser(
    @ActiveUser() user: ActiveUserData,
    @Body() patchUserDto: PatchUserDto,
  ): Promise<User> {
    return await this.usersService.update(user.sub, patchUserDto);
  }

  @Patch('update/:id')
  public async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() patchUserDto: PatchUserDto,
  ): Promise<User> {
    return await this.usersService.update(id, patchUserDto);
  }

  @Patch('update-profile/:id')
  public async updateProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<User> {
    console;
    return await this.usersService.updateUserProfile(id, updateProfileDto);
  }

  @Patch('faculty-profile/:id')
  updateFacultyProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFacultyProfileDto: UpdateFacultyProfileDto,
  ) {
    return this.usersService.updateFacultyProfile(id, updateFacultyProfileDto);
  }

  @Patch('change-password')
  async changePassword(
    @ActiveUser() user: ActiveUserData,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(user.sub, changePasswordDto);
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
