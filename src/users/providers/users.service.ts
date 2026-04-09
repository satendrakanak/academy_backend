import { BadRequestException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from '../dtos/create-user.dto';
import { CreateUserProvider } from './create-user.provider';
import { FindOneByEmailProvider } from './find-one-by-email.provider';
import { FindOneByIdProvider } from './find-one-by-id.provider';
import { PaginationProvider } from 'src/common/pagination/providers/pagination.provider';
import { GetUsersDto } from '../dtos/get-users.dto';
import { Paginated } from 'src/common/pagination/interfaces/paginated.interface';
import { CreateBulkUsersDto } from '../dtos/create-bulk-users.dto';
import { CreateBulkUsersProvider } from './create-bulk-users.provider';
import { PatchUserDto } from '../dtos/patch-user.dto';
import { UpdateUserProvider } from './update-user.provider';
import { DeleteRecord } from 'src/common/interfaces/delete-record.interface';
import { DeleteBulkUsersDto } from '../dtos/delete-bulk-users.dto';
import { RestoreUserProvider } from './restore-user.provider';
import { DeleteUserProvider } from './delete-user.provider';
import { MarkEmailVerifiedProvider } from './mark-email-verified.provider';
import { UpdatePasswordProvider } from './update-password.provider';

@Injectable()
export class UsersService {
  constructor(
    /**
     * Inject userRepository
     */

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    /**
     * Inject createUserProvider
     */
    private readonly createUserprovider: CreateUserProvider,

    /**
     * Inject createBulkUsersProvider
     */

    private readonly createBulkUsersProvider: CreateBulkUsersProvider,

    /**
     * Inject updateUserProvider
     */
    private readonly updateUserProvider: UpdateUserProvider,

    /**
     * Inject findOneByEmailProvider
     */
    private readonly findOneByEmailProvider: FindOneByEmailProvider,

    /**
     * Inject findOneByIdProvider
     */
    private readonly findOneByIdProvider: FindOneByIdProvider,

    /**
     * Inject paginatedProvider
     */

    private readonly paginationProvider: PaginationProvider,

    /**
     * Inject deleteUserProvider
     */

    private readonly deleteUserProvider: DeleteUserProvider,

    /**
     * Inject restoreUserProvider
     */
    private readonly restoreUserProvider: RestoreUserProvider,

    /**
     * Inject markEmailVerifiedProvider
     */

    private readonly markEmailVerifiedProvider: MarkEmailVerifiedProvider,

    /**
     * Inject updatePasswordProvider
     */

    private readonly updatePasswordProvider: UpdatePasswordProvider,
  ) {}

  public async findAll(getUsersDto: GetUsersDto): Promise<Paginated<User>> {
    return await this.paginationProvider.paginateQuery(
      {
        limit: getUsersDto.limit,
        page: getUsersDto.page,
      },
      this.userRepository,
    );
  }

  public async findOneById(id: number): Promise<User> {
    return await this.findOneByIdProvider.findOneById(id);
  }

  public async findOneByEmail(email: string): Promise<User> {
    return await this.findOneByEmailProvider.findOneByEmail(email);
  }

  public async create(createUserDto: CreateUserDto): Promise<User> {
    return await this.createUserprovider.create(createUserDto);
  }

  public async createMany(
    createBulkUsersDto: CreateBulkUsersDto,
  ): Promise<User[]> {
    return await this.createBulkUsersProvider.createMany(createBulkUsersDto);
  }

  public async update(id: number, patchUserDto: PatchUserDto): Promise<User> {
    return await this.updateUserProvider.update(id, patchUserDto);
  }

  public async delete(id: number): Promise<DeleteRecord> {
    return await this.deleteUserProvider.delete(id);
  }

  public async softDelete(id: number): Promise<DeleteRecord> {
    return await this.deleteUserProvider.softDelete(id);
  }

  public async deleteMany(
    deleteBulkUsersDto: DeleteBulkUsersDto,
  ): Promise<DeleteRecord> {
    return await this.deleteUserProvider.deleteMany(deleteBulkUsersDto);
  }

  public async restore(id: number): Promise<User> {
    return await this.restoreUserProvider.restore(id);
  }

  async markEmailVerified(userId: number): Promise<User> {
    return await this.markEmailVerifiedProvider.markEmailVerified(userId);
  }
  async updatePassword(
    userId: number,
    password: string,
    confirmPassword: string,
  ): Promise<User> {
    return await this.updatePasswordProvider.updatePassword(
      userId,
      password,
      confirmPassword,
    );
  }
}
