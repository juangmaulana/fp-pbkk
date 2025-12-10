import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateCart(userId: string) {
    let cart = await this.prisma.cart.findFirst({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    }

    return cart;
  }

  async addToCart(userId: string, addToCartDto: AddToCartDto) {
    const cart = await this.getOrCreateCart(userId);

    // Check if product exists and is available
    const product = await this.prisma.product.findUnique({
      where: { id: addToCartDto.productId },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    if (!product.isAvailable) {
      throw new Error('Product is not available');
    }

    if (product.stock < addToCartDto.quantity) {
      throw new Error(`Insufficient stock. Only ${product.stock} available`);
    }

    // Check if item already exists in cart
    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: addToCartDto.productId,
        },
      },
    });

    if (existingItem) {
      // Update quantity
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + addToCartDto.quantity,
        },
        include: {
          product: true,
        },
      });
    }

    // Create new cart item
    return this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: addToCartDto.productId,
        quantity: addToCartDto.quantity,
      },
      include: {
        product: true,
      },
    });
  }

  async getCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    
    // Calculate total
    const total = cart.items.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);

    return {
      ...cart,
      total,
    };
  }

  async updateCartItem(userId: string, itemId: string, updateDto: UpdateCartItemDto) {
    // Verify cart item belongs to user
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: true,
        product: true,
      },
    });

    if (!cartItem) {
      throw new Error('Cart item not found');
    }

    if (cartItem.cart.userId !== userId) {
      throw new Error('Unauthorized');
    }

    // Check stock availability
    if (cartItem.product.stock < updateDto.quantity) {
      throw new Error(`Insufficient stock. Only ${cartItem.product.stock} available`);
    }

    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: updateDto.quantity },
      include: {
        product: true,
      },
    });
  }

  async removeFromCart(userId: string, itemId: string) {
    // Verify cart item belongs to user
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: true,
      },
    });

    if (!cartItem) {
      throw new Error('Cart item not found');
    }

    if (cartItem.cart.userId !== userId) {
      throw new Error('Unauthorized');
    }

    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });

    return { message: 'Item removed from cart' };
  }

  async clearCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    
    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return { message: 'Cart cleared' };
  }
}
