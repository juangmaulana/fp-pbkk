export class ProductResponseDto {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  imageUrl?: string;
  images?: string[];
  isAvailable: boolean;
  popularity: number;
  createdAt: Date;
  updatedAt: Date;
}

export class PaginatedProductsResponseDto {
  data: ProductResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
