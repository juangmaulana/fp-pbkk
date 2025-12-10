import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl: string;
  images: string[] | null;
  isAvailable: boolean;
  sku: string;
}

export default function ProductManagement() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: ''
  });

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/auth/login');
      return;
    }
    fetchProducts();
  }, [authLoading, user]);

  const fetchProducts = async () => {
    if (!user || !token) return;

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/products?sellerId=${user.username}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch products (${response.status})`);
      }

      const data = await response.json();
      setProducts(data.data || []);
    } catch (error: any) {
      console.error('Failed to fetch products:', error);
      alert(error.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        category: product.category,
        stock: product.stock.toString()
      });
      // Load existing images
      if (Array.isArray(product.images) && product.images.length > 0) {
        setImagePreviews(product.images);
      } else if (product.imageUrl) {
        setImagePreviews([product.imageUrl]);
      } else {
        setImagePreviews([]);
      }
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        stock: ''
      });
      setImagePreviews([]);
    }
    setImageFiles([]);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setImageFiles([]);
    setImagePreviews([]);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length > 10) {
      alert('Maximum 10 images allowed');
      return;
    }

    // Validate file sizes and types
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} exceeds 5MB limit`);
        return false;
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert(`${file.name} is not a valid image type`);
        return false;
      }
      return true;
    });

    setImageFiles(validFiles);

    // Create previews
    const previews: string[] = [];
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        previews.push(reader.result as string);
        if (previews.length === validFiles.length) {
          setImagePreviews(previews);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.price || !formData.category.trim() || !formData.stock) {
      alert('Please fill in all required fields');
      return;
    }

    if (!editingProduct && imageFiles.length === 0) {
      alert('Please upload at least one product image');
      return;
    }

    setSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('stock', formData.stock);

      imageFiles.forEach(file => {
        formDataToSend.append('images', file);
      });

      const url = editingProduct
        ? `http://localhost:3000/products/${editingProduct.id}`
        : 'http://localhost:3000/products';

      const method = editingProduct ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save product');
      }

      alert(editingProduct ? 'Product updated successfully' : 'Product created successfully');
      handleCloseModal();
      await fetchProducts();
    } catch (error: any) {
      alert(error.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (productId: string, productName: string) => {
    if (!confirm(`Are you sure you want to delete "${productName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/products/${productId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete product');
      }

      alert('Product deleted successfully');
      await fetchProducts();
    } catch (error: any) {
      alert(error.message || 'Failed to delete product');
    }
  };

  const handleUpdateStock = async (productId: string, newStock: number) => {
    try {
      const response = await fetch(`http://localhost:3000/products/${productId}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ stock: newStock })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update stock');
      }

      alert('Stock updated successfully');
      await fetchProducts();
    } catch (error: any) {
      alert(error.message || 'Failed to update stock');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
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

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Product Management</h1>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-plus-circle me-2" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
          </svg>
          Add New Product
        </button>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            fill="currentColor"
            className="bi bi-box-seam text-muted mb-3"
            viewBox="0 0 16 16"
          >
            <path d="M8.186 1.113a.5.5 0 0 0-.372 0L1.846 3.5l2.404.961L10.404 2zm3.564 1.426L5.596 5 8 5.961 14.154 3.5zm3.25 1.7-6.5 2.6v7.922l6.5-2.6V4.24zM7.5 14.762V6.838L1 4.239v7.923zM7.443.184a1.5 1.5 0 0 1 1.114 0l7.129 2.852A.5.5 0 0 1 16 3.5v8.662a1 1 0 0 1-.629.928l-7.185 2.874a.5.5 0 0 1-.372 0L.63 13.09a1 1 0 0 1-.63-.928V3.5a.5.5 0 0 1 .314-.464z" />
          </svg>
          <h3>No products yet</h3>
          <p className="text-muted">Start by adding your first product</p>
          <button className="btn btn-primary mt-3" onClick={() => handleOpenModal()}>
            Add Product
          </button>
        </div>
      ) : (
        <div className="row">
          {products.map((product) => (
            <div key={product.id} className="col-md-6 col-lg-4 mb-4">
              <div className="card h-100">
                <img
                  src={product.imageUrl || '/placeholder.png'}
                  className="card-img-top"
                  alt={product.name}
                  style={{ height: '200px', objectFit: 'cover' }}
                />
                <div className="card-body">
                  <h5 className="card-title">{product.name}</h5>
                  <p className="card-text text-muted small" style={{ height: '60px', overflow: 'hidden' }}>
                    {product.description}
                  </p>
                  <div className="mb-2">
                    <span className="badge bg-secondary">{product.category}</span>
                    <span className="badge bg-info ms-2">{product.sku}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="text-primary mb-0">{formatPrice(product.price)}</h5>
                    <span className={`badge ${product.stock === 0 ? 'bg-danger' : product.stock < 10 ? 'bg-warning' : 'bg-success'}`}>
                      Stock: {product.stock}
                    </span>
                  </div>
                  <div className="mb-3">
                    {product.isAvailable ? (
                      <span className="badge bg-success">Available</span>
                    ) : (
                      <span className="badge bg-danger">Unavailable</span>
                    )}
                  </div>
                </div>
                <div className="card-footer bg-transparent">
                  <div className="d-grid gap-2">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => handleOpenModal(product)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(product.id, product.name)}
                    >
                      Delete
                    </button>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => {
                        const newStock = prompt(`Update stock for ${product.name}:`, product.stock.toString());
                        if (newStock !== null) {
                          const stock = parseInt(newStock);
                          if (!isNaN(stock) && stock >= 0) {
                            handleUpdateStock(product.id, stock);
                          } else {
                            alert('Invalid stock value');
                          }
                        }
                      }}
                    >
                      Update Stock
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal}
                  disabled={submitting}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">
                      Product Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      disabled={submitting}
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        Price (IDR) <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        min="0"
                        required
                        disabled={submitting}
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        Stock <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        min="0"
                        required
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      Category <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      Product Images {!editingProduct && <span className="text-danger">*</span>}
                    </label>
                    <input
                      type="file"
                      className="form-control"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      disabled={submitting}
                    />
                    <small className="text-muted">
                      Upload up to 10 images (max 5MB each). Supported: JPEG, PNG, GIF, WebP
                    </small>
                  </div>

                  {imagePreviews.length > 0 && (
                    <div className="mb-3">
                      <label className="form-label">Image Previews</label>
                      <div className="row g-2">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="col-4 col-md-3">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="img-fluid rounded"
                              style={{ height: '100px', objectFit: 'cover', width: '100%' }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCloseModal}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        {editingProduct ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      editingProduct ? 'Update Product' : 'Create Product'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
