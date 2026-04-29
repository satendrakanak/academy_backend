import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { AuthType } from 'src/auth/enums/auth-type.enum';
import { Paginated } from 'src/common/pagination/interfaces/paginated.interface';
import { CreateTestimonialDto } from './dtos/create-testimonial.dto';
import { GetTestimonialsDto } from './dtos/get-testimonials.dto';
import { UpdateTestimonialDto } from './dtos/update-testimonial.dto';
import { Testimonial } from './testimonial.entity';
import { TestimonialsService } from './providers/testimonials.service';

@Controller('testimonials')
export class TestimonialsController {
  constructor(private readonly testimonialsService: TestimonialsService) {}

  @Auth(AuthType.None)
  @Get('public')
  async findPublic(
    @Query() getTestimonialsDto: GetTestimonialsDto,
  ): Promise<Paginated<Testimonial>> {
    return await this.testimonialsService.findPublic(getTestimonialsDto);
  }

  @Auth(AuthType.None)
  @Get('featured')
  async getFeatured(@Query('limit') limit = 10): Promise<Testimonial[]> {
    return await this.testimonialsService.getFeatured(limit);
  }

  @Auth(AuthType.None)
  @Get('public/:id')
  async findPublicById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Testimonial> {
    return await this.testimonialsService.findPublicById(id);
  }

  @Get()
  async findAll(
    @Query() getTestimonialsDto: GetTestimonialsDto,
  ): Promise<Paginated<Testimonial>> {
    return await this.testimonialsService.findAll(getTestimonialsDto);
  }

  @Get(':id')
  async findOneById(@Param('id', ParseUUIDPipe) id: string) {
    return await this.testimonialsService.findOneById(id);
  }

  @Auth(AuthType.None)
  @Post()
  async create(
    @Body() createTestimonialDto: CreateTestimonialDto,
  ): Promise<Testimonial> {
    return await this.testimonialsService.create(createTestimonialDto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTestimonialDto: UpdateTestimonialDto,
  ): Promise<Testimonial> {
    return await this.testimonialsService.update(id, updateTestimonialDto);
  }

  @Delete(':id')
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return await this.testimonialsService.delete(id);
  }
}
