import { Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ActiveUser } from 'src/auth/decorators/active-user.decorator';
import type { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';
import { CertificatesService } from './providers/certificates.service';

@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Get('my')
  findMine(@ActiveUser() user: ActiveUserData) {
    return this.certificatesService.findMine(user.sub);
  }

  @Get('course/:courseId')
  findForCourse(
    @ActiveUser() user: ActiveUserData,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    return this.certificatesService.findForCourse(user.sub, courseId);
  }

  @Post('course/:courseId/generate')
  generateForCourse(
    @ActiveUser() user: ActiveUserData,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    return this.certificatesService.generateForCourse(user.sub, courseId);
  }
}
