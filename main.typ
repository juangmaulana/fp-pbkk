#set enum(numbering: "a)")

= Dokumentasi Final Project PBKK

#v(0.3cm)

Juang Maulana Taruna Putra

NRP: 5025231257

#v(0.5cm)

== 1. Cara Menjalankan Projek

Berikut adalah langkah-langkah untuk menjalankan aplikasi dari sisi Backend dan Frontend.

=== a. Prerequisites
Pastikan `Node.js` (v18+) dan `pnpm` sudah terinstall.
Database menggunakan SQLite, sehingga tidak perlu setup database server terpisah.

=== b. Backend Setup
```bash
cd backend
pnpm install
pnpm exec prisma migrate dev --name init
pnpm exec prisma generate
pnpm run start:dev
```
Server akan berjalan di `http://localhost:3000`.

=== c. Frontend Setup
```bash
cd frontend
pnpm install
pnpm run dev
```
Akses aplikasi melalui browser di `http://localhost:3001`.

#line(length: 100%)

== 2. Database Schema

Database yang digunakan adalah SQLite (untuk development) dengan ORM Prisma. Berikut adalah penjelasan entity relationship diagram (ERD) dan struktur tabel utamanya:

=== a. Users & Roles
Tabel `User` menyimpan data pengguna dengan role:
- `USER`: Customer biasa yang bisa membeli produk.
- `SELLER`: Penjual yang bisa mengelola produk dan order.
- `ADMIN`: Memiliki akses penuh.

```prisma
model User {
  username     String    @id
  email        String    @unique
  role         Role      @default(USER) // Enum: USER, ADMIN, SELLER
  products     Product[] // One-to-Many: Seller creates multiple products
  orders       Order[]   // One-to-Many: User places multiple orders
}
```

=== b. Products & Inventory
Tabel `Product` menyimpan katalog barang. Fitur multiple images dihandle dengan menyimpan JSON string pada kolom `images`. Stok dikelola dengan integer `stock` dan boolean `isAvailable`.

```prisma
model Product {
  id          String      @id @default(uuid())
  sku         String      @unique // Stock Keeping Unit
  name        String
  price       Float
  stock       Int         @default(0)
  images      String?     // Stores JSON array of image URLs
  sellerId    String
  seller      User        @relation(fields: [sellerId], references: [username])
}
```

=== c. Shopping Cart
Sistem cart menggunakan relasi One-to-One antara `User` dan `Cart`. `Cart` memiliki relasi One-to-Many dengan `CartItem`.

```prisma
model Cart {
  userId    String
  items     CartItem[]
}

model CartItem {
  productId String
  product   Product  @relation(...)
  quantity  Int      @default(1)
}
```

=== d. Orders & Transaction
Saat checkout, data dari `Cart` dipindahkan ke `Order`. `Order` memiliki status yang dilacak menggunakan enum `OrderStatus`.

```prisma
enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

model Order {
  orderNumber     String      @unique
  status          OrderStatus @default(PENDING)
  totalAmount     Float
  items           OrderItem[]
}
```

#line(length: 100%)

== 3. Product Management (Seller)

=== a. Create Product & Multiple Image Upload (Multer)
Feature: Manage products (Create), upload multiple images, auto-generate SKU.

**Controller (`products.controller.ts`):**
```ts
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: diskStorage({
        destination: './uploads/products',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `product-${uniqueSuffix}${ext}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type'), false);
        }
      },
    }),
  )
  create(@Request() req, @Body() createProductDto: CreateProductDto, @UploadedFiles() files?: Express.Multer.File[]) {
    const imageUrls = files?.map(file => `http://localhost:3000/uploads/products/${file.filename}`);
    return this.productsService.create(req.user.username, createProductDto, imageUrls);
  }
