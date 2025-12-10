# E-Commerce Platform - Complete Implementation

A full-stack e-commerce marketplace with customer and seller features, built with NestJS, Next.js, and Prisma.

## 🎯 Features Implemented

### Customer Features
- ✅ Product browsing with search, filters, sorting, and pagination
- ✅ Product detail pages with multiple images and comments
- ✅ Shopping cart with quantity management
- ✅ Checkout with shipping address form
- ✅ Order placement and confirmation
- ✅ Order history with status tracking
- ✅ Order details view with cancel option (for PENDING orders)
- ✅ Email notifications for order confirmations and status updates

### Seller Features
- ✅ Seller dashboard with analytics:
  - Total revenue and order count
  - Sales trends (daily/weekly/monthly)
  - Top selling products
  - Order status breakdown
  - Low stock alerts
- ✅ Product management:
  - Create products with multiple images (up to 10)
  - Edit product details
  - Update stock levels
  - Delete products
  - Auto-generated SKU codes
- ✅ Order management:
  - View orders containing seller's products
  - Update order status (PENDING → PROCESSING → SHIPPED → DELIVERED)
  - Filter orders by status
- ✅ Inventory tracking with email alerts
- ✅ Email notifications for new orders and low stock

### Technical Features
- ✅ JWT authentication with role-based access (USER, ADMIN, SELLER)
- ✅ Multiple image upload support (Multer)
- ✅ Stock validation throughout purchase flow
- ✅ Automatic cart clearing after order placement
- ✅ Order status workflow enforcement
- ✅ Email notification system (console logging)
- ✅ Responsive Bootstrap UI
- ✅ IDR currency formatting

## 📁 Project Structure

```
fp-pbkk/
├── backend/                    # NestJS Backend
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── src/
│   │   ├── auth/              # Authentication
│   │   ├── cart/              # Shopping cart
│   │   ├── orders/            # Order management
│   │   ├── products/          # Product catalog
│   │   ├── dashboard/         # Seller analytics
│   │   ├── email/             # Email notifications
│   │   ├── comments/          # Product comments
│   │   └── upload/            # File uploads
│   └── uploads/               # Uploaded files
│       ├── products/          # Product images
│       └── comments/          # Comment images
│
└── frontend/                  # Next.js Frontend
    └── src/
        ├── contexts/          # React contexts
        │   ├── AuthContext.tsx
        │   └── CartContext.tsx
        ├── pages/
        │   ├── auth/          # Login/Register
        │   ├── products/      # Product pages
        │   ├── orders/        # Order pages
        │   ├── seller/        # Seller pages
        │   ├── cart.tsx       # Shopping cart
        │   └── checkout.tsx   # Checkout page
        └── components/        # Reusable components
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and pnpm
- SQLite (included with Prisma)

### Backend Setup

```bash
cd backend

# Install dependencies
pnpm install

# Generate Prisma client
pnpm prisma generate

# Run database migrations
pnpm prisma migrate dev

# Start development server
pnpm run start:dev
```

Backend will run on `http://localhost:3000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

Frontend will run on `http://localhost:3001`

## 📊 Database Schema

### Core Models

**User**
- `username` (unique)
- `email` (unique)
- `password` (hashed)
- `role` (USER, ADMIN, SELLER)

**Product**
- `sku` (auto-generated, unique)
- `name`, `description`, `price`
- `category`, `stock`
- `imageUrl` (primary image)
- `images` (JSON array of all images)
- `sellerId` (references User)
- `isAvailable` (auto-updated based on stock)

**Cart & CartItem**
- User's shopping cart with items
- Unique constraint on `[cartId, productId]`

**Order & OrderItem**
- `orderNumber` (format: ORD-timestamp-random)
- `status` enum (PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED)
- `shippingAddress` (text)
- `totalAmount`
- Order items capture price at purchase time

## 🛍️ Customer User Flow

1. **Browse Products**
   - Search by name/description
   - Filter by category, price range, availability
   - Sort by newest, price, or popularity

2. **View Product Details**
   - See multiple images
   - Read description and check stock
   - Read/write comments
   - Add to cart with quantity selection

3. **Shopping Cart**
   - View all items with images
   - Update quantities (max: available stock)
   - Remove items
   - See order total
   - Proceed to checkout

4. **Checkout**
   - Enter shipping information:
     - Full name, phone, address
     - City, postal code
     - Optional delivery notes
   - Review order summary
   - Place order

5. **Order Confirmation**
   - Receive order number
   - Get email confirmation
   - Auto-redirect to order history

6. **Track Orders**
   - View all past orders
   - Filter by status
   - See order details
   - Cancel PENDING orders

## 🏪 Seller User Flow

1. **Dashboard Overview**
   - View revenue and order statistics
   - Analyze sales trends (daily/weekly/monthly)
   - See top selling products
   - Monitor order status breakdown
   - Get low stock alerts

2. **Manage Products**
   - Create new products:
     - Upload up to 10 images
     - Auto-generated SKU
     - Set price and stock
   - Edit existing products
   - Update stock levels
   - Delete products

3. **Manage Orders**
   - View all orders with seller's products
   - Filter by order status
   - Update order status:
     - PENDING → PROCESSING
     - PROCESSING → SHIPPED
     - SHIPPED → DELIVERED
     - Cancel orders (PENDING/PROCESSING)
   - View customer information
   - See shipping addresses

