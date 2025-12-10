import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EmailService } from '../email/email.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) { }

  private generateOrderNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `ORD-${timestamp}-${random}`;
  }

  async createOrder(userId: string, createOrderDto: CreateOrderDto) {
    // Get user's cart
    const cart = await this.prisma.cart.findFirst({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new Error('Cart is empty');
    }

    // Validate stock and calculate total
    let totalAmount = 0;
    for (const item of cart.items) {
      if (!item.product.isAvailable) {
        throw new Error(`Product ${item.product.name} is no longer available`);
      }
      if (item.product.stock < item.quantity) {
        throw new Error(
          `Insufficient stock for ${item.product.name}. Only ${item.product.stock} available`,
        );
      }
      totalAmount += item.product.price * item.quantity;
    }

    // Create order and order items, update stock
    const order = await this.prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber: this.generateOrderNumber(),
          userId,
          shippingAddress: createOrderDto.shippingAddress,
          totalAmount,
          status: OrderStatus.PENDING,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // Update product stock and check for low/out of stock
      for (const item of cart.items) {
        const product = await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        // Check if stock is low or out using the updated product stock
        // We need to do this asynchronously after the transaction or collect them to send later
        // Since we are inside a transaction, we can't await the email sending here if it might fail, 
        // but our email service is fire-and-forget (not awaited in a way that blocks transaction unless failure).
        // Best practice: Store these events to trigger after transaction commits, but for simplicity we'll 
        // collect the data and trigger email service after the transaction block.
        // HOWEVER, since we're in the same service method, I'll collect the triggers.
      }

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return newOrder;
    });

    // Post-transaction notifications

    // Check for low stock alerts separately to avoid locking or transaction issues
    // We fetch the updated products to check current stock
    for (const item of cart.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        select: { id: true, name: true, stock: true, sellerId: true },
      });

      if (product) {
        const seller = await this.prisma.user.findUnique({
          where: { username: product.sellerId },
          select: { email: true },
        });

        if (seller) {
          if (product.stock === 0) {
            await this.emailService.sendOutOfStockAlert(seller.email, product.name);
          } else if (product.stock < 10) {
            await this.emailService.sendLowStockAlert(seller.email, product.name, product.stock);
          }
        }
      }
    }

    // Get user email for notification
    const user = await this.prisma.user.findUnique({
      where: { username: userId },
      select: { email: true },
    });

    // Send order confirmation email to customer
    if (user) {
      await this.emailService.sendOrderConfirmation(
        user.email,
        order.orderNumber,
        order.totalAmount,
        order.items,
      );
    }

    // Send notifications to sellers for products in the order
    const sellerNotifications = new Map<string, any[]>();
    for (const item of order.items) {
      const sellerId = item.product.sellerId;
      if (!sellerNotifications.has(sellerId)) {
        sellerNotifications.set(sellerId, []);
      }
      sellerNotifications.get(sellerId)!.push(item);
    }

    for (const [sellerId, items] of sellerNotifications) {
      const seller = await this.prisma.user.findUnique({
        where: { username: sellerId },
        select: { email: true },
      });

      if (seller) {
        const sellerTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        await this.emailService.sendNewOrderNotificationToSeller(
          seller.email,
          order.orderNumber,
          items,
          sellerTotal,
        );
      }
    }

    return order;
  }

  async getMyOrders(
    userId: string,
    status?: OrderStatus,
    startDate?: Date,
    endDate?: Date,
    page: number = 1,
    limit: number = 10,
  ) {
    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrderById(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            username: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    return order;
  }

  async cancelOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new Error('Only pending orders can be cancelled');
    }

    // Restore stock and update order status
    await this.prisma.$transaction(async (tx) => {
      // Restore stock
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }

      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
      });
    });

    return { message: 'Order cancelled successfully' };
  }

  // Seller methods
  async getSellerOrders(
    sellerId: string,
    status?: OrderStatus,
    page: number = 1,
    limit: number = 10,
  ) {
    // Get all orders that contain seller's products
    const where: any = {
      items: {
        some: {
          product: {
            sellerId,
          },
        },
      },
    };

    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
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
          user: {
            select: {
              username: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateOrderStatus(
    sellerId: string,
    orderId: string,
    updateDto: UpdateOrderStatusDto,
  ) {
    // Verify seller owns products in this order
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        items: {
          some: {
            product: {
              sellerId,
            },
          },
        },
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new Error('Order not found or unauthorized');
    }

    const oldStatus = order.status;

    // If cancelling order, restore stock using transaction
    if (updateDto.status === OrderStatus.CANCELLED && oldStatus !== OrderStatus.CANCELLED) {
      const updatedOrder = await this.prisma.$transaction(async (tx) => {
        // Restore stock for all items in the order
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }

        // Update order status
        return await tx.order.update({
          where: { id: orderId },
          data: { status: updateDto.status },
          include: {
            items: {
              include: {
                product: true,
              },
            },
            user: {
              select: {
                username: true,
                email: true,
              },
            },
          },
        });
      });

      // Send email notification to customer about status change
      await this.emailService.sendOrderStatusUpdate(
        updatedOrder.user.email,
        updatedOrder.orderNumber,
        oldStatus,
        updateDto.status,
      );

      return updatedOrder;
    }

    // Normal status update (no stock restoration needed)
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: updateDto.status },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            username: true,
            email: true,
          },
        },
      },
    });

    // Send email notification to customer about status change
    await this.emailService.sendOrderStatusUpdate(
      updatedOrder.user.email,
      updatedOrder.orderNumber,
      oldStatus,
      updateDto.status,
    );

    return updatedOrder;
  }
}