```

**DTO (`create-product.dto.ts`):**
Mendefinisikan struktur data produk (Nama, Deskripsi, Kategori, Harga, Stok).
```ts
export class CreateProductDto {
  @IsString() name: string;
  @IsString() description: string;
  @IsString() category: string;
  @IsNumber() @Min(0) price: number;
  @IsNumber() @Min(0) stock: number;
}
```

**Auto-Generate SKU (`products.service.ts`):**
SKU dibuat otomatis berdasarkan kategori, nama, dan timestamp unik.
```ts
  private generateSKU(category: string, name: string): string {
    const categoryCode = category.substring(0, 3).toUpperCase();
    const nameCode = name.substring(0, 3).toUpperCase().replace(/\s/g, '');
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${categoryCode}-${nameCode}-${timestamp}-${random}`;
  }
```

Implementasi menggunakan `FilesInterceptor` untuk menangani multiple uploads (max 10 gambar). File disimpan di disk lokal `./uploads/products` dengan nama unik. SKU digenerate otomatis di service.

=== Screenshot Create Product
#image("create-product.png")

#line(length: 100%)

== 4. Product Browsing & Search (Customer)

=== a. Controller
Feature: Browse all products, search by name/description, filter by category/price/availability.

```ts
  @Get()
  findAll(@Query(new ValidationPipe({ transform: true })) query: QueryProductsDto) {
    return this.productsService.findAll(query);
  }
```

**DTO (`query-products.dto.ts`):**
Mendukung filter, sort, dan pagination.
```ts
export class QueryProductsDto {
  @IsOptional() page?: number = 1;
  @IsOptional() limit?: number = 10;
  @IsOptional() search?: string;
  @IsOptional() category?: string;
  @IsOptional() minPrice?: number;
  @IsOptional() maxPrice?: number;
  @IsOptional() isAvailable?: boolean;
  @IsOptional() @IsEnum(SortBy) sortBy?: SortBy = SortBy.NEWEST;
}
```

**Service Logic (`products.service.ts`):**
Membangun query `where` dan `orderBy` secara dinamis.
```ts
  async findAll(query: QueryProductsDto) {
    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }
    // Sorting logic
    switch (sortBy) {
      case SortBy.PRICE_ASC: orderBy = { price: 'asc' }; break;
      case SortBy.PRICE_DESC: orderBy = { price: 'desc' }; break;
      case SortBy.POPULARITY: orderBy = { popularity: 'desc' }; break;
      default: orderBy = { createdAt: 'desc' };
    }
    // Prisma query
    return this.prisma.product.findMany({ where, skip, take: limit, orderBy });
  }
```
Endpoint `findAll` menerima `QueryProductsDto` untuk filter search, category, minPrice, maxPrice, dan isAvailable. Hasilnya dipagination.

=== Screenshot Browse Products
#image("browse-products.png")

#line(length: 100%)

== 5. Shopping Cart (Customer)

=== a. Controller
Feature: Add products to cart, view cart, update quantities.

```ts
  @Post()
  async addToCart(@Request() req, @Body() addToCartDto: AddToCartDto) {
    return this.cartService.addToCart(req.user.username, addToCartDto);
  }

  async getCart(@Request() req) {
    return this.cartService.getCart(req.user.username);
  }
```

**Add to Cart (`cart.service.ts`):**
Mengecek stok produk dan menambahkan item atau update quantity jika sudah ada.
```ts
  async addToCart(userId: string, addToCartDto: AddToCartDto) {
    const product = await this.prisma.product.findUnique({ where: { id: addToCartDto.productId } });
    if (product.stock < addToCartDto.quantity) throw new Error('Insufficient stock');
    
    // Check existing item
    const existingItem = await this.prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId: addToCartDto.productId } }
    });
    if (existingItem) {
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + addToCartDto.quantity }
      });
    }
    return this.prisma.cartItem.create({ ... });
  }
```

**View Cart & Total (`cart.service.ts`):**
Menghitung total harga belanjaan secara otomatis.
```ts
  async getCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    const total = cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    return { ...cart, total };
  }
```

**Update/Remove Items:**
```ts
  async updateCartItem(userId: string, itemId: string, updateDto: UpdateCartItemDto) {
    // Check stock before update
    if (cartItem.product.stock < updateDto.quantity) throw new Error('Insufficient stock');
    return this.prisma.cartItem.update({ where: { id: itemId }, data: { quantity: updateDto.quantity } });
  }

  async removeFromCart(userId: string, itemId: string) {
    return this.prisma.cartItem.delete({ where: { id: itemId } });
  }
```

=== Screenshot Shopping Cart
#image("shopping-cart.png")

#line(length: 100%)

== 6. Order Placement (Customer)

=== a. Controller
Feature: Checkout from cart, shipping address, order confirmation.

```ts
  async createOrder(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.createOrder(req.user.username, createOrderDto);
  }
```

**DTO (`create-order.dto.ts`):**
Menerima alamat pengiriman.
```ts
export class CreateOrderDto {
  @IsString() @IsNotEmpty() shippingAddress: string;
}
```

**Service Logic (`orders.service.ts`):**
Menggunakan `prisma.$transaction` untuk menjamin konsistensi data (Order dibuat, Stok berkurang, Cart kosong).
```ts
  async createOrder(userId: string, createOrderDto: CreateOrderDto) {
    // Validate stock & calculate total
    for (const item of cart.items) {
      if (item.product.stock < item.quantity) throw new Error('Insufficient stock');
      totalAmount += item.product.price * item.quantity;
    }

    const order = await this.prisma.$transaction(async (tx) => {
      // 1. Create Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber: this.generateOrderNumber(),
          status: OrderStatus.PENDING,
          items: { create: cart.items.map(...) }
        }
      });

      // 2. Decrement Stock
      for (const item of cart.items) {
        await tx.product.update({ where: { id: }, data: { stock: { decrement: quantity } } });
      }

      // 3. Clear Cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return newOrder;
    });

    // Send Email Confirmation
    await this.emailService.sendOrderConfirmation(user.email, order.orderNumber, ...);
    return order;
  }
```
Saat order dibuat, item akan dipindahkan dari cart ke order, stok produk dikurangi, dan status awal diset ke `PENDING`.

=== Screenshot Place Order
#image("place-order.png")

#line(length: 100%)

== 7. Order Management (Seller)

=== a. Controller
Feature: View seller orders, update status (Processing, Shipped, Delivered).

```ts
  @Get('seller')
  async getSellerOrders(@Request() req, @Query('status') status?: OrderStatus) {
    return this.ordersService.getSellerOrders(req.user.username, status);
  }

  async updateOrderStatus(@Request() req, @Param('id') id: string, @Body() updateDto: UpdateOrderStatusDto) {
    return this.ordersService.updateOrderStatus(req.user.username, id, updateDto);
  }
```

**Get Seller Orders (`orders.service.ts`):**
Hanya menampilkan order yang berisi produk milik seller tersebut.
```ts
  async getSellerOrders(sellerId: string, status?: OrderStatus) {
    // Filter orders containing seller's products
    const where: any = {
      items: { some: { product: { sellerId } } }
    };
    
    return this.prisma.order.findMany({
      where,
      include: {
        // Include ONLY items belonging to this seller
        items: {
          where: { product: { sellerId } },
          include: { product: true }
        },
        user: { select: { username: true, email: true } } // Customer details
      }
    });
  }
```

**Update Status (`orders.service.ts`):**
Seller dapat mengubah status (Processing, Shipped, Delivered) dan notifikasi dikirim ke customer.
```ts
  async updateOrderStatus(sellerId: string, orderId: string, updateDto: UpdateOrderStatusDto) {
    // Verify ownership
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, items: { some: { product: { sellerId } } } }
    });
    
    // Update status
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: updateDto.status }
    });

    // Send Email Notification
    await this.emailService.sendOrderStatusUpdate(updatedOrder.user.email, ...);
  }
```

=== Screenshot Manage Orders
#image("manage-orders.png")

#line(length: 100%)

== 8. Order History (Customer)

=== a. Controller
Feature: View past orders and details.

```ts
  async getMyOrders(@Request() req, @Query('status') status?: OrderStatus) {
    return this.ordersService.getMyOrders(req.user.username, status);
  }
```

**Service Logic (`orders.service.ts`):**
Mendukung filter berdasarkan status dan tanggal (Date Range), serta pagination.
```ts
  async getMyOrders(userId: string, status?: OrderStatus, startDate?: Date, endDate?: Date, page = 1, limit = 10) {
    const where: any = { userId };

    // Filter by Status
    if (status) where.status = status;

    // Filter by Date Range
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' }, // Newest first
      skip: (page - 1) * limit,
      take: limit,
    });
    
    return { orders, total };
  }
```

=== Screenshot Order History
#image("order-history.png")

#line(length: 100%)

== 9. Sales Dashboard (Seller)

=== a. Controller
Feature: View total revenue, order count, sales trends.

```ts
  @Get('seller')
  async getSellerDashboard(@Request() req, @Query('period') period?: 'daily' | 'weekly' | 'monthly') {
    return this.dashboardService.getSellerDashboard(req.user.username, period);
  }
```

**Service Logic (`dashboard.service.ts`):**
Menghitung total pendapatan, produk terlaris, dan tren penjualan.
```ts
  async getSellerDashboard(sellerId: string, period: 'daily' | 'weekly' | 'monthly') {
    // 1. Determine Date Range
    let startDate: Date; 
    switch(period) {
      case 'daily': startDate = ...; break;
      case 'weekly': startDate = ...; break;
    }

    // 2. Fetch Orders & Aggregate Sales
    const orders = await this.prisma.order.findMany({ 
      where: { createdAt: { gte: startDate }, items: { some: { product: { sellerId } } } } 
    });

    // 3. Calculate Top Products
    const productSales = {}; // Map logic...
    const topProducts = Object.values(productSales).sort((a,b) => b.quantity - a.quantity).slice(0, 10);

    // 4. Low Stock Alerts
    const lowStockProducts = await this.prisma.product.findMany({ where: { sellerId, stock: { lt: 10 } } });

    // 5. Status Breakdown
    const statusBreakdown = await this.prisma.order.groupBy({ by: ['status'], _count: true, where: ... });

    return { summary: { totalRevenue, orderCount }, topProducts, lowStockProducts, statusBreakdown };
  }
```
Menampilkan data ringkasan penjualan berdasarkan periode yang dipilih.

=== Screenshot Dashboard
#image("sales-dashboard.png")

#line(length: 100%)

== 10. Product Inventory & Alerts (Seller)

=== a. Service (Stock Update & Alerts)
Feature: Update stock, low stock (<10) alerts.

  @Patch(':id/stock')
  async updateStock(@Request() req, @Param('id') id: string, @Body('stock') stock: number) {
    return this.productsService.updateStock(id, req.user.username, stock);
  }
```

**Service Logic (`products.service.ts`):**
Cek perubahan stok. Jika stok turun dibawah 10 (dan sebelumnya >= 10), kirim email alert.
```ts
  async updateStock(id: string, sellerId: string, stock: number) {
    const oldStock = existing.stock;
    const product = await this.prisma.product.update({
      where: { id },
      data: { stock, isAvailable: stock > 0 },
    });

    // Send Alerts
    if (stock > 0 && stock < 10 && oldStock >= 10) {
      await this.emailService.sendLowStockAlert(seller.email, product.name, stock);
    }
    if (stock === 0 && oldStock > 0) {
      await this.emailService.sendOutOfStockAlert(seller.email, product.name);
    }
    return product;
  }
```
Jika stok turun di bawah 10 units, sistem otomatis mengirim email notifikasi "Low Stock" ke seller.

=== Screenshot Low Stock Alert
#image("low-stock-alert.png")

#line(length: 100%)

== 11. Content Management (User)

=== a. Logic
Feature: Edit/Delete products (Seller), Cancel orders (Customer).

**Delete Product (Controller & Service):**
Seller hanya dapat menghapus produk miliknya sendiri.
```ts
  // Controller
  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.productsService.remove(id, req.user.username);
  }

  // Service (Ownership Validation)
  async remove(id: string, sellerId: string) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (existing.sellerId !== sellerId) throw new Error('Unauthorized');
    return this.prisma.product.delete({ where: { id } });
  }
