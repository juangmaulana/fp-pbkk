import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';

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

interface Comment {
  id: string;
  text: string;
  imageUrl?: string;
  createdAt: string;
  user: {
    username: string;
    email: string;
  };
}

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { user, getAuthHeader } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  // Comment form state
  const [commentText, setCommentText] = useState('');
  const [commentImage, setCommentImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Edit state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

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

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchComments();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`http://localhost:3000/products/${id}`);
      if (!response.ok) throw new Error('Failed to fetch product');
      const data = await response.json();
      setProduct(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`http://localhost:3000/products/${id}/comments`);
      if (!response.ok) {
        console.error('Failed to fetch comments, status:', response.status);
        return;
      }
      const data = await response.json();
      setComments(data);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      alert('Please login to add items to cart');
      router.push('/auth/login');
      return;
    }

    if (quantity > product!.stock) {
      alert(`Only ${product!.stock} units available`);
      return;
    }

    setAddingToCart(true);
    try {
      await addToCart(product!.id, quantity);
      alert('Product added to cart successfully!');
      setQuantity(1); // Reset quantity
    } catch (error: any) {
      alert(error.message || 'Failed to add product to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only image files (JPEG, PNG, GIF, WebP) are allowed');
        return;
      }

      setCommentImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setCommentImage(null);
    setImagePreview(null);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('Please login to comment');
      router.push('/auth/login');
      return;
    }

    if (!commentText.trim()) {
      alert('Please enter a comment');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('text', commentText);
      if (commentImage) {
        formData.append('image', commentImage);
      }

      const authHeaders = getAuthHeader();
      console.log('Auth headers:', authHeaders);
      console.log('Posting comment to:', `http://localhost:3000/products/${id}/comments`);
      
      const response = await fetch(`http://localhost:3000/products/${id}/comments`, {
        method: 'POST',
        headers: {
          ...authHeaders,
          // Don't set Content-Type for FormData, browser will set it automatically with boundary
        },
        body: formData,
      });

      console.log('Response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to post comment: ${response.status} - ${errorText}`);
      }

      // Reset form
      setCommentText('');
      setCommentImage(null);
      setImagePreview(null);
      
      // Refresh comments
      await fetchComments();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditText(comment.text);
    setEditImagePreview(comment.imageUrl || null);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditText('');
    setEditImage(null);
    setEditImagePreview(null);
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only image files (JPEG, PNG, GIF, WebP) are allowed');
        return;
      }

      setEditImage(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitEdit = async (commentId: string) => {
    if (!editText.trim()) {
      alert('Please enter a comment');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('text', editText);
      if (editImage) {
        formData.append('image', editImage);
      }

      const authHeaders = getAuthHeader();
      console.log('Updating comment, auth headers:', authHeaders);
      
      const response = await fetch(`http://localhost:3000/products/${id}/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          ...authHeaders,
        },
        body: formData,
      });

      console.log('Update response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update error response:', errorText);
        throw new Error(`Failed to update comment: ${response.status} - ${errorText}`);
      }

      // Reset edit state
      handleCancelEdit();
      
      // Refresh comments
      await fetchComments();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      const authHeaders = getAuthHeader();
      console.log('Deleting comment, auth headers:', authHeaders);
      
      const response = await fetch(`http://localhost:3000/products/${id}/comments/${commentId}`, {
        method: 'DELETE',
        headers: authHeaders,
      });

      console.log('Delete response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete error response:', errorText);
        throw new Error(`Failed to delete comment: ${response.status} - ${errorText}`);
      }

      // Refresh comments
      await fetchComments();
    } catch (err: any) {
      alert(err.message);
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

  if (error || !product) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          {error || 'Product not found'}
        </div>
        <button className="btn btn-primary" onClick={() => router.push('/')}>
          Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className="container mt-4 mb-5">
      {/* Back button */}
      <button className="btn btn-outline-secondary mb-3" onClick={() => router.push('/')}>
        ← Back to Products
      </button>

      {/* Product Details */}
      <div className="row">
        <div className="col-md-5">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              className="img-fluid rounded shadow"
              alt={product.name}
              style={{ width: '100%', maxHeight: '500px', objectFit: 'cover' }}
            />
          ) : (
            <div
              className="bg-secondary d-flex align-items-center justify-content-center text-white rounded shadow"
              style={{ width: '100%', height: '500px' }}
            >
              <span className="fs-3">No Image Available</span>
            </div>
          )}
        </div>

        <div className="col-md-7">
          <h1 className="mb-3">{product.name}</h1>
          
          <div className="mb-3">
            <span className="badge bg-secondary fs-6">{product.category}</span>
          </div>

          <h2 className="text-primary fw-bold mb-3">{formatPrice(product.price)}</h2>

          <div className="mb-4">
            {product.isAvailable ? (
              <span className="badge bg-success fs-6">In Stock ({product.stock} available)</span>
            ) : (
              <span className="badge bg-danger fs-6">Out of Stock</span>
            )}
          </div>

          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">Product Details</h5>
              <hr />
              <div className="row mb-2">
                <div className="col-4 fw-bold">Stock:</div>
                <div className="col-8">{product.stock} units</div>
              </div>
              <div className="row mb-2">
                <div className="col-4 fw-bold">Popularity:</div>
                <div className="col-8">{product.popularity} views</div>
              </div>
              <div className="row mb-2">
                <div className="col-4 fw-bold">Category:</div>
                <div className="col-8">{product.category}</div>
              </div>
            </div>
          </div>

          <div className="card mb-3">
            <div className="card-body">
              <h5 className="card-title">Description</h5>
              <hr />
              <p className="card-text">{product.description}</p>
            </div>
          </div>

          {/* Add to Cart Section */}
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Add to Cart</h5>
              <hr />
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label fw-bold">Quantity</label>
                  <input
                    type="number"
                    className="form-control"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    max={product.stock}
                    disabled={!product.isAvailable || product.stock === 0}
                  />
                  <small className="text-muted">Max: {product.stock}</small>
                </div>
                <div className="col-md-8 d-flex align-items-end">
                  <button
                    className="btn btn-primary btn-lg w-100"
                    onClick={handleAddToCart}
                    disabled={!product.isAvailable || product.stock === 0 || addingToCart || quantity > product.stock}
                  >
                    {addingToCart ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Adding...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-cart-plus me-2" viewBox="0 0 16 16">
                          <path d="M9 5.5a.5.5 0 0 0-1 0V7H6.5a.5.5 0 0 0 0 1H8v1.5a.5.5 0 0 0 1 0V8h1.5a.5.5 0 0 0 0-1H9z"/>
                          <path d="M.5 1a.5.5 0 0 0 0 1h1.11l.401 1.607 1.498 7.985A.5.5 0 0 0 4 12h1a2 2 0 1 0 0 4 2 2 0 0 0 0-4h7a2 2 0 1 0 0 4 2 2 0 0 0 0-4h1a.5.5 0 0 0 .491-.408l1.5-8A.5.5 0 0 0 14.5 3H2.89l-.405-1.621A.5.5 0 0 0 2 1zm3.915 10L3.102 4h10.796l-1.313 7zM6 14a1 1 0 1 1-2 0 1 1 0 0 1 2 0m7 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
                        </svg>
                        Add to Cart
                      </>
                    )}
                  </button>
                </div>
              </div>
              {!product.isAvailable && (
                <div className="alert alert-warning mt-3 mb-0">
                  <strong>Out of Stock!</strong> This product is currently unavailable.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="row mt-5">
        <div className="col-12">
          <h3 className="mb-4">Comments ({comments.length})</h3>

          {/* Comment Form */}
          {user ? (
            <div className="card mb-4">
              <div className="card-body">
                <h5 className="card-title">Add Comment</h5>
                <form onSubmit={handleSubmitComment}>
                  <div className="mb-3">
                    <textarea
                      className="form-control"
                      rows={4}
                      placeholder="Write your comment here..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Attach Image (optional)</label>
                    <input
                      type="file"
                      className="form-control"
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={submitting}
                    />
                    <small className="text-muted">
                      Max file size: 5MB. Allowed formats: JPEG, PNG, GIF, WebP
                    </small>
                  </div>

                  {imagePreview && (
                    <div className="mb-3 position-relative d-inline-block">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="rounded"
                        style={{ maxWidth: '200px', maxHeight: '200px' }}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1"
                        onClick={handleRemoveImage}
                      >
                        ×
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? 'Posting...' : 'Post Comment'}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="alert alert-info">
              Please <a href="/auth/login" className="alert-link">login</a> to leave a comment.
            </div>
          )}

          {/* Comments List */}
          <div className="comments-list">
            {comments.length === 0 ? (
              <p className="text-muted">No comments yet. Be the first to comment!</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="card mb-3">
                  <div className="card-body">
                    {editingCommentId === comment.id ? (
                      /* Edit Mode */
                      <div>
                        <div className="mb-2">
                          <strong>{comment.user.username}</strong>
                          <small className="text-muted ms-2">{formatDate(comment.createdAt)}</small>
                        </div>
                        <textarea
                          className="form-control mb-2"
                          rows={3}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                        />
                        <div className="mb-2">
                          <input
                            type="file"
                            className="form-control"
                            accept="image/*"
                            onChange={handleEditImageChange}
                          />
                        </div>
                        {editImagePreview && (
                          <div className="mb-2">
                            <img
                              src={editImagePreview}
                              alt="Preview"
                              className="rounded"
                              style={{ maxWidth: '200px' }}
                            />
                          </div>
                        )}
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleSubmitEdit(comment.id)}
                            disabled={submitting}
                          >
                            {submitting ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={handleCancelEdit}
                            disabled={submitting}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* View Mode */
                      <div>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h6 className="mb-0">{comment.user.username}</h6>
                            <small className="text-muted">{formatDate(comment.createdAt)}</small>
                          </div>
                          {user && user.username === comment.user.username && (
                            <div className="d-flex gap-2">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleEditComment(comment)}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDeleteComment(comment.id)}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="card-text">{comment.text}</p>
                        {comment.imageUrl && (
                          <img
                            src={comment.imageUrl}
                            alt="Comment attachment"
                            className="img-fluid rounded mt-2"
                            style={{ maxWidth: '400px' }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
