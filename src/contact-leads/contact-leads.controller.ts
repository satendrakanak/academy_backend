import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ActiveUser } from 'src/auth/decorators/active-user.decorator';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { AuthType } from 'src/auth/enums/auth-type.enum';
import type { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';
import { CreateContactLeadDto } from './dtos/create-contact-lead.dto';
import { QueryContactLeadsDto } from './dtos/query-contact-leads.dto';
import { UpdateContactLeadDto } from './dtos/update-contact-lead.dto';
import { ContactLeadsService } from './providers/contact-leads.service';

@Controller('contact-leads')
export class ContactLeadsController {
  constructor(private readonly contactLeadsService: ContactLeadsService) {}

  @Auth(AuthType.Optional)
  @Post()
  create(
    @Body() createContactLeadDto: CreateContactLeadDto,
    @ActiveUser() currentUser?: ActiveUserData,
  ) {
    return this.contactLeadsService.create(createContactLeadDto, currentUser);
  }

  @Get()
  findAll(@Query() query: QueryContactLeadsDto) {
    return this.contactLeadsService.findAll(query);
  }

  @Get('statuses')
  getStatuses() {
    return this.contactLeadsService.getStatuses();
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateContactLeadDto,
  ) {
    return this.contactLeadsService.update(id, payload);
  }
}
