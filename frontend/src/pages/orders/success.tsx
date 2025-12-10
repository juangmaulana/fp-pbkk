import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

export default function OrderSuccess() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { orderNumber } = router.query;
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (!orderNumber) {
      router.push('/');
      return;
    }

    // Auto redirect countdown
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/orders');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [authLoading, user, orderNumber, router]);

  if (!orderNumber) {
    return null;
  }

  return (
    <div className="container mt-5 mb-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow-lg">
            <div className="card-body text-center py-5">
              {/* Success Icon */}
              <div className="mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="80"
                  height="80"
                  fill="currentColor"
                  className="bi bi-check-circle-fill text-success"
                  viewBox="0 0 16 16"
                >
                  <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                </svg>
              </div>

              {/* Success Message */}
              <h2 className="text-success mb-3">Order Placed Successfully!</h2>
              <p className="text-muted mb-4">
                Thank you for your purchase. Your order has been received and is being processed.
              </p>

              {/* Order Number */}
              <div className="bg-light rounded p-3 mb-4">
                <small className="text-muted d-block mb-1">Order Number</small>
                <h4 className="mb-0 text-primary fw-bold">{orderNumber}</h4>
              </div>

              {/* Info Message */}
              <div className="alert alert-info mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="currentColor"
                  className="bi bi-info-circle me-2"
                  viewBox="0 0 16 16"
                >
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                  <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533z"/>
                  <path d="M9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
                </svg>
                You can track your order status in the Order History page.
              </div>

              {/* Action Buttons */}
              <div className="d-grid gap-2">
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => router.push('/orders')}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    fill="currentColor"
                    className="bi bi-list-ul me-2"
                    viewBox="0 0 16 16"
                  >
                    <path fillRule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m-3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2"/>
                  </svg>
                  View Order History
                </button>
                
                <button
                  className="btn btn-outline-primary"
                  onClick={() => router.push('/')}
                >
                  Continue Shopping
                </button>
              </div>

              {/* Auto Redirect Message */}
              <p className="text-muted mt-4 mb-0">
                <small>
                  Redirecting to Order History in {countdown} seconds...
                </small>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
