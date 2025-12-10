import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  body: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.example.com',
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER || 'user',
        pass: process.env.SMTP_PASS || 'pass',
      },
    });
  }

  /**
   * Send an email notification
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      if (!process.env.SMTP_HOST) {
        this.logger.warn('SMTP configuration missing. Email not sent.');
        this.logger.log(`
          ============ EMAIL MOCK ============
          To: ${options.to}
          Subject: ${options.subject}
          Body: ${options.body}
          ====================================
        `);
        return;
      }

      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || '"No Reply" <noreply@example.com>',
        to: options.to,
        subject: options.subject,
        text: options.body, // Using text for now as bodies are plain text
      });

      this.logger.log(`Email sent to ${options.to}: ${options.subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}`, error);
    }
  }

  /**
   * Send order confirmation email to customer
   */
  async sendOrderConfirmation(
    email: string,
    orderNumber: string,
    totalAmount: number,
    items: any[],
  ): Promise<void> {
    const itemsList = items
      .map(
        (item) =>
          `- ${item.product.name} x${item.quantity} @ Rp ${item.price.toLocaleString()}`,
      )
      .join('\n');

    const body = `
      Hello!
      
      Your order ${orderNumber} has been confirmed.
      
      Order Details:
      ${itemsList}
      
      Total: Rp ${totalAmount.toLocaleString()}
      
      Thank you for your purchase!
    `;

    await this.sendEmail({
      to: email,
      subject: `Order Confirmation - ${orderNumber}`,
      body,
    });
  }

  /**
   * Send order status update email to customer
   */
  async sendOrderStatusUpdate(
    email: string,
    orderNumber: string,
    oldStatus: string,
    newStatus: string,
  ): Promise<void> {
    const statusMessages = {
      PENDING: 'Your order is pending confirmation.',
      PROCESSING: 'Your order is being processed.',
      SHIPPED: 'Your order has been shipped!',
      DELIVERED: 'Your order has been delivered.',
      CANCELLED: 'Your order has been cancelled.',
    };

    const body = `
      Hello!
      
      Your order ${orderNumber} status has been updated.
      
      Previous Status: ${oldStatus}
      New Status: ${newStatus}
      
      ${statusMessages[newStatus] || ''}
      
      Thank you for shopping with us!
    `;

    await this.sendEmail({
      to: email,
      subject: `Order ${orderNumber} - Status Update`,
      body,
    });
  }

  /**
   * Send low stock alert to seller
   */
  async sendLowStockAlert(
    sellerEmail: string,
    productName: string,
    currentStock: number,
  ): Promise<void> {
    const body = `
      Hello!
      
      ALERT: Your product "${productName}" is running low on stock.
      
      Current Stock: ${currentStock} units
      
      Please restock this product to avoid running out of inventory.
      
      You can update the stock from your seller dashboard.
    `;

    await this.sendEmail({
      to: sellerEmail,
      subject: `Low Stock Alert - ${productName}`,
      body,
    });
  }

  /**
   * Send out of stock notification to seller
   */
  async sendOutOfStockAlert(
    sellerEmail: string,
    productName: string,
  ): Promise<void> {
    const body = `
      Hello!
      
      URGENT: Your product "${productName}" is now OUT OF STOCK!
      
      This product is no longer available for purchase.
      Please restock immediately to resume sales.
      
      You can update the stock from your seller dashboard.
    `;

    await this.sendEmail({
      to: sellerEmail,
      subject: `OUT OF STOCK Alert - ${productName}`,
      body,
    });
  }

  /**
   * Send new order notification to seller
   */
  async sendNewOrderNotificationToSeller(
    sellerEmail: string,
    orderNumber: string,
    items: any[],
    totalAmount: number,
  ): Promise<void> {
    const itemsList = items
      .map(
        (item) =>
          `- ${item.product.name} x${item.quantity} @ Rp ${item.price.toLocaleString()}`,
      )
      .join('\n');

    const body = `
      Hello!
      
      You have received a new order: ${orderNumber}
      
      Items:
      ${itemsList}
      
      Total: Rp ${totalAmount.toLocaleString()}
      
      Please process this order from your seller dashboard.
    `;

    await this.sendEmail({
      to: sellerEmail,
      subject: `New Order - ${orderNumber}`,
      body,
    });
  }

  /**
   * Send weekly sales summary report to seller
   */
  async sendWeeklySalesSummary(
    sellerEmail: string,
    sellerUsername: string,
    summary: {
      totalRevenue: number;
      totalOrders: number;
      totalItemsSold: number;
      topProducts: Array<{ name: string; quantity: number; revenue: number }>;
      weekStart: Date;
      weekEnd: Date;
    },
  ): Promise<void> {
    const topProductsList = summary.topProducts
      .map(
        (product, index) =>
          `${index + 1}. ${product.name}: ${product.quantity} sold, Rp ${product.revenue.toLocaleString()} revenue`,
      )
      .join('\n');

    const body = `
      Hello ${sellerUsername}!
      
      Here's your weekly sales summary:
      
      Period: ${summary.weekStart.toLocaleDateString()} - ${summary.weekEnd.toLocaleDateString()}
      
      📊 Sales Overview:
      - Total Revenue: Rp ${summary.totalRevenue.toLocaleString()}
      - Total Orders: ${summary.totalOrders}
      - Total Items Sold: ${summary.totalItemsSold}
      
      🏆 Top Selling Products:
      ${topProductsList || 'No sales this week'}
      
      Keep up the great work!
      
      View detailed analytics in your seller dashboard.
    `;

    await this.sendEmail({
      to: sellerEmail,
      subject: `Weekly Sales Summary - ${summary.weekStart.toLocaleDateString()}`,
      body,
    });
  }
}
