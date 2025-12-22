import { useAuth } from "@/_core/hooks/useAuth";
import { Redirect } from "wouter";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();

  console.log('[ProtectedRoute] Auth state:', { user, loading, isAuthenticated, requireAdmin });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-red-500">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (requireAdmin && user?.role !== "admin") {
    return <Redirect to="/" />;
  }

  return <>{children}</>;
}
