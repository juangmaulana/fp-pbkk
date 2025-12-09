import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
  Get,
  Param,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UploadService } from './upload.service';
import type { Response } from 'express';
import { existsSync } from 'fs';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    this.uploadService.validateFile(file);

    return {
      message: 'File uploaded successfully',
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      url: this.uploadService.getFileUrl(file.filename),
    };
  }

  @Post('document')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  uploadDocument(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    this.uploadService.validateFile(file);

    return {
      message: 'Document uploaded successfully',
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      url: this.uploadService.getFileUrl(file.filename),
    };
  }

  @Get(':filename')
  serveFile(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = this.uploadService.getFilePath(filename);

    if (!existsSync(filePath)) {
      throw new BadRequestException('File not found');
    }

    return res.sendFile(filePath, { root: '.' });
  }
}
