import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting to seed products...');

  const products = [
    {
      name: 'Laptop Dell XPS 13',
      description: 'Powerful ultrabook with 11th Gen Intel Core i7 processor, 16GB RAM, and 512GB SSD. Perfect for professionals and students.',
      category: 'Electronics',
      price: 18500000,
      stock: 15,
      imageUrl: 'https://placehold.co/400x300/0066cc/ffffff?text=Dell+XPS+13',
      isAvailable: true,
      popularity: 250,
    },
    {
      name: 'iPhone 14 Pro',
      description: 'Latest iPhone with A16 Bionic chip, 48MP camera system, and Dynamic Island. Available in multiple colors.',
      category: 'Electronics',
      price: 15999000,
      stock: 8,
      imageUrl: 'https://placehold.co/400x300/000000/ffffff?text=iPhone+14+Pro',
      isAvailable: true,
      popularity: 520,
    },
    {
      name: 'Nike Air Max 270',
      description: 'Comfortable running shoes with Air Max cushioning. Breathable mesh upper and durable rubber outsole.',
      category: 'Fashion',
      price: 1899000,
      stock: 30,
      imageUrl: 'https://placehold.co/400x300/ff6600/ffffff?text=Nike+Air+Max',
      isAvailable: true,
      popularity: 180,
    },
    {
      name: 'Samsung 55" 4K Smart TV',
      description: '55-inch 4K UHD Smart TV with HDR, built-in streaming apps, and voice control.',
      category: 'Electronics',
      price: 8500000,
      stock: 12,
      imageUrl: 'https://placehold.co/400x300/003366/ffffff?text=Samsung+TV',
      isAvailable: true,
      popularity: 145,
    },
    {
      name: 'Adidas Originals Hoodie',
      description: 'Classic hoodie with kangaroo pocket and ribbed cuffs. Made from soft cotton blend.',
      category: 'Fashion',
      price: 899000,
      stock: 50,
      imageUrl: 'https://placehold.co/400x300/000000/ffffff?text=Adidas+Hoodie',
      isAvailable: true,
      popularity: 320,
    },
    {
      name: 'Sony WH-1000XM5 Headphones',
      description: 'Industry-leading noise canceling headphones with exceptional sound quality and 30-hour battery life.',
      category: 'Electronics',
      price: 5299000,
      stock: 20,
      imageUrl: 'https://placehold.co/400x300/333333/ffffff?text=Sony+Headphones',
      isAvailable: true,
      popularity: 410,
    },
    {
      name: 'Levi\'s 501 Original Jeans',
      description: 'Iconic straight-fit jeans with button fly. Made from premium denim for lasting durability.',
      category: 'Fashion',
      price: 1299000,
      stock: 40,
      imageUrl: 'https://placehold.co/400x300/003d99/ffffff?text=Levis+Jeans',
      isAvailable: true,
      popularity: 275,
    },
    {
      name: 'MacBook Pro 14"',
      description: 'Apple M2 Pro chip, 16GB RAM, 512GB SSD. Liquid Retina XDR display with ProMotion.',
      category: 'Electronics',
      price: 29999000,
      stock: 5,
      imageUrl: 'https://placehold.co/400x300/666666/ffffff?text=MacBook+Pro',
      isAvailable: true,
      popularity: 380,
    },
    {
      name: 'The North Face Backpack',
      description: 'Durable 30L backpack with padded laptop sleeve, multiple compartments, and water bottle pockets.',
      category: 'Fashion',
      price: 1499000,
      stock: 25,
      imageUrl: 'https://placehold.co/400x300/009900/ffffff?text=TNF+Backpack',
      isAvailable: true,
      popularity: 195,
    },
    {
      name: 'Canon EOS R6',
      description: 'Full-frame mirrorless camera with 20MP sensor, 4K video, and advanced autofocus system.',
      category: 'Electronics',
      price: 35000000,
      stock: 3,
      imageUrl: 'https://placehold.co/400x300/cc0000/ffffff?text=Canon+EOS+R6',
      isAvailable: true,
      popularity: 90,
    },
    {
      name: 'Zara Leather Jacket',
      description: 'Premium leather jacket with asymmetric zip closure and multiple pockets. Modern slim fit.',
      category: 'Fashion',
      price: 3299000,
      stock: 15,
      imageUrl: 'https://placehold.co/400x300/8b4513/ffffff?text=Leather+Jacket',
      isAvailable: true,
      popularity: 165,
    },
    {
      name: 'iPad Air',
      description: 'M1 chip, 10.9-inch Liquid Retina display, 64GB storage. Compatible with Apple Pencil and Magic Keyboard.',
      category: 'Electronics',
      price: 9999000,
      stock: 18,
      imageUrl: 'https://placehold.co/400x300/999999/ffffff?text=iPad+Air',
      isAvailable: true,
      popularity: 290,
    },
    {
      name: 'Puma Running Shorts',
      description: 'Lightweight running shorts with dryCELL technology and zippered pocket. Perfect for workouts.',
      category: 'Fashion',
      price: 449000,
      stock: 60,
      imageUrl: 'https://placehold.co/400x300/ff3366/ffffff?text=Puma+Shorts',
      isAvailable: true,
      popularity: 140,
    },
    {
      name: 'Dyson V15 Vacuum',
      description: 'Cordless vacuum cleaner with laser dust detection and powerful suction. Up to 60 minutes runtime.',
      category: 'Home',
      price: 10999000,
      stock: 10,
      imageUrl: 'https://placehold.co/400x300/6633cc/ffffff?text=Dyson+V15',
      isAvailable: true,
      popularity: 125,
    },
    {
      name: 'Ray-Ban Aviator Sunglasses',
      description: 'Classic aviator sunglasses with UV protection and metal frame. Timeless style.',
      category: 'Fashion',
      price: 2199000,
      stock: 35,
      imageUrl: 'https://placehold.co/400x300/ffcc00/333333?text=Ray-Ban',
      isAvailable: true,
      popularity: 225,
    },
    {
      name: 'PlayStation 5',
      description: 'Next-gen gaming console with ultra-high-speed SSD, ray tracing, and 4K gaming support.',
      category: 'Electronics',
      price: 7999000,
      stock: 0,
      imageUrl: 'https://placehold.co/400x300/003087/ffffff?text=PS5',
      isAvailable: false,
      popularity: 650,
    },
    {
      name: 'Xbox Series X',
      description: 'Powerful gaming console with 12 teraflops GPU and 1TB SSD. Experience true 4K gaming.',
      category: 'Electronics',
      price: 7499000,
      stock: 0,
      imageUrl: 'https://placehold.co/400x300/107c10/ffffff?text=Xbox+Series+X',
      isAvailable: false,
      popularity: 580,
    },
    {
      name: 'AirPods Pro 2',
      description: 'Premium wireless earbuds with active noise cancellation and spatial audio support.',
      category: 'Electronics',
      price: 3799000,
      stock: 0,
      imageUrl: 'https://placehold.co/400x300/ffffff/000000?text=AirPods+Pro',
      isAvailable: false,
      popularity: 470,
    },
    {
      name: 'Samsung Galaxy Z Fold 5',
      description: 'Revolutionary foldable smartphone with 7.6-inch display and multitasking capabilities.',
      category: 'Electronics',
      price: 24999000,
      stock: 0,
      imageUrl: 'https://placehold.co/400x300/1428a0/ffffff?text=Galaxy+Fold',
      isAvailable: false,
      popularity: 340,
    },
    {
      name: 'Nike Air Jordan 1 Retro',
      description: 'Iconic basketball sneakers with premium leather and classic colorways. Limited edition.',
      category: 'Fashion',
      price: 2599000,
      stock: 0,
      imageUrl: 'https://placehold.co/400x300/ff0000/ffffff?text=Air+Jordan',
      isAvailable: false,
      popularity: 520,
    },
    {
      name: 'Rolex Submariner Watch',
      description: 'Luxury diving watch with automatic movement and 300m water resistance.',
      category: 'Fashion',
      price: 125000000,
      stock: 0,
      imageUrl: 'https://placehold.co/400x300/006600/ffffff?text=Rolex',
      isAvailable: false,
      popularity: 890,
    },
  ];

  for (const product of products) {
    await prisma.product.create({
      data: product,
    });
  }

  console.log(`✅ Successfully seeded ${products.length} products!`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
