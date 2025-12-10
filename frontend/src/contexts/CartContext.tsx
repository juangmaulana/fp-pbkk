import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl?: string;
    stock: number;
    isAvailable: boolean;
  };
}

interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
}

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  itemCount: number;
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity: number) => Promise<void>;
  updateCartItem: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);

  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  useEffect(() => {
    if (user && token) {
      fetchCart();
    } else {
      setCart(null);
    }
  }, [user, token]);

  const fetchCart = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/cart', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCart(data);
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: string, quantity: number) => {
    if (!token) {
      alert('Please login to add items to cart');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, quantity }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add to cart');
      }

      await fetchCart();
    } catch (error) {
      console.error('Add to cart error:', error);
      throw error;
    }
  };

  const updateCartItem = async (itemId: string, quantity: number) => {
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:3000/cart/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity }),
      });

      if (!response.ok) {
        throw new Error('Failed to update cart item');
      }

      await fetchCart();
    } catch (error) {
      console.error('Update cart item error:', error);
      throw error;
    }
  };

  const removeFromCart = async (itemId: string) => {
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:3000/cart/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to remove from cart');
      }

      await fetchCart();
    } catch (error) {
      console.error('Remove from cart error:', error);
      throw error;
    }
  };

  const clearCart = async () => {
    if (!token) return;

    try {
      const response = await fetch('http://localhost:3000/cart', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to clear cart');
      }

      await fetchCart();
    } catch (error) {
      console.error('Clear cart error:', error);
      throw error;
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        itemCount,
        fetchCart,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
