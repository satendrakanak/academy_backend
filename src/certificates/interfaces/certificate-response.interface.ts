import { Upload } from 'src/uploads/upload.entity';

export interface CertificateResponse {
  id: number;
  certificateNumber: string;
  issuedAt: Date;
  emailedAt?: Date | null;
  file?: Upload | null;
  course: {
    id: number;
    title: string;
    slug: string;
  };
  user: {
    id: number;
    firstName: string;
    lastName?: string;
    email: string;
  };
}
