import { BadRequestException, Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as path from 'path';
import { UploadController } from './upload.controller';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const timeStamp = Date.now();
          const originalName = file.originalname.replace(/\s+/g, '-');
          const fileExtension = extname(originalName);
          cb(null, `${file.fieldname}-${timeStamp}${fileExtension}`);
        }
      }),
      limits: {fileSize: 5 * 1024 * 1024}, 
      fileFilter: function(_req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif|webp/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if(mimetype && extname){
            return cb(null, true); 
        } else {
            cb(new BadRequestException('Only image files are allowed'), false);
        }
      },
    }),
  ],
  controllers: [UploadController],
})
export class UploadModule {}
