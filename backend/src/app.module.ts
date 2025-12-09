import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PostsModule } from './posts/posts.module';
import { S3Module } from './s3/s3.module';
import { ProductsModule } from './products/products.module';
import { UploadModule } from './upload/upload.module';
import { CommentsModule } from './comments/comments.module';

@Module({
  imports: [PostsModule, AuthModule, S3Module, ProductsModule, UploadModule, CommentsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
