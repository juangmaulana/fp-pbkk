import type { AppProps } from "next/app";
import "bootstrap/dist/css/bootstrap.min.css";
import { AuthProvider, useAuth } from "../contexts/AuthContext";

function Navigation() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <a className="navbar-brand" href="/">
          Products Store
        </a>
      </div>
    </nav>
  );
}

function AppContent({ Component, pageProps }: AppProps) {
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
