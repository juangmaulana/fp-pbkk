import type { AppProps } from "next/app";
import "bootstrap/dist/css/bootstrap.min.css";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "../contexts/AuthContext";

function Navigation() {
  const { user, logout, isAdmin } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <a className="navbar-brand" href="/">
          Products Store
        </a>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <a className="nav-link" href="/">
                Products
              </a>
            </li>
            {user ? (
              <>
                {isAdmin() && (
                  <li className="nav-item">
                    <a className="nav-link" href="/admin/products">
                      <span className="badge bg-danger">Admin Panel</span>
                    </a>
                  </li>
                )}
                <li className="nav-item dropdown">
                  <a
                    className="nav-link dropdown-toggle"
                    href="#"
                    id="navbarDropdown"
                    role="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    {user.username}
                    {isAdmin() && (
                      <span className="badge bg-danger ms-2">ADMIN</span>
                    )}
                  </a>
                  <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
                    <li>
                      <span className="dropdown-item-text">
                        <small className="text-muted">{user.email}</small>
                      </span>
                    </li>
                    <li>
                      <hr className="dropdown-divider" />
                    </li>
                    <li>
                      <button className="dropdown-item" onClick={handleLogout}>
                        Logout
                      </button>
                    </li>
                  </ul>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <a className="nav-link" href="/auth/login">
                    Login
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="/auth/register">
                    Register
                  </a>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

function AppContent({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Import Bootstrap JS on client side
    if (typeof window !== 'undefined') {
      require('bootstrap/dist/js/bootstrap.bundle.min.js');
    }
  }, []);

  return (
    <>
      <Navigation />
      <div className="container mt-4">
        <Component {...pageProps} />
      </div>
    </>
  );
}

export default function App(props: AppProps) {
  return (
    <AuthProvider>
      <AppContent {...props} />
    </AuthProvider>
  );
}
