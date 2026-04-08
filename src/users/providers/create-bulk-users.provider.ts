import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  RequestTimeoutException,
} from '@nestjs/common';
import { User } from '../user.entity';
import { DataSource, QueryFailedError } from 'typeorm';
import { HashingProvider } from 'src/auth/providers/hashing.provider';
import { CreateBulkUsersDto } from '../dtos/create-bulk-users.dto';

@Injectable()
export class CreateBulkUsersProvider {
  constructor(
    /**
     * Inject hashingProvider
     */
    @Inject(forwardRef(() => HashingProvider))
    private readonly hashingProvider: HashingProvider,

    /**
     * Inject dataSource
     */
    private readonly dataSource: DataSource,
  ) {}

  public async createMany(
    createBulkUsersDto: CreateBulkUsersDto,
  ): Promise<User[]> {
    //create queryRunner Instance
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      //Connect queryRunner to datasource
      await queryRunner.connect();
      //Start Transaction
      await queryRunner.startTransaction();
    } catch (error) {
      throw new RequestTimeoutException(
        'Unable to process your request at the moment, please try again later',
        {
          description: 'Error in connnecting to database',
        },
      );
    }
    //Run Query
    try {
      const newUsers = await Promise.all(
        createBulkUsersDto.users.map(async (user) => {
          return queryRunner.manager.create(User, {
            ...user,
            password: await this.hashingProvider.hashPassword(user.password),
          });
        }),
      );
      const result = await queryRunner.manager.save(newUsers);
      //If successfull Commit Transaction
      await queryRunner.commitTransaction();
      return result;
    } catch (error: unknown) {
      //Else Rollback Transaction
      await queryRunner.rollbackTransaction();
      if (
        error instanceof QueryFailedError &&
        (error as QueryFailedError & { code?: string }).code === '23505'
      ) {
        throw new ConflictException('Email or phone already exists');
      }

      throw new ConflictException('Bulk create failed');
    } finally {
      try {
        //Release connection
      } catch (error) {
        throw new RequestTimeoutException(
          'Unable to process your request at the moment, please try again later',
          {
            description: String(error),
          },
        );
      }
    }
  }
}
