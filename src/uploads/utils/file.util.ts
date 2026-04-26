import { BadRequestException } from '@nestjs/common';
import { FileTypes } from '../enums/file-types.enum';
import * as path from 'path';

export function getFolderFromType(type: FileTypes): string {
  switch (type) {
    case FileTypes.IMAGE:
      return 'images';
    case FileTypes.VIDEO:
      return 'videos';
    case FileTypes.CSV:
    case FileTypes.EXCEL:
    case FileTypes.PDF:
    case FileTypes.DOC:
      return 'documents';
  }
}

export function getDatePath(): string {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}/${month}/${day}`;
}

export function generateFileName(originalName: string): string {
  const extension = path.extname(originalName);
  const name = originalName
    .split('.')[0]
    .replace(/\s+/g, '-')
    .toLowerCase()
    .trim();

  const timestamp = Date.now(); // optional but recommended

  return `${name}-${timestamp}${extension}`;
}
export function getFileType(mime: string): FileTypes {
  if (mime.startsWith('image/')) return FileTypes.IMAGE;

  if (mime.startsWith('video/')) return FileTypes.VIDEO;

  if (mime === 'text/csv') return FileTypes.CSV;

  if (
    mime === 'application/vnd.ms-excel' ||
    mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) {
    return FileTypes.EXCEL;
  }

  if (mime === 'application/pdf') return FileTypes.PDF;

  if (
    mime === 'application/msword' ||
    mime ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return FileTypes.DOC;
  }

  throw new BadRequestException('Unsupported file type');
}
