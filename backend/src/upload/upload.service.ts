import { Injectable, BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

@Injectable()
export class UploadService {
  private readonly uploadPath = './uploads';

  constructor() {
    // Create uploads directory if it doesn't exist
    if (!existsSync(this.uploadPath)) {
      mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  validateFile(file: Express.Multer.File) {
    // Allowed file types
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Allowed types: JPEG, PNG, GIF, WEBP, PDF, DOC, DOCX',
      );
    }

    // Max file size: 5MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    return true;
  }

  getFileUrl(filename: string): string {
    return `/uploads/${filename}`;
  }

  getFilePath(filename: string): string {
    return join(this.uploadPath, filename);
  }
}
