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
  createdAt: string;
  items: OrderItem[];
}

export default function OrderHistory() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const limit = 10;

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/auth/login');
      return;
    }
    fetchOrders();
  }, [authLoading, user, page, statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (statusFilter) {
        params.append('status', statusFilter);
      }

      const response = await fetch(`http://localhost:3000/orders/my-orders?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch orders (${response.status})`);
      }

      const data = await response.json();
      setOrders(data.orders || []);
      setTotalOrders(data.total || 0);
    } catch (error: any) {
      console.error('Failed to fetch orders:', error);
      alert(error.message || 'Failed to load orders');
    } finally {
      setLoading(false);
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
    return <span className={`badge bg-${config.bg}`}>{config.text}</span>;
  };

  const totalPages = Math.ceil(totalOrders / limit);

  if (loading && orders.length === 0) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h1 className="mb-4">Order History</h1>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row align-items-end">
            <div className="col-md-4">
              <label className="form-label">Filter by Status</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Orders</option>
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div className="col-md-4">
              <button
                className="btn btn-outline-secondary"
                onClick={() => {
                  setStatusFilter('');
                  setPage(1);
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="text-center py-5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            fill="currentColor"
            className="bi bi-inbox text-muted mb-3"
            viewBox="0 0 16 16"
          >
            <path d="M4.98 4a.5.5 0 0 0-.39.188L1.54 8H6a.5.5 0 0 1 .5.5 1.5 1.5 0 1 0 3 0A.5.5 0 0 1 10 8h4.46l-3.05-3.812A.5.5 0 0 0 11.02 4zm-1.17-.437A1.5 1.5 0 0 1 4.98 3h6.04a1.5 1.5 0 0 1 1.17.563l3.7 4.625a.5.5 0 0 1 .106.374l-.39 3.124A1.5 1.5 0 0 1 14.117 13H1.883a1.5 1.5 0 0 1-1.489-1.314l-.39-3.124a.5.5 0 0 1 .106-.374z"/>
          </svg>
          <h3>No orders found</h3>
          <p className="text-muted">You haven't placed any orders yet.</p>
          <button
            className="btn btn-primary mt-3"
            onClick={() => router.push('/')}
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <>
          {orders.map((order) => (
            <div key={order.id} className="card mb-3">
              <div className="card-body">
                <div className="row align-items-center">
                  <div className="col-md-3">
                    <small className="text-muted">Order Number</small>
                    <h6 className="mb-0 text-primary">{order.orderNumber}</h6>
                  </div>
                  <div className="col-md-2">
                    <small className="text-muted">Date</small>
                    <div className="small">{formatDate(order.createdAt)}</div>
                  </div>
                  <div className="col-md-2">
                    <small className="text-muted">Status</small>
                    <div>{getStatusBadge(order.status)}</div>
                  </div>
                  <div className="col-md-2">
                    <small className="text-muted">Total</small>
                    <div className="fw-bold">{formatPrice(order.totalAmount)}</div>
                  </div>
                  <div className="col-md-3 text-end">
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => router.push(`/orders/${order.id}`)}
                    >
                      View Details
                    </button>
                  </div>
                </div>

                {/* Order Items Preview */}
                <div className="mt-3 pt-3 border-top">
                  <small className="text-muted d-block mb-2">
                    Items ({order.items.length})
                  </small>
                  <div className="d-flex gap-2" style={{ overflowX: 'auto' }}>
                    {order.items.slice(0, 5).map((item) => (
                      <div key={item.id} style={{ minWidth: '60px' }}>
                        <img
                          src={item.product.imageUrl || '/placeholder.png'}
                          alt={item.product.name}
                          className="rounded"
                          style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                          title={`${item.product.name} (${item.quantity}x)`}
                        />
                      </div>
                    ))}
                    {order.items.length > 5 && (
                      <div
                        className="d-flex align-items-center justify-content-center bg-light rounded text-muted"
                        style={{ minWidth: '60px', height: '60px' }}
                      >
                        +{order.items.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav aria-label="Order history pagination">
              <ul className="pagination justify-content-center">
                <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </button>
                </li>
                {[...Array(totalPages)].map((_, i) => (
                  <li
                    key={i + 1}
                    className={`page-item ${page === i + 1 ? 'active' : ''}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
