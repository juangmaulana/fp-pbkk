import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { EmailService } from './email.service';

@Injectable()
export class EmailSchedulerService {
  private readonly logger = new Logger(EmailSchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) { }

  /**
   * Send weekly sales summary every Monday at 9 AM
   */
  @Cron(CronExpression.EVERY_WEEK, {
    name: 'weekly-sales-summary',
    timeZone: 'Asia/Jakarta',
  })
  async sendWeeklySalesSummary(targetUsername?: string) {
    this.logger.log(
      `Starting weekly sales summary email process${targetUsername ? ` for user: ${targetUsername}` : ''
      }...`,
    );

    try {
      // Get all sellers (or specific seller if target is provided)
      const whereClause: any = {
        OR: [{ role: 'SELLER' }, { role: 'ADMIN' }],
      };

      if (targetUsername) {
        whereClause.username = targetUsername;
      }

      const sellers = await this.prisma.user.findMany({
        where: whereClause,
      });

      // Calculate date range (last 7 days)
      const weekEnd = new Date();
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);

      for (const seller of sellers) {
        // Get orders containing seller's products in the past week
        const orders = await this.prisma.order.findMany({
          where: {
            createdAt: {
              gte: weekStart,
              lte: weekEnd,
            },
            items: {
              some: {
                product: {
                  sellerId: seller.username,
                },
              },
            },
            status: {
              not: 'CANCELLED',
            },
          },
          include: {
            items: {
              where: {
                product: {
                  sellerId: seller.username,
                },
              },
              include: {
                product: true,
              },
            },
          },
        });

        if (orders.length === 0) {
          this.logger.log(
            `No sales for seller ${seller.username} in the past week`,
          );
          continue;
        }

        // Calculate statistics
        let totalRevenue = 0;
        let totalItemsSold = 0;
        const productSales = new Map<
          string,
          { name: string; quantity: number; revenue: number }
        >();

        for (const order of orders) {
          for (const item of order.items) {
            const itemRevenue = item.price * item.quantity;
            totalRevenue += itemRevenue;
            totalItemsSold += item.quantity;

            // Track product sales
            const productId = item.productId;
            if (productSales.has(productId)) {
              const existing = productSales.get(productId)!;
              existing.quantity += item.quantity;
              existing.revenue += itemRevenue;
            } else {
              productSales.set(productId, {
                name: item.product.name,
                quantity: item.quantity,
                revenue: itemRevenue,
              });
            }
          }
        }

        // Get top 5 products
        const topProducts = Array.from(productSales.values())
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

        // Send email
        await this.emailService.sendWeeklySalesSummary(
          seller.email,
          seller.username,
          {
            totalRevenue,
            totalOrders: orders.length,
            totalItemsSold,
            topProducts,
            weekStart,
            weekEnd,
          },
        );

        this.logger.log(
          `Weekly sales summary sent to ${seller.email} - Revenue: Rp ${totalRevenue.toLocaleString()}`,
        );
      }

      this.logger.log('Weekly sales summary email process completed');
    } catch (error) {
      this.logger.error('Error sending weekly sales summary:', error);
    }
  }

  /**
   * Manual trigger for testing (can be called via API endpoint)
   */
  async triggerWeeklySalesSummaryManually(username?: string) {
    this.logger.log('Manually triggering weekly sales summary...');
    await this.sendWeeklySalesSummary(username);
  }
}
