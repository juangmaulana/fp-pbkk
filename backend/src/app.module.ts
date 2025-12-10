import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PostsModule } from './posts/posts.module';
import { ProductsModule } from './products/products.module';
import { UploadModule } from './upload/upload.module';
import { CommentsModule } from './comments/comments.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PostsModule,
    AuthModule,
    ProductsModule,
    UploadModule,
    CommentsModule,
    CartModule,
    OrdersModule,
    DashboardModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
