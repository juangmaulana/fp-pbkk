import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getSellerDashboard(sellerId: string, period: 'daily' | 'weekly' | 'monthly' = 'daily') {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    // Get orders containing seller's products
    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
        items: {
          some: {
            product: {
              sellerId,
            },
          },
        },
      },
      include: {
        items: {
          where: {
            product: {
              sellerId,
            },
          },
          include: {
            product: true,
          },
        },
      },
    });

    // Calculate total revenue and order count
    let totalRevenue = 0;
    let orderCount = orders.length;
    const productSales: { [key: string]: { name: string; quantity: number; revenue: number } } = {};

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const revenue = item.price * item.quantity;
        totalRevenue += revenue;

        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.product.name,
            quantity: 0,
            revenue: 0,
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += revenue;
      });
    });

    // Top selling products
    const topProducts = Object.entries(productSales)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Low stock alerts
    const lowStockProducts = await this.prisma.product.findMany({
      where: {
        sellerId,
        stock: { lt: 10 },
        isAvailable: true,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
      },
      orderBy: {
        stock: 'asc',
      },
    });

    // Order status breakdown
    const statusBreakdown = await this.prisma.order.groupBy({
      by: ['status'],
      where: {
        items: {
          some: {
            product: {
              sellerId,
            },
          },
        },
      },
      _count: true,
    });

    // Sales trends (daily breakdown for the period)
    const salesTrends = await this.getSalesTrends(sellerId, startDate, now);

    return {
      period,
      summary: {
        totalRevenue,
        orderCount,
      },
      topProducts,
      lowStockProducts,
      statusBreakdown: statusBreakdown.map((item) => ({
        status: item.status,
        count: item._count,
      })),
      salesTrends,
    };
  }

  private async getSalesTrends(sellerId: string, startDate: Date, endDate: Date) {
    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        items: {
          some: {
            product: {
              sellerId,
            },
          },
        },
      },
      include: {
        items: {
          where: {
            product: {
              sellerId,
            },
          },
        },
      },
    });

    // Group by date
    const trendsByDate: { [key: string]: { revenue: number; orders: number } } = {};

    orders.forEach((order) => {
      const dateKey = order.createdAt.toISOString().split('T')[0];
      if (!trendsByDate[dateKey]) {
        trendsByDate[dateKey] = { revenue: 0, orders: 0 };
      }

      const orderRevenue = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      trendsByDate[dateKey].revenue += orderRevenue;
      trendsByDate[dateKey].orders += 1;
    });

    return Object.entries(trendsByDate).map(([date, data]) => ({
      date,
      ...data,
    })).sort((a, b) => a.date.localeCompare(b.date));
  }

  async getInventoryStatus(sellerId: string) {
    const products = await this.prisma.product.findMany({
      where: { sellerId },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        isAvailable: true,
      },
    });

    const totalProducts = products.length;
    const lowStock = products.filter((p) => p.stock < 10 && p.isAvailable).length;
    const outOfStock = products.filter((p) => p.stock === 0).length;

    return {
      totalProducts,
      lowStock,
      outOfStock,
      products: products.map((p) => ({
        ...p,
        status:
          p.stock === 0
            ? 'out_of_stock'
            : p.stock < 10
              ? 'low_stock'
              : 'in_stock',
      })),
    };
  }
}