4. **Inventory Management**
   - View all products with stock levels
   - Get alerts for:
     - Low stock (< 10 units)
     - Out of stock (0 units)
   - Quick stock updates

## 📧 Email Notifications

The system logs email notifications to console. In production, integrate with:
- SendGrid
- AWS SES
- Nodemailer with SMTP

**Email Types:**

Customer Notifications:
- Order confirmation with items and total
- Order status updates
- Delivery confirmations

Seller Notifications:
- New order alerts
- Low stock warnings (< 10 units)
- Out of stock alerts

**Implementation Note:** Edit `/backend/src/email/email.service.ts` to add real email sending logic.

## 🔐 User Roles

### USER (Customer)
- Browse and purchase products
- Manage cart and orders
- Write product comments

### SELLER
- All USER permissions
- Access seller dashboard
- Manage own products
- Manage orders with their products
- Receive inventory alerts

### ADMIN
- All SELLER permissions
- Access admin panel
- Manage all products
- View all system data

**Note:** To create a seller account, manually update the user's role in the database:

```sql
UPDATE User SET role = 'SELLER' WHERE username = 'yourUsername';
```

## 🎨 UI/UX Features

- **Responsive Design**: Bootstrap 5 responsive grid
- **Loading States**: Spinners for async operations
- **Error Handling**: User-friendly error messages
- **Form Validation**: Client-side validation with visual feedback
- **Stock Indicators**: Visual badges for stock levels
- **Currency Formatting**: Indonesian Rupiah (IDR) formatting
- **Image Previews**: Real-time preview for uploads
- **Auto-redirect**: Countdown timer on success pages
- **Pagination**: Navigate large datasets easily

## 📡 API Endpoints

### Products
- `GET /products` - List with filters
- `GET /products/:id` - Product details
- `POST /products` - Create (auth, multipart)
- `PATCH /products/:id` - Update (auth)
- `DELETE /products/:id` - Delete (auth)
- `PATCH /products/:id/stock` - Update stock (auth)

### Cart
- `GET /cart` - Get user's cart (auth)
- `POST /cart` - Add item (auth)
- `PATCH /cart/items/:id` - Update quantity (auth)
- `DELETE /cart/items/:id` - Remove item (auth)
- `DELETE /cart` - Clear cart (auth)

### Orders
- `POST /orders` - Create order (auth)
- `GET /orders/my-orders` - Customer orders (auth)
- `GET /orders/my-orders/:id` - Order details (auth)
- `DELETE /orders/my-orders/:id` - Cancel order (auth)
- `GET /orders/seller` - Seller orders (auth)
- `PATCH /orders/seller/:id/status` - Update status (auth)

### Dashboard
- `GET /dashboard/seller?period=daily|weekly|monthly` - Analytics (auth)
- `GET /dashboard/inventory` - Inventory status (auth)

### Auth
- `POST /auth/register` - Register
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh token

## 🧪 Testing the System

1. **Create User Account**
   ```
   Register at /auth/register
   ```

2. **Browse and Purchase**
   ```
   - View products on homepage
   - Add items to cart
   - Complete checkout
   - View order in history
   ```

3. **Become a Seller** (via database)
   ```sql
   UPDATE User SET role = 'SELLER' WHERE username = 'yourUsername';
   ```

4. **Test Seller Features**
   ```
   - Access seller dropdown in navbar
   - Create products with images
   - View dashboard analytics
   - Manage orders
   ```

5. **Test Email Notifications**
   ```
   Check backend console logs for:
   - Order confirmations
   - Status updates
   - Low stock alerts
   ```

## 🔧 Configuration

### Backend Environment Variables
Create `.env` in `/backend`:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="7d"

# For production email setup:
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_USER=your-email@example.com
# SMTP_PASS=your-password
# SMTP_FROM=noreply@example.com
```

### Frontend Configuration
Update API URL in context files if needed:
```typescript
const API_URL = 'http://localhost:3000';
```

## 📈 Analytics Dashboard

Seller dashboard provides:

1. **Revenue Metrics**
   - Total revenue by period
   - Order count
   - Average order value

2. **Sales Trends**
   - Visual bar chart
   - Daily breakdown
   - Revenue per day

3. **Top Products**
   - Products by quantity sold
   - Revenue per product
   - Ranking

4. **Order Status**
   - Status distribution
   - Progress bars
   - Percentage breakdown

5. **Inventory Alerts**
   - Low stock products
   - Out of stock items
   - Quick restock actions

## 🚀 Production Deployment

### Backend
1. Set up production database (PostgreSQL/MySQL)
2. Configure email service (SendGrid/AWS SES)
3. Set secure JWT secrets
4. Enable CORS for frontend domain
5. Set up file storage (AWS S3/CloudFlare R2)
6. Deploy to Heroku/Railway/Vercel

### Frontend
1. Update API URLs for production
2. Optimize images
3. Enable Next.js production build
4. Deploy to Vercel/Netlify
5. Configure environment variables

## 📝 License

This project is part of the PBKK (Pemrograman Berbasis Kerangka Kerja) course final project.

## 🤝 Contributing

This is a course project, but suggestions and improvements are welcome!

## 📞 Support

For issues or questions, please create an issue in the repository or contact the development team.

---

**Built with ❤️ using NestJS, Next.js, Prisma, and Bootstrap**
