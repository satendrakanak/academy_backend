import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiHeaders, ApiOperation } from '@nestjs/swagger';
import type { Express } from 'express';
import { UploadsService } from './providers/uploads.service';

@Controller('uploads')
export class UploadsController {
  constructor(
    /**
     * Inject uploadsService
     */

    private readonly uploadsService: UploadsService,
  ) {}

  @UseInterceptors(FileInterceptor('file'))
  @Post('file')
  @ApiHeaders([
    {
      name: 'Content-Type',
      description: 'multipart/form-data',
    },
    {
      name: 'Authorization',
      description: 'Bearer token',
    },
  ])
  @ApiOperation({
    summary: 'Upload a file to the server',
  })
  public async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return await this.uploadsService.uploadFile(file);
  }
}
