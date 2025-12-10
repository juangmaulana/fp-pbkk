import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';

interface CheckoutForm {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  notes: string;
}

export default function Checkout() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const { cart, loading: cartLoading, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<CheckoutForm>({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Partial<CheckoutForm>>({});

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      alert('Please login to checkout');
      router.push('/auth/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!cartLoading && (!cart || cart.items.length === 0)) {
      alert('Your cart is empty');
      router.push('/cart');
    }
  }, [cart, cartLoading, router]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name as keyof CheckoutForm]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CheckoutForm> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9+\-\s()]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.postalCode.trim()) {
      newErrors.postalCode = 'Postal code is required';
    } else if (!/^[0-9]{5}$/.test(formData.postalCode)) {
      newErrors.postalCode = 'Postal code must be 5 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Check for out of stock items
    const outOfStockItems = cart?.items.filter(item => !item.product.isAvailable) || [];
    if (outOfStockItems.length > 0) {
      alert('Some items in your cart are out of stock. Please remove them before checkout.');
      return;
    }

    setSubmitting(true);

    try {
      // Format shipping address
      const shippingAddress = `${formData.fullName}\n${formData.phone}\n${formData.address}\n${formData.city}, ${formData.postalCode}${formData.notes ? `\n\nNotes: ${formData.notes}` : ''}`;

      const response = await fetch('http://localhost:3000/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ shippingAddress })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create order');
      }

      const order = await response.json();
      
      // Clear cart
      await clearCart();
      
      // Redirect to success page
      router.push(`/orders/success?orderNumber=${order.orderNumber}`);
    } catch (error: any) {
      alert(error.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  if (cartLoading || !cart || !user) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4 mb-5">
      <h1 className="mb-4">Checkout</h1>

      <div className="row">
        {/* Shipping Form */}
        <div className="col-md-7">
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title mb-3">Shipping Information</h5>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="fullName" className="form-label">
                    Full Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.fullName ? 'is-invalid' : ''}`}
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    disabled={submitting}
                  />
                  {errors.fullName && (
                    <div className="invalid-feedback">{errors.fullName}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="phone" className="form-label">
                    Phone Number <span className="text-danger">*</span>
                  </label>
                  <input
                    type="tel"
                    className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+62 812-3456-7890"
                    disabled={submitting}
                  />
                  {errors.phone && (
                    <div className="invalid-feedback">{errors.phone}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="address" className="form-label">
                    Address <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                    id="address"
                    name="address"
                    rows={3}
                    value={formData.address}
                    onChange={handleInputChange}
                    disabled={submitting}
                  />
                  {errors.address && (
                    <div className="invalid-feedback">{errors.address}</div>
                  )}
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="city" className="form-label">
                      City <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${errors.city ? 'is-invalid' : ''}`}
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      disabled={submitting}
                    />
                    {errors.city && (
                      <div className="invalid-feedback">{errors.city}</div>
                    )}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="postalCode" className="form-label">
                      Postal Code <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${errors.postalCode ? 'is-invalid' : ''}`}
                      id="postalCode"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      placeholder="12345"
                      maxLength={5}
                      disabled={submitting}
                    />
                    {errors.postalCode && (
                      <div className="invalid-feedback">{errors.postalCode}</div>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="notes" className="form-label">
                    Notes (Optional)
                  </label>
                  <textarea
                    className="form-control"
                    id="notes"
                    name="notes"
                    rows={2}
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Additional delivery instructions..."
                    disabled={submitting}
                  />
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="col-md-5">
          <div className="card position-sticky" style={{ top: '20px' }}>
            <div className="card-body">
              <h5 className="card-title mb-3">Order Summary</h5>
              
              {/* Cart Items */}
              <div className="mb-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {cart.items.map((item) => (
                  <div key={item.id} className="d-flex mb-3 pb-3 border-bottom">
                    <img
                      src={item.product.imageUrl || '/placeholder.png'}
                      alt={item.product.name}
                      className="rounded me-3"
                      style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                    />
                    <div className="flex-grow-1">
                      <h6 className="mb-1">{item.product.name}</h6>
                      <small className="text-muted">Qty: {item.quantity}</small>
                      <div className="text-primary fw-bold">
                        {formatPrice(item.product.price * item.quantity)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-top pt-3">
                <div className="d-flex justify-content-between mb-2">
                  <span>Subtotal ({cart.items.length} items)</span>
                  <span>{formatPrice(cart.total)}</span>
                </div>
                <div className="d-flex justify-content-between mb-3">
                  <span className="fw-bold fs-5">Total</span>
                  <span className="fw-bold fs-5 text-primary">{formatPrice(cart.total)}</span>
                </div>
              </div>

              {/* Actions */}
              <button
                className="btn btn-primary w-100 mb-2"
                onClick={handleSubmit}
                disabled={submitting || cart.items.some(item => !item.product.isAvailable)}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Placing Order...
                  </>
                ) : (
                  'Place Order'
                )}
              </button>
              
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => router.push('/cart')}
                disabled={submitting}
              >
                Back to Cart
              </button>

              {cart.items.some(item => !item.product.isAvailable) && (
                <div className="alert alert-warning mt-3 mb-0">
                  <small>Some items are out of stock</small>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
