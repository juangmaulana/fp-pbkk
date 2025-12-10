import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EmailService } from '../email/email.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto, SortBy } from './dto/query-products.dto';
import { PaginatedProductsResponseDto, ProductResponseDto } from './dto/product-response.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  private generateSKU(category: string, name: string): string {
    const categoryCode = category.substring(0, 3).toUpperCase();
    const nameCode = name.substring(0, 3).toUpperCase().replace(/\s/g, '');
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${categoryCode}-${nameCode}-${timestamp}-${random}`;
  }

  async create(sellerId: string, createProductDto: CreateProductDto, imageUrls?: string[]): Promise<ProductResponseDto> {
    const sku = this.generateSKU(createProductDto.category, createProductDto.name);
    
    const product = await this.prisma.product.create({
      data: {
        ...createProductDto,
        sku,
        sellerId,
        images: imageUrls && imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
        imageUrl: imageUrls && imageUrls.length > 0 ? imageUrls[0] : createProductDto.imageUrl,
      },
    });
    return this.mapToResponse(product);
  }

  async findAll(query: QueryProductsDto): Promise<PaginatedProductsResponseDto> {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      minPrice,
      maxPrice,
      isAvailable,
      sellerId,
      sortBy = SortBy.NEWEST,
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Category filter
    if (category) {
      where.category = category;
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice;
      }
    }

    // Availability filter
    if (isAvailable !== undefined) {
      where.isAvailable = isAvailable;
    }

    // Seller filter
    if (sellerId) {
      where.sellerId = sellerId;
    }

    // Build orderBy clause
    let orderBy: any = {};
    switch (sortBy) {
      case SortBy.PRICE_ASC:
        orderBy = { price: 'asc' };
        break;
      case SortBy.PRICE_DESC:
        orderBy = { price: 'desc' };
        break;
      case SortBy.POPULARITY:
        orderBy = { popularity: 'desc' };
        break;
      case SortBy.NEWEST:
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    // Execute queries
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: products.map((p) => this.mapToResponse(p)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: string): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });
    
    if (!product) {
      throw new Error('Product not found');
    }

    return this.mapToResponse(product);
  }

  async update(id: string, sellerId: string, updateProductDto: UpdateProductDto, imageUrls?: string[]): Promise<ProductResponseDto> {
    // Verify ownership
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Product not found');
    }
    if (existing.sellerId !== sellerId) {
      throw new Error('Unauthorized to update this product');
    }

    const updateData: any = { ...updateProductDto };
    if (imageUrls && imageUrls.length > 0) {
      updateData.images = JSON.stringify(imageUrls);
      updateData.imageUrl = imageUrls[0];
    }

    const product = await this.prisma.product.update({
      where: { id },
      data: updateData,
    });
    return this.mapToResponse(product);
  }

  async remove(id: string, sellerId: string): Promise<void> {
    // Verify ownership
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Product not found');
    }
    if (existing.sellerId !== sellerId) {
      throw new Error('Unauthorized to delete this product');
    }

    await this.prisma.product.delete({
      where: { id },
    });
  }

  async updateStock(id: string, sellerId: string, stock: number): Promise<ProductResponseDto> {
    // Verify ownership
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Product not found');
    }
    if (existing.sellerId !== sellerId) {
      throw new Error('Unauthorized');
    }

    const oldStock = existing.stock;

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        stock,
        isAvailable: stock > 0,
      },
    });

    // Get seller email
    const seller = await this.prisma.user.findUnique({
      where: { username: sellerId },
      select: { email: true },
    });

    if (seller) {
      // Send low stock alert if stock is below threshold (10 units)
      if (stock > 0 && stock < 10 && oldStock >= 10) {
        await this.emailService.sendLowStockAlert(
          seller.email,
          product.name,
          stock,
        );
      }

      // Send out of stock alert if stock reached 0
      if (stock === 0 && oldStock > 0) {
        await this.emailService.sendOutOfStockAlert(
          seller.email,
          product.name,
        );
      }
    }

    return this.mapToResponse(product);
  }

  async getLowStockProducts(sellerId: string, threshold: number = 10) {
    return this.prisma.product.findMany({
      where: {
        sellerId,
        stock: { lt: threshold },
        isAvailable: true,
      },
      orderBy: {
        stock: 'asc',
      },
    });
  }

  async getCategories(): Promise<string[]> {
    const products = await this.prisma.product.findMany({
      select: { category: true },
      distinct: ['category'],
    });
    return products.map((p) => p.category);
  }

  private mapToResponse(product: any): ProductResponseDto {
    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      stock: product.stock,
      imageUrl: product.imageUrl,
      images: product.images ? JSON.parse(product.images) : undefined,
      isAvailable: product.isAvailable,
      popularity: product.popularity,
      sellerId: product.sellerId,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