```

**Cancel Order (Controller & Service):**
Customer dapat membatalkan order jika statusnya masih `PENDING`. Stok akan dikembalikan otomatis.
```ts
  // Controller
  @Delete('my-orders/:id')
  async cancelOrder(@Request() req, @Param('id') id: string) {
    return this.ordersService.cancelOrder(req.user.username, id);
  }

  // Service (Transaction & Stock Restore)
  async cancelOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId } });
    if (order.status !== 'PENDING') throw new Error('Cannot cancel processed order');

    await this.prisma.$transaction(async (tx) => {
      // Restore Stock
      for (const item of order.items) {
        await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
      }
      // Update Status
      await tx.order.update({ where: { id: orderId }, data: { status: 'CANCELLED' } });
    });
  }
```

#line(length: 100%)

== 12. Email Notifications

=== a. Service
Feature: Order confirmation, status updates, new order alerts, weekly summary.

```ts
**Email Service (`email.service.ts`):**
Menangani pengiriman email menggunakan `nodemailer`.
```ts
  // 1. Order Confirmation (Customer)
  async sendOrderConfirmation(email: string, orderNumber: string, items: any[]) {
    await this.transporter.sendMail({
      to: email,
      subject: `Order Confirmation - ${orderNumber}`,
      body: `Your order ${orderNumber} has been confirmed...`
    });
  }

  // 2. Status Updates (Customer)
  async sendOrderStatusUpdate(email: string, orderNumber: string, status: string) {
    await this.transporter.sendMail({
      to: email,
      subject: `Order Status Update - ${status}`,
      body: `Your order is now ${status}...`
    });
  }

  // 3. Alerts (Seller)
  // Low Stock / New Order alerts...
```

**Weekly Sales Summary (`email-scheduler.service.ts`):**
Menggunakan `@Cron` untuk mengirim laporan mingguan setiap Senin jam 9 pagi.
```ts
  @Cron(CronExpression.EVERY_WEEK, { name: 'weekly-sales-summary', timeZone: 'Asia/Jakarta' })
  async sendWeeklySalesSummary() {
    const sellers = await this.prisma.user.findMany({ where: { role: 'SELLER' } });
    
    for (const seller of sellers) {
      // 1. Calculate Revenue & Items Sold (Last 7 Days)
      const orders = await this.prisma.order.findMany({ 
        where: { createdAt: { gte: weekStart }, items: { some: { product: { sellerId } } } } 
      });
      
      // 2. Aggregate Data
      let totalRevenue = 0;
      // ... logic loop ...

      // 3. Send Email
      await this.emailService.sendWeeklySalesSummary(seller.email, seller.username, { totalRevenue, ... });
    }
  }
```
Sistem menggunakan `nodemailer` untuk mengirim email transaksional dan `@nestjs/schedule` untuk laporan mingguan otomatis.

=== Screenshot Email Notifications
#image("email-notifications.png")
