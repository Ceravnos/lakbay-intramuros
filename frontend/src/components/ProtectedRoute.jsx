import { Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";

// Generic protected route
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
      return (
          <div className="min-h-screen flex items-center justify-center">
              <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
      );
  }

  if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
  }

  return children;
};

// Admin only route
export const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
      return (
          <div className="min-h-screen flex items-center justify-center">
              <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
      );
  }

  if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
      return <Navigate to="/" replace />;
  }

  return children;
};

// Approved guide only route (must be in guide mode)
export const GuideRoute = ({ children }) => {
  const { isAuthenticated, isApprovedGuide, isGuideMode, loading } = useAuth();

  if (loading) {
      return (
          <div className="min-h-screen flex items-center justify-center">
              <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
      );
  }

  if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
  }

  if (!isApprovedGuide) {
      return <Navigate to="/" replace />;
  }

  if (!isGuideMode) {
      return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Tourist only route
export const TouristRoute = ({ children }) => {
  const { isAuthenticated, isTourist, loading } = useAuth();

  if (loading) {
      return (
          <div className="min-h-screen flex items-center justify-center">
              <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
      );
  }

  if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
  }

  if (!isTourist) {
      return <Navigate to="/" replace />;
  }

  return children;
};

// Redirect if already authenticated
export const GuestRoute = ({ children }) => {
  const { isAuthenticated, user, isGuideMode, loading } = useAuth();

  if (loading) {
      return (
          <div className="min-h-screen flex items-center justify-center">
              <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
      );
  }

  if (isAuthenticated) {
      if (user?.role === "admin") {
          return <Navigate to="/admin/dashboard" replace />;
      }
      if (user?.role === "guide" && isGuideMode) {
          return <Navigate to="/guide/dashboard" replace />;
      }
      return <Navigate to="/dashboard" replace />;
  }

  return children;
};
