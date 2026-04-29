import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { UploadsService } from './providers/uploads.service';
import { InitUploadDto } from './dtos/init-upload.dto';

@Controller('uploads')
export class UploadsController {
  constructor(
    /**
     * Inject uploadsService
     */

    private readonly uploadsService: UploadsService,
  ) {}

  @Get()
  async getUploads() {
    return await this.uploadsService.getUploads();
  }

  @Post('init')
  initUpload(@Body() initUploadDto: InitUploadDto) {
    return this.uploadsService.initUpload(initUploadDto);
  }

  // STEP 3: confirm upload
  @Post('confirm/:id')
  confirmUpload(@Param('id') id: number) {
    return this.uploadsService.confirmUpload(Number(id));
  }

  @Delete(':id')
  async deleteFile(@Param('id', ParseIntPipe) id: number) {
    return await this.uploadsService.delete(id);
  }
}
