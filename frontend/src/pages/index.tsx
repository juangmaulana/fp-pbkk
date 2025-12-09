import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  imageUrl?: string;
  images?: string[];
  isAvailable: boolean;
  popularity: number;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popularity', label: 'Most Popular' },
];

const CATEGORIES = ['Electronics', 'Fashion', 'Home'];

export default function Home() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters and pagination state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [isAvailable, setIsAvailable] = useState<boolean | undefined>(undefined);
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const limit = 12;

  useEffect(() => {
    fetchProducts();
  }, [page, sortBy, selectedCategory, isAvailable]);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
      });

      if (search) params.append('search', search);
      if (selectedCategory) params.append('category', selectedCategory);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (isAvailable !== undefined) params.append('isAvailable', isAvailable.toString());

      const response = await fetch(`http://localhost:3000/products?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data: PaginatedResponse = await response.json();
      setProducts(data.data);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
    setIsAvailable(undefined);
    setSortBy('newest');
    setPage(1);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(price);
  };

  return (
    <div className="container py-4">
      <h1 className="mb-4">Browse Products</h1>

      {/* Search and Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <form onSubmit={handleSearch}>
            <div className="row g-3">
              {/* Search */}
              <div className="col-md-6">
                <label className="form-label">Search</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by name or description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Category */}
              <div className="col-md-3">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div className="col-md-3">
                <label className="form-label">Sort By</label>
                <select
                  className="form-select"
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPage(1);
                  }}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Min Price */}
              <div className="col-md-3">
                <label className="form-label">Min Price</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
              </div>

              {/* Max Price */}
              <div className="col-md-3">
                <label className="form-label">Max Price</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="999999"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>

              {/* Availability */}
              <div className="col-md-3">
                <label className="form-label">Availability</label>
                <select
                  className="form-select"
                  value={isAvailable === undefined ? '' : isAvailable.toString()}
                  onChange={(e) => {
                    const val = e.target.value;
                    setIsAvailable(val === '' ? undefined : val === 'true');
                    setPage(1);
                  }}
                >
                  <option value="">All</option>
                  <option value="true">Available</option>
                  <option value="false">Out of Stock</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="col-md-3 d-flex align-items-end gap-2">
                <button type="submit" className="btn btn-primary flex-grow-1">
                  Search
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleResetFilters}
                >
                  Reset
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Results Info */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <strong>{total}</strong> products found
        </div>
        <div className="text-muted">
          Page {page} of {totalPages}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {/* Products Grid */}
      {!loading && products.length > 0 && (
        <div className="row row-cols-1 row-cols-md-3 row-cols-lg-4 g-4 mb-4">
          {products.map((product) => (
            <div key={product.id} className="col">
              <div 
                className="card h-100" 
                style={{ cursor: 'pointer' }}
                onClick={() => router.push(`/products/${product.id}`)}
              >
                {product.imageUrl && (
                  <img
                    src={product.imageUrl}
                    className="card-img-top"
                    alt={product.name}
                    style={{ height: '200px', objectFit: 'cover' }}
                  />
                )}
                {!product.imageUrl && (
                  <div
                    className="bg-secondary d-flex align-items-center justify-content-center text-white"
                    style={{ height: '200px' }}
                  >
                    No Image
                  </div>
                )}
                <div className="card-body">
                  <h5 className="card-title">{product.name}</h5>
                  <p className="card-text text-muted small">
                    {product.description.length > 80
                      ? product.description.substring(0, 80) + '...'
                      : product.description}
                  </p>
                  <div className="mb-2">
                    <span className="badge bg-secondary">{product.category}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <strong className="text-primary">{formatPrice(product.price)}</strong>
                    {product.isAvailable ? (
                      <span className="badge bg-success">In Stock</span>
                    ) : (
                      <span className="badge bg-danger">Out of Stock</span>
                    )}
                  </div>
                  <div className="mt-2 text-muted small">
                    Stock: {product.stock} | Popularity: {product.popularity}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {!loading && products.length === 0 && (
        <div className="alert alert-info text-center" role="alert">
          No products found. Try adjusting your filters.
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <nav aria-label="Product pagination">
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
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <li
                  key={pageNum}
                  className={`page-item ${page === pageNum ? 'active' : ''}`}
                >
                  <button className="page-link" onClick={() => setPage(pageNum)}>
                    {pageNum}
                  </button>
                </li>
              );
            })}
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
    </div>
  );
}
