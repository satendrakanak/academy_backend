import { Controller } from '@nestjs/common';
import { EnrollmentsService } from './providers/enrollments.service';

@Controller('enrollments')
export class EnrollmentsController {
  constructor(
    /**
     * Inject enrollmentsService
     */
    private readonly enrollmentsService: EnrollmentsService,
  ) {}
}
