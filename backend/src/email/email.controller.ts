import { Controller, Post, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmailSchedulerService } from './email-scheduler.service';

@Controller('email')
export class EmailController {
  constructor(private emailSchedulerService: EmailSchedulerService) { }

  /**
   * Manual trigger for weekly sales summary (for testing)
   * Only accessible by authenticated users
   */
  @UseGuards(JwtAuthGuard)
  @Post('trigger-weekly-summary')
  async triggerWeeklySummary(@Req() req: any) {
    await this.emailSchedulerService.triggerWeeklySalesSummaryManually(
      req.user.username,
    );
    return {
      message: 'Weekly sales summary emails are being sent...',
    };
  }
}
