import { Injectable, NotFoundException } from '@nestjs/common';
import { Lecture } from '../lecture.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateLectureDto } from '../dtos/create-lecture.dto';
import { CreateLectureProvider } from './create-lecture.provider';
import { UpdateLectureProvider } from './update-lecture.provider';
import { PatchLectureDto } from '../dtos/patch-lecture.dto';
import { DeleteRecord } from 'src/common/interfaces/delete-record.interface';
import { ReorderLecturesArrayDto } from '../dtos/reorder-lectures.dto';

@Injectable()
export class LecturesService {
  constructor(
    /**
     * Inject lectureRepository
     */
    @InjectRepository(Lecture)
    private readonly lectureRepository: Repository<Lecture>,

    /**
     * Inject createLectureProvider
     */

    private readonly createLectureProvider: CreateLectureProvider,

    /**
     * Inject updateLectureProvider
     */

    private readonly updateLectureProvider: UpdateLectureProvider,
  ) {}

  async findAll(): Promise<Lecture[]> {
    const chapters = await this.lectureRepository.find({
      relations: ['chapter', 'video'],
    });

    return chapters;
  }

  async findOne(id: number): Promise<Lecture> {
    const result = await this.lectureRepository.findOne({
      where: {
        id,
      },
      relations: ['chapter', 'video'],
    });

    if (!result) {
      throw new NotFoundException('Lecture not found');
    }

    return result;
  }
  async create(createLectureDto: CreateLectureDto): Promise<Lecture> {
    return await this.createLectureProvider.create(createLectureDto);
  }

  async update(id: number, patchLectureDto: PatchLectureDto): Promise<Lecture> {
    return await this.updateLectureProvider.update(id, patchLectureDto);
  }

  async reorder(
    reorderLecturesArrayDto: ReorderLecturesArrayDto,
  ): Promise<void> {
    await this.lectureRepository.manager.transaction(async (manager) => {
      for (const item of reorderLecturesArrayDto.items) {
        await manager.update(Lecture, item.id, {
          position: item.position,
        });
      }
    });
  }

  async delete(id: number): Promise<DeleteRecord> {
    const result = await this.lectureRepository.delete(id);

    if (!result.affected) {
      throw new NotFoundException('Lecture not found');
    }
    return {
      message: 'Lecture deleted successfully',
    };
  }
}
