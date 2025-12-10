import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('seller')
  async getSellerDashboard(
    @Request() req,
    @Query('period') period?: 'daily' | 'weekly' | 'monthly',
  ) {
    return this.dashboardService.getSellerDashboard(req.user.username, period);
  }

  @Get('inventory')
  async getInventoryStatus(@Request() req) {
    return this.dashboardService.getInventoryStatus(req.user.username);
  }
}
