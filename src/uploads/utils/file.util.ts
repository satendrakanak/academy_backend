import { FileTypes } from '../enums/file-types.enum';

export function detectFileType(mime: string): FileTypes {
  if (mime.startsWith('image/')) return FileTypes.IMAGE;

  if (mime.startsWith('video/')) return FileTypes.VIDEO;

  if (mime.includes('pdf') || mime.includes('word')) return FileTypes.DOCUMENT;

  if (
    mime.includes('excel') ||
    mime.includes('spreadsheet') ||
    mime === 'text/csv'
  )
    return FileTypes.EXCEL;

  return FileTypes.OTHER;
}

export function getFolder(type: FileTypes): string {
  switch (type) {
    case FileTypes.IMAGE:
      return 'images';
    case FileTypes.VIDEO:
      return 'videos';
    case FileTypes.DOCUMENT:
      return 'documents';
    case FileTypes.EXCEL:
      return 'excels';
    default:
      return 'others';
  }
}
