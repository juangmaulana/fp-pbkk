import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

export default function CartPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { cart, loading, updateCartItem, removeFromCart } = useCart();
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/auth/login');
    }
  }, [authLoading, user, router]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(price);
  };

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setUpdating(itemId);
    try {
      await updateCartItem(itemId, newQuantity);
    } catch (error: any) {
      alert(error.message || 'Failed to update quantity');
    } finally {
      setUpdating(null);
    }
  };

  const handleRemove = async (itemId: string) => {
    if (!confirm('Remove this item from cart?')) return;
    
    setUpdating(itemId);
    try {
      await removeFromCart(itemId);
    } catch (error: any) {
      alert(error.message || 'Failed to remove item');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mt-5">
        <div className="text-center py-5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            fill="currentColor"
            className="bi bi-cart-x text-muted mb-3"
            viewBox="0 0 16 16"
          >
            <path d="M7.354 5.646a.5.5 0 1 0-.708.708L7.793 7.5 6.646 8.646a.5.5 0 1 0 .708.708L8.5 8.207l1.146 1.147a.5.5 0 0 0 .708-.708L9.207 7.5l1.147-1.146a.5.5 0 0 0-.708-.708L8.5 6.793 7.354 5.646z"/>
            <path d="M.5 1a.5.5 0 0 0 0 1h1.11l.401 1.607 1.498 7.985A.5.5 0 0 0 4 12h1a2 2 0 1 0 0 4 2 2 0 0 0 0-4h7a2 2 0 1 0 0 4 2 2 0 0 0 0-4h1a.5.5 0 0 0 .491-.408l1.5-8A.5.5 0 0 0 14.5 3H2.89l-.405-1.621A.5.5 0 0 0 2 1H.5zm3.915 10L3.102 4h10.796l-1.313 7h-8.17zM6 14a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm7 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
          </svg>
          <h2>Your cart is empty</h2>
          <p className="text-muted">Add some products to get started!</p>
          <button
            className="btn btn-primary mt-3"
            onClick={() => router.push('/')}
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h1 className="mb-4">Shopping Cart</h1>

      <div className="row">
        <div className="col-lg-8">
          {/* Cart Items */}
          {cart.items.map((item) => (
            <div key={item.id} className="card mb-3">
              <div className="card-body">
                <div className="row align-items-center">
                  <div className="col-md-2">
                    {item.product.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="img-fluid rounded"
                      />
                    ) : (
                      <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ height: '80px' }}>
                        <span className="text-muted">No Image</span>
                      </div>
                    )}
                  </div>
                  <div className="col-md-4">
                    <h5 className="mb-1">{item.product.name}</h5>
                    <p className="text-muted mb-0">{formatPrice(item.product.price)}</p>
                    {!item.product.isAvailable && (
                      <span className="badge bg-danger">Out of Stock</span>
                    )}
                  </div>
                  <div className="col-md-3">
                    <div className="input-group">
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        disabled={updating === item.id || item.quantity <= 1}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        className="form-control text-center"
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (val > 0 && val <= item.product.stock) {
                            handleUpdateQuantity(item.id, val);
                          }
                        }}
                        disabled={updating === item.id}
                        min="1"
                        max={item.product.stock}
                      />
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        disabled={updating === item.id || item.quantity >= item.product.stock}
                      >
                        +
                      </button>
                    </div>
                    <small className="text-muted">Max: {item.product.stock}</small>
                  </div>
                  <div className="col-md-2">
                    <strong>{formatPrice(item.product.price * item.quantity)}</strong>
                  </div>
                  <div className="col-md-1">
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleRemove(item.id)}
                      disabled={updating === item.id}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        className="bi bi-trash"
                        viewBox="0 0 16 16"
                      >
                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"/>
                        <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="col-lg-4">
          {/* Cart Summary */}
          <div className="card sticky-top" style={{ top: '20px' }}>
            <div className="card-body">
              <h5 className="card-title">Order Summary</h5>
              <hr />
              <div className="d-flex justify-content-between mb-2">
                <span>Items ({cart.items.length})</span>
                <span>{formatPrice(cart.total)}</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-3">
                <strong>Total</strong>
                <strong className="text-primary">{formatPrice(cart.total)}</strong>
              </div>
              <button
                className="btn btn-primary w-100 mb-2"
                onClick={() => router.push('/checkout')}
                disabled={cart.items.some(item => !item.product.isAvailable)}
              >
                Proceed to Checkout
              </button>
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => router.push('/')}
              >
                Continue Shopping
              </button>
              {cart.items.some(item => !item.product.isAvailable) && (
                <div className="alert alert-warning mt-3 mb-0">
                  <small>Some items are out of stock. Please remove them to continue.</small>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
