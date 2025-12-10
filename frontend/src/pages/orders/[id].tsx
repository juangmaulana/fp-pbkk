import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    imageUrl: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  totalAmount: number;
  shippingAddress: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  user: {
    username: string;
    email: string;
  };
}

export default function OrderDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { user, token, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (id) {
      fetchOrderDetails();
    }
  }, [authLoading, user, id]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/orders/my-orders/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }

      const data = await response.json();
      setOrder(data);
    } catch (error: any) {
      console.error('Failed to fetch order:', error);
      alert(error.message || 'Failed to load order details');
      router.push('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    setCancelling(true);
    try {
      const response = await fetch(`http://localhost:3000/orders/my-orders/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel order');
      }

      alert('Order cancelled successfully');
      await fetchOrderDetails(); // Refresh order data
    } catch (error: any) {
      alert(error.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusBadge = (status: Order['status']) => {
    const statusConfig = {
      PENDING: { bg: 'warning', text: 'Pending' },
      PROCESSING: { bg: 'info', text: 'Processing' },
      SHIPPED: { bg: 'primary', text: 'Shipped' },
      DELIVERED: { bg: 'success', text: 'Delivered' },
      CANCELLED: { bg: 'danger', text: 'Cancelled' }
    };

    const config = statusConfig[status];
    return <span className={`badge bg-${config.bg} fs-6`}>{config.text}</span>;
  };

  const getStatusIcon = (status: Order['status']) => {
    const icons = {
      PENDING: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-clock-history text-warning" viewBox="0 0 16 16">
          <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022zm2.004.45a7 7 0 0 0-.985-.299l.219-.976q.576.129 1.126.342zm1.37.71a7 7 0 0 0-.439-.27l.493-.87a8 8 0 0 1 .979.654l-.615.789a7 7 0 0 0-.418-.302zm1.834 1.79a7 7 0 0 0-.653-.796l.724-.69q.406.429.747.91zm.744 1.352a7 7 0 0 0-.214-.468l.893-.45a8 8 0 0 1 .45 1.088l-.95.313a7 7 0 0 0-.179-.483m.53 2.507a7 7 0 0 0-.1-1.025l.985-.17q.1.58.116 1.17zm-.131 1.538q.05-.254.081-.51l.993.123a8 8 0 0 1-.23 1.155l-.964-.267q.069-.247.12-.501m-.952 2.379q.276-.436.486-.908l.914.405q-.24.54-.555 1.038zm-.964 1.205q.183-.183.35-.378l.758.653a8 8 0 0 1-.401.432z"/>
          <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0z"/>
          <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5"/>
        </svg>
      ),
      PROCESSING: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-gear-fill text-info" viewBox="0 0 16 16">
          <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z"/>
        </svg>
      ),
      SHIPPED: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-truck text-primary" viewBox="0 0 16 16">
          <path d="M0 3.5A1.5 1.5 0 0 1 1.5 2h9A1.5 1.5 0 0 1 12 3.5V5h1.02a1.5 1.5 0 0 1 1.17.563l1.481 1.85a1.5 1.5 0 0 1 .329.938V10.5a1.5 1.5 0 0 1-1.5 1.5H14a2 2 0 1 1-4 0H5a2 2 0 1 1-3.998-.085A1.5 1.5 0 0 1 0 10.5zm1.294 7.456A2 2 0 0 1 4.732 11h5.536a2 2 0 0 1 .732-.732V3.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .294.456M12 10a2 2 0 0 1 1.732 1h.768a.5.5 0 0 0 .5-.5V8.35a.5.5 0 0 0-.11-.312l-1.48-1.85A.5.5 0 0 0 13.02 6H12zm-9 1a1 1 0 1 0 0 2 1 1 0 0 0 0-2m9 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2"/>
        </svg>
      ),
      DELIVERED: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-box-seam text-success" viewBox="0 0 16 16">
          <path d="M8.186 1.113a.5.5 0 0 0-.372 0L1.846 3.5l2.404.961L10.404 2zm3.564 1.426L5.596 5 8 5.961 14.154 3.5zm3.25 1.7-6.5 2.6v7.922l6.5-2.6V4.24zM7.5 14.762V6.838L1 4.239v7.923zM7.443.184a1.5 1.5 0 0 1 1.114 0l7.129 2.852A.5.5 0 0 1 16 3.5v8.662a1 1 0 0 1-.629.928l-7.185 2.874a.5.5 0 0 1-.372 0L.63 13.09a1 1 0 0 1-.63-.928V3.5a.5.5 0 0 1 .314-.464z"/>
        </svg>
      ),
      CANCELLED: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-x-circle-fill text-danger" viewBox="0 0 16 16">
          <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293z"/>
        </svg>
      )
    };
    return icons[status];
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

  if (!order) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">Order not found</div>
        <button className="btn btn-primary" onClick={() => router.push('/orders')}>
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <button
            className="btn btn-outline-secondary mb-2"
            onClick={() => router.push('/orders')}
          >
            ← Back to Orders
          </button>
          <h1 className="mb-0">Order Details</h1>
        </div>
        {order.status === 'PENDING' && (
          <button
            className="btn btn-danger"
            onClick={handleCancelOrder}
            disabled={cancelling}
          >
            {cancelling ? 'Cancelling...' : 'Cancel Order'}
          </button>
        )}
      </div>

      <div className="row">
        {/* Order Info */}
        <div className="col-lg-8">
          {/* Status Card */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="d-flex align-items-center mb-3">
                {getStatusIcon(order.status)}
                <div className="ms-3">
                  <h5 className="mb-1">Order {order.orderNumber}</h5>
                  {getStatusBadge(order.status)}
                </div>
              </div>
              <div className="row text-muted small">
                <div className="col-md-6">
                  <strong>Placed on:</strong> {formatDate(order.createdAt)}
                </div>
                <div className="col-md-6">
                  <strong>Last updated:</strong> {formatDate(order.updatedAt)}
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">Shipping Address</h5>
              <hr />
              <pre className="mb-0" style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                {order.shippingAddress}
              </pre>
            </div>
          </div>

          {/* Order Items */}
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Order Items</h5>
              <hr />
              {order.items.map((item) => (
                <div key={item.id} className="row mb-3 pb-3 border-bottom align-items-center">
                  <div className="col-md-2">
                    <img
                      src={item.product.imageUrl || '/placeholder.png'}
                      alt={item.product.name}
                      className="img-fluid rounded"
                      style={{ width: '100%', maxHeight: '80px', objectFit: 'cover' }}
                    />
                  </div>
                  <div className="col-md-5">
                    <h6 className="mb-1">{item.product.name}</h6>
                    <small className="text-muted">Price: {formatPrice(item.price)}</small>
                  </div>
                  <div className="col-md-2 text-center">
                    <small className="text-muted d-block">Quantity</small>
                    <strong>{item.quantity}</strong>
                  </div>
                  <div className="col-md-3 text-end">
                    <small className="text-muted d-block">Subtotal</small>
                    <strong className="text-primary">{formatPrice(item.price * item.quantity)}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="col-lg-4">
          <div className="card position-sticky" style={{ top: '20px' }}>
            <div className="card-body">
              <h5 className="card-title">Order Summary</h5>
              <hr />
              
              <div className="d-flex justify-content-between mb-2">
                <span>Items ({order.items.length})</span>
                <span>{formatPrice(order.totalAmount)}</span>
              </div>
              
              <div className="d-flex justify-content-between mb-2">
                <span>Shipping</span>
                <span className="text-success">FREE</span>
              </div>
              
              <hr />
              
              <div className="d-flex justify-content-between mb-3">
                <strong className="fs-5">Total</strong>
                <strong className="fs-5 text-primary">{formatPrice(order.totalAmount)}</strong>
              </div>

              {order.status === 'PENDING' && (
                <div className="alert alert-info mb-0">
                  <small>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-info-circle me-1" viewBox="0 0 16 16">
                      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                      <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533z"/>
                      <path d="M9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
                    </svg>
                    Your order is being processed. You can cancel it before it enters processing.
                  </small>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
