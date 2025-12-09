import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('products/:productId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/comments',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `comment-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
        }
      },
    }),
  )
  async create(
    @Param('productId') productId: string,
    @Body('text') text: string,
    @Request() req,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!text || text.trim() === '') {
      throw new Error('Comment text is required');
    }

    const imageUrl = file ? `http://localhost:3000/uploads/comments/${file.filename}` : undefined;
    
    return this.commentsService.create(
      productId,
      req.user.username,
      { text },
      imageUrl,
    );
  }

  @Get()
  async findAll(@Param('productId') productId: string) {
    return this.commentsService.findAllByProduct(productId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/comments',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `comment-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
        }
      },
    }),
  )
  async update(
    @Param('id') id: string,
    @Body('text') text: string,
    @Request() req,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const imageUrl = file ? `http://localhost:3000/uploads/comments/${file.filename}` : undefined;
    
    return this.commentsService.update(
      id,
      req.user.username,
      { text },
      imageUrl,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @Request() req) {
    return this.commentsService.remove(id, req.user.username);
  }
}
