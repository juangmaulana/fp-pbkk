import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PostsModule } from './posts/posts.module';
import { UploadModule } from './upload/upload.module';
import { ProductsModule } from './products/products.module';
import { CommentsModule } from './comments/comments.module';

@Module({
  imports: [PostsModule, AuthModule, UploadModule, ProductsModule, CommentsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
