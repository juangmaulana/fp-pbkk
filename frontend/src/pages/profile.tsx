import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const { user, updateUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentRole, setCurrentRole] = useState<string>('');
  const [message, setMessage] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/auth/login');
      return;
    }
    setCurrentRole(user.role);
  }, [authLoading, user, router]);

  const handleRoleChange = async (newRole: 'USER' | 'SELLER') => {
    if (!user) return;

    try {
      setLoading(true);
      setMessage('');

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/auth/update-role', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update role');
      }

      const data = await response.json();

      // Update user in context and localStorage
      const updatedUser = { ...user, role: newRole };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      updateUser(updatedUser);

      setCurrentRole(newRole);
      setMessage(`Successfully switched to ${newRole === 'USER' ? 'Buyer' : 'Seller'} mode!`);

      // Reload page after 1.5 seconds to update navigation
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error('Failed to update role:', error);
      alert(error.message || 'Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerWeeklySummary = async () => {
    try {
      setEmailLoading(true);
      setEmailMessage('');

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/email/trigger-weekly-summary', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to trigger weekly summary: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      setEmailMessage(data.message);

      setTimeout(() => {
        setEmailMessage('');
      }, 5000);
    } catch (error: any) {
      console.error('Failed to trigger weekly summary:', error);
      setEmailMessage(error.message || 'Failed to trigger weekly summary');
    } finally {
      setEmailLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <h2 className="card-title mb-4">
                <i className="bi bi-person-circle me-2"></i>
                My Profile
              </h2>

              {/* User Information */}
              <div className="mb-4 p-3 bg-light rounded">
                <div className="row mb-2">
                  <div className="col-4 fw-bold">Username:</div>
                  <div className="col-8">{user.username}</div>
                </div>
                <div className="row mb-2">
                  <div className="col-4 fw-bold">Email:</div>
                  <div className="col-8">{user.email}</div>
                </div>
                <div className="row">
                  <div className="col-4 fw-bold">Current Role:</div>
                  <div className="col-8">
                    <span className={`badge ${currentRole === 'SELLER' ? 'bg-primary' :
                        currentRole === 'ADMIN' ? 'bg-danger' : 'bg-success'
                      }`}>
                      {currentRole === 'SELLER' ? 'Seller' :
                        currentRole === 'ADMIN' ? 'Admin' : 'Buyer'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Role Switch Section */}
              {currentRole !== 'ADMIN' && (
                <div className="mb-4">
                  <h5 className="mb-3">
                    <i className="bi bi-arrow-left-right me-2"></i>
                    Switch Account Type
                  </h5>

                  {message && (
                    <div className="alert alert-success" role="alert">
                      <i className="bi bi-check-circle me-2"></i>
                      {message}
                    </div>
                  )}

                  <div className="row g-3">
                    {/* Buyer Card */}
                    <div className="col-md-6">
                      <div className={`card h-100 ${currentRole === 'USER' ? 'border-success' : 'border-secondary'}`}>
                        <div className="card-body text-center">
                          <i className="bi bi-cart-check display-4 text-success mb-3"></i>
                          <h5 className="card-title">Buyer Account</h5>
                          <p className="card-text text-muted small">
                            Shop for products, manage your cart, place orders, and track deliveries
                          </p>
                          {currentRole === 'USER' ? (
                            <span className="badge bg-success">
                              <i className="bi bi-check-circle me-1"></i>
                              Current Mode
                            </span>
                          ) : (
                            <button
                              className="btn btn-outline-success"
                              onClick={() => handleRoleChange('USER')}
                              disabled={loading}
                            >
                              {loading ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-2"></span>
                                  Switching...
                                </>
                              ) : (
                                <>
                                  <i className="bi bi-arrow-right-circle me-2"></i>
                                  Switch to Buyer
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Seller Card */}
                    <div className="col-md-6">
                      <div className={`card h-100 ${currentRole === 'SELLER' ? 'border-primary' : 'border-secondary'}`}>
                        <div className="card-body text-center">
                          <i className="bi bi-shop display-4 text-primary mb-3"></i>
                          <h5 className="card-title">Seller Account</h5>
                          <p className="card-text text-muted small">
                            List products, manage inventory, process orders, and view analytics
                          </p>
                          {currentRole === 'SELLER' ? (
                            <span className="badge bg-primary">
                              <i className="bi bi-check-circle me-1"></i>
                              Current Mode
                            </span>
                          ) : (
                            <button
                              className="btn btn-outline-primary"
                              onClick={() => handleRoleChange('SELLER')}
                              disabled={loading}
                            >
                              {loading ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-2"></span>
                                  Switching...
                                </>
                              ) : (
                                <>
                                  <i className="bi bi-arrow-right-circle me-2"></i>
                                  Switch to Seller
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="alert alert-info mt-3" role="alert">
                    <i className="bi bi-info-circle me-2"></i>
                    <strong>Note:</strong> You can switch between Buyer and Seller modes anytime.
                    Your data (products, orders, cart) will be preserved.
                  </div>
                </div>
              )}

              {currentRole === 'ADMIN' && (
                <div className="alert alert-warning" role="alert">
                  <i className="bi bi-shield-check me-2"></i>
                  <strong>Admin Account:</strong> You have full access to both buyer and seller features.
                </div>
              )}

              {/* Testing Section for Sellers/Admins */}
              {(currentRole === 'SELLER' || currentRole === 'ADMIN') && (
                <div className="card shadow-sm mt-4">
                  <div className="card-body">
                    <h5 className="card-title mb-3">
                      <i className="bi bi-envelope-paper me-2"></i>
                      Email Testing
                    </h5>
                    <p className="text-muted mb-3">
                      Test the weekly sales summary email notification. This will send you an email with your sales data from the last 7 days.
                    </p>

                    {emailMessage && (
                      <div className={`alert ${emailMessage.startsWith('Error') ? 'alert-danger' : 'alert-success'} mb-3`}>
                        {emailMessage}
                      </div>
                    )}

                    <button
                      className="btn btn-primary"
                      onClick={handleTriggerWeeklySummary}
                      disabled={emailLoading}
                    >
                      {emailLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Sending...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-send me-2"></i>
                          Send Weekly Summary Email
                        </>
                      )}
                    </button>

                    <div className="alert alert-info mt-3 mb-0" role="alert">
                      <i className="bi bi-info-circle me-2"></i>
                      <small>
                        <strong>Note:</strong> In production, this email is automatically sent every Monday at 9 AM.
                        Currently, emails are logged to the console (check backend terminal).
                      </small>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
