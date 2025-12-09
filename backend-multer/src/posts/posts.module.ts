import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { PrismaService } from '../prisma.service';
import { MulterModule } from '@nestjs/platform-express'; 

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads', 
    }),
  ],
  controllers: [PostsController],
  providers: [PostsService, PrismaService],
})
export class PostsModule {}