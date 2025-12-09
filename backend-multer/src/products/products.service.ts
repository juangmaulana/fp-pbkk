import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto, SortBy } from './dto/query-products.dto';
import { PaginatedProductsResponseDto, ProductResponseDto } from './dto/product-response.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto): Promise<ProductResponseDto> {
    const product = await this.prisma.product.create({
      data: createProductDto,
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

  async update(id: string, updateProductDto: UpdateProductDto): Promise<ProductResponseDto> {
    const product = await this.prisma.product.update({
      where: { id },
      data: updateProductDto,
    });
    return this.mapToResponse(product);
  }

  async remove(id: string): Promise<void> {
    await this.prisma.product.delete({
      where: { id },
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
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      stock: product.stock,
      imageUrl: product.imageUrl,
      images: product.images ? JSON.parse(product.images) : undefined,
      isAvailable: product.isAvailable,
      popularity: product.popularity,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
