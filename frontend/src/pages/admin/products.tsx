import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import ProtectedRoute from '@/components/ProtectedRoute';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  imageUrl?: string;
  isAvailable: boolean;
}

function AdminProductsContent() {
  const { token, isAdmin } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: 0,
    stock: 0,
    imageUrl: '',
  });

  useEffect(() => {
    if (!isAdmin()) {
      router.push('/');
    }
  }, [isAdmin, router]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:3000/products?limit=100');
      const data = await response.json();
      setProducts(data.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingProduct
        ? `http://localhost:3000/products/${editingProduct.id}`
        : 'http://localhost:3000/products';

      const method = editingProduct ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save product');
      }

      // Reset form and refresh products
      setFormData({
        name: '',
        description: '',
        category: '',
        price: 0,
        stock: 0,
        imageUrl: '',
      });
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      stock: product.stock,
      imageUrl: product.imageUrl || '',
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/products/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const handleCancel = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      category: '',
      price: 0,
      stock: 0,
      imageUrl: '',
    });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Admin - Product Management</h1>

      {/* Product Form */}
      <div className="card mb-4">
        <div className="card-body">
          <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Home">Home</option>
                </select>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
              />
            </div>

            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">Price</label>
                <input
                  type="number"
                  className="form-control"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: parseFloat(e.target.value) })
                  }
                  required
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Stock</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: parseInt(e.target.value) })
                  }
                  required
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Image URL</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.imageUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, imageUrl: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-primary">
                {editingProduct ? 'Update Product' : 'Add Product'}
              </button>
              {editingProduct && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Products List */}
      <div className="card">
        <div className="card-body">
          <h3>All Products ({products.length})</h3>
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                        />
                      )}
                    </td>
                    <td>{product.name}</td>
                    <td>{product.category}</td>
                    <td>${product.price.toFixed(2)}</td>
                    <td>{product.stock}</td>
                    <td>
                      {product.isAvailable ? (
                        <span className="badge bg-success">Available</span>
                      ) : (
                        <span className="badge bg-danger">Out of Stock</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-warning me-2"
                        onClick={() => handleEdit(product)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(product.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminProducts() {
  return (
    <ProtectedRoute>
      <AdminProductsContent />
    </ProtectedRoute>
  );
}
