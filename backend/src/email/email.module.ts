import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailSchedulerService } from './email-scheduler.service';
import { EmailController } from './email.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [EmailController],
  providers: [EmailService, EmailSchedulerService, PrismaService],
  exports: [EmailService],
})
export class EmailModule {}
