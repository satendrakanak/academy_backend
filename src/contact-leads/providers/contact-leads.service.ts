import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';
import { Brackets, Repository } from 'typeorm';
import { ContactLead, ContactLeadStatus } from '../contact-lead.entity';
import { CreateContactLeadDto } from '../dtos/create-contact-lead.dto';
import { QueryContactLeadsDto } from '../dtos/query-contact-leads.dto';
import { UpdateContactLeadDto } from '../dtos/update-contact-lead.dto';

@Injectable()
export class ContactLeadsService {
  constructor(
    @InjectRepository(ContactLead)
    private readonly contactLeadRepository: Repository<ContactLead>,
  ) {}

  async create(
    createContactLeadDto: CreateContactLeadDto,
    currentUser?: ActiveUserData,
  ) {
    const lead = this.contactLeadRepository.create({
      ...createContactLeadDto,
      phoneNumber: createContactLeadDto.phoneNumber?.trim() || null,
      subject: createContactLeadDto.subject?.trim() || null,
      source: createContactLeadDto.source?.trim() || 'website-contact',
      pageUrl: createContactLeadDto.pageUrl?.trim() || null,
      message: createContactLeadDto.message.trim(),
      fullName: createContactLeadDto.fullName.trim(),
      email: createContactLeadDto.email.trim().toLowerCase(),
      user: currentUser?.sub ? ({ id: currentUser.sub } as never) : null,
    });

    return this.contactLeadRepository.save(lead);
  }

  async findAll(query: QueryContactLeadsDto) {
    const queryBuilder = this.contactLeadRepository
      .createQueryBuilder('lead')
      .leftJoinAndSelect('lead.user', 'user')
      .orderBy('lead.createdAt', 'DESC');

    if (query.search?.trim()) {
      const search = `%${query.search.trim().toLowerCase()}%`;
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(lead.fullName) LIKE :search', { search })
            .orWhere('LOWER(lead.email) LIKE :search', { search })
            .orWhere('LOWER(lead.phoneNumber) LIKE :search', { search })
            .orWhere('LOWER(lead.subject) LIKE :search', { search })
            .orWhere('LOWER(lead.message) LIKE :search', { search });
        }),
      );
    }

    if (query.status) {
      queryBuilder.andWhere('lead.status = :status', { status: query.status });
    }

    if (query.dateFrom) {
      queryBuilder.andWhere('DATE(lead.createdAt) >= :dateFrom', {
        dateFrom: query.dateFrom,
      });
    }

    if (query.dateTo) {
      queryBuilder.andWhere('DATE(lead.createdAt) <= :dateTo', {
        dateTo: query.dateTo,
      });
    }

    return queryBuilder.getMany();
  }

  async update(id: number, payload: UpdateContactLeadDto) {
    const lead = await this.contactLeadRepository.findOneByOrFail({ id });

    if (payload.status !== undefined) {
      lead.status = payload.status;
    }

    if (payload.adminNotes !== undefined) {
      lead.adminNotes = payload.adminNotes?.trim() || null;
    }

    return this.contactLeadRepository.save(lead);
  }

  getStatuses() {
    return Object.values(ContactLeadStatus);
  }
}
