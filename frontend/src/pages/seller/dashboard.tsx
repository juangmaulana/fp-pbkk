import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

interface Product {
  id: string;
  name: string;
  quantity: number;
  revenue: number;
}

interface OrderStatusBreakdown {
  status: string;
  count: number;
}

interface SalesTrend {
  date: string;
  revenue: number;
  orderCount: number;
}

interface DashboardData {
  totalRevenue: number;
  totalOrders: number;
  topProducts: Product[];
  lowStockProducts: Product[];
  orderStatusBreakdown: OrderStatusBreakdown[];
  salesTrends: SalesTrend[];
}

interface InventoryProduct {
  id: string;
  name: string;
  stock: number;
  isAvailable: boolean;
}

interface InventoryData {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  products: InventoryProduct[];
}

export default function SellerDashboard() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [inventoryData, setInventoryData] = useState<InventoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory'>('overview');

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/auth/login');
      return;
    }
    fetchDashboardData();
  }, [authLoading, user, period]);

  useEffect(() => {
    if (user && activeTab === 'inventory') {
      fetchInventoryData();
    }
  }, [user, activeTab]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/dashboard/seller?period=${period}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (error: any) {
      console.error('Failed to fetch dashboard:', error);
      alert(error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryData = async () => {
    try {
      const response = await fetch('http://localhost:3000/dashboard/inventory', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch inventory data');
      }

      const data = await response.json();
      setInventoryData(data);
    } catch (error: any) {
      console.error('Failed to fetch inventory:', error);
      alert(error.message || 'Failed to load inventory data');
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
      month: 'short',
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      PENDING: 'warning',
      PROCESSING: 'info',
      SHIPPED: 'primary',
      DELIVERED: 'success',
      CANCELLED: 'danger'
    };
    return colors[status] || 'secondary';
  };

  if (loading && !dashboardData) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">Failed to load dashboard data</div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Seller Dashboard</h1>
        <div className="btn-group" role="group">
          <button
            className={`btn btn-outline-primary ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`btn btn-outline-primary ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            Inventory
          </button>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <>
          {/* Period Filter */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-md-6">
                  <h6 className="mb-0">Select Period</h6>
                </div>
                <div className="col-md-6">
                  <div className="btn-group w-100" role="group">
                    <button
                      className={`btn btn-sm ${period === 'daily' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setPeriod('daily')}
                    >
                      Daily
                    </button>
                    <button
                      className={`btn btn-sm ${period === 'weekly' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setPeriod('weekly')}
                    >
                      Weekly
                    </button>
                    <button
                      className={`btn btn-sm ${period === 'monthly' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setPeriod('monthly')}
                    >
                      Monthly
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="row mb-4">
            <div className="col-md-6 mb-3">
              <div className="card h-100 border-primary">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="text-muted mb-2">Total Revenue</h6>
                      <h2 className="text-primary mb-0">{formatPrice(dashboardData.totalRevenue)}</h2>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" className="bi bi-cash-stack text-primary" viewBox="0 0 16 16">
                      <path d="M1 3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1zm7 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4"/>
                      <path d="M0 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1zm3 0a2 2 0 0 1-2 2v4a2 2 0 0 1 2 2h10a2 2 0 0 1 2-2V7a2 2 0 0 1-2-2z"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6 mb-3">
              <div className="card h-100 border-success">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="text-muted mb-2">Total Orders</h6>
                      <h2 className="text-success mb-0">{dashboardData.totalOrders}</h2>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" className="bi bi-cart-check text-success" viewBox="0 0 16 16">
                      <path d="M11.354 6.354a.5.5 0 0 0-.708-.708L8 8.293 6.854 7.146a.5.5 0 1 0-.708.708l1.5 1.5a.5.5 0 0 0 .708 0z"/>
                      <path d="M.5 1a.5.5 0 0 0 0 1h1.11l.401 1.607 1.498 7.985A.5.5 0 0 0 4 12h1a2 2 0 1 0 0 4 2 2 0 0 0 0-4h7a2 2 0 1 0 0 4 2 2 0 0 0 0-4h1a.5.5 0 0 0 .491-.408l1.5-8A.5.5 0 0 0 14.5 3H2.89l-.405-1.621A.5.5 0 0 0 2 1zm3.915 10L3.102 4h10.796l-1.313 7zM6 14a1 1 0 1 1-2 0 1 1 0 0 1 2 0m7 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sales Trends Chart */}
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">Sales Trends</h5>
              <hr />
              {dashboardData.salesTrends?.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <div style={{ minWidth: '600px', height: '250px', position: 'relative' }}>
                    {/* Simple bar chart */}
                    <div className="d-flex align-items-end justify-content-around" style={{ height: '200px' }}>
                      {dashboardData.salesTrends.map((trend, index) => {
                        const maxRevenue = Math.max(...dashboardData.salesTrends.map(t => t.revenue));
                        const height = maxRevenue > 0 ? (trend.revenue / maxRevenue) * 180 : 0;
                        
                        return (
                          <div key={index} className="text-center" style={{ flex: 1, maxWidth: '80px' }}>
                            <div
                              className="bg-primary rounded-top mx-auto"
                              style={{
                                width: '50px',
                                height: `${height}px`,
                                transition: 'height 0.3s',
                                cursor: 'pointer'
                              }}
                              title={`${formatPrice(trend.revenue)} (${trend.orderCount} orders)`}
                            />
                            <small className="d-block mt-2 text-muted">{formatDate(trend.date)}</small>
                            <small className="text-primary fw-bold">{formatPrice(trend.revenue)}</small>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted text-center">No sales data available for this period</p>
              )}
            </div>
          </div>

          <div className="row">
            {/* Top Products */}
            <div className="col-md-6 mb-4">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">Top Selling Products</h5>
                  <hr />
                  {dashboardData.topProducts?.length > 0 ? (
                    <div className="list-group list-group-flush">
                      {dashboardData.topProducts.map((product, index) => (
                        <div key={product.id} className="list-group-item px-0">
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center">
                              <span className="badge bg-primary me-2">#{index + 1}</span>
                              <div>
                                <h6 className="mb-0">{product.name}</h6>
                                <small className="text-muted">Sold: {product.quantity} units</small>
                              </div>
                            </div>
                            <div className="text-end">
                              <div className="text-success fw-bold">{formatPrice(product.revenue)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted text-center">No products sold yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Order Status Breakdown */}
            <div className="col-md-6 mb-4">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">Order Status</h5>
                  <hr />
                  {dashboardData.orderStatusBreakdown?.length > 0 ? (
                    <div>
                      {dashboardData.orderStatusBreakdown.map((statusData) => (
                        <div key={statusData.status} className="mb-3">
                          <div className="d-flex justify-content-between mb-1">
                            <span className={`badge bg-${getStatusColor(statusData.status)}`}>
                              {statusData.status}
                            </span>
                            <span className="fw-bold">{statusData.count}</span>
                          </div>
                          <div className="progress" style={{ height: '20px' }}>
                            <div
                              className={`progress-bar bg-${getStatusColor(statusData.status)}`}
                              style={{
                                width: `${(statusData.count / dashboardData.totalOrders) * 100}%`
                              }}
                            >
                              {Math.round((statusData.count / dashboardData.totalOrders) * 100)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted text-center">No orders yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Low Stock Alert */}
          {dashboardData.lowStockProducts?.length > 0 && (
            <div className="card border-warning">
              <div className="card-body">
                <h5 className="card-title">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-exclamation-triangle-fill text-warning me-2" viewBox="0 0 16 16">
                    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2"/>
                  </svg>
                  Low Stock Alert
                </h5>
                <hr />
                <div className="row">
                  {dashboardData.lowStockProducts.map((product) => (
                    <div key={product.id} className="col-md-6 mb-2">
                      <div className="alert alert-warning mb-0">
                        <strong>{product.name}</strong>
                        <br />
                        <small>Only {product.quantity} units left</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Inventory Tab */
        <div className="row">
          <div className="col-12">
            {inventoryData ? (
              <>
                {/* Inventory Summary */}
                <div className="row mb-4">
                  <div className="col-md-4 mb-3">
                    <div className="card border-primary">
                      <div className="card-body text-center">
                        <h3 className="text-primary">{inventoryData.totalProducts}</h3>
                        <p className="text-muted mb-0">Total Products</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="card border-warning">
                      <div className="card-body text-center">
                        <h3 className="text-warning">{inventoryData.lowStockCount}</h3>
                        <p className="text-muted mb-0">Low Stock</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="card border-danger">
                      <div className="card-body text-center">
                        <h3 className="text-danger">{inventoryData.outOfStockCount}</h3>
                        <p className="text-muted mb-0">Out of Stock</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inventory List */}
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">Product Inventory</h5>
                    <hr />
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Product Name</th>
                            <th className="text-center">Stock</th>
                            <th className="text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inventoryData.products?.map((product) => (
                            <tr key={product.id}>
                              <td>{product.name}</td>
                              <td className="text-center">
                                <span className={`badge ${product.stock === 0 ? 'bg-danger' : product.stock < 10 ? 'bg-warning' : 'bg-success'}`}>
                                  {product.stock} units
                                </span>
                              </td>
                              <td className="text-center">
                                {product.isAvailable ? (
                                  <span className="badge bg-success">Available</span>
                                ) : (
                                  <span className="badge bg-danger">Unavailable</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
