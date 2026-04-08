import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteRecord } from 'src/common/interfaces/delete-record.interface';
import { User } from '../user.entity';
import { Repository } from 'typeorm';
import { DeleteBulkUsersDto } from '../dtos/delete-bulk-users.dto';

@Injectable()
export class DeleteUserProvider {
  constructor(
    /**
     * Inject userRepository
     */

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  public async delete(id: number): Promise<DeleteRecord> {
    const result = await this.userRepository.delete(id);

    if (!result.affected) {
      throw new NotFoundException('User not found');
    }
    return {
      message: 'User deleted successfully',
    };
  }

  public async softDelete(id: number): Promise<DeleteRecord> {
    const result = await this.userRepository.softDelete(id);

    if (!result.affected) {
      throw new NotFoundException('User not found');
    }

    return {
      message: 'User deleted successfully',
    };
  }

  public async deleteMany(
    deleteBulkUsersDto: DeleteBulkUsersDto,
  ): Promise<DeleteRecord> {
    const result = await this.userRepository.softDelete(deleteBulkUsersDto.ids);
    if (!result.affected) {
      throw new NotFoundException('User not found');
    }

    return {
      message: 'Users deleted successfully',
    };
  }
}
